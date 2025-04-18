const axios = require('axios');

const getFeedbackSummary = async (data) => {
  const url = "https://feedback-backend-51af.onrender.com/api/agent/process";

  try {
    const response = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error("Error fetching feedback summary:", error.message);
    throw error;
  }
};

const generateSummary = async (data) => {
  const { id, title, description, reviews } = data;

  if (!id || !title || !description || !reviews || !Array.isArray(reviews)) {
    throw new Error("Missing or invalid fields in input data.");
  }
  console.log("Generating summary for:", id, title, description, reviews);
  const summary = await getFeedbackSummary({ id, title, description, reviews });
  return summary;
};
const refreshApi = async () => {
    try {
        const response = await axios.get('https://feedback-backend-51af.onrender.com/');
        console.log('API refreshed successfully:', response.data);
    } catch (error) {
        console.error('Error refreshing API:', error.message);
    }
};
    setInterval(refreshApi, 10000 ); // Refresh every hour

module.exports = {
  getFeedbackSummary,
  generateSummary,
};
