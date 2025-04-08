// api/tone-changer.js

// Import the Google Generative AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Initialization ---
// Initialize the SDK - it will implicitly use process.env.GEMINI_API_KEY
let genAI;
try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
    console.error("CRITICAL: Failed to initialize GoogleGenerativeAI SDK. Check GEMINI_API_KEY.", error);
    // If SDK fails to init, the function cannot work.
}

// Read the expected secret key for API authorization from environment variables
const EXPECTED_SECRET = process.env.API_SECRET_KEY;
// --- End Initialization ---


// --- Main Handler Function ---
module.exports = async (req, res) => {

    // --- Pre-computation Checks ---
    // Check if SDK initialized correctly
    if (!genAI) {
        return res.status(500).json({ error: "API Initialization Failed", details: "Server configuration issue." });
    }

    // Check if expected secret is configured on the server
    if (!EXPECTED_SECRET) {
        console.error("CRITICAL: API_SECRET_KEY environment variable not set on Vercel server.");
        return res.status(500).json({ error: "API Security Not Configured", details: "Server configuration issue." });
    }
    // --- End Pre-computation Checks ---


    // --- Security Check ---
    const providedSecret = req.headers['x-api-secret']; // Standard header practice is lowercase
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn(`Unauthorized API attempt detected. Request from IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
        // Return 403 Forbidden - do not give details about why
        return res.status(403).json({ error: "Forbidden" });
    }
    // --- End Security Check ---


    // --- Method Check ---
    if (req.method !== 'POST') {
        // Allow only POST requests
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    // --- End Method Check ---


    // --- Request Body Processing and Validation ---
    try {
        // Check if body exists and is an object (Vercel likely parses JSON by default)
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid Request Body', details: 'Expected JSON payload.' });
        }

        const { text, tone } = req.body;

        // Validate required fields
        if (!text || !tone) {
            return res.status(400).json({ error: 'Missing Required Fields', details: 'Both "text" and "tone" are required.' });
        }
        if (typeof text !== 'string' || typeof tone !== 'string') {
            return res.status(400).json({ error: 'Invalid Data Types', details: '"text" and "tone" must be strings.' });
        }
        const trimmedText = text.trim();
        const trimmedTone = tone.trim();
        if (trimmedText === '' || trimmedTone === '') {
            return res.status(400).json({ error: 'Empty Input', details: '"text" and "tone" cannot be empty or just whitespace.' });
        }

        // Optional: Add length limits if needed
        // if (trimmedText.length > 5000) { // Example limit
        //     return res.status(413).json({ error: 'Payload Too Large', details: 'Input text exceeds maximum length.' });
        // }

    // --- End Request Body Processing ---


        // --- Gemini API Interaction ---
        console.log(`Processing tone change request. Tone: "${trimmedTone}"`); // Log request info

        // Construct the prompt clearly
        const prompt = `Rewrite the following text to have a "${trimmedTone}" tone. Respond only with the rewritten text itself, without any preamble or explanation.\n\nOriginal Text:\n"${trimmedText}"`;

        // Choose the Gemini model
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); // Consider gemini-1.5-flash-latest for speed/cost

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Check for safety ratings or blocks if necessary (depending on use case)
        // if (response.promptFeedback?.blockReason) {
        //    console.warn(`Gemini request blocked. Reason: ${response.promptFeedback.blockReason}`);
        //    return res.status(400).json({ error: 'Request Blocked', details: `Content generation blocked due to safety settings (${response.promptFeedback.blockReason}).` });
        // }

        const rewrittenText = response.text(); // Get the text result

        console.log(`Successfully generated rewrite for tone: "${trimmedTone}"`);

        // --- End Gemini API Interaction ---


        // --- Send Success Response ---
        // Send the result back to the client
        res.status(200).json({
           rewrittenText: rewrittenText
           // Optional: include originalText and requestedTone if useful for frontend
           // originalText: trimmedText,
           // requestedTone: trimmedTone
        });
        // --- End Success Response ---

    } catch (error) {
        // --- Error Handling ---
        console.error("Error during API processing:", error);

        // Determine the type of error if possible
        let statusCode = 500;
        let errorType = "API Processing Error";
        let errorDetails = "An unexpected error occurred on the server.";

        if (error.message.includes('API key not valid')) {
             errorType = "Authentication Error";
             errorDetails = "Internal API key configuration issue.";
        } else if (error.message.includes('billing') || error.message.includes('Quota')) {
             statusCode = 429; // Too Many Requests (or internal issue)
             errorType = "Quota or Billing Error";
             errorDetails = "API usage limit potentially exceeded.";
        } else if (error.message.includes('Invalid JSON payload')) {
             statusCode = 400;
             errorType = "Invalid Request";
             errorDetails = "Could not parse request body.";
        }
         // Add more specific error checks based on potential Gemini API errors if needed

        // Send a generic error response to the client
        res.status(statusCode).json({ error: errorType, details: errorDetails });
        // --- End Error Handling ---
    }
};
// --- End Handler Function ---