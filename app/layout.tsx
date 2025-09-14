import type React from "react"
import type { Metadata } from "next"

import MobileNav from "@/components/codelingo/mobile-nav"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "CodeLingo",
  description: "Created with Love",
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
          <div className="min-h-screen pb-16">{children}</div>
          <MobileNav />
        </Suspense>
      </body>
    </html>
  )
}
