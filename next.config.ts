import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Las fuentes publican por mes, trimestre o semestre, sin horario fijo: se revisan cada 6 horas.
    // `expire` amplio para seguir sirviendo lo último bueno si no hay visitas por un tiempo.
    datos: {
      stale: 60 * 60,
      revalidate: 60 * 60 * 6,
      expire: 60 * 60 * 24 * 14,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
