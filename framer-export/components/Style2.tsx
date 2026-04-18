import React from 'react';

interface Style2Props {
  framerhtmlstyle?: string;
}
export default function Style2({ framerhtmlstyle }: Style2Props) {
  return (
    <style data-framer-html-style="">
    <text>
    :root body { background: var(--token-5b23898e-f48a-4c0b-a7d1-01a559bbd900, rgb(248, 248, 248)); }
    </text>
    </style>
  );
}
