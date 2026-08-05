import type { Metadata } from 'next';
import { Newsreader, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const title = 'Craig Roberts — AI Engineer';
const description =
  'MS in Artificial Intelligence at Northeastern University. Building multi-agent orchestration systems, RAG pipelines, and production-grade AI.';

export const metadata: Metadata = {
  metadataBase: new URL('https://portfolio-lilac-three-cjbkxkha6w.vercel.app'),
  title,
  description,
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Craig Roberts',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
