import * as cheerio from 'cheerio';
import { RawDOMNode, ParsedResult } from '../types';

export function parseHTML(html: string): ParsedResult {
  const startTime = Date.now();
  // Load with fragment mode to avoid wrapping in html/body
  const $ = cheerio.load(html, { decodeEntities: true });

  const nodeSet = new Set<string>();
  let nodeCount = 0;

  function traverse(element: cheerio.Element | null): RawDOMNode | null {
    if (!element) return null;

    const node: RawDOMNode = {
      tag: element.name || 'text',
      attributes: { ...element.attribs },
      children: [],
      text: element.type === 'text' ? element.data : undefined,
    };

    nodeCount++;
    nodeSet.add(element.name || 'text');

    if (element.children) {
      element.children.forEach((child) => {
        const childNode = traverse(child as cheerio.Element);
        if (childNode) {
          node.children.push(childNode);
        }
      });
    }

    return node;
  }

  // Get root element - cheerio wraps in html, so get body's first child
  let rootElement: cheerio.Element | null = null;

  // Navigate: html > body > [first tag child]
  const htmlElement = $.root().children()[0] as cheerio.Element;

  if (htmlElement && htmlElement.name === 'html') {
    const bodyElement = htmlElement.children?.find(
      (child: any) => child.type === 'tag' && child.name === 'body'
    ) as cheerio.Element | undefined;

    if (bodyElement && bodyElement.children && bodyElement.children.length > 0) {
      // Find first tag child of body
      for (const child of bodyElement.children) {
        if ((child as cheerio.Element).type === 'tag') {
          rootElement = child as cheerio.Element;
          break;
        }
      }
    }
  }

  const rawDOM =
    rootElement && traverse(rootElement)
      ? traverse(rootElement)!
      : { tag: 'html', attributes: {}, children: [] };

  const parseTime = Date.now() - startTime;

  return {
    rawDOM,
    nodeCount,
    uniqueTags: Array.from(nodeSet).sort(),
    parseTime,
  };
}
