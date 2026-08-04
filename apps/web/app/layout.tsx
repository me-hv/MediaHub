import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'MediaHub • Universal Media Downloader',
  description: 'Download videos and images from YouTube, Instagram, X, Reddit, TikTok, Facebook, Vimeo and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased flex flex-col min-h-screen bg-background text-text selection:bg-indigo-500 selection:text-white">
        <Providers>
          <Header />
          <main className="flex-1 relative">
            <div className="ambient-gradient" />
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
