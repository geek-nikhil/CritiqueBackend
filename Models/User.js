const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  interest: {
    type: String,
    required: true,
  },
});

const UserSchema = new mongoose.Schema({
  OrganisationName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
  },
  interests: {
    type: [String], // Ensure it's an array of strings
    required: true,
  },
  linkedin: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', UserSchema);

