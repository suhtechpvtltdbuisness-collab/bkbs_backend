import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    timeFrom: {
      type: String,
      trim: true,
    },
    timeTo: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    days: {
      type: [String],
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      default: [],
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

// Indexes
doctorSchema.index({ organizationId: 1 });
doctorSchema.index({ isDeleted: 1 });
doctorSchema.index({ createdBy: 1 });
doctorSchema.index({ name: 1 });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
