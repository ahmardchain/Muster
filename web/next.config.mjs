/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // These Mezo wallet packages ship TypeScript source.
  transpilePackages: ["@mezo-org/orangekit-contracts", "@mezo-org/orangekit-smart-account"],
  webpack: (config) => {
    // Optional native deps pulled in by wallet libraries; not needed in the browser.
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    return config;
  },
};
export default nextConfig;
