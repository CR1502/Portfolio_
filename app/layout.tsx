import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// SF Pro is the system face on Apple devices, but its licence bars serving it, so
// tokens.css asks for the system font first. These are the fallbacks for every
// other platform; they are not preloaded, so Apple devices never download them.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

const title = "Craig Roberts — AI Engineer";
const description =
  "Craig Roberts, AI Engineer in Boston. Building retrieval pipelines, multi-agent systems, drift detection, and LLM serving infrastructure.";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-lilac-three-cjbkxkha6w.vercel.app"),
  title,
  description,
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Craig Roberts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The font variables must be declared on <html>, because globals.css
    // composes --font-body from --font-sans inside :root.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
