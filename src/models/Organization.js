import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    partnerId: {
      type: String,
      trim: true,
    },
    establishedYear: {
      type: String,
      trim: true,
    },
    bed: {
      type: Number,
      min: 0,
    },
    logo: {
      type: String,
      trim: true,
    },
    staff: {
      type: Number,
      min: 0,
    },
    ambulance: {
      type: String,
      trim: true,
    },
    emergency: {
      type: String,
      trim: true,
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
organizationSchema.index({ registrationId: 1 });
organizationSchema.index({ isDeleted: 1 });
organizationSchema.index({ createdBy: 1 });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
