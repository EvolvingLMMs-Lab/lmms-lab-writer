import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { MotionProvider } from "@/components/providers/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMMs-Lab Writer",
  description:
    "AI-native LaTeX editor. Let AI agents write your papers while you focus on research.",
  keywords: [
    "LaTeX",
    "editor",
    "AI",
    "OpenCode",
    "AI agents",
    "research",
    "academic writing",
  ],
  authors: [{ name: "LMMs-Lab" }],
  icons: {
    icon: "/favicon.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "LMMs-Lab Writer",
    description: "AI-native LaTeX editor. Let AI agents write your papers.",
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
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
