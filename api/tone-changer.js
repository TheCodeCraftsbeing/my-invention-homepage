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
// This is a security measure to prevent unauthorized domains from using this API.
// IMPORTANT: Use your *production* frontend URL here primarily.
// For testing preview deployments, you might temporarily use '*' (less secure)
// or build a more complex allowlist if needed.
const ALLOWED_ORIGIN = 'https://my-invention-homepage.vercel.app'; // <<< YOUR PRODUCTION FRONTEND URL HERE

// --- Main Handler Function ---
module.exports = async (req, res) => {

    // --- Set CORS Headers ---
    // Cross-Origin Resource Sharing (CORS) headers are necessary to allow a web application
    // running at one origin (domain) to request resources from a server at a different origin.
    // Here, we're allowing requests from ANY origin ('*').
    // For production, it's more secure to restrict this to `ALLOWED_ORIGIN`.
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Or use '*' for any origin (less secure, ok for initial testing maybe):
    // res.setHeader('Access-Control-Allow-Origin', '*');

    // Specify the HTTP methods allowed when accessing the resource.
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow POST and the preflight OPTIONS
    // Specify the headers that can be used during the actual request.
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Secret'); // Allow necessary headers
    // Optional: Allow credentials if needed in the future (e.g., cookies, authorization headers)
    // res.setHeader('Access-Control-Allow-Credentials', 'true');
    // --- End CORS Headers ---


    // --- Handle OPTIONS Preflight Request ---
    // The OPTIONS method is used by browsers to send a "preflight" request.
    // This request checks if the server understands and allows the actual request (e.g., a POST request)
    // with the specified CORS headers and methods.
    // If the request method is OPTIONS, it's the browser checking CORS permissions.
    // Send back the CORS headers with a 204 No Content status and end the response.
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return; // Stop processing further for OPTIONS requests
    }
    // --- End OPTIONS Handling ---


    // --- Pre-computation Checks (Run after OPTIONS check) ---
    // These checks ensure that critical components like the Generative AI SDK and API secret are loaded.
    // If these are not available, the API cannot function correctly or securely.
    // This runs after the OPTIONS check because OPTIONS requests don't need these components.
    if (!genAI) {
        console.error("API Initialization Failed - Cannot process request.");
        // Return a 500 Internal Server Error if the AI SDK is not initialized.
        return res.status(500).json({ error: "API Initialization Failed", details: "Server configuration issue." });
    }
    if (!EXPECTED_SECRET) {
        console.error("CRITICAL: API_SECRET_KEY environment variable not set.");
        // Return a 500 Internal Server Error if the API secret is not configured.
        return res.status(500).json({ error: "API Security Not Configured", details: "Server configuration issue." });
    }
    // --- End Pre-computation Checks ---


    // --- Security Check (POST requests) ---
    // For POST requests, verify the 'X-API-Secret' header.
    // This acts as a simple authentication mechanism to ensure that only authorized clients
    // (who know the secret) can use the API.
    const providedSecret = req.headers['x-api-secret'];
    if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
        console.warn(`Unauthorized API attempt detected. Origin: ${req.headers['origin']}`);
        // Return a 403 Forbidden status if the secret is missing or incorrect.
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
    // This section handles the actual logic for POST requests.
    try {
        // Ensure the request body exists and is an object.
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid Request Body', details: 'Expected JSON payload.' });
        }
        // Destructure 'text' and 'tone' from the request body.
        const { text, tone } = req.body;
        // Validate that 'text' and 'tone' are provided and are non-empty strings.
        if (!text || !tone || typeof text !== 'string' || typeof tone !== 'string' || text.trim() === '' || tone.trim() === '') {
            return res.status(400).json({ error: 'Invalid Input', details: 'Valid "text" and "tone" strings are required.' });
        }
        // Trim whitespace from text and tone for cleaner processing.
        const trimmedText = text.trim();
        const trimmedTone = tone.trim();

        // --- Gemini API Interaction ---
        // Log the request being processed.
        console.log(`Processing tone change request. Tone: "${trimmedTone}"`);
        // Construct the prompt for the Gemini API.
        // The prompt instructs the model to rewrite the given text in the specified tone
        // and to respond only with the rewritten text.
        const prompt = `Rewrite the following text to have a "${trimmedTone}" tone. Respond only with the rewritten text itself, without any preamble or explanation.\n\nOriginal Text:\n"${trimmedText}"`;
        // Get the generative model from the initialized SDK.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        // Send the prompt to the model and await the result.
        const result = await model.generateContent(prompt);
        // Extract the response object from the result.
        const response = await result.response;
        // Get the rewritten text from the response.
        const rewrittenText = response.text();
        // Log successful generation.
        console.log(`Successfully generated rewrite for tone: "${trimmedTone}"`);

        // --- Send Success Response (POST requests) ---
        // If the API call was successful, send a 200 OK status with the rewritten text.
        // NOTE: CORS headers were already set at the beginning of the handler.
        res.status(200).json({ rewrittenText: rewrittenText });

    } catch (error) {
        // --- Error Handling ---
        // Catch any errors that occur during the try block (e.g., API errors, validation errors).
        console.error("Error during API processing:", error);
        let statusCode = 500; // Default to 500 Internal Server Error.
        let errorType = "API Processing Error";
        let errorDetails = "An unexpected error occurred on the server.";

        // Potentially add more specific error checks here if needed.
        // For example, if the error is from the Gemini API, you might want to customize the message.
        // if (error.isGoogleGenerativeAIError) { ... }

        // Send an error response with the determined status code and error information.
        res.status(statusCode).json({ error: errorType, details: errorDetails });
    }
};