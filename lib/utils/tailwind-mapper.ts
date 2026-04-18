export interface TailwindMapping {
  tailwindClasses: string[];
  unmappedStyles: Record<string, string>;
}

const tailwindMap: Record<string, Record<string, string>> = {
  'background-color': {
    '#ffffff': 'bg-white',
    '#000000': 'bg-black',
    '#ff0000': 'bg-red-600',
    '#0066ff': 'bg-blue-600',
    '#00aa00': 'bg-green-600',
    '#ffaa00': 'bg-yellow-600',
    '#aa00ff': 'bg-purple-600',
    '#ff00aa': 'bg-pink-600',
    '#00aaaa': 'bg-cyan-600',
    '#555555': 'bg-gray-600',
  },
  'background': {
    '#ffffff': 'bg-white',
    '#000000': 'bg-black',
    '#ff0000': 'bg-red-600',
    '#0066ff': 'bg-blue-600',
    '#00aa00': 'bg-green-600',
    '#ffaa00': 'bg-yellow-600',
    '#aa00ff': 'bg-purple-600',
    '#ff00aa': 'bg-pink-600',
    '#00aaaa': 'bg-cyan-600',
    '#555555': 'bg-gray-600',
  },
  'padding': {
    '4px': 'p-1',
    '8px': 'p-2',
    '12px': 'p-3',
    '16px': 'p-4',
    '20px': 'p-5',
    '24px': 'p-6',
    '28px': 'p-7',
    '32px': 'p-8',
    '36px': 'p-9',
    '40px': 'p-10',
  },
  'margin': {
    '4px': 'm-1',
    '8px': 'm-2',
    '12px': 'm-3',
    '16px': 'm-4',
    '20px': 'm-5',
    '24px': 'm-6',
    '28px': 'm-7',
    '32px': 'm-8',
    '36px': 'm-9',
    '40px': 'm-10',
  },
  'border-radius': {
    '4px': 'rounded-sm',
    '8px': 'rounded',
    '12px': 'rounded-md',
    '16px': 'rounded-lg',
    '24px': 'rounded-xl',
    '32px': 'rounded-2xl',
    '9999px': 'rounded-full',
  },
  'border': {
    '1px solid #000000': 'border border-black',
    '2px solid #000000': 'border-2 border-black',
    '1px solid #cccccc': 'border border-gray-300',
  },
};

export function inlineStyleToTailwind(styleString: string): TailwindMapping {
  const styles = parseInlineStyle(styleString);
  const tailwindClasses: string[] = [];
  const unmappedStyles: Record<string, string> = {};

  for (const [prop, value] of Object.entries(styles)) {
    const mapped = findTailwindClass(prop, value);
    if (mapped) {
      tailwindClasses.push(mapped);
    } else {
      unmappedStyles[prop] = value;
    }
  }

  return { tailwindClasses, unmappedStyles };
}

function parseInlineStyle(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!styleString || !styleString.trim()) {
    return styles;
  }

  styleString.split(';').forEach((pair) => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > 0) {
      const prop = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      if (prop && value) {
        styles[prop] = value;
      }
    }
  });

  return styles;
}

function findTailwindClass(property: string, value: string): string | null {
  const normProp = normalizeProperty(property);

  // Try exact match first
  if (tailwindMap[normProp] && tailwindMap[normProp][value]) {
    return tailwindMap[normProp][value];
  }

  // Try to find partial matches or handle special cases
  if (normProp === 'background' || normProp === 'background-color') {
    // Handle hex color values
    const hexMatch = value.match(/^#[0-9a-fA-F]{6}$/);
    if (hexMatch) {
      const lowerValue = value.toLowerCase();
      if (tailwindMap[normProp] && tailwindMap[normProp][lowerValue]) {
        return tailwindMap[normProp][lowerValue];
      }
    }
  }

  return null;
}

function normalizeProperty(prop: string): string {
  return prop.toLowerCase().trim();
}
