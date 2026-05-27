/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/events/finali-femminili-pallavolo",
        destination: "/events/don-bosco-cup-2026",
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8787" },
      { protocol: "http", hostname: "localhost", port: "8787" }
    ]
  }
};

export default nextConfig;
