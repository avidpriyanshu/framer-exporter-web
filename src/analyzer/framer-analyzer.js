class FramerAnalyzer {
  constructor(html) {
    this.html = html;
  }

  analyze() {
    return {
      siteTitle: this.extractSiteTitle(),
      publishDate: this.extractPublishDate(),
      generatorVersion: this.extractGeneratorVersion(),
      components: this.extractComponents(),
      namedLayers: this.extractNamedLayers(),
      fonts: this.extractFonts(),
      externalServices: this.extractExternalServices(),
      hasAnalytics: this.hasAnalytics(),
      analyticsId: this.extractAnalyticsId(),
    };
  }

  extractSiteTitle() {
    const match = this.html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
  }

  extractPublishDate() {
    const match = this.html.match(/<!-- Published ([^-]+) -->/);
    return match ? match[1].trim() : null;
  }

  extractGeneratorVersion() {
    const match = this.html.match(/<meta name="generator" content="Framer ([a-f0-9]+)">/i);
    return match ? match[1] : null;
  }

  extractComponents() {
    const match = this.html.match(/data-framer-components="([^"]+)"/);
    if (!match) return [];
    return match[1].split(' ').filter(c => c.length > 0);
  }

  extractNamedLayers() {
    const regex = /data-framer-name="([^"]+)"/g;
    const layers = [];
    const seen = new Set();
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      if (!seen.has(match[1])) {
        layers.push(match[1]);
        seen.add(match[1]);
      }
    }
    return layers;
  }

  extractFonts() {
    const fonts = [];
    const seen = new Set();
    const regex = /font-family:\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(this.html)) !== null) {
      if (!seen.has(match[1])) {
        fonts.push(match[1]);
        seen.add(match[1]);
      }
    }
    return fonts;
  }

  extractExternalServices() {
    const services = [];
    const seen = new Set();

    // Extract from script src
    const scriptRegex = /<script[^>]+src="(https?:\/\/[^"]+)"/g;
    let match;
    while ((match = scriptRegex.exec(this.html)) !== null) {
      const url = match[1];
      const hostname = new URL(url).hostname;
      if (!seen.has(hostname)) {
        services.push(hostname);
        seen.add(hostname);
      }
    }

    // Extract from link href
    const linkRegex = /<link[^>]+href="(https?:\/\/[^"]+)"/g;
    while ((match = linkRegex.exec(this.html)) !== null) {
      const url = match[1];
      const hostname = new URL(url).hostname;
      if (!seen.has(hostname)) {
        services.push(hostname);
        seen.add(hostname);
      }
    }

    return services;
  }

  hasAnalytics() {
    return this.html.includes('googletagmanager.com') ||
           this.html.includes('google-analytics.com');
  }

  extractAnalyticsId() {
    const match = this.html.match(/[?&]id=([GU][A-Z0-9-]+)/);
    return match ? match[1] : null;
  }
}

module.exports = { FramerAnalyzer };
