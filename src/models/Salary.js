import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Salary date is required"],
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "paid", "cancelled", "processing"],
      default: "pending",
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    method: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["bank_transfer", "cash", "cheque", "upi", "other"],
      default: "bank_transfer",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Create compound indexes for efficient queries
salarySchema.index({ employeeId: 1, date: -1 });
salarySchema.index({ status: 1, date: -1 });
salarySchema.index({ createdAt: -1 });

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
