// File: routes/summaryRoute.js (or wherever you define routes)

const express = require('express');
const axios = require('axios');
const router = express.Router();


router.get('/', async (req, res) => {
  try {
   res.json({ message: 'Hello from the summary route!' });
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
module.exports = router;
