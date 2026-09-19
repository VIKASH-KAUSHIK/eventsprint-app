import mongoose, { Schema, model, models } from "mongoose";

const HackathonConfigSchema = new Schema({
  name: { type: String, default: "EventSprint Hackathon" },
  minTeamSize: { type: Number, default: 2 },
  maxTeamSize: { type: Number, default: 4 },
  registrationOpen: { type: Boolean, default: true },
  teamLockDeadline: { type: Date },
});

export const HackathonConfig =
  models.HackathonConfig || model("HackathonConfig", HackathonConfigSchema);