import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    overrides: [
      {
        files: ["*.js", "*.jsx"], // apply only to JS files
        rules: {
          "@typescript-eslint/no-explicit-any": "off", // no TS rules in JS
          "@typescript-eslint/*": "off", // turn off ALL TS rules
        },
      },
    ],
  },
];

export default eslintConfig;
