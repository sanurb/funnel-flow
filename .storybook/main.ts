import type { StorybookConfig } from "@storybook/nextjs";
import path from "path";

const config = {
  stories: [
    "../src/stories/**/*.mdx",
    "../src/stories/**/*.stories.@(js|jsx|ts|tsx)",
    "./tokens/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/utils': path.resolve(__dirname, "../src/lib/utils"),
        '@/components': path.resolve(__dirname, "../src/components"),
      };
    }
    return config;
  },
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
} satisfies StorybookConfig;

export default config;
