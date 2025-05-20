"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { messageService, type User } from "@/lib/message-service"
import { ArrowLeft, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export default function NewMessagePage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await messageService.getUsers(roleFilter)
        setUsers(data)
        setError(null)
      } catch (err) {
        console.error("Erreur lors de la récupération des utilisateurs:", err)
        setError("Erreur lors du chargement des utilisateurs")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [roleFilter, router])

  const handleSendMessage = async () => {
    if (!selectedUserId || !message.trim()) return

    try {
      setSending(true)
      const result = await messageService.sendMessage({
        receiverId: selectedUserId,
        content: message.trim(),
      })

      if (result) {
        // Rediriger vers la conversation
        router.push(`/messages/${selectedUserId}`)
      } else {
        setError("Erreur lors de l'envoi du message")
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err)
      setError("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  // Fonction pour traduire le rôle
  const translateRole = (role: string) => {
    const roles: Record<string, string> = {
      teacher: "Professeur",
      student: "Élève",
      parent: "Parent",
      admin: "Administrateur",
    }
    return roles[role.toLowerCase()] || role
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-2" onClick={() => router.push("/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Nouvelle conversation</h1>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un destinataire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role-filter">Filtrer par rôle</Label>
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) => setRoleFilter(value === "all" ? null : value)}
            >
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="teacher">Professeurs</SelectItem>
                <SelectItem value="student">Élèves</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="user-select">Destinataire</Label>
            <Select
              value={selectedUserId?.toString() || "none"}
              onValueChange={(value) => value !== "none" && setSelectedUserId(Number(value))}
            >
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Sélectionner un destinataire" />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <SelectItem value="none">Aucun utilisateur disponible</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.email} ({translateRole(user.role)})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              disabled={!selectedUserId}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            className="w-full bg-blue-900 hover:bg-blue-800"
            disabled={!selectedUserId || !message.trim() || sending}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
