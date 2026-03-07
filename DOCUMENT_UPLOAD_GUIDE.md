# Card Document Upload Guide

## Overview

Cards now support document uploads with automatic yearly folder organization. You can upload up to 5 documents per card.

**🌐 Production Storage:** This application uses **Vercel Blob Storage** for file uploads in production. Files are permanently stored with global CDN access. See [VERCEL_BLOB_INTEGRATION.md](./VERCEL_BLOB_INTEGRATION.md) for details.

## Features

- ✅ Multiple file uploads (max 5 files)
- ✅ Automatic yearly folder organization (`uploads/YYYY/` locally, `YYYY/` in cloud)
- ✅ File size limit: 100KB per file
- ✅ Supported file types: JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX
- ✅ Automatic sanitization of filenames
- ✅ Secure file storage
- ✅ **Production:** Permanent CDN storage via Vercel Blob
- ✅ **Development:** Local disk storage

## API Usage

### Creating a Card with Documents

**Endpoint:** `POST {{URL}}/api/cards`

**Content-Type:** `multipart/form-data`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

| Field            | Type   | Required | Description                  |
| ---------------- | ------ | -------- | ---------------------------- |
| firstName        | string | Yes      | First name                   |
| middleName       | string | No       | Middle name                  |
| lastName         | string | No       | Last name                    |
| contact          | string | Yes      | Contact number               |
| alternateContact | string | No       | Alternate contact            |
| email            | string | No       | Email address                |
| applicationDate  | string | No       | Application date             |
| totalAmount      | number | No       | Total amount                 |
| documents        | file[] | No       | Upload files (max 5)         |
| members          | string | No       | JSON string of members array |

### Example: Using Postman

1. **Set Method:** POST
2. **Set URL:** `{{URL}}/api/cards`
3. **Headers:**
   - Authorization: `Bearer YOUR_JWT_TOKEN`
4. **Body:** Select "form-data"
   - firstName: `Rajesh`
   - middleName: `Kumar`
   - lastName: `Sharma`
   - contact: `9876333210`
   - alternateContact: `9876543211`
   - email: `rajesh.sharma@example.com`
   - applicationDate: `2026-03-02`
   - totalAmount: `5000`
   - documents: [Select File] (can add multiple files, max 5)
   - members: `[{"name":"Priya Sharma","relation":"Wife","age":28}]`

### Example: Using cURL

```bash
curl -X POST "{{URL}}/api/cards" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "firstName=Rajesh" \
  -F "middleName=Kumar" \
  -F "lastName=Sharma" \
  -F "contact=9876333210" \
  -F "alternateContact=9876543211" \
  -F "email=rajesh.sharma@example.com" \
  -F "applicationDate=2026-03-02" \
  -F "totalAmount=5000" \
  -F "documents=@/path/to/document1.pdf" \
  -F "documents=@/path/to/document2.jpg" \
  -F 'members=[{"name":"Priya Sharma","relation":"Wife","age":28}]'
```

### Example: Using JavaScript Fetch

```javascript
const formData = new FormData();

// Add text fields
formData.append("firstName", "Rajesh");
formData.append("middleName", "Kumar");
formData.append("lastName", "Sharma");
formData.append("contact", "9876333210");
formData.append("alternateContact", "9876543211");
formData.append("email", "rajesh.sharma@example.com");
formData.append("applicationDate", "2026-03-02");
formData.append("totalAmount", "5000");

// Add files (from file input)
const fileInput = document.querySelector('input[type="file"]');
for (let file of fileInput.files) {
  formData.append("documents", file);
}

// Add members as JSON string
formData.append(
  "members",
  JSON.stringify([
    { name: "Priya Sharma", relation: "Wife", age: 28 },
    { name: "Aarav Sharma", relation: "Son", age: 5 },
  ]),
);

// Send request
fetch("{{URL}}/api/cards", {
  method: "POST",
  headers: {
    Authorization: "Bearer YOUR_JWT_TOKEN",
  },
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

## Response Example

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Card application created successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "applicationId": "AC-0000000001",
    "firstName": "Rajesh",
    "middleName": "Kumar",
    "lastName": "Sharma",
    "contact": "9876333210",
    "alternateContact": "9876543211",
    "email": "rajesh.sharma@example.com",
    "applicationDate": "2026-03-02",
    "totalAmount": 5000,
    "status": "pending",
    "totalMember": 1,
    "documents": [
      {
        "filename": "Rajesh_Sharma_ID-1709654321-123456789.pdf",
        "originalName": "Rajesh_Sharma_ID.pdf",
        "path": "/Users/.../uploads/2026/Rajesh_Sharma_ID-1709654321-123456789.pdf",
        "size": 245678,
        "mimetype": "application/pdf",
        "uploadedAt": "2026-03-07T10:30:45.123Z"
      },
      {
        "filename": "photo-1709654321-987654321.jpg",
        "originalName": "photo.jpg",
        "path": "/Users/.../uploads/2026/photo-1709654321-987654321.jpg",
        "size": 156789,
        "mimetype": "image/jpeg",
        "uploadedAt": "2026-03-07T10:30:45.124Z"
      }
    ],
    "members": [
      {
        "_id": "65f1234567890abcdef12346",
        "cardId": "65f1234567890abcdef12345",
        "name": "Priya Sharma",
        "relation": "Wife",
        "age": 28
      }
    ],
    "createdBy": "65f1234567890abcdef12340",
    "isDeleted": false,
    "createdAt": "2026-03-07T10:30:45.120Z",
    "updatedAt": "2026-03-07T10:30:45.120Z"
  }
}
```

## File Storage Structure

Files are automatically organized by year:

```
uploads/
├── 2026/
│   ├── document1-1709654321-123456789.pdf
│   ├── photo-1709654321-987654321.jpg
│   └── ...
├── 2027/
│   └── ...
└── .gitignore
```

## Accessing Uploaded Files

Uploaded files are accessible via HTTP:

```
{{URL}}/uploads/2026/document1-1709654321-123456789.pdf
```

## Allowed File Types

- **Images:** JPEG, JPG, PNG, GIF
- **Documents:** PDF, DOC, DOCX
- **Spreadsheets:** XLS, XLSX

## Validation Rules

- Maximum 5 files per card
- Maximum 100KB per file
- Only allowed file types accepted
- Filenames are automatically sanitized (special characters replaced with underscores)
- Unique filenames generated using timestamp and random suffix

## Error Handling

### Invalid File Type

```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX files are allowed."
}
```

### File Size Exceeded

```json
{
  "success": false,
  "message": "File too large"
}
```

### Too Many Files

```json
{
  "success": false,
  "message": "Too many files. Maximum 5 files allowed."
}
```

## Notes

- Files are uploaded before validation, so ensure valid data to avoid orphaned files
- Documents field is optional - cards can be created without documents
- All uploaded files are stored permanently unless manually deleted
- The `uploads/` folder is gitignored (except `.gitignore` itself) to prevent large files in version control
