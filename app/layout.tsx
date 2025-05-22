import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import AuthGuard from "@/components/auth-guard"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Portail Professeurs",
  description: "Portail de gestion pour les professeurs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthGuard>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1">{children}</div>
              </div>
            </div>
          </AuthGuard>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
