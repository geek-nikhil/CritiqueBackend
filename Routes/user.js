const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Category = require('../Models/Categories');

// Create a new user (signup)
router.post('/signup', async (req, res) => {
  const { OrganisationName, email, password, role, domains, linkedin } = req.body;

  // Validate required fields
  if (!OrganisationName || !email || !password || !role || !domains || !linkedin) {
    return res.status(400).send({ error: 'All fields are required' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).send({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send({ error: 'User with this email already exists' });
    }

    // Create a new user instance
    const user = new User({ 
      OrganisationName, 
      email: email.toLowerCase(),
      role, 
      interests: domains,
      linkedin 
    });

    // Set the password (this will generate salt and hash)
    user.setPassword(password);

    // Iterate over domains to update or create categories
    for (const domain of domains) {
      let category = await Category.findOne({ category: domain });

      if (!category) {
        // Create a new category if it doesn't exist
        category = new Category({
          category: domain,
          participants: [email.toLowerCase()],
          tasks: []
        });
      } else {
        // Add the user's email to participants if not already present
        if (!category.participants.includes(email.toLowerCase())) {
          category.participants.push(email.toLowerCase());
        }
      }

      // Save the category
      await category.save();
    }

    await user.save();
    
    // Don't send password or salt back in response
    const userResponse = {
      OrganisationName: user.OrganisationName,
      email: user.email,
      role: user.role,
      interests: user.interests,
      linkedin: user.linkedin,
      createdAt: user.createdAt
    };
    
    res.status(201).send({ 
      message: 'User created successfully',
      user: userResponse 
    });
    
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(400).send({ error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    // Validate password
    const isValidPassword = user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }

    // Don't send password or salt back in response
    const userResponse = {
      OrganisationName: user.OrganisationName,
      email: user.email,
      role: user.role,
      interests: user.interests,
      linkedin: user.linkedin,
      createdAt: user.createdAt
    };

    res.status(200).send({ 
      message: 'Login successful',
      user: userResponse 
    });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Get all users (excluding password and salt)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -salt');
    res.status(200).send(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).send({ error: error.message });
  }
});

// Get single user by ID (excluding password and salt)
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -salt');
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
