const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with your free API key
// Get your key from: https://aistudio.google.com/
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-api-key-here';
const genAI = new GoogleGenerativeAI('AIzaSyCoBYj3sYVjexnzAEWYPM94jr-Ia0HRE2k');

// Using Gemini 1.5 Flash - free tier with generous limits
// Free tier: 60 requests per minute, 60,000 tokens per minute [citation:9]
const MODEL_NAME = "gemini-1.5-flash"; // or "gemini-2.0-flash-exp" for experimental features

const buildCritiqueConnectPrompt = (id, title, description, reviews) => {
  const formattedReviews = reviews.map(r => `- ${r}`).join('\n');
  
  return `You are an expert review analyst using the Critique Connect framework.

Analyze the following user reviews for the given product or service, and provide a
structured response matching the Critique Connect report format.

Title: ${title}
Description: ${description}

Reviews:
${formattedReviews}

Based on the reviews, return the response in the following JSON format:

{
    "id": "${id}",
    "overall_summary": "<A concise and insightful summary of the overall user feedback>",
    "improvement_points": [
        "<List specific points where users suggest or imply improvements are needed>"
    ],
    "sentiment_analysis": {
        "positive": "<% of reviews that are positive>",
        "neutral": "<% of reviews that are neutral>",
        "negative": "<% of reviews that are negative>"
    }
}

Guidelines:
- Extract patterns and recurring themes from the reviews.
- Use a critical but fair tone, like a professional reviewer.
- Make the summary insightful and actionable.
- Ensure sentiment percentages reflect the tone and content of the reviews.
- Balance strengths and weaknesses for a fair assessment.

Output valid JSON only, without any code blocks or other text.`;
};

const generateSummary = async (data) => {
  const { id, title, description, reviews } = data;

  if (!id || !title || !description || !reviews || !Array.isArray(reviews)) {
    throw new Error("Missing or invalid fields in input data.");
  }

  console.log("Generating summary for:", id, title);
  console.log(`Number of reviews: ${reviews.length}`);

  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    // Build the prompt
    const prompt = buildCritiqueConnectPrompt(id, title, description, reviews);
    
    console.log("Sending request to Gemini API...");
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let summaryText = response.text();
    
    console.log("Raw response received from Gemini");
    
    // Clean up the response (remove markdown code blocks if present)
    summaryText = summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    let summary;
    try {
      summary = JSON.parse(summaryText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response');
      }
    }
    
    // Ensure the ID matches
    summary.id = id;
    
    // Validate and ensure sentiment percentages exist
    if (!summary.sentiment_analysis) {
      summary.sentiment_analysis = { positive: "33%", neutral: "34%", negative: "33%" };
    }
    
    console.log("Summary generated successfully with Gemini");
    return summary;
    
  } catch (error) {
    console.error("Error generating summary with Gemini:", error.message);
    if (error.response) {
      console.error("Gemini API Error Details:", error.response.data);
    }
    
    // Calculate basic sentiment for fallback
    const positiveKeywords = ['good', 'great', 'excellent', 'awesome', 'love', 'like', 'amazing', 'perfect', 'fantastic', 'wonderful'];
    const negativeKeywords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'dislike', 'issue', 'problem', 'bug', 'broken', 'worse'];
    
    let positive = 0, negative = 0, neutral = 0;
    
    reviews.forEach(review => {
      const lowerReview = review.toLowerCase();
      const hasPositive = positiveKeywords.some(keyword => lowerReview.includes(keyword));
      const hasNegative = negativeKeywords.some(keyword => lowerReview.includes(keyword));
      
      if (hasPositive && !hasNegative) positive++;
      else if (hasNegative && !hasPositive) negative++;
      else neutral++;
    });
    
    const total = reviews.length;
    
    // Return fallback summary
    return {
      id: id,
      overall_summary: `Based on ${reviews.length} review(s): The main feedback includes ${reviews.slice(0, 2).join(' and ')}. ${reviews.length > 2 ? 'Additional reviews provide more insights.' : ''}`,
      improvement_points: [
        "Review data has been collected",
        "Manual analysis recommended for detailed insights"
      ],
      sentiment_analysis: {
        positive: `${Math.round((positive / total) * 100)}%`,
        neutral: `${Math.round((neutral / total) * 100)}%`,
        negative: `${Math.round((negative / total) * 100)}%`
      }
    };
  }
};

// Optional: Test function
const testSummary = async () => {
  const testData = {
    id: "test123",
    title: "Mobile App Development",
    description: "Create a React Native e-commerce app with payment integration",
    reviews: [
      "Great concept but UI needs improvement",
      "Very useful app, but scalability concerns",
      "Good idea, needs better performance optimization",
      "The payment integration works smoothly!"
    ]
  };
  
  console.log("Running test with Gemini...");
  const result = await generateSummary(testData);
  console.log("Generated Summary:", JSON.stringify(result, null, 2));
};

// Run test if called directly
if (require.main === module) {
  testSummary();
}

module.exports = { generateSummary };
