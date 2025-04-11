const mongoose = require("mongoose");

// Define the feedback schema for participants
const feedbackSchema = new mongoose.Schema({
  participant: {
    type: String, // Participant ID or name
    required: true,
  },
  feedback: {
    type: String, // Feedback content
    required: true,
  },
});

// Define the summary schema for each task
const summarySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  overall_summary: {
    type: String,
    required: true,
  },
  improvement_points: {
    type: [String],
    default: [],
  },
  sentiment_analysis: {
    positive: {
      type: String,
    },
    neutral: {
      type: String,
    },
    negative: {
      type: String,
    },
  },
}, { _id: false }); // Prevent automatic _id generation for embedded summary

// Define the task schema
const taskSchema = new mongoose.Schema({
  seeker: {
    type: String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
  },
  type: {
    type: String,
  },
  reviewedParticipants: {
    type: [String],
    default: [],
  },
  feedback: {
    type: [feedbackSchema],
    default: [],
  },
  summary: {
    type: summarySchema, // Embed summary schema
  },
});

// Define the category schema
const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  participants: {
    type: [String],
  },
  tasks: {
    type: [taskSchema],
  },
});

module.exports = mongoose.model("Category", categorySchema);
