import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sentinel X - Trade Analysis & Signal Provider',
  description: 'Real-time trade engine, Pine Script market regime analysis, risk calculator, and Convex Cloud synchronization.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-darkBg text-gray-200 antialiased selection:bg-accentBlue selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
