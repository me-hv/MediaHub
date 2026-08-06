import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '../components/layout/AppLayout';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'MediaHub • Universal Media Downloader',
  description: 'Download videos and audio from YouTube, YouTube Music, Instagram, X, Reddit, TikTok, Facebook, Vimeo and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        <Providers>
          <AppLayout>
            <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-between">
              <div className="ambient-gradient" />
              <div>{children}</div>
              <Footer />
            </div>
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
