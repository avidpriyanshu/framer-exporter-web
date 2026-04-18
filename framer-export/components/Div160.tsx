import React from 'react';

interface Div160Props {
  framername?: string;
  framercomponenttype?: string;
}
export default function Div160({ framername, framercomponenttype }: Div160Props) {
  return (
    <div data-framer-name="heading" data-framer-component-type="RichTextContainer">
    <p dir="auto">
    <text>Creative agency</text>
    </p>
    <p dir="auto">
    <text>for the industry leaders</text>
    </p>
    </div>
  );
}
