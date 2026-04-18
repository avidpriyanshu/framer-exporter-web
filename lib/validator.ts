export function isValidFramerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Accept any HTTPS URL - let the framer-exporter CLI validate if it's actually a Framer/Webflow site
    // This allows custom Framer domains like artone.studio
    return true;
  } catch {
    return false;
  }
}
