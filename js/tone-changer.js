document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    // Select all necessary HTML elements from the page to interact with them.
    // These elements are part of the tone changer form and its output areas.
    const form = document.getElementById('tone-changer-form'); // The main form
    const originalTextInput = document.getElementById('original-text'); // Textarea for user input
    const otherToneRadio = document.getElementById('tone-other'); // Radio button for 'Other' tone
    const otherToneInputContainer = document.getElementById('other-tone-input-container'); // Div containing the 'Other' tone input
    const otherToneInput = document.getElementById('other-tone-input'); // Text input for custom 'Other' tone
    const resultTextElement = document.getElementById('result-text'); // Element to display the rewritten text
    const errorContainer = document.getElementById('error-container'); // Element to display error messages
    const submitButton = document.getElementById('submit-button'); // The form's submit button
    // --- End DOM Element Selection ---

    // --- Configuration ---
    // These values are expected to be injected into the global `window.appConfig` object
    // by the build process (e.g., by Eleventy using environment variables).
    const API_ENDPOINT_URL = window.appConfig?.toneChangerApiUrl; // URL of the backend API
    const API_SECRET = window.appConfig?.toneChangerApiSecret;   // Secret key for API authentication
    // --- End Configuration ---

    // --- Initial Check ---
    // Perform critical checks on page load to ensure the tool can function.
    // 1. Check if all required DOM elements are present.
    if (!form || !originalTextInput || !resultTextElement || !errorContainer || !submitButton || !otherToneRadio || !otherToneInputContainer || !otherToneInput) {
        console.error("CRITICAL: One or more required form elements not found on the page. Check element IDs.");
        if (errorContainer) errorContainer.textContent = "Page structure error: Required interactive elements missing. Cannot initialize.";
        // If essential elements are missing, the script cannot proceed.
        return;
    }

    // 2. Check if API configuration (URL and Secret) is available.
    if (!API_ENDPOINT_URL || !API_SECRET) {
        console.error("CRITICAL: API_ENDPOINT_URL or API_SECRET not found in window.appConfig. Check environment variables and build script injection.");
        errorContainer.textContent = "Frontend configuration error: API details missing. Cannot contact server.";
        submitButton.disabled = true; // Disable the form if configuration is missing
        form.style.opacity = '0.5';   // Visually indicate that the form is non-functional
        // Stop execution if critical configuration is missing.
        return;
    }
    // --- End Initial Check ---


    // --- Event Listener for 'Other' Tone Input ---
    // Show or hide the text input field for a custom tone when the 'Other' radio button is selected/deselected.
    form.addEventListener('change', (event) => {
        // Check if the event was triggered by a radio button in the 'tone' group
        if (event.target.name === 'tone') {
            if (otherToneRadio.checked) {
                // If 'Other' is selected, display the input field and make it required.
                otherToneInputContainer.style.display = 'block';
                otherToneInput.required = true;
            } else {
                // If any other tone is selected, hide the input field, make it not required, and clear its value.
                otherToneInputContainer.style.display = 'none';
                otherToneInput.required = false;
                otherToneInput.value = ''; // Clear the custom tone if 'Other' is deselected
            }
        }
    });
    // --- End 'Other' Tone Input Listener ---

    // --- Form Submission Handler ---
    // Attach an asynchronous event listener to handle the form's submit event.
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default browser form submission (which would cause a page reload).

        // --- UI Reset and Loading State ---
        // Prepare the UI for an API request: show loading indicators, clear previous results/errors.
        resultTextElement.textContent = 'Processing...';         // Display a loading message in the result area.
        resultTextElement.parentElement.style.opacity = '0.6'; // Dim the result area slightly to indicate processing.
        errorContainer.textContent = '';                       // Clear any previous error messages.
        submitButton.disabled = true;                          // Disable the submit button to prevent multiple submissions.
        submitButton.setAttribute('aria-busy', 'true');        // Set ARIA attribute for accessibility (used by some CSS frameworks for loading spinners).
        submitButton.textContent = 'Working...';               // Change button text to indicate activity.
        // --- End UI Reset and Loading State ---

        // --- Form Data Retrieval and Validation ---
        // Get the selected tone from the radio button group.
        let selectedTone = form.elements['tone'].value;
        // If 'Other' tone is selected, get the value from the custom tone input field.
        if (selectedTone === 'Other') {
            selectedTone = otherToneInput.value.trim(); // Get and trim the custom tone.
            // Validate that the custom tone is not empty.
            if (!selectedTone) {
              errorContainer.textContent = 'Please specify the custom tone when "Other" is selected.';
              resultTextElement.textContent = 'Rewrite will appear here...'; // Reset result text.
              resultTextElement.parentElement.style.opacity = '1';        // Restore result area opacity.
              submitButton.disabled = false;                              // Re-enable submit button.
              submitButton.removeAttribute('aria-busy');                  // Clear ARIA busy state.
              submitButton.textContent = 'Change Tone';                   // Reset button text.
              return; // Stop processing if custom tone is selected but empty.
            }
        }
        // Get and trim the original text entered by the user.
        const originalText = originalTextInput.value.trim();
        // Validate that the original text is not empty.
        if (!originalText) {
             errorContainer.textContent = 'Please enter some text to change.';
             resultTextElement.textContent = 'Rewrite will appear here...'; // Reset result text.
             resultTextElement.parentElement.style.opacity = '1';        // Restore result area opacity.
             submitButton.disabled = false;                              // Re-enable submit button.
             submitButton.removeAttribute('aria-busy');                  // Clear ARIA busy state.
             submitButton.textContent = 'Change Tone';                   // Reset button text.
             return; // Stop processing if no text is entered.
        }
        // --- End Form Data Retrieval and Validation ---


        // --- API Call using Fetch ---
        // Use a try...catch...finally block to handle the asynchronous API request and potential errors.
        try {
            // Make a POST request to the API endpoint.
            const response = await fetch(API_ENDPOINT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indicate that the request body is JSON.
                    'X-API-Secret': API_SECRET          // Send the API secret key for authentication.
                },
                // Convert the data to a JSON string for the request body.
                body: JSON.stringify({
                    text: originalText,
                    tone: selectedTone
                })
            });

            // --- Response Handling ---
            // Check if the HTTP response status code indicates success (e.g., 200 OK).
            if (!response.ok) {
                // If the response is not OK, attempt to parse an error message from the API's JSON response.
                let errorData = { message: `API Error: ${response.status} ${response.statusText}` }; // Default error if parsing fails.
                try {
                    const apiError = await response.json(); // Try to parse the JSON body of the error response.
                    // Use more specific error details from the API if available.
                    errorData.message = apiError?.details || apiError?.error || errorData.message;
                } catch (e) {
                    // If the response body isn't JSON or parsing fails, log a warning. The default error message will be used.
                    console.warn("Could not parse error response body as JSON. Original status:", response.status);
                }
                throw new Error(errorData.message); // Throw an error to be caught by the catch block.
            }

            // If the response is OK, parse the JSON body of the success response.
            const data = await response.json();

            // --- Displaying Results ---
            // Check if the response data contains the rewritten text.
            if (data.rewrittenText) {
                resultTextElement.textContent = data.rewrittenText; // Display the rewritten text.
            } else {
                 // Handle cases where the API returns a success status but no rewritten text.
                 console.warn("API returned success status but no rewrittenText found in response:", data);
                 resultTextElement.textContent = 'API returned an unexpected response format.';
                 errorContainer.textContent = 'Received incomplete or malformed data from the server.';
            }
            // --- End Displaying Results ---

        } catch (error) {
            // --- Error Handling for Fetch and Processing ---
            // Handle errors from the fetch call (e.g., network issues) or errors thrown during response processing.
            console.error('Error during API call or response processing:', error);
            errorContainer.textContent = `An error occurred: ${error.message}`; // Display the error message to the user.
            resultTextElement.textContent = 'Rewrite failed.';                 // Update result area to indicate failure.
        } finally {
             // --- UI Cleanup (Finally Block) ---
             // This block executes regardless of whether the try block succeeded or failed.
             // Restore the UI to its normal state after the API request is complete.
             resultTextElement.parentElement.style.opacity = '1'; // Restore full opacity to the result area.
             submitButton.disabled = false;                       // Re-enable the submit button.
             submitButton.removeAttribute('aria-busy');           // Clear ARIA busy state.
             submitButton.textContent = 'Change Tone';            // Reset button text.
             // --- End UI Cleanup ---
        }
        // --- End API Call ---
    }); // End of form submit event listener
}); // End of DOMContentLoaded event listener