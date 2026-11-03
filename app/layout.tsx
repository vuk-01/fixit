import type { Metadata, Viewport } from "next"
import { DM_Sans, Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

const outfitHeading = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-heading" })

const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sr-Latn-ME"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", dmSans.variable, outfitHeading.variable)}
    >
      <body className="min-h-svh bg-background text-foreground">
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
