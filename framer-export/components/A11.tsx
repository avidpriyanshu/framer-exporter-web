import React from 'react';

interface A11Props {
  href?: string;
  framername?: string;
  highlight?: string;
  framerpagelinkcurrent?: string;
}
export default function A11({ href, framername, highlight, framerpagelinkcurrent }: A11Props) {
  return (
    <a data-framer-name="Desktop" data-highlight="true" href="./" data-framer-page-link-current="true" tabindex="0">
    <svg>
    <use href="#svg12410614130"></use>
    </svg>
    <h3 data-styles-preset="Pb3gzJKtv" dir="auto">
    <text>mindmaps</text>
    </h3>
    </a>
  );
}
