"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function ApiTest() {
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("teacher@teacher.fr")
  const [password, setPassword] = useState("password123")
  const [createUserResult, setCreateUserResult] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch(`${apiUrl}/auth/test`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({
          success: true,
          message: "Connexion à l'API réussie!",
          data,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult({
          success: false,
          message: `Erreur ${response.status}: ${response.statusText}. ${errorData.message || ""}`,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({
          success: true,
          message: "Authentification réussie!",
          data,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult({
          success: false,
          message: `Erreur ${response.status}: ${response.statusText}. ${errorData.message || ""}`,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erreur d'authentification: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTestUser = async () => {
    setIsLoading(true)
    setCreateUserResult(null)

    try {
      // Créer un script SQL pour insérer un utilisateur de test
      const sqlScript = `
      INSERT INTO users (email, password, role) 
      VALUES ('${email}', SHA2('${password}', 256), 'professeur')
      ON DUPLICATE KEY UPDATE password = SHA2('${password}', 256);
      
      -- Récupérer l'ID de l'utilisateur
      SET @user_id = LAST_INSERT_ID();
      
      -- Insérer un enseignant associé à cet utilisateur s'il n'existe pas déjà
      INSERT INTO teachers (user_id, subject)
      SELECT @user_id, 'Mathématiques'
      FROM dual
      WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = @user_id);
      `

      setCreateUserResult({
        success: true,
        message: "Voici le script SQL à exécuter dans votre base de données pour créer un utilisateur de test:",
      })

      // Afficher le script SQL dans la console
      console.log(sqlScript)

      setTestResult({
        success: true,
        message: "Script SQL généré. Veuillez l'exécuter dans votre base de données.",
        data: sqlScript,
      })
    } catch (error) {
      setCreateUserResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Test de connexion à l'API</CardTitle>
        <CardDescription>Vérifiez la connexion à votre API backend</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection">
          <TabsList className="mb-4">
            <TabsTrigger value="connection">Test de connexion</TabsTrigger>
            <TabsTrigger value="auth">Test d'authentification</TabsTrigger>
            <TabsTrigger value="create-user">Créer un utilisateur</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">URL de l'API</Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/api"
              />
              <p className="text-sm text-muted-foreground">
                L'URL de base de votre API (définie dans NEXT_PUBLIC_API_URL)
              </p>
            </div>

            <Button onClick={testConnection} disabled={isLoading}>
              {isLoading ? "Test en cours..." : "Tester la connexion"}
            </Button>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@teacher.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>

            <Button onClick={testLogin} disabled={isLoading}>
              {isLoading ? "Test en cours..." : "Tester l'authentification"}
            </Button>
          </TabsContent>

          <TabsContent value="create-user" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@teacher.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe</Label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
            </div>

            <Button onClick={createTestUser} disabled={isLoading}>
              {isLoading ? "Génération en cours..." : "Générer le script SQL"}
            </Button>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Cette fonctionnalité génère uniquement un script SQL. Vous devrez l'exécuter manuellement dans votre
                base de données.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{testResult.success ? "Succès" : "Erreur"}</AlertTitle>
            <AlertDescription>
              {testResult.message}
              {testResult.data && typeof testResult.data === "string" && (
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs">{testResult.data}</pre>
              )}
              {testResult.data && typeof testResult.data === "object" && (
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto text-xs">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Assurez-vous que votre API est en cours d'exécution et accessible.
        </p>
      </CardFooter>
    </Card>
  )
}
