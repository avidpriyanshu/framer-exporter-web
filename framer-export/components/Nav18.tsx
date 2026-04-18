import React from 'react';

interface Nav18Props {
  framername?: string;
}
export default function Nav18({ framername }: Nav18Props) {
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
    <text>About us</text>
    </a>
    <text></text>
    </p>
    </nav>
  );
}
