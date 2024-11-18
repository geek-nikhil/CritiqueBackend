const express = require('express');
const router = express.Router();
const categories = require('../Models/Categories');
const  User = require('../Models/User');

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
    const { category,seeker, task } = req.body;
    const response = await categories.findOne( { category: category });
       
    console.log(task);
    if(task.type === "problem")  {
    response.tasks.push({
          seeker: seeker,
            title: task.title,
            description: task.description,
            // url: task.url,
            type: task.type,
        })
      }
      if(task.type === "idea")  {
        response.tasks.push({
          seeker: seeker,
            title: task.title,
            description: task.description,
            url: task.url,
            type: task.type,
        })
      }
      if(task.type === "survey")  {
        response.tasks.push({
          seeker: seeker,
            title: task.title,
            description: task.description,
            url: task.url,
            type: task.type,
        })
      } 
      response.save();
    res.json("submmitted");
  }catch (error) {
    console.error('Error creating category:', error.message);
    res.status  
    (500).json({ error: 'Internal Server Error' });
  }
})   

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
console.log(category + "||  " +  title + "||  " + feedback + "||  " + email);
try {
  const response = await categories.findOne( { category: category });
  const task = response.tasks.find(task => task.title === title);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  task.feedback.push({
    feedback: feedback,
    participant: email,
  })
  task.reviewedParticipants.push(email);
  await response.save();
  res.json(response);
} catch (error) {
  console.error('Error creating category:', error.message);
  res.status(500).json({ error: 'Internal Server Error' });
}
})
module.exports = router;
