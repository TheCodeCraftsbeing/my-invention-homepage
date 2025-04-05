// api/tone-changer.js

// Import the Google Generative AI SDK
// We'll install this in the next step
const { GoogleGenerativeAI } = require("@google/generative-ai");

// IMPORTANT: Access your API key from environment variables
// Never hardcode your API key! We'll set this up in Vercel's dashboard.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// This is the main function Vercel will run
module.exports = async (req, res) => {
  // 1. Check if it's a POST request (we expect data)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 2. Get data from the request body
    const { text, tone } = req.body;

    // Basic validation
    if (!text || !tone) {
      return res.status(400).json({ error: 'Missing "text" or "tone" in request body' });
    }

    // 3. --- GEMINI API CALL LOGIC WILL GO HERE ---
    // For now, let's just log it and send a placeholder

    console.log("Received Text:", text);
    console.log("Received Tone:", tone);

    // Construct the prompt for Gemini
    const prompt = `Rewrite the following text to have a "${tone}" tone:\n\n"${text}"`;
    console.log("Prompt for Gemini:", prompt);


    // Use the stable versioned model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Send the prompt and get the result
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rewrittenText = response.text();

    console.log("Gemini Response Text:", rewrittenText);

    // 4. Send the successful response back
    res.status(200).json({
       originalText: text,
       requestedTone: tone,
       rewrittenText: rewrittenText // Send the actual text from Gemini
    });

  } catch (error) {
    // 5. Handle errors
    console.error("Error processing request:", error);
    // Check for specific Gemini errors if needed, otherwise send a generic error
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
};