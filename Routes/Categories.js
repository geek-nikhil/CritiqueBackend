const express = require('express');
const router = express.Router();
const categories = require('../Models/Categories');
const User = require('../Models/User');
const { generateSummary } = require('../summary/summarygenerate');

// GET health check endpoint
router.get('/health', async (req, res) => {
  console.log('[GET /health] - Health check endpoint hit');
  console.log(`[GET /health] - Timestamp: ${new Date().toISOString()}`);
  console.log(`[GET /health] - Request IP: ${req.ip}`);
  console.log(`[GET /health] - User Agent: ${req.get('user-agent')}`);
  
  try {
    // Optional: Check database connection
    console.log('[GET /health] - Checking database connection...');
    await categories.findOne().lean(); // Simple query to check DB
    console.log('[GET /health] - Database connection: OK');
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
    
    console.log('[GET /health] - Health check successful:', JSON.stringify(healthStatus, null, 2));
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('[GET /health] - Health check failed:', error.message);
    console.error('[GET /health] - Database connection error:', error.stack);
    
    const healthStatus = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: 'disconnected',
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
    
    res.status(503).json(healthStatus);
  }
});

// Simple health check without database verification (lighter version)
router.get('/ping', (req, res) => {
  console.log('[GET /ping] - Simple ping received');
  console.log(`[GET /ping] - Timestamp: ${new Date().toISOString()}`);
  
  res.status(200).json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// GET all categories
router.get('/', async (req, res) => {
  console.log('[GET /] - Fetching all categories');
  try {
    const response = await categories.find();
    console.log(`[GET /] - Successfully fetched ${response.length} categories`);
    res.json(response);
  } catch (error) {
    console.error('[GET /] - Error fetching categories:', error.message);
    console.error('[GET /] - Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST create new task
router.post('/task', async (req, res) => {
  console.log('[POST /task] - Received request to create task');
  console.log('[POST /task] - Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { category, seeker, task } = req.body;
    console.log(`[POST /task] - Extracted data - Category: ${category}, Seeker: ${seeker}`);
    console.log(`[POST /task] - Task details:`, task);

    let response = await categories.findOne({ category });
    console.log(`[POST /task] - Category lookup result: ${response ? 'Found existing category' : 'Category not found, will create new'}`);

    // ✅ If category doesn't exist, create it
    if (!response) {
      console.log(`[POST /task] - Creating new category: ${category}`);
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
    console.log(`[POST /task] - Created new task object:`, newTask);

    // Only add URL if task type is 'idea' or 'survey'
    if (task.type === "idea" || task.type === "survey") {
      newTask.url = task.url;
      console.log(`[POST /task] - Added URL to task: ${task.url}`);
    }

    // ✅ Push task
    response.tasks.push(newTask);
    console.log(`[POST /task] - Pushed task to category. Total tasks now: ${response.tasks.length}`);

    // ✅ Save updated/new category document
    await response.save();
    console.log(`[POST /task] - Successfully saved category to database`);

    res.json("submitted");
    console.log('[POST /task] - Response sent: submitted');
  } catch (error) {
    console.error('[POST /task] - Error creating/updating category:', error.message);
    console.error('[POST /task] - Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET provider tasks by email
router.get('/provider/:email', async (req, res) => {
  const { email } = req.params;
  console.log(`[GET /provider/${email}] - Fetching tasks for provider`);
  
  try {
    // Find the user by email
    console.log(`[GET /provider/${email}] - Looking up user in database`);
    const response = await User.findOne({ email });
    
    if (!response) {
      console.log(`[GET /provider/${email}] - User not found`);
      return res.status(404).json({ error: "User not found." });
    }
    
    console.log(`[GET /provider/${email}] - User found. Interests:`, response.interests);

    if (!response.interests) {
      console.log(`[GET /provider/${email}] - User has no interests defined`);
      return res.status(404).json({ error: "User or interests not found." });
    }

    // Fetch categories and filter tasks based on user's interests
    console.log(`[GET /provider/${email}] - Fetching categories for ${response.interests.length} interests`);
    const categoriesWithValidTasks = await Promise.all(
      response.interests.map(async (element, index) => {
        console.log(`[GET /provider/${email}] - Processing interest ${index + 1}/${response.interests.length}: ${element}`);
        const category = await categories.findOne({ category: element });

        if (!category) {
          console.log(`[GET /provider/${email}] - Category '${element}' not found, skipping`);
          return null; // Skip if category does not exist
        }
        
        console.log(`[GET /provider/${email}] - Category '${element}' found with ${category.tasks?.length || 0} tasks`);

        if (!category.tasks || category.tasks.length === 0) {
          console.log(`[GET /provider/${email}] - No tasks in category '${element}', skipping`);
          return null;
        }

        // Filter valid tasks that the user hasn't reviewed yet
        const validTasks = category.tasks.filter(
          (task) => !task.reviewedParticipants?.includes(email)
        );
        console.log(`[GET /provider/${email}] - Filtered tasks for '${element}': ${validTasks.length} valid out of ${category.tasks.length} total`);

        // Return category with valid tasks
        return {
          category: category.category,
          participants: category.participants,
          tasks: validTasks,
        };
      })
    );

    // Remove any null results (categories that were skipped)
    const filteredCategories = categoriesWithValidTasks.filter(Boolean);
    console.log(`[GET /provider/${email}] - Final categories with valid tasks: ${filteredCategories.length}`);

    // If no valid tasks are found, return a response indicating that
    if (filteredCategories.length === 0) {
      console.log(`[GET /provider/${email}] - No valid tasks found for this user`);
      return res.status(404).json({ message: "No valid tasks found for this user." });
    }

    // Respond with categories containing valid tasks
    console.log(`[GET /provider/${email}] - Successfully returning ${filteredCategories.length} categories`);
    res.json(filteredCategories);
  } catch (error) {
    console.error(`[GET /provider/${email}] - Error fetching categories:`, error.message);
    console.error(`[GET /provider/${email}] - Stack trace:`, error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST task feedback
router.post('/task/feedback', async (req, res) => {
  console.log('[POST /task/feedback] - Received feedback submission');
  console.log('[POST /task/feedback] - Request body:', JSON.stringify(req.body, null, 2));
  
  const { category, title, feedback, email } = req.body;
  console.log(`[POST /task/feedback] - Extracted: Category: ${category}, Title: ${title}, Email: ${email}`);
  console.log(`[POST /task/feedback] - Feedback content: ${feedback}`);

  try {
    console.log(`[POST /task/feedback] - Finding category: ${category}`);
    const response = await categories.findOne({ category });
    
    if (!response) {
      console.log(`[POST /task/feedback] - Category '${category}' not found`);
      return res.status(404).json({ error: 'Category not found' });
    }
    console.log(`[POST /task/feedback] - Category found, searching for task: ${title}`);

    const task = response.tasks.find(task => task.title === title);
    if (!task) {
      console.log(`[POST /task/feedback] - Task '${title}' not found in category '${category}'`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log(`[POST /task/feedback] - Task found. Current feedback count: ${task.feedback?.length || 0}`);

    // Step 1: Add feedback first
    console.log(`[POST /task/feedback] - Adding feedback from ${email}`);
    task.feedback.push({
      feedback,
      participant: email,
    });
    task.reviewedParticipants.push(email);
    console.log(`[POST /task/feedback] - Feedback added. New feedback count: ${task.feedback.length}`);
    console.log(`[POST /task/feedback] - Reviewed participants count: ${task.reviewedParticipants.length}`);

    // Step 2: If there's more than 1 feedback, generate summary
    if (task.feedback.length > 1) {
      console.log(`[POST /task/feedback] - ${task.feedback.length} feedbacks collected, generating summary...`);
      const reviews = task.feedback.map(fb => fb.feedback);
      console.log(`[POST /task/feedback] - Reviews to summarize:`, reviews);

      const summaryPayload = {
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        reviews,
      };
      console.log(`[POST /task/feedback] - Summary payload created:`, summaryPayload);

      try {
        console.log(`[POST /task/feedback] - Calling generateSummary function...`);
        const summary = await generateSummary(summaryPayload);
        console.log(`[POST /task/feedback] - Summary generated successfully:`, summary);

        // Step 3: Add summary to the task
        task.summary = summary;
        console.log('[POST /task/feedback] - Summary added to task');
      } catch (summaryErr) {
        console.error("[POST /task/feedback] - Error generating summary:", summaryErr.message);
        console.error("[POST /task/feedback] - Summary error stack:", summaryErr.stack);
        // Don't block the response on summary failure
      }
    } else {
      console.log(`[POST /task/feedback] - Only ${task.feedback.length} feedback so far, skipping summary generation (need at least 2)`);
    }

    // Step 4: Save the changes to DB
    console.log('[POST /task/feedback] - Saving updated category to database');
    await response.save();
    console.log('[POST /task/feedback] - Successfully saved feedback');
    
    res.json(response);
    console.log('[POST /task/feedback] - Response sent with updated category');
  } catch (error) {
    console.error('[POST /task/feedback] - Error updating task with feedback:', error.message);
    console.error('[POST /task/feedback] - Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET feedbacks by email
router.get('/feedbacks/:email', async (req, res) => {
  const { email } = req.params;
  console.log(`[GET /feedbacks/${email}] - Fetching feedbacks for seeker`);
  
  try {
    // Fetch all categories from database
    console.log(`[GET /feedbacks/${email}] - Fetching all categories`);
    const response = await categories.find();
    console.log(`[GET /feedbacks/${email}] - Found ${response.length} total categories`);
    
    // Filter the tasks for the given email
    console.log(`[GET /feedbacks/${email}] - Filtering tasks where seeker = ${email}`);
    const filteredTasks = response.flatMap(element => {
      const matchingTasks = element.tasks.filter(task => task.seeker === email);
      if (matchingTasks.length > 0) {
        console.log(`[GET /feedbacks/${email}] - Category '${element.category}': Found ${matchingTasks.length} matching tasks`);
      }
      return matchingTasks;
    });
    
    console.log(`[GET /feedbacks/${email}] - Total tasks found for seeker: ${filteredTasks.length}`);
    
    const feedbacks = filteredTasks.map(task => ({
      title: task.title,
      feedback: task.feedback || [],
    }));
    
    console.log(`[GET /feedbacks/${email}] - Extracted feedbacks from ${filteredTasks.length} tasks`);
    feedbacks.forEach((fb, index) => {
      console.log(`[GET /feedbacks/${email}] - Task ${index + 1}: '${fb.title}' has ${fb.feedback.length} feedback items`);
    });

    // Send filtered tasks as the response
    console.log(`[GET /feedbacks/${email}] - Successfully returning feedbacks`);
    res.json(feedbacks);
  } catch (error) {
    console.error(`[GET /feedbacks/${email}] - Error fetching tasks:`, error.message);
    console.error(`[GET /feedbacks/${email}] - Stack trace:`, error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
