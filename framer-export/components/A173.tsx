import React from 'react';

interface A173Props {
  href?: string;
  framername?: string;
  highlight?: string;
}
export default function A173({ href, framername, highlight }: A173Props) {
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
