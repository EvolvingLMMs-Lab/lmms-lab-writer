import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ExternalLinkHandler } from "@/components/external-link-handler";
import { DeepLinkHandler } from "@/components/auth/deep-link-handler";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const modernSans = Roboto({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const modernMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LMMs-Lab Writer",
  description: "AI-native LaTeX editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${modernSans.variable} ${modernMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <ToastProvider>
            <ExternalLinkHandler />
            <DeepLinkHandler />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
