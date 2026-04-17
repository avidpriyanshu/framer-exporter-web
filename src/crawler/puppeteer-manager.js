const { createBrowserWithBypass } = require('./anti-bot-bypass');

class CrawlerManager {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      waitSelector: 'body',
      scrollToBottom: true,
      ...options,
    };
    this.browser = null;
  }

  async initialize() {
    this.browser = await createBrowserWithBypass();
  }

  async crawlUrl(url, options = {}) {
    const opts = { ...this.options, ...options };
    const page = await this.browser.newPage();

    try {
      // Navigate with timeout
      await Promise.race([
        page.goto(url, { waitUntil: 'networkidle2' }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Navigation timeout')), opts.timeout)
        ),
      ]);

      // Wait for specific selector if provided
      if (opts.waitSelector && opts.waitSelector !== 'body') {
        await page.waitForSelector(opts.waitSelector, { timeout: 5000 })
          .catch(() => console.warn(`Selector not found: ${opts.waitSelector}`));
      }

      // Scroll to bottom to trigger lazy-load
      if (opts.scrollToBottom) {
        await this.scrollToBottom(page);
      }

      // Give async content time to load
      await page.addRandomDelay(500, 1500);

      // Get full HTML
      const html = await page.content();
      return { html, url, success: true };
    } catch (error) {
      console.error(`Crawl failed for ${url}:`, error.message);
      return { html: null, url, success: false, error: error.message };
    } finally {
      await page.close();
    }
  }

  async scrollToBottom(page) {
    await page.evaluate(() => {
      return new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = { CrawlerManager };
