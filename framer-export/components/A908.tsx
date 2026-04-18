import React from 'react';

interface A908Props {
  border?: string;
  framername?: string;
}
export default function A908({ border, framername }: A908Props) {
  return (
    <a data-border="true" data-framer-name="Dark">
    <div data-framer-name="BG Color"></div>
    <p dir="auto">
    <text>FAQs</text>
    </p>
    </a>
  );
}
