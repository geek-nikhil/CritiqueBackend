const mongoose = require('mongoose');

const connectDB = async () => {
  console.log("object");
  try {
    // Fixed the space in the MongoDB URI
    await mongoose.connect('mongodb://127.0.0.1:27017/critique', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();
