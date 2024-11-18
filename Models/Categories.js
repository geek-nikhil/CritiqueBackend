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

// Define the task schema
const taskSchema = new mongoose.Schema({
  seeker :{
    type : String,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  url: {
    type: String, // Optional URL for the task
  },
  type: {
    type: String,
  },
  reviewedParticipants: {
    type: [String], 
    default: [],
  },
  feedback: {
    type: [feedbackSchema], // Array of feedback objects
    default: [], // Default to an empty array if no feedback is provided
  },
});

// Define the category schema
const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  participants: {
    type: [String], // Array of participant names or IDs
  },
  tasks: {
    type: [taskSchema], // Array of tasks, each following the `taskSchema`
  },
});

module.exports = mongoose.model("Category", categorySchema);
