module.exports = function(eleventyConfig) {
  // Tell Eleventy to use the Nunjucks templating engine for markdown files
  // This allows us to use variables and logic within markdown if needed later
  eleventyConfig.setTemplateFormats(["md", "njk"]); // Process md and njk files
  eleventyConfig.markdownTemplateEngine = "njk";

// *** ADD THIS: Create a collection for all markdown files in the features folder ***
  eleventyConfig.addCollection("features", function(collectionApi) {
    // getFilteredByGlob returns files matching the pattern, sorted by filename
    return collectionApi.getFilteredByGlob("features/*.md");
    // You could sort differently here, e.g., by date from front matter
    // return collectionApi.getFilteredByGlob("features/*.md").sort((a, b) => {
    //   return a.data.date - b.data.date; // Sort by date ascending
    // });
  });
  // *** END ADDITION ***

  return {
    dir: {
      input: ".",       // Use root folder for input files (like index.md)
      includes: "_includes", // Folder for layout files
      output: "_site"    // Folder where the built website will go
    }
  };
};