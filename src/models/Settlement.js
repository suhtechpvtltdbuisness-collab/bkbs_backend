import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Settlement date is required"],
      trim: true,
    },
    cardsCount: {
      type: Number,
      default: 0,
      min: [0, "Cards count must be positive"],
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, "Amount must be positive"],
    },
    status: {
      type: String,
      enum: ["pending", "done"],
      default: "pending",
      index: true,
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

settlementSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
