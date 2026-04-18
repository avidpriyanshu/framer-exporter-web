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

    // Check for framer.com, framer.app, or webflow.io
    const hostname = parsed.hostname;
    const isFramer = hostname === 'framer.com' || hostname.endsWith('.framer.com') || hostname.endsWith('.framer.app');
    const isWebflow = hostname.endsWith('.webflow.io');

    return isFramer || isWebflow;
  } catch {
    return false;
  }
}
