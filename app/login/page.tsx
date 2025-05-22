"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Appel au service d'authentification
      const userData = await authService.login({ username, password })

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${userData.username}`,
      })

      // Appliquer les paramètres utilisateur immédiatement après la connexion
      try {
        await authService.applyUserSettings()
      } catch (error) {
        console.error("Erreur lors de l'application des paramètres:", error)
      }

      // Redirection vers la page d'accueil
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 500)
    } catch (error: any) {
      console.error("Erreur de connexion:", error)

      toast({
        title: "Échec de la connexion",
        description: error.message || "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 z-50">
        <div className="absolute inset-0 z-0 opacity-10">
          <Image
              src="/abstract-geometric-shapes.png"
              alt="Background pattern"
              fill
              style={{ objectFit: "cover" }}
              priority
          />
        </div>

        <Card className="w-full max-w-md z-10 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Portail Professeurs</CardTitle>
            <CardDescription className="text-center">Connectez-vous pour accéder à votre espace</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="exemple@education.fr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Button variant="link" className="p-0 h-auto text-xs" asChild>
                    <a href="/forgot-password">Mot de passe oublié?</a>
                  </Button>
                </div>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-800"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                    <div className="flex items-center">
                      <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                      >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion en cours...
                    </div>
                ) : (
                    "Se connecter"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
  )
}