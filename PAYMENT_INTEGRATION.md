# Payment Integration Guide

## Overview

The Payment model has been integrated with the Card creation flow. When creating a card, you can optionally include payment information, and the system will create both records atomically using MongoDB transactions.

## Payment Model Structure

```javascript
{
  id: ObjectId,                    // Auto-generated
  transactionId: String,           // Required, unique
  cardId: ObjectId,               // Reference to Card
  method: String,                 // 'online' or 'cash'
  totalAmount: Number,            // Positive number required
  createdBy: ObjectId,            // Reference to User
  status: Boolean,                // true if payment provided, false otherwise
  date: Date,                     // Payment date (default: now)
  createdAt: Date,                // Auto-generated timestamp
  updatedAt: Date                 // Auto-generated timestamp
}
```

## Creating a Card with Payment

### Request Format

**Endpoint:** `POST /api/cards`

**Headers:**

```
Authorization: Bearer <your_token>
Content-Type: application/json
```

### Example 1: Card with Payment (Status = true)

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "contact": "1234567890",
  "email": "john@example.com",
  "totalAmount": 5000,

  "payment": {
    "transactionId": "TXN123456789",
    "method": "online",
    "totalAmount": 5000,
    "date": "2026-03-11T10:30:00.000Z"
  }
}
```

### Example 2: Card without Payment (Status = false)

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "contact": "9876543210",
  "email": "jane@example.com",
  "totalAmount": 3000
}
```

### Example 3: Card with Payment and Members

```json
{
  "firstName": "Robert",
  "lastName": "Johnson",
  "contact": "5555555555",
  "email": "robert@example.com",
  "totalAmount": 8000,

  "members": [
    {
      "name": "Alice Johnson",
      "relation": "Spouse",
      "age": 35
    },
    {
      "name": "Tommy Johnson",
      "relation": "Child",
      "age": 10
    }
  ],

  "payment": {
    "transactionId": "TXN987654321",
    "method": "cash",
    "totalAmount": 8000
  }
}
```

### Using with File Uploads (multipart/form-data)

When uploading files, send payment as a JSON string:

```javascript
const formData = new FormData();
formData.append("firstName", "John");
formData.append("lastName", "Doe");
formData.append("contact", "1234567890");
formData.append(
  "payment",
  JSON.stringify({
    transactionId: "TXN123456789",
    method: "online",
    totalAmount: 5000,
  }),
);
formData.append("documents", file1);
formData.append("documents", file2);
```

## Transaction Behavior

### Atomicity

The system uses MongoDB transactions to ensure:

- If card creation fails, payment is not created
- If payment creation fails, card is not created
- If members creation fails, neither card nor payment is created
- All operations succeed together or none at all

### Payment Status Logic

- **status = true**: Set when payment object is provided during card creation
- **status = false**: Set when no payment object is provided (default behavior)

## Payment API Endpoints

### 1. Get All Payments

```
GET /api/payments
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)
  - status: Filter by status (true/false)
  - method: Filter by method (online/cash)
  - cardId: Filter by card ID
```

### 2. Get Payment by ID

```
GET /api/payments/:id
```

### 3. Get Payment by Transaction ID

```
GET /api/payments/transaction/:transactionId
```

### 4. Get All Payments for a Card

```
GET /api/payments/card/:cardId
```

### 5. Update Payment Status

```
PATCH /api/payments/:id/status
Body: {
  "status": true
}
```

### 6. Delete Payment (Admin Only)

```
DELETE /api/payments/:id
```

## Response Format

### Success Response (Card with Payment)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Card application created successfully",
  "data": {
    "_id": "card_id",
    "applicationId": "APP001",
    "firstName": "John",
    "lastName": "Doe",
    "contact": "1234567890",
    "totalAmount": 5000,
    "createdBy": "user_id",
    "members": [...],
    "payment": {
      "_id": "payment_id",
      "transactionId": "TXN123456789",
      "cardId": "card_id",
      "method": "online",
      "totalAmount": 5000,
      "status": true,
      "date": "2026-03-11T10:30:00.000Z",
      "createdBy": "user_id"
    }
  }
}
```

## Error Handling

### Duplicate Transaction ID

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Payment with transaction ID TXN123456789 already exists"
}
```

### Invalid Payment Method

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Payment method must be either 'online' or 'cash'"
}
```

### Missing Required Fields

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Transaction ID is required"
}
```

## Database Indexes

The Payment model includes the following indexes for optimal performance:

- `transactionId` (unique)
- `cardId`
- Composite: `(cardId, transactionId)`
- Composite: `(status, date)` descending

## Access Control

- **Create Payment**: Automatically handled through card creation (employee, editor, admin)
- **View Payments**: employee, editor, admin
- **Update Payment Status**: employee, editor, admin
- **Delete Payment**: admin only

## Best Practices

1. **Always provide unique transaction IDs** to avoid conflicts
2. **Use transactions** when creating related data (handled automatically)
3. **Validate payment amounts** match card totalAmount
4. **Include payment date** for better record keeping
5. **Set appropriate payment method** (online/cash) for reporting

## Testing

### Test Card Creation with Payment

```bash
curl -X POST http://localhost:5000/api/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "contact": "1234567890",
    "totalAmount": 1000,
    "payment": {
      "transactionId": "TEST001",
      "method": "online",
      "totalAmount": 1000
    }
  }'
```

### Test Get All Payments

```bash
curl -X GET http://localhost:5000/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Get Payment by Transaction ID

```bash
curl -X GET http://localhost:5000/api/payments/transaction/TEST001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Migration Notes

- No database migration required (MongoDB schema-less)
- Existing cards without payments will continue to work
- Payment functionality is opt-in when creating new cards
- All existing APIs remain backward compatible
