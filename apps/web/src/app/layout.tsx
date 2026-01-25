import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMMs-Lab Writer",
  description:
    "AI-native LaTeX editor. Let Claude, Cursor, and Codex write your papers while you focus on research.",
  keywords: [
    "LaTeX",
    "editor",
    "AI",
    "Claude",
    "Cursor",
    "research",
    "academic writing",
  ],
  authors: [{ name: "LMMs-Lab" }],
  openGraph: {
    title: "LMMs-Lab Writer",
    description:
      "AI-native LaTeX editor. Let Claude, Cursor, and Codex write your papers.",
    url: "https://writer.lmms-lab.com",
    siteName: "LMMs-Lab Writer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMMs-Lab Writer",
    description: "AI-native LaTeX editor for researchers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
