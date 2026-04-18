import React from 'react';

interface A79Props {
  href?: string;
  framername?: string;
  highlight?: string;
}
export default function A79({ href, framername, highlight }: A79Props) {
  return (
    <a data-framer-name="Green small" data-highlight="true" href="./contact" tabindex="0">
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
