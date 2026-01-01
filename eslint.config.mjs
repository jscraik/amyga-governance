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
      "brainwav/governance/templates/**",
      "brainwav/governance/context/**",
      "brainwav/governance/docs/**",
      "**/tasks/**/logs/**"
    ],
    plugins: { jsdoc },
    settings: {
      jsdoc: {
        tagNamePreference: {
          fileoverview: "fileoverview"
        }
      }
    },
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
      "jsdoc/check-tag-names": [
        "error",
        {
          definedTags: ["fileoverview", "docsnap", "openapi"]
        }
      ],
      "jsdoc/check-types": "error",
      "jsdoc/require-example": "off",
      "jsdoc/empty-tags": "error",
      "jsdoc/no-undefined-types": "error"
    }
  }
);
