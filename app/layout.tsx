import type React from "react"
import type { Metadata, Viewport } from "next"

import MobileNav from "@/components/codelingo/mobile-nav"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "CodeLingo",
  description: "Created with Love",
  manifest: "/manifest.json",
  applicationName: "CodeLingo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CodeLingo",
  },
  icons: {
    icon: [
      { url: "/next.svg", type: "image/svg+xml" },
      { url: "/window.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/next.svg", type: "image/svg+xml" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans `}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="min-h-[100dvh] pb-16">{children}</div>
          <MobileNav />
        </Suspense>
      </body>
    </html>
  )
}
