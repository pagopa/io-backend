import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/naming-convention": "off",
      "no-invalid-this": "off",
      "prefer-arrow/prefer-arrow-functions": "off",
    },
  },
  {
    ignores: [
      "node_modules",
      "generated",
      "dist",
      "**/__tests__/*",
      "**/__mocks__/*",
      "Dangerfile.*",
      "*.d.ts",
    ],
  },
];
