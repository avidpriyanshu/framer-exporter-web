const puppeteer = require('puppeteer');

const REAL_USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

async function createBrowserWithBypass() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-resources',
      '--disable-sync',
    ],
  });

  return browser;
}

async function applyAntiBot(page) {
  // Disable webdriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override chrome property
    Object.defineProperty(navigator, 'chrome', {
      get: () => ({ runtime: {} }),
    });
  });

  // Set realistic user agent
  const ua = REAL_USER_AGENTS[Math.floor(Math.random() * REAL_USER_AGENTS.length)];
  await page.setUserAgent(ua);

  // Add delay injection utility
  page.addRandomDelay = async (min = 300, max = 1200) => {
    const delay = Math.random() * (max - min) + min;
    await new Promise(r => setTimeout(r, delay));
  };
}

module.exports = { createBrowserWithBypass, applyAntiBot };
