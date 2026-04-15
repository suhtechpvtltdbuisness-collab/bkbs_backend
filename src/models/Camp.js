import mongoose from "mongoose";

const campSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Camp name is required"],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, "Camp latitude is required"],
    },
    long: {
      type: Number,
      required: [true, "Camp longitude is required"],
    },
    city: {
      type: String,
      required: [true, "Camp city is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Camp state is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Camp date is required"],
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

campSchema.index({ isDeleted: 1 });
campSchema.index({ date: -1 });

const Camp = mongoose.model("Camp", campSchema);

export default Camp;
