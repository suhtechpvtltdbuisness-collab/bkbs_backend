import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["online", "cash", "upi", "card", "netbanking", "wallet"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Amount must be positive"],
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

paymentSchema
  .virtual("method")
  .get(function getMethod() {
    return this.paymentMethod;
  })
  .set(function setMethod(value) {
    this.paymentMethod = value;
  });

paymentSchema
  .virtual("totalAmount")
  .get(function getTotalAmount() {
    return this.amount;
  })
  .set(function setTotalAmount(value) {
    this.amount = value;
  });

paymentSchema.virtual("date").get(function getDate() {
  return this.createdAt;
});

// Index for composite queries
paymentSchema.index({ cardId: 1, orderId: 1, transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
