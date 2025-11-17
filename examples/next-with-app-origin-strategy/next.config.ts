import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  /*
   *  --- For this example, during development ensure to configure domains in your hosts file:
   *  127.0.0.1       english.local
   *  127.0.0.1       italiano.local
   */
  allowedDevOrigins: ["english.local", "italiano.local"],

  // basePath: "/subdir",
};

export default nextConfig;
