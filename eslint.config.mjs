export default [
  { ignores: ["node_modules", "dist", "build", ".turbo", "*.config.*"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" }
      }
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
    }
  }
];