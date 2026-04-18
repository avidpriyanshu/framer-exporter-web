import React from 'react';

interface A225Props {
  border?: string;
  framername?: string;
}
export default function A225({ border, framername }: A225Props) {
  return (
    <a data-border="true" data-framer-name="Dark">
    <div data-framer-name="BG Color"></div>
    <p dir="auto">
    <text>Featured Projects</text>
    </p>
    </a>
  );
}
