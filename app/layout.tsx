import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Devya Feedback',
  description:
    'Share your honest take on working with Devya Solutions. Independent, verified feedback that shapes how we hire and how future teams find us.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-ink-100 font-sora antialiased">
        {children}
      </body>
    </html>
  );
}
