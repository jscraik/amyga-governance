import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";

// ESLint flat config focusing on JSDoc coverage and documentation quality for JS/TS.
export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.output/**",
      "**/.nx/**",
      "**/.cache/**",
      "**/.git/**",
      "**/tasks/**/logs/**"
    ],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true
          },
          contexts: ["TSInterfaceDeclaration", "TSTypeAliasDeclaration"]
        }
      ],
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-description-complete-sentence": "error",
      "jsdoc/check-tag-names": "error",
      "jsdoc/check-types": "error",
      "jsdoc/require-example": [
        "warn",
        {
          exemptedBy: ["@private"],
          contexts: ["FunctionDeclaration", "ClassDeclaration"]
        }
      ],
      "jsdoc/empty-tags": "error",
      "jsdoc/no-undefined-types": "error"
    }
  }
);
