const express = require('express');
const router = express.Router();
const User = require('../Models/User'); // Import your User model
const Category = require('../Models/Categories');

router.get('/', async (req, res) => {
  try {
    res.send('Hello, this is the summary endpoint!');
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

module.exports = router;
