import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: String,
      unique: true,
      required: [true, "Enquiry ID is required"],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    location: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    message: {
      type: String,
      trim: true,
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

// Index for search and filtering
donationSchema.index({ name: 1 });
donationSchema.index({ contact: 1 });
donationSchema.index({ date: -1 });
donationSchema.index({ isDeleted: 1 });

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
