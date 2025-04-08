// api/tone-changer.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure GEMINI_API_KEY is loaded from Vercel Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Read the expected secret from Vercel Environment Variables
const EXPECTED_SECRET = process.env.API_SECRET_KEY;

module.exports = async (req, res) => {
  // --- SECURITY CHECK ---
  const providedSecret = req.headers['x-api-secret']; // Read secret from header (lowercase standard)

  if (!EXPECTED_SECRET) {
     // Safety check: If the env variable isn't set on the server, deny all
     console.error("CRITICAL: API_SECRET_KEY environment variable not set on Vercel.");
     // Don't expose internal details to the client
     return res.status(500).json({ error: "API configuration error." });
  }

  if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
    console.warn(`Unauthorized attempt detected. Provided Secret: ${providedSecret ? '******' : 'None'}`); // Avoid logging the actual wrong secret
    // Return a generic 403 Forbidden status
    return res.status(403).json({ error: "Forbidden" });
  }
  // --- END SECURITY CHECK ---

  // --- METHOD CHECK ---
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    // Use 405 Method Not Allowed for incorrect methods
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  // --- END METHOD CHECK ---

  // --- MAIN LOGIC ---
  try {
    // 1. Get data from the request body
    // Add basic checks for body existence and content type if needed, though Vercel often handles JSON parsing
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body. Expected JSON.' });
    }
    const { text, tone } = req.body;

    // 2. Basic validation
    if (!text || !tone) {
      return res.status(400).json({ error: 'Missing "text" or "tone" in request body' });
    }
    if (typeof text !== 'string' || typeof tone !== 'string') {
        return res.status(400).json({ error: '"text" and "tone" must be strings.' });
    }
    if (text.trim() === '' || tone.trim() === '') {
         return res.status(400).json({ error: '"text" and "tone" cannot be empty.' });
    }


    // 3. Construct the prompt for Gemini
    // Keep the prompt relatively simple and clear
    const prompt = `Please rewrite the following text to have a single, specific "${tone}" tone. Only return the rewritten text, without any introductory phrases like "Here is the rewritten text:":\n\n"${text}"`;
    console.log("Attempting to generate content with tone:", tone); // Log intent

    // 4. Choose the Gemini model (ensure this model name is correct and available)
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); // Or "gemini-1.5-flash-latest" etc.

    // 5. Send the prompt and get the result
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rewrittenText = response.text(); // Use .text() method

    console.log("Gemini generation successful for tone:", tone);

    // 6. Send the successful response back to the frontend
    res.status(200).json({
       originalText: text,      // Optional: echo back original text
       requestedTone: tone,     // Optional: echo back requested tone
       rewrittenText: rewrittenText // The main payload
    });

  } catch (error) {
    // 7. Handle errors during Gemini call or processing
    console.error("Error processing tone change request:", error);

    // Provide a generic error message to the client for security
    // Log the detailed error on the server (Vercel logs) for debugging
    // Check for specific API errors if needed (e.g., billing issues, quota exceeded)
    if (error.message.includes('API key not valid')) {
         // Log a more specific internal error
         console.error("Gemini API key validation failed.");
         // Return generic error externally
         res.status(500).json({ error: 'API processing failed.', details: "Internal configuration issue." });
    } else if (error.message.includes('billing')) {
         console.error("Gemini API billing issue detected.");
         res.status(500).json({ error: 'API processing failed.', details: "Billing configuration issue." });
    }
     else {
         res.status(500).json({ error: 'API processing failed.', details: error.message || 'An unexpected error occurred.' });
    }
  }
  // --- END MAIN LOGIC ---
}; // End of module.exports