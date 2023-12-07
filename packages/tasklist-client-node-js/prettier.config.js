module.exports = {
    endOfLine: "lf",
    jsxSingleQuote: true,
    overrides: [
        {
            files: ["*.yaml", "*.yml"],
            options: {
                tabWidth: 2,
            },
        },
    ],
    semi: false,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: "es5",
    useTabs: false,
    printWidth: 140,
    arrowParens: "always",
}
