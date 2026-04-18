import React from 'react';

interface Div150Props {
  framername?: string;
  framercomponenttype?: string;
}
export default function Div150({ framername, framercomponenttype }: Div150Props) {
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
