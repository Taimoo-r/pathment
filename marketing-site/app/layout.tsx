import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Pathment | Structured Growth, At Scale',
  description:
    'Pathment is AI-powered mentorship infrastructure for enterprise teams focused on precise, measurable capability growth.',
  metadataBase: new URL('https://pathment.me'),
  icons: {
    icon: [
      { url: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/assets/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Pathment | Enterprise Mentorship Infrastructure',
    description:
      'Build structured mentorship systems for measurable capability progression across enterprise teams.',
    url: 'https://pathment.me',
    siteName: 'Pathment',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pathment',
    description:
      'AI-powered mentorship platform for industry teams that need measurable skill growth.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${manrope.variable} ${sora.variable}`}>
        {children}
      </body>
    </html>
  );
}
