const mongoose = require('mongoose');

const connectDB = async () => {
  console.log("object");
  try {
    // Fixed the space in the MongoDB URI
    await mongoose.connect('mongodb+srv://nikhilraikwar846:IkQU5yIBMpFIluLs@cluster0.a8u4r.mongodb.net/critique');
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();
