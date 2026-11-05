import type { Metadata, Viewport } from "next"
import { preload } from "react-dom"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants"

// Overpass is self-hosted with metric overrides in globals.css (UI.md "Typography"); preload the Latin
// subset the first screen always uses
const FONT_PRELOADS = ["/fonts/overpass-latin.woff2", "/fonts/overpass-mono-latin.woff2"]

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // the browser bar takes the navy of the header
  themeColor: "#17212f",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  for (const href of FONT_PRELOADS) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" })
  }

  return (
    <html lang="sr-Latn-ME" suppressHydrationWarning className="font-sans antialiased">
      <body className="min-h-svh bg-background text-foreground">
        {/* light only in P0 (UI.md): the map tiles are light, and dark mode was hard to read */}
        <ThemeProvider forcedTheme="light">
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
