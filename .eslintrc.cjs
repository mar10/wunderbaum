/* eslint-env node */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    curly: ["warn", "all"],
    "prefer-const": "warn",
    "prefer-spread": "warn",
    "prefer-rest-params": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    // "@typescript-eslint/curly": "warn",
  },
};
