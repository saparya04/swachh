const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  server: {
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Force host binding to your LAN IP
        req.headers.host = '192.168.1.8:8081';
        return middleware(req, res, next);
      };
    },
  },
};
