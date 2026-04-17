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
    const ua = await page.evaluate(() => navigator.userAgent);
    expect(ua).toContain('Chrome');
    expect(ua).not.toContain('HeadlessChrome');
    await page.close();
  });

  test('detects webdriver and disables it', async () => {
    browser = await createBrowserWithBypass();
    const page = await browser.newPage();
    const isWebdriver = await page.evaluate(() => navigator.webdriver);
    expect(isWebdriver).toBe(false);
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

  test('returns error on crawl failure', async () => {
    const result = await manager.crawlUrl('about:invalid-url-that-wont-load');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
