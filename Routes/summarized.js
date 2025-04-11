// File: routes/summaryRoute.js (or wherever you define routes)

const express = require('express');
const axios = require('axios');
const Categories = require('../Models/Categories');
const router = express.Router();


router.post('/', async (req, res) => {
      const { category ,title } = req.body;
        const response = await Categories.findOne({ category });
        const task = response.tasks.find(task => task.title === title);

        if (!task.summary) {
            return res.status(404).json({ message: "Summary not available for this task." });
        }
        res.json(task.summary);

});
module.exports = router;
