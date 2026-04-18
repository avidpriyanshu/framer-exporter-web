import React from 'react';

interface A1117Props {
  href?: string;
  framername?: string;
  highlight?: string;
}
export default function A1117({ href, framername, highlight }: A1117Props) {
  return (
    <a data-framer-name="Green small" data-highlight="true" href="https://cal.com" target="_blank" rel="noopener" tabindex="0">
    <p dir="auto">
    <text>Book a call</text>
    </p>
    <div>
    <text></text>
    <div></div>
    <text></text>
    </div>
    </a>
  );
}
