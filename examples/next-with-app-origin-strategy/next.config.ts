import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  /*
   *  --- For this example, during development ensure to configure domains in your hosts file:
   *  127.0.0.1       english.test
   *  127.0.0.1       italiano.test
   */
  allowedDevOrigins: ["english.test", "italiano.test"],

  // basePath: "/subdir",
};

export default nextConfig;
