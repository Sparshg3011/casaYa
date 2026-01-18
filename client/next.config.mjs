/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'manyzxfbauebqzjmfkti.supabase.co',
      },
    ],
  },
  experimental: {
    esmExternals: 'loose',
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://rentcasaya-server.vercel.app/api/:path*'
          : 'http://localhost:4000/api/:path*',
      },
    ];
  },
  webpack: (config, { dir }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': dir + '/src',
    };
    return config;
  },
};

export default nextConfig;