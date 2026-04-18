import React from 'react';

interface A687Props {
  border?: string;
  framername?: string;
}
export default function A687({ border, framername }: A687Props) {
  return (
    <a data-border="true" data-framer-name="Dark">
    <div data-framer-name="BG Color"></div>
    <p dir="auto">
    <text>Client Testimonials</text>
    </p>
    </a>
  );
}
