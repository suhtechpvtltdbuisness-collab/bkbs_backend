import mongoose from "mongoose";

const duplicateReceiptSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      unique: true,
      required: [true, "Receipt number is required"],
      trim: true,
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      index: true,
    },
    cardId: {
      type: String,
      trim: true,
    },
    originalReceiptNo: {
      type: String,
      trim: true,
    },
    clientName: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    employeeName: {
      type: String,
      trim: true,
    },
    penaltyAmount: {
      type: Number,
      default: 50,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "offline"],
      required: [true, "Payment method is required"],
    },
    paymentRef: {
      type: String,
      trim: true,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    paymentProofImage: {
      type: String,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

duplicateReceiptSchema.index({ paymentStatus: 1, paymentMethod: 1, issuedDate: -1 });

const DuplicateReceipt = mongoose.model(
  "DuplicateReceipt",
  duplicateReceiptSchema,
);

export default DuplicateReceipt;
