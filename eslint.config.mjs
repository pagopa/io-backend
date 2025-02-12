import pagopa from "@pagopa/eslint-config";

export default [
  ...pagopa,
  {
    rules: {
      "comma-dangle": "off",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-enums": "off",
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-intersection-types": "off",
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-object-types": "off",
      "perfectionist/sort-union-types": "off",
      "prefer-arrow/prefer-arrow-functions": "off",
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-invalid-this": "off"
    }
  },
  {
    ignores: [
      "node_modules",
      "generated",
      "dist",
      "**/__tests__/*",
      "**/__mocks__/*",
      "Dangerfile.*",
      "**/*.d.ts"
    ]
  }
];
