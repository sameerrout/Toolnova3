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
        { source: '/pdf-to-pptx', destination: '/tools/pdf-to-powerpoint' },
        { source: '/pdf2pptx', destination: '/tools/pdf-to-powerpoint' },
        { source: '/qr-code-generator', destination: '/tools/qr-code-generator' },
        { source: '/qr-generator', destination: '/tools/qr-code-generator' },
        { source: '/compress-image', destination: '/image-compressor' },
        { source: '/image-compress', destination: '/image-compressor' },
        { source: '/pdf-compressor', destination: '/tools/compress-pdf' },
        { source: '/compress-pdf', destination: '/tools/compress-pdf' },
        { source: '/pdf-merger', destination: '/tools/merge-pdf' },
        { source: '/merge-pdf', destination: '/tools/merge-pdf' },
        { source: '/pdf-splitter', destination: '/tools/split-pdf' },
        { source: '/split-pdf', destination: '/tools/split-pdf' },
        { source: '/pdf-rotator', destination: '/tools/rotate-pdf' },
        { source: '/rotate-pdf', destination: '/tools/rotate-pdf' },
        { source: '/watermark-pdf', destination: '/tools/watermark-pdf' },
        { source: '/pdf-page-numbers', destination: '/tools/pdf-page-numbers' },
        { source: '/pdf-organizer', destination: '/tools/organize-pdf' },
        { source: '/organize-pdf', destination: '/tools/organize-pdf' },
        { source: '/resize-image', destination: '/image-resizer' },
        { source: '/image-resize', destination: '/image-resizer' },
        { source: '/pdf-editor', destination: '/edit-pdf' },
        { source: '/editor-pdf', destination: '/edit-pdf' },
        { source: '/pdf-to-image', destination: '/tools/pdf-to-image' },
        { source: '/pdf2image', destination: '/tools/pdf-to-image' },
        { source: '/pdf-to-img', destination: '/tools/pdf-to-image' },
        { source: '/protect-pdf', destination: '/tools/protect-pdf' },
        { source: '/pdf-protect', destination: '/tools/protect-pdf' },
        { source: '/remove-bg', destination: '/background-remover' },
        { source: '/remove-background', destination: '/background-remover' },
        { source: '/bg-remover', destination: '/background-remover' },
        { source: '/convert-image', destination: '/image-converter' },
        { source: '/image-convert', destination: '/image-converter' },
        { source: '/ocr', destination: '/image-to-text' },
        { source: '/image-ocr', destination: '/image-to-text' },
        { source: '/img-to-text', destination: '/image-to-text' },
        { source: '/passport-photo', destination: '/passport-photo-maker' },
        { source: '/passport-maker', destination: '/passport-photo-maker' },
        { source: '/passport-size-photo', destination: '/passport-photo-maker' },
    ],
};

export default nextConfig;