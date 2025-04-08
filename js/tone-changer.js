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
    // These should ideally be injected during the build process (Phase 6 from previous explanation)
    // Using window.appConfig assumes you implemented the build-time injection
    const API_ENDPOINT_URL = window.appConfig?.toneChangerApiUrl || 'https://my-invention-homepage.vercel.app'; // Use injected URL
    const API_SECRET = window.appConfig?.toneChangerApiSecret || 'YOUR_FALLBACK_SECRET_IF_NEEDED'; // Use injected Secret

     // Basic check if config loaded properly (add error handling if needed)
    if (!API_ENDPOINT_URL || !API_SECRET || API_ENDPOINT_URL.includes('FALLBACK') || API_SECRET.includes('FALLBACK') ) {
        console.error("CRITICAL: API URL or Secret not configured properly in window.appConfig. Check Eleventy build injection.");
        errorContainer.textContent = "Frontend configuration error. API details missing.";
        // Optionally disable the form entirely
        if(form) form.style.display = 'none';
        return; // Stop execution if config is missing
    }
    // --- End Configuration ---


    // Show/hide the 'Other' tone input field based on radio selection
    if (form) { // Check if form exists before adding listeners
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

            // THIS is where the frontend logic STOPS before the fetch call
            // The backend code previously pasted here was incorrect

            try {
                const response = await fetch(API_ENDPOINT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Send the secret key in a custom header
                        'X-API-Secret': API_SECRET // Use the variable defined above
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
                        // Ignore if body is not json or response is empty
                         console.warn("Could not parse error response as JSON:", e);
                    }
                    const errorMessage = errorData?.details || errorData?.error || `Error: ${response.status} ${response.statusText}`;
                    throw new Error(errorMessage);
                }

                const data = await response.json();

                if (data.rewrittenText) {
                    resultTextElement.textContent = data.rewrittenText;
                } else {
                     resultTextElement.textContent = 'No rewrite returned by the API.';
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
        }); // End of form submit listener
    } else {
         console.warn("Tone changer form not found on this page.");
    }
}); // End of DOMContentLoaded listener