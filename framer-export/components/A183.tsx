import React from 'react';

interface A183Props {
  href?: string;
  framername?: string;
  highlight?: string;
}
export default function A183({ href, framername, highlight }: A183Props) {
  return (
    <a data-framer-name="Green small" data-highlight="true" href="https://www.cal.com" rel="noopener" tabindex="0">
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
