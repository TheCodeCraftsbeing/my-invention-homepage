// api/tone-changer.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Initialization ---
let genAI;
try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
    console.error("CRITICAL: Failed to initialize GoogleGenerativeAI SDK.", error);
}
const EXPECTED_SECRET = process.env.API_SECRET_KEY;

// --- Allowed Origins ---
// Define the specific frontend origin that IS allowed to make requests.
// IMPORTANT: Use your *production* frontend URL here primarily.
// For testing preview deployments, you might temporarily use '*' (less secure)
// or build a more complex allowlist if needed.
const ALLOWED_ORIGIN = 'https://my-invention-homepage.vercel.app'; // <<< YOUR PRODUCTION FRONTEND URL HERE

// --- Main Handler Function ---
module.exports = async (req, res) => {

    // --- Set CORS Headers ---
    // Set headers that allow requests from your specific frontend origin
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    // Or use '*' for any origin (less secure, ok for initial testing maybe):
    // res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow POST and the preflight OPTIONS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Secret'); // Allow necessary headers
    // Optional: Allow credentials if needed in the future (e.g., cookies)
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // --- End CORS Headers ---


    // --- Handle OPTIONS Preflight Request ---
    // If the request method is OPTIONS, it's the browser checking CORS permissions.
    // Send back the CORS headers with a 204 No Content status and end the response.
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return; // Stop processing further for OPTIONS requests
    }
    // --- End OPTIONS Handling ---


    // --- Pre-computation Checks (Run after OPTIONS check) ---
    if (!genAI) {
        console.error("API Initialization Failed - Cannot process request.");
        return res.status(500).json({ error: "API Initialization Failed", details: "Server configuration issue." });
    }
    if (!EXPECTED_SECRET) {
        console.error("CRITICAL: API_SECRET_KEY environment variable not set.");
        return res.status(500).json({ error: "API Security Not Configured", details: "Server configuration issue." });
    }
    // --- End Pre-computation Checks ---


    // --- Security Check (POST requests) ---
    const providedSecret = req.headers['x-api-secret'];
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn(`Unauthorized API attempt detected. Origin: ${req.headers['origin']}`);
        return res.status(403).json({ error: "Forbidden" });
    }
    // --- End Security Check ---


    // --- Method Check (Should only be POST now) ---
    if (req.method !== 'POST') {
        // This case might be less likely now due to OPTIONS handling, but keep as safeguard
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    // --- End Method Check ---


    // --- Request Body Processing and Validation (POST requests) ---
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid Request Body', details: 'Expected JSON payload.' });
        }
        const { text, tone } = req.body;
        if (!text || !tone || typeof text !== 'string' || typeof tone !== 'string' || text.trim() === '' || tone.trim() === '') {
            return res.status(400).json({ error: 'Invalid Input', details: 'Valid "text" and "tone" strings are required.' });
        }
        const trimmedText = text.trim();
        const trimmedTone = tone.trim();

        // --- Gemini API Interaction ---
        console.log(`Processing tone change request. Tone: "${trimmedTone}"`);
        const prompt = `Rewrite the following text to have a "${trimmedTone}" tone. Respond only with the rewritten text itself, without any preamble or explanation.\n\nOriginal Text:\n"${trimmedText}"`;
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rewrittenText = response.text();
        console.log(`Successfully generated rewrite for tone: "${trimmedTone}"`);

        // --- Send Success Response (POST requests) ---
        // NOTE: CORS headers were already set at the beginning
        res.status(200).json({ rewrittenText: rewrittenText });

    } catch (error) {
        // --- Error Handling ---
        console.error("Error during API processing:", error);
        let statusCode = 500;
        let errorType = "API Processing Error";
        let errorDetails = "An unexpected error occurred on the server.";
        // Add specific error checks if needed...
        res.status(statusCode).json({ error: errorType, details: errorDetails });
    }
};