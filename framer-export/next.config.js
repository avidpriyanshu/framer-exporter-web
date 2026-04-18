/** @type {import('next').NextConfig} */
const nextConfig = {
  "reactStrictMode": true,
  "images": {
    
    "formats": [
      "image/avif",
      "image/webp"
    ]
  },
  "webpack": {
    "resolve": {
      "alias": {
        "@": "."
      }
    }
  }
};

module.exports = nextConfig;