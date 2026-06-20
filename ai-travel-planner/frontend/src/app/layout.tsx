import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trao — AI Travel Planner',
  description: 'Plan personalized AI-generated travel itineraries in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">{children}</body>
    </html>
  );
}
