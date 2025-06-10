---
layout: base.njk
title: AI-Powered Tone Changer: Rewrite Your Text
tags: feature
status: Interactive Demo
scripts:
  - /js/tone-changer.js
---

This tool leverages the power of Artificial Intelligence, specifically Google Gemini, to rewrite your text in a variety of tones. Whether you need to sound more formal for a business proposal, friendly for a casual message, or even adopt a custom tone, this AI-powered assistant can help you effectively communicate your message with the right nuance.

## AI-Powered Tone Changer

**Goal:** To provide a simple tool that modifies the tone of user-provided text using AI.

**Functionality:** Input text, select a desired tone (Formal, Professional, Client-Facing, Friendly, or specify 'Other'), and get an AI-generated rewrite in that tone using Google Gemini.

---

### Interactive Demo

<article> {# Using article tag for semantic grouping #}
  <form id="tone-changer-form">
      <label for="original-text">
        Enter Text:
        <textarea id="original-text" name="original-text" rows="6" required placeholder="Paste your text here..."></textarea>
      </label>

      <label>Select Target Tone:</label>
      <fieldset>
         <label for="tone-formal">
           <input type="radio" id="tone-formal" name="tone" value="Formal" required> Formal
         </label>
         <label for="tone-professional">
           <input type="radio" id="tone-professional" name="tone" value="Professional"> Professional
         </label>
         <label for="tone-client">
           <input type="radio" id="tone-client" name="tone" value="Client-Facing"> Client-Facing
         </label>
         <label for="tone-friendly">
           <input type="radio" id="tone-friendly" name="tone" value="Friendly"> Friendly
         </label>
         <label for="tone-other">
           <input type="radio" id="tone-other" name="tone" value="Other"> Other (Type your custom tone in the text field below)
         </label>
      </fieldset>

      <div id="other-tone-input-container" style="display: none; margin-top: 0.5rem;">
        <label for="other-tone-input">
          Custom Tone:
          <input type="text" id="other-tone-input" name="other-tone-input" placeholder="e.g., Humorous, Empathetic, Sarcastic">
        </label>
      </div>

      <button type="submit" id="submit-button">Change Tone</button>
  </form>

  <div id="result-container" style="margin-top: 2rem;">
      <hr> {# Separator #}
      <h4>Result:</h4>
      <pre><code id="result-text">The rewritten text will appear here...</code></pre>
  </div>

  <div id="error-container" class="error-message" style="margin-top: 1rem;"></div> {# For displaying errors #}

</article>