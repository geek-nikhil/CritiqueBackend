const express = require('express');
const router = express.Router();
const User = require('../Models/User'); // Import your User model
const Category = require('../Models/Categories');
// Create a new user
router.post('/signup', async (req, res) => {
  const { OrganisationName, email, role, domains, linkedin } = req.body;

  try {
    // Create a new user instance
    const user = new User({ 
      OrganisationName, 
      email, 
      role, 
      interests: domains, // Assign domains directly to interests
      linkedin 
    });

    // Iterate over domains to update or create categories
    for (const domain of domains) {
      let category = await Category.findOne({ category: domain });

      if (!category) {
        // Create a new category if it doesn't exist
        category = new Category({
          category: domain,
          participants: [email],
          tasks: []
        });
      } else {
        // Add the user's email to participants if not already present
        if (!category.participants.includes(email)) {
          category.participants.push(email);
        }
      }

      // Save the category
      await category.save();
    }

    await user.save(); // Save the user to the database
    res.status(201).send(user); // Respond with the created user
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(400).send({ error: error.message }); // Send detailed error message
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).send(users); // Respond with the users
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).send({ error: error.message }); // Handle server error
  }
});

module.exports = router;
