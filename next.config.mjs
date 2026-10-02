/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    serverExternalPackages: ['pdfjs-dist'],
    webpack: (config, { isServer, webpack }) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            canvas: false,
        };
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                stream: false,
                crypto: false,
                os: false,
                canvas: false,
            };
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
                    resource.request = resource.request.replace(/^node:/, '');
                })
            );
        }
        return config;
    },
    headers: async() => [{
        source: '/:path*',
        headers: [{
                key: 'X-DNS-Prefetch-Control',
                value: 'on',
            },
            {
                key: 'X-Content-Type-Options',
                value: 'nosniff',
            },
            {
                key: 'X-Frame-Options',
                value: 'DENY',
            },
            {
                key: 'Referrer-Policy',
                value: 'strict-origin-when-cross-origin',
            },
            {
                key: 'Permissions-Policy',
                value: 'camera=(), microphone=(), geolocation=()',
            },
        ],
    }, ],
    rewrites: async () => [
        { source: '/image-to-pdf', destination: '/tools/image-to-pdf' },
        { source: '/pdf-to-powerpoint', destination: '/tools/pdf-to-powerpoint' },
        { source: '/qr-code-generator', destination: '/tools/qr-code-generator' },
        { source: '/pdf-compressor', destination: '/tools/compress-pdf' },
        { source: '/pdf-merger', destination: '/tools/merge-pdf' },
        { source: '/merge-pdf', destination: '/tools/merge-pdf' },
        { source: '/pdf-splitter', destination: '/tools/split-pdf' },
        { source: '/split-pdf', destination: '/tools/split-pdf' },
    ],
};

export default nextConfig;