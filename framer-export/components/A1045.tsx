import React from 'react';

interface A1045Props {
  href?: string;
  framername?: string;
  highlight?: string;
}
export default function A1045({ href, framername, highlight }: A1045Props) {
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
