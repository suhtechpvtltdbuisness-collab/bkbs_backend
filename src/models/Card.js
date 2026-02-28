import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: [true, "Application ID is required"],
      trim: true,
    },
    applicationDate: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "expired"],
      default: "pending",
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
      trim: true,
    },
    alternateContact: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    cardNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    cardIssueDate: {
      type: String,
    },
    cardExpiredDate: {
      type: String,
    },
    verificationDate: {
      type: String,
    },
    totalMember: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Card = mongoose.model("Card", cardSchema);

export default Card;
