import mongoose, { Schema, model, models } from "mongoose";

const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    leaderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    track: {
      type: String,
      default: "AI & Distributed Systems",
    },
    maxMembers: {
      type: Number,
      default: 4,
      min: 1,
      max: 6,
    },
    isLocked: {
      type: Boolean,
      default: false, // Organizers or leaders can lock rosters
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export const Team = models.Team || model("Team", TeamSchema);
export default Team;