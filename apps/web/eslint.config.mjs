// @ts-check

import baseEslintConfig from "@polymeer/config/eslint/eslint.config.react.mjs"
import nodeEslintConfig from "@polymeer/config/eslint/eslint.config.node.mjs"

export default [
  ...baseEslintConfig,
  {
    files: ["scripts/**/*.js"],
    ...nodeEslintConfig,
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]
