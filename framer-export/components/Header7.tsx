import React from 'react';

interface Header7Props {
  border?: string;
  framername?: string;
}
export default function Header7({ border, framername }: Header7Props) {
  return (
    <header data-border="true" data-framer-name="desktop">
    <div data-framer-name="max-width">
    <div>
    <text></text>
    <a data-framer-name="Desktop" data-highlight="true" href="./" data-framer-page-link-current="true" tabindex="0">
    <svg>
    <use href="#svg12410614130"></use>
    </svg>
    <h3 data-styles-preset="Pb3gzJKtv" dir="auto">
    <text>mindmaps</text>
    </h3>
    </a>
    <text></text>
    </div>
    <div>
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
    <div data-framer-name="right">
    <text></text>
    <div>
    <text></text>
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
    <text></text>
    </div>
    <text></text>
    </div>
    </div>
    </div>
    </header>
  );
}
