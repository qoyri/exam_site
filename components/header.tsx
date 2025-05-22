"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"
import { settingsService } from "@/lib/settings-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const { setTheme } = useTheme()
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        // Récupérer l'utilisateur actuel
        const currentUser = authService.getCurrentUser()
        setUser(currentUser)

        // Si l'utilisateur est connecté, récupérer ses paramètres
        if (currentUser) {
          try {
            const settings = await settingsService.getSettings()
            console.log("Paramètres utilisateur récupérés:", settings)

            // Appliquer le thème de l'utilisateur immédiatement
            if (settings.theme) {
              // Forcer l'application du thème sans attendre le cycle de rendu
              document.documentElement.classList.remove("light", "dark")
              document.documentElement.classList.add(settings.theme)
              setTheme(settings.theme)
            }

            // Définir l'image de profil si elle existe
            if (settings.profileImage) {
              setProfileImage(settings.profileImage)
            }
          } catch (error) {
            console.error("Erreur lors de la récupération des paramètres:", error)
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [setTheme])

  const handleLogout = () => {
    authService.logout()
  }

  return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">Portail Professeurs</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    {loading ? (
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    ) : (
                        <Avatar className="h-8 w-8">
                          {profileImage ? (
                              <AvatarImage src={profileImage || "/placeholder.svg"} alt={user?.username || "Avatar"} />
                          ) : (
                              <User className="h-5 w-5" />
                          )}
                          <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user ? user.username : "Mon compte"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/parametres">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>
  )
}