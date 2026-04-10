const axios = require('axios');

// Groq Free API (sign up at https://console.groq.com)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const generateSummary = async (data) => {
  const { id, title, description, reviews } = data;

  if (!id || !title || !description || !reviews || !Array.isArray(reviews)) {
    throw new Error("Missing or invalid fields in input data.");
  }

  console.log("Generating summary for:", id, title);
  console.log(`Number of reviews: ${reviews.length}`);

  try {
  const prompt = `You are an expert review analyst using the Critique Connect framework.

Analyze the following user reviews for the given product or service, and provide a
structured response matching the Critique Connect report format.

Title: ${title}
Description: ${description}

Reviews:
${reviewsList}

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

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-8b-8192", // Free model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let summaryText = response.data.choices[0].message.content;
    summaryText = summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const summary = JSON.parse(summaryText);
    
    return { id, ...summary };
    
  } catch (error) {
    console.error("Error:", error.message);
    return {
      id,
      overall_summary: `Summary of ${reviews.length} reviews: ${reviews.join('; ')}`,
      improvement_points: ["Check reviews for improvement points"],
      sentiment_analysis: { positive: "33%", neutral: "34%", negative: "33%" }
    };
  }
};

module.exports = { generateSummary };
