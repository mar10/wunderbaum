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
    "require-yield": "warn",
    "no-constant-condition": ["error", { checkLoops: false }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    // "@typescript-eslint/curly": "warn",
  },
};
