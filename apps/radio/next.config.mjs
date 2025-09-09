import CopyPlugin from "copy-webpack-plugin";

import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./i18n.ts");

import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.INPUT_NEXT_BASE_PATH,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
  output: "export",
  webpack(config, { isServer, dev }) {
    // Use the client static directory in the server bundle and prod mode
    // Fixes `Error occurred prerendering page "/"`
    // config.output.webassemblyModuleFilename =
    //   isServer && !dev
    //     ? "../static/wasm/[modulehash].wasm"
    //     : "static/wasm/[modulehash].wasm";

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "../../node_modules/oxigraph/node_bg.wasm",
            to: "server/chunks/",
          },
          {
            from: "../../node_modules/oxigraph/node_bg.wasm",
            to: "server/vendor-chunks/",
          },
        ],
      }),
    );

    // Since Webpack 5 doesn't enable WebAssembly by default, we should do it manually
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    return config;
  },
};

export default withNextIntl(withVanillaExtract(nextConfig));
