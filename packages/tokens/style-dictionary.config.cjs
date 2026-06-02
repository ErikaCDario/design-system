module.exports = {
  source: ["packages/tokens/src/tokens.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "packages/tokens/dist/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables"
        }
      ]
    },
    js: {
      transformGroup: "js",
      buildPath: "packages/tokens/dist/",
      files: [
        {
          destination: "tokens.js",
          format: "javascript/es6"
        }
      ]
    }
  }
};
