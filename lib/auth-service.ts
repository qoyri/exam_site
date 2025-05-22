"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export interface User {
  username: string
  role: string
  token: string
}

export interface LoginCredentials {
  username: string
  password: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: () => false,
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("token")

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      }
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      }

      const userData: User = await response.json()

      localStorage.setItem("token", userData.token)
      localStorage.setItem("user", JSON.stringify({ username: userData.username, role: userData.role }))

      setUser(userData)
      setToken(userData.token)
      router.push("/")
    } catch (error: any) {
      console.error("Error during login:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setToken(null)
    router.push("/login")
  }

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem("token")
  }

// eslint-disable-next-line
  //return <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`)
      }

      const userData = await response.json()

      // Stocker le token et les informations utilisateur
      localStorage.setItem("token", userData.token)
      localStorage.setItem(
          "user",
          JSON.stringify({
            username: userData.username,
            role: userData.role,
          }),
      )

      return userData
    } catch (error: any) {
      console.error("Erreur lors de la connexion:", error)
      throw error
    }
  },

  logout(): void {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  },

  getCurrentUser(): { username: string; role: string } | null {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
      return null
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("token")
  },

  async applyUserSettings() {
    try {
      const { settingsService } = await import("./settings-service")
      const settings = await settingsService.getSettings()

      if (settings && settings.theme) {
        // Appliquer le thème directement au DOM
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(settings.theme)

        // Si next-themes est disponible, mettre à jour son état aussi
        const htmlElement = document.documentElement
        htmlElement.setAttribute("data-theme", settings.theme)
      }

      return settings
    } catch (error) {
      console.error("Erreur lors de l'application des paramètres utilisateur:", error)
      return null
    }
  },
}
