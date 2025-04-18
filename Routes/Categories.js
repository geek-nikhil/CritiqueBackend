const express = require('express');
const router = express.Router();
const categories = require('../Models/Categories');
const  User = require('../Models/User');
const { generateSummary } = require('../summary/summarygenerate');

router.get('/', async (req, res) => {
  try {
    console.log("object")
    const response = await categories.find();
    res.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/task', async (req, res) => {
  try {
    const { category, seeker, task } = req.body;

    console.log(task);

    let response = await categories.findOne({ category });

    // ✅ If category doesn't exist, create it
    if (!response) {
      response = new categories({
        category,
        participants: [],
        tasks: [],
      });
    }

    // ✅ Prepare task object
    const newTask = {
      seeker,
      title: task.title,
      description: task.description,
      type: task.type,
    };

    // Only add URL if task type is 'idea' or 'survey'
    if (task.type === "idea" || task.type === "survey") {
      newTask.url = task.url;
    }

    // ✅ Push task
    response.tasks.push(newTask);

    // ✅ Save updated/new category document
    await response.save();

    res.json("submitted");
  } catch (error) {
    console.error('Error creating/updating category:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/provider/:email', async (req, res) => {
  const { email } = req.params;
  console.log(email)
  try {
    // Find the user by email
    const response = await User.findOne({ email });

    if (!response || !response.interests) {
      return res.status(404).json({ error: "User or interests not found." });
    }

    // Fetch categories and filter tasks based on user's interests
    const categoriesWithValidTasks = await Promise.all(
      response.interests.map(async (element) => {
        const category = await categories.findOne({ category: element });

        if (!category || !category.tasks) {
          return null; // Skip if category or tasks do not exist
        }

        // Filter valid tasks that the user hasn't reviewed yet
        const validTasks = category.tasks.filter(
          (task) => !task.reviewedParticipants.includes(email) // Only include tasks the user hasn't reviewed
        );

        // Return category with valid tasks
        return {
          category: category.category,
          participants: category.participants,
          tasks: validTasks, // Attach only valid tasks
        };
      })
    );

    // Remove any null results (categories that were skipped)
    const filteredCategories = categoriesWithValidTasks.filter(Boolean);

    // If no valid tasks are found, return a response indicating that
    if (filteredCategories.length === 0) {
      return res.status(404).json({ message: "No valid tasks found for this user." });
    }

    // Respond with categories containing valid tasks
    res.json(filteredCategories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/task/feedback', async (req, res) => {
  const { category, title, feedback, email } = req.body;

  console.log(`${category} || ${title} || ${feedback} || ${email}`);

  try {
    const response = await categories.findOne({ category });

    const task = response.tasks.find(task => task.title === title);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Step 1: Add feedback first
    task.feedback.push({
      feedback,
      participant: email,
    });
    task.reviewedParticipants.push(email);

    // Step 2: If there's more than 1 feedback, generate summary
    if (task.feedback.length > 1) {
      const reviews = task.feedback.map(fb => fb.feedback);

      const summaryPayload = {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        reviews,
      };

      try {
        const summary = await generateSummary(summaryPayload);

        // Step 3: Add summary to the task
        task.summary = summary;
        console.log('Summary generated and added to task.');
      } catch (summaryErr) {
        console.error("Error generating summary:", summaryErr.message);
        // Don't block the response on summary failure
      }
    }

    // Step 4: Save the changes to DB
    await response.save();
    res.json(response);
  } catch (error) {
    console.error('Error updating task with feedback:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.get('/feedbacks/:email', async (req, res) => {
  const { email } = req.params;
  console.log('Email:', email);

  try {
    // Assuming you're fetching `response` from a database
    const response = await categories.find(); // Replace with actual query
    console.log('Fetched response:', response);

    // Filter the tasks for the given email
    const filteredTasks = response.flatMap(element => 
      element.tasks.filter(task => task.seeker === email)
    );
    const feedbacks = filteredTasks.map(task => ({
      title: task.title,
      feedback: task.feedback,
    }));
    console.log('Filtered tasks:', filteredTasks);

    // Send filtered tasks as the response
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
    