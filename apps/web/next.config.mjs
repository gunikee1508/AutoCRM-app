export default {
  transpilePackages: ['@autocrm/core'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/demo/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "script-src 'self'; object-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};
