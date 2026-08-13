/**
 * Temporary dev helper: disable TypeScript build-time checks to avoid
 * a Windows path-normalization Debug Failure during dev. Remove when
 * underlying issue is resolved.
 */
module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
