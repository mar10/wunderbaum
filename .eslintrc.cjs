/* eslint-env node */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  rules: {
    curly: ["error", "all"],
    "prefer-const": ["error", { destructuring: "all" }],
    "prefer-spread": "warn",
    "prefer-rest-params": "warn",
    "require-yield": "warn",
    "no-constant-condition": ["error", { checkLoops: false }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    // "one-var": ["error", { const: "always" }],
    // "one-var": ["error", { var: "always", let: "never", const: "never" }],

    // "@typescript-eslint/curly": "warn",
  },
};
