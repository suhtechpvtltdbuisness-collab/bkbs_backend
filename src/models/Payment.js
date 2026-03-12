import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: [true, "Card ID is required"],
      index: true,
    },
    method: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["online", "cash"],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Amount must be positive"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    status: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
      required: [true, "Payment date is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Index for composite queries
paymentSchema.index({ cardId: 1, transactionId: 1 });
paymentSchema.index({ status: 1, date: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
