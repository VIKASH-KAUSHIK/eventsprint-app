import mongoose, { Schema, model, models } from "mongoose";

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    tracks: [{ type: String }],
    submissionDeadline: { type: Date, required: true },
    isLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Event = models.Event || model("Event", EventSchema);