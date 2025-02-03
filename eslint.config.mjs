import pagopa from "@pagopa/eslint-config";

export default [
    ...pagopa,
    {
        rules: {
            "prefer-arrow/prefer-arrow-functions": "off",
            "@typescript-eslint/naming-convention": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "no-invalid-this": "off",
        }
    },
    {
        ignores: [
            "node_modules",
            "generated",
            "**/__tests__/*",
            "**/__mocks__/*",
            "Dangerfile.*",
            "*.d.ts"
        ],
    },
];