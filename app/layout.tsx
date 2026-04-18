import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Framer Exporter',
  description: 'Clone your Framer website and download as ZIP',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
