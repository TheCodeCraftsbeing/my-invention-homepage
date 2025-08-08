// api/tone-changer.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- Initialization ---
let genAI;
try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
    console.error("CRITICAL: Failed to initialize GoogleGenerativeAI SDK.", error);
}
// Prefer TONE_CHANGER_API_SECRET but fallback to API_SECRET_KEY for compatibility
const EXPECTED_SECRET = process.env.TONE_CHANGER_API_SECRET || process.env.API_SECRET_KEY;

// --- Allowed Origins ---
// Supports comma-separated list via FRONTEND_ORIGINS, or single via FRONTEND_ORIGIN.
// You can also set FRONTEND_ORIGINS to '*' to allow all (not recommended for production).
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'https://my-invention-homepage.vercel.app')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(requestOrigin) {
  if (FRONTEND_ORIGINS.includes('*')) {
    return '*';
  }
  if (requestOrigin && FRONTEND_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  // If no match, do not reflect an untrusted origin. Return first configured origin for non-browser clients.
  return FRONTEND_ORIGINS[0] || 'null';
}

// --- Main Handler Function ---
module.exports = async (req, res) => {

    const requestOrigin = req.headers['origin'];
    const allowOrigin = resolveCorsOrigin(requestOrigin);

    // --- Set CORS Headers ---
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Secret');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    // --- Pre-computation Checks (Run after OPTIONS check) ---
    if (!genAI) {
        console.error("API Initialization Failed - Cannot process request.");
        return res.status(500).json({ error: "API Initialization Failed", details: "Server configuration issue." });
    }
    if (!EXPECTED_SECRET) {
        console.error("CRITICAL: API secret environment variable not set (TONE_CHANGER_API_SECRET or API_SECRET_KEY).");
        return res.status(500).json({ error: "API Security Not Configured", details: "Server configuration issue." });
    }

    // --- Security Check (POST requests) ---
    const providedSecret = req.headers['x-api-secret'];
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn(`Unauthorized API attempt detected. Origin: ${req.headers['origin']}`);
        return res.status(403).json({ error: "Forbidden" });
    }

    // --- Method Check (Should only be POST now) ---
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rewrittenText = response.text();
        console.log(`Successfully generated rewrite for tone: "${trimmedTone}"`);

        res.status(200).json({ rewrittenText: rewrittenText });

    } catch (error) {
        console.error("Error during API processing:", error);
        const statusCode = 500;
        const errorType = "API Processing Error";
        const errorDetails = "An unexpected error occurred on the server.";
        res.status(statusCode).json({ error: errorType, details: errorDetails });
    }
};