"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    // Vérifier l'authentification
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated()
      setIsAuthenticated(isAuth)

      // Si on est sur la page de login et qu'on est déjà authentifié, rediriger vers l'accueil
      if (isLoginPage && isAuth) {
        router.push("/")
      }

      // Si on n'est pas sur la page de login et qu'on n'est pas authentifié, rediriger vers login
      if (!isLoginPage && !isAuth) {
        router.push("/login")
      }
    }

    checkAuth()
  }, [router, isLoginPage])

  // Si on est sur la page de login, afficher directement le contenu sans vérification
  if (isLoginPage) {
    return <>{children}</>
  }

  // Pendant la vérification, ne rien afficher pour éviter un flash de contenu
  if (isAuthenticated === null) {
    return null
  }

  // Si authentifié, afficher le contenu protégé
  return isAuthenticated ? <>{children}</> : null
}
