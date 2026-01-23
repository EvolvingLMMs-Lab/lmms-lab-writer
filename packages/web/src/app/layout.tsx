import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'LMMs-Lab Write',
  description: 'Collaborative LaTeX editor with real-time sync',
  icons: {
    icon: '/icons8-w-key-96.png',
    apple: '/icons8-w-key-96.png',
  },
  openGraph: {
    title: 'LMMs-Lab Write',
    description: 'Collaborative LaTeX editor with real-time sync',
    type: 'website',
    locale: 'en_US',
    siteName: 'LMMs-Lab Write',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LMMs-Lab Write',
    description: 'Collaborative LaTeX editor with real-time sync',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
