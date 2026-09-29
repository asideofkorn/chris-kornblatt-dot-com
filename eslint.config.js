export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
    rules: {
      "no-unused-vars": "error",
      "no-constant-condition": "error",
      "no-unreachable": "error",
      eqeqeq: "error",
    },
  },
];
