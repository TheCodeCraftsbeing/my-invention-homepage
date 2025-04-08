// Load environment variables from .env file locally
require('dotenv').config();

module.exports = function(eleventyConfig) {

  // Set template formats and Markdown engine
  eleventyConfig.setTemplateFormats(["md", "njk", "html"]); // Include html if you have plain html files too
  eleventyConfig.markdownTemplateEngine = "njk";
  eleventyConfig.htmlTemplateEngine = "njk";

  // Create a collection for all markdown files in the features folder
  eleventyConfig.addCollection("features", function(collectionApi) {
    return collectionApi.getFilteredByGlob("features/*.md").sort((a, b) => {
       // Optional: Sort by title or date if needed
       return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  // Make environment variables available globally in Nunjucks templates under 'env'
  // This is crucial for injecting secrets/URLs into the frontend HTML
  eleventyConfig.addGlobalData("env", process.env);

  // Copy the 'js' directory (and its contents) to the output folder (_site)
  eleventyConfig.addPassthroughCopy("js");
  // Copy other static assets like images or CSS if you have them
  // eleventyConfig.addPassthroughCopy("css");
  // eleventyConfig.addPassthroughCopy("img");


  // Return the configuration object
  return {
    dir: {
      input: ".",             // Source files are in the root
      includes: "_includes",  // Layouts folder
      data: "_data",          // Optional: Global data files folder
      output: "_site"         // Build output folder
    }
  };
};