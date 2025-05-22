"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Erreur</h2>
        <Button variant="outline" onClick={() => router.push("/absences")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Une erreur est survenue</CardTitle>
          <CardDescription>Nous n'avons pas pu charger les détails de cette absence.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error.message || "Une erreur inattendue s'est produite."}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => router.push("/absences")}>Retour à la liste</Button>
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
