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
    relation: {
      type: String,
      trim: true,
    },
    relatedPerson: {
      type: String,
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
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
    documents: [
      {
        filename: {
          type: String,
        },
        originalName: {
          type: String,
        },
        path: {
          type: String,
        },
        size: {
          type: Number,
        },
        mimetype: {
          type: String,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Created by is required"],
    },
    isPrint: {
      type: Boolean,
      default: false,
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

// Indexes - Only apply to non-deleted cards
cardSchema.index(
  { contact: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

cardSchema.index(
  { firstName: 1, middleName: 1, lastName: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  },
);

const Card = mongoose.model("Card", cardSchema);

export default Card;
