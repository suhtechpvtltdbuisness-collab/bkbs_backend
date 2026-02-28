import mongoose from "mongoose";

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Partner name is required"],
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

const Partner = mongoose.model("Partner", partnerSchema);

export default Partner;
