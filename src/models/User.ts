import mongoose, { Schema, model, models } from "mongoose";

if (process.env.NODE_ENV !== "production") {
  delete (models as any).User;
}

const UserSchema = new Schema(
  {
    name: {
      type: String,
      default: "Participant",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "participant",
    },
    // Skills & track preferences for AI matching
    skills: {
      type: [String],
      default: ["Next.js", "React", "Node.js"], // sensible defaults
    },
    primaryTrack: {
      type: String,
      default: "AI & Distributed Systems",
    },
    bio: {
      type: String,
      default: "Full-stack hacker interested in building autonomous agents.",
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
export default User;