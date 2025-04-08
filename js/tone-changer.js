document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const form = document.getElementById('tone-changer-form');
    const originalTextInput = document.getElementById('original-text');
    const otherToneRadio = document.getElementById('tone-other');
    const otherToneInputContainer = document.getElementById('other-tone-input-container');
    const otherToneInput = document.getElementById('other-tone-input');
    const resultTextElement = document.getElementById('result-text');
    const errorContainer = document.getElementById('error-container');
    const submitButton = document.getElementById('submit-button');

    // --- Configuration ---
    // Read values injected during the build process via window.appConfig
    const API_ENDPOINT_URL = window.appConfig?.toneChangerApiUrl;
    const API_SECRET = window.appConfig?.toneChangerApiSecret;
    // --- End Configuration ---

    // --- Initial Check ---
    // Check if the necessary elements and config exist before proceeding
    if (!form || !originalTextInput || !resultTextElement || !errorContainer || !submitButton) {
        console.error("CRITICAL: One or more required form elements not found on the page.");
        if (errorContainer) errorContainer.textContent = "Page structure error: Required elements missing.";
        return; // Stop if page structure is broken
    }

    if (!API_ENDPOINT_URL || !API_SECRET) {
        console.error("CRITICAL: API URL or Secret not found in window.appConfig. Check Vercel env vars and Eleventy build injection.");
        errorContainer.textContent = "Frontend configuration error: API details missing. Cannot contact server.";
        submitButton.disabled = true; // Disable form submission if config fails
        form.style.opacity = '0.5'; // Visually indicate form is disabled
        return; // Stop execution if config is missing
    }
    // --- End Initial Check ---


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

        // --- UI Reset and Loading State ---
        resultTextElement.textContent = 'Processing...'; // Show loading message
        resultTextElement.parentElement.style.opacity = '0.6'; // Dim result area slightly
        errorContainer.textContent = ''; // Clear previous errors
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true'); // Use Pico loading indicator
        submitButton.textContent = 'Working...';
        // --- End UI Reset ---

        // --- Get Form Data ---
        let selectedTone = form.elements['tone'].value;
        if (selectedTone === 'Other') {
            selectedTone = otherToneInput.value.trim();
            if (!selectedTone) {
              errorContainer.textContent = 'Please specify the custom tone when "Other" is selected.';
              resultTextElement.textContent = 'Rewrite will appear here...'; // Reset result text
              resultTextElement.parentElement.style.opacity = '1';
              submitButton.disabled = false;
              submitButton.removeAttribute('aria-busy');
              submitButton.textContent = 'Change Tone';
              return; // Stop if custom tone is selected but empty
            }
        }
        const originalText = originalTextInput.value.trim(); // Trim input text
        if (!originalText) {
             errorContainer.textContent = 'Please enter some text to change.';
             resultTextElement.textContent = 'Rewrite will appear here...';
             resultTextElement.parentElement.style.opacity = '1';
             submitButton.disabled = false;
             submitButton.removeAttribute('aria-busy');
             submitButton.textContent = 'Change Tone';
             return; // Stop if no text entered
        }
        // --- End Get Form Data ---


        // --- API Call ---
        try {
            const response = await fetch(API_ENDPOINT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send the secret key obtained from build injection
                    'X-API-Secret': API_SECRET
                },
                body: JSON.stringify({
                    text: originalText,
                    tone: selectedTone
                })
            });

            // Check if response status indicates an error
            if (!response.ok) {
                let errorData = { message: `API Error: ${response.status} ${response.statusText}` }; // Default error
                try {
                    // Try to parse more specific error from API response body
                    const apiError = await response.json();
                    errorData.message = apiError?.details || apiError?.error || errorData.message;
                } catch (e) {
                    // Ignore if response body is not JSON or parsing fails
                    console.warn("Could not parse error response body as JSON.");
                }
                throw new Error(errorData.message); // Throw an error to be caught below
            }

            // Parse successful response
            const data = await response.json();

            // Display result
            if (data.rewrittenText) {
                resultTextElement.textContent = data.rewrittenText;
            } else {
                 console.warn("API returned success status but no rewrittenText found in response:", data);
                 resultTextElement.textContent = 'API returned an unexpected response.';
                 errorContainer.textContent = 'Received incomplete data from server.';
            }

        } catch (error) {
            // Handle fetch errors (network issues) or errors thrown from response check
            console.error('Error during API call or processing:', error);
            errorContainer.textContent = `An error occurred: ${error.message}`;
            resultTextElement.textContent = 'Rewrite failed.'; // Reset result area on error
        } finally {
             // --- UI Reset After Completion ---
             resultTextElement.parentElement.style.opacity = '1'; // Restore opacity
             submitButton.disabled = false;
             submitButton.removeAttribute('aria-busy');
             submitButton.textContent = 'Change Tone';
             // --- End UI Reset ---
        }
        // --- End API Call ---
    }); // End of form submit listener
}); // End of DOMContentLoaded listener