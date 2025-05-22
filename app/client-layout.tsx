"use client"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import AuthGuard from "@/components/auth-guard"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

// Composant wrapper pour gérer l'affichage conditionnel
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return children
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
