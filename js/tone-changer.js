// js/tone-changer.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tone-changer-form');
    const originalTextInput = document.getElementById('original-text');
    const otherToneRadio = document.getElementById('tone-other');
    const otherToneInputContainer = document.getElementById('other-tone-input-container');
    const otherToneInput = document.getElementById('other-tone-input');
    const resultTextElement = document.getElementById('result-text');
    const errorContainer = document.getElementById('error-container');
    const submitButton = document.getElementById('submit-button');

    // --- Configuration ---
    // Replace with your actual deployed Vercel function URL
    const API_ENDPOINT_URL = 'https://my-invention-homepage.vercel.app/api/tone-changer';
    // We will inject this secret via build process later (Part 3)
    // For now, you can hardcode the *test* secret you'll set up in Vercel
    const API_SECRET = 'YOUR_TEMPORARY_TEST_SECRET'; // !! IMPORTANT: Replace or inject later !!
    // --- End Configuration ---


    // Show/hide the 'Other' tone input field based on radio selection
    form.addEventListener('change', (event) => {
        if (event.target.name === 'tone') {
            if (otherToneRadio.checked) {
                otherToneInputContainer.style.display = 'block';
                otherToneInput.required = true;
            } else {
                otherToneInputContainer.style.display = 'none';
                otherToneInput.required = false;
                otherToneInput.value = ''; // Clear if hidden
            }
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default browser form submission

        // Clear previous results/errors
        resultTextElement.textContent = 'Processing...';
        errorContainer.textContent = '';
        submitButton.disabled = true;
        submitButton.textContent = 'Working...';


        let selectedTone = form.elements['tone'].value;
        if (selectedTone === 'Other') {
            selectedTone = otherToneInput.value.trim();
            if (!selectedTone) {
              errorContainer.textContent = 'Please specify the custom tone.';
              resultTextElement.textContent = 'Rewrite will appear here...';
              submitButton.disabled = false;
              submitButton.textContent = 'Change Tone';
              return; // Stop if custom tone is selected but empty
            }
        }

        const originalText = originalTextInput.value;
// api/tone-changer.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Read the expected secret from environment variables
const EXPECTED_SECRET = process.env.API_SECRET_KEY;

module.exports = async (req, res) => {
  // --- SECURITY CHECK ---
  const providedSecret = req.headers['x-api-secret']; // Read secret from header (lowercase)

  if (!EXPECTED_SECRET) {
     // Safety check: If the env variable isn't set on the server, deny all
     console.error("CRITICAL: API_SECRET_KEY environment variable not set on server.");
     return res.status(500).json({ error: "Internal Server Configuration Error" });
  }

  if (!providedSecret || providedSecret !== EXPECTED_SECRET) {
    console.warn('Unauthorized attempt detected.'); // Log failed attempts
    // Return a generic 403 Forbidden status
    return res.status(403).json({ error: "Forbidden" });
  }
  // --- END SECURITY CHECK ---


  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

        try {
            const response = await fetch(API_ENDPOINT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send the secret key in a custom header
                    'X-API-Secret': API_SECRET
                },
                body: JSON.stringify({
                    text: originalText,
                    tone: selectedTone
                })
            });

            if (!response.ok) {
                // Try to get error details from response body
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignore if body is not json
                }
                const errorMessage = errorData?.error || `Error: ${response.status} ${response.statusText}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.rewrittenText) {
                resultTextElement.textContent = data.rewrittenText;
            } else {
                 resultTextElement.textContent = 'No rewrite returned.'; // Should not happen on success
            }

        } catch (error) {
            console.error('Error calling API:', error);
            errorContainer.textContent = `An error occurred: ${error.message}`;
            resultTextElement.textContent = 'Rewrite failed.'; // Reset result area on error
        } finally {
             // Re-enable button regardless of success or failure
             submitButton.disabled = false;
             submitButton.textContent = 'Change Tone';
        }
    });
});