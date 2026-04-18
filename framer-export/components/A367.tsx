import React from 'react';

interface A367Props {
  href?: string;
  border?: string;
  framername?: string;
}
export default function A367({ href, border, framername }: A367Props) {
  return (
    <a data-border="true" data-framer-name="White" href="./projects">
    <div data-framer-name="BG Color"></div>
    <p dir="auto">
    <text>View all projects</text>
    </p>
    </a>
  );
}
