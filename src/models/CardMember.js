import mongoose from "mongoose";

const cardMemberSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: [true, "Card ID is required"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    relation: {
      type: String,
      required: [true, "Relation is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
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

const CardMember = mongoose.model("CardMember", cardMemberSchema);

export default CardMember;
