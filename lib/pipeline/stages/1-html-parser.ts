import * as cheerio from 'cheerio';
import { RawDOMNode, ParsedResult } from '../types';

export function parseHTML(html: string): ParsedResult {
  const startTime = Date.now();
  // Load HTML
  const $ = cheerio.load(html);

  const nodeSet = new Set<string>();
  let nodeCount = 0;

  function traverse(element: any): RawDOMNode | null {
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
      element.children.forEach((child: any) => {
        const childNode = traverse(child as any);
        if (childNode) {
          node.children.push(childNode);
        }
      });
    }

    return node;
  }

  // Get root element - cheerio wraps in html, so get body's first child
  let rootElement: any = null;

  // Navigate: html > body > [first tag child]
  const htmlElement = $.root().children()[0] as any;

  if (htmlElement && htmlElement.name === 'html') {
    const bodyElement = htmlElement.children?.find(
      (child: any) => child.type === 'tag' && child.name === 'body'
    ) as any;

    if (bodyElement && bodyElement.children && bodyElement.children.length > 0) {
      // Find first tag child of body
      for (const child of bodyElement.children) {
        if ((child as any).type === 'tag') {
          rootElement = child as any;
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
