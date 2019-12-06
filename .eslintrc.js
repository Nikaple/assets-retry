module.exports = {
    "env": {
        "browser": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 6,
        "project": "./tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/class-name-casing": "error",
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/indent": "off",
        "@typescript-eslint/member-delimiter-style": [
            "off",
            "error",
            {
                "multiline": {
                    "delimiter": "none",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/no-empty-function": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-unnecessary-qualifier": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/quotes": "off",
        "@typescript-eslint/semi": [
            "off",
            null
        ],
        "@typescript-eslint/space-within-parens": [
            "off",
            "never"
        ],
        "@typescript-eslint/type-annotation-spacing": "off",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-parens": [
            "off",
            "as-needed"
        ],
        "camelcase": "error",
        "capitalized-comments": "off",
        "comma-dangle": "off",
        "curly": [
            "error",
            "multi-line"
        ],
        "eol-last": "off",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "linebreak-style": "off",
        "max-len": "off",
        "new-parens": "off",
        "newline-per-chained-call": "off",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-constant-condition": "error",
        "no-control-regex": "error",
        "no-duplicate-imports": "error",
        "no-empty": "error",
        "no-eval": "error",
        "no-extra-semi": "off",
        "no-fallthrough": "error",
        "no-invalid-regexp": "error",
        "no-irregular-whitespace": "off",
        "no-multiple-empty-lines": "off",
        "no-redeclare": "error",
        "no-regex-spaces": "error",
        "no-return-await": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "off",
        "no-unused-expressions": [
            "error",
            {
                "allowTaggedTemplates": true,
                "allowShortCircuit": true
            }
        ],
        "no-unused-labels": "error",
        "no-var": "error",
        "one-var": [
            "error",
            "never"
        ],
        "quote-props": "off",
        "radix": "error",
        "space-before-function-paren": "off",
        "spaced-comment": "error",
        "use-isnan": "error",
        "handle-callback-err": [
            "error",
            "^(err|error)$"
        ],
        "no-duplicate-case": "error",
        "no-empty-character-class": "error",
        "no-ex-assign": "error",
        "no-extra-boolean-cast": "error",
        "no-inner-declarations": [
            "error",
            "functions"
        ],
        "no-sparse-arrays": "error",
        "no-unexpected-multiline": "error",
        "valid-typeof": "error",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "no-reference-import": "error",
                    "strict-type-predicates": "error",
                    
                    "jsdoc-format": "error",
                }
            }
        ]
    }
};
