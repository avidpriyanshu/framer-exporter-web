import React from 'react';

interface Nav64Props {
  framername?: string;
}
export default function Nav64({ framername }: Nav64Props) {
  return (
    <nav data-framer-name="menu">
    <p data-styles-preset="HRNSu_G2S">
    <text></text>
    <a data-styles-preset="k9HPVFDWu" href="./projects">
    <text>Projects</text>
    </a>
    <text></text>
    </p>
    <p data-styles-preset="HRNSu_G2S" dir="auto">
    <text></text>
    <a data-styles-preset="k9HPVFDWu" href="./contact">
    <text>About Us</text>
    </a>
    <text></text>
    </p>
    </nav>
  );
}
