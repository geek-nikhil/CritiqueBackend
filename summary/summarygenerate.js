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
    const prompt = `Analyze these reviews and return JSON only:

Task: ${title}
Description: ${description}

Reviews:
${reviews.map((r, i) => `${i+1}. ${r}`).join('\n')}

Return EXACTLY this format (no other text):
{
    "overall_summary": "2-3 sentence summary",
    "improvement_points": ["point1", "point2"],
    "sentiment_analysis": {"positive": "X%", "neutral": "Y%", "negative": "Z%"}
}`;

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
