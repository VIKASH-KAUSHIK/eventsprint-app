import mongoose, { Schema, model, models } from "mongoose";

if (process.env.NODE_ENV !== "production") {
  delete (models as any).Submission;
}

const SubmissionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "",
    },
    track: {
      type: String,
      default: "AI & Distributed Systems",
    },
    pitchText: {
      type: String,
      required: true,
    },
    aiEvaluation: {
      overallScore: { type: Number, default: 0 },
      breakdown: [
        {
          criterion: String,
          score: Number,
          feedback: String,
        },
      ],
      recommendations: [String],
    },
  },
  { timestamps: true }
);

export const Submission = models.Submission || model("Submission", SubmissionSchema);
export default Submission;