const baseConfig = require("./tailwind.config")

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    ...baseConfig.content,
    "content/**/*.mdx",
    "registry/**/*.{ts,tsx}",
    "stories/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx}",
  ],
}
