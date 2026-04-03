import basePrettierConfig from "@polymeer/config/prettier/prettier.config.mjs"

/**
 * @type {import("prettier").Config}
 */
const config = {
  ...basePrettierConfig,
  plugins: ["prettier-plugin-tailwindcss"],
}

export default config
