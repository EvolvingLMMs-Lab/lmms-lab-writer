import type { NextConfig } from "next";
import type { Configuration } from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import WebpackObfuscator from "webpack-obfuscator";

const isProd = process.env.NODE_ENV === "production";
const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@lmms-lab/writer-shared"],
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  productionBrowserSourceMaps: false,
  turbopack: {},

  webpack: (config: Configuration, { isServer }) => {
    config.module = config.module || { rules: [] };
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/framer-motion/,
      loader: "string-replace-loader",
      options: {
        search: /\/\/# sourceMappingURL=.+\.map/g,
        replace: "",
      },
    });

    if (isProd && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ["console.info", "console.debug", "console.warn"],
                passes: 3,
              },
              mangle: {
                safari10: true,
                properties: {
                  regex: /^_/,
                },
              },
              format: {
                comments: false,
              },
            },
            extractComments: false,
          }),
        ],
      };

      config.plugins = config.plugins || [];
      config.plugins.push(
        new WebpackObfuscator(
          {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            disableConsoleOutput: true,
            identifierNamesGenerator: "hexadecimal",
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.75,
            stringArrayEncoding: ["base64"],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: "function",
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false,
          },
          ["**/node_modules/**", "**/*.min.js"],
        ),
      );
    }

    return config;
  },
};

export default nextConfig;
