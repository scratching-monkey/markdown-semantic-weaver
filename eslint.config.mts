import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser"
import { defineConfig } from "eslint/config";

export default tseslint.config([
  {
    ignores: [
      // Ignore node_modules, build outputs, etc.
      "node_modules/",
      "dist/",
      "src/templates/*"
    ],
  },
  {
      files: ["**/*.ts"],

      languageOptions: {
          parser: tsParser,
          ecmaVersion: 2022,
          sourceType: "module",
      },

      rules: {
          "@typescript-eslint/naming-convention": ["warn", {
              selector: "import",
              format: ["camelCase", "PascalCase"],
          }],

          curly: "warn",
          eqeqeq: "warn",
          "no-throw-literal": "warn",
          semi: "warn",
      },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  tseslint.configs.recommended,
]);
