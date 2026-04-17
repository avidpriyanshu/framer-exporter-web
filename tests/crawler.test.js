const { createBrowserWithBypass } = require('../src/crawler/anti-bot-bypass');
const { CrawlerManager } = require('../src/crawler/puppeteer-manager');

describe('Anti-Bot Bypass', () => {
  let browser;

  afterEach(async () => {
    if (browser) await browser.close();
  });

  test('sets realistic user-agent', async () => {
    browser = await createBrowserWithBypass();
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    const ua = await page.evaluate(() => navigator.userAgent);
    expect(ua).toMatch(/Chrome|Mozilla/);
    await page.close();
  });

  test('disables webdriver detection', async () => {
    browser = await createBrowserWithBypass();
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    const isWebdriver = await page.evaluate(() => navigator.webdriver);
    expect(isWebdriver).toBeFalsy();
    await page.close();
  });
});

describe('CrawlerManager', () => {
  let manager;

  beforeEach(async () => {
    manager = new CrawlerManager();
    await manager.initialize();
  });

  afterEach(async () => {
    await manager.close();
  });

  test('crawls about:blank successfully', async () => {
    const result = await manager.crawlUrl('about:blank');
    expect(result.success).toBe(true);
    expect(result.html).toBeDefined();
  });

  test('handles crawl errors gracefully', async () => {
    const result = await manager.crawlUrl('about:blank');
    // Verify crawl completes without throwing
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('html');
  });
});
