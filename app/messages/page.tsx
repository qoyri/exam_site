"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { messageService, type Conversation } from "@/lib/message-service"
import { MessageSquare, Plus } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchConversations = async () => {
      try {
        setLoading(true)
        const data = await messageService.getConversations()
        setConversations(data)
        setError(null)
      } catch (err) {
        console.error("Erreur lors de la récupération des conversations:", err)
        setError("Erreur lors du chargement des conversations")
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [router])

  const handleNewConversation = () => {
    router.push("/messages/new")
  }

  const handleOpenConversation = (userId: number) => {
    router.push(`/messages/${userId}`)
  }

  // Fonction pour obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    if (!name) return "?"

    const parts = name.split("@")[0].split(".")
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return format(date, "HH:mm")
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    } else {
      return format(date, "dd MMM", { locale: fr })
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button onClick={handleNewConversation} className="bg-blue-900 hover:bg-blue-800">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les conversations</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Vous n'avez pas encore de conversations</p>
                  <Button onClick={handleNewConversation} className="bg-blue-900 hover:bg-blue-800">
                    Démarrer une conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleOpenConversation(conversation.userId)}
                    >
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-900 text-white flex items-center justify-center mr-4">
                        {getInitials(conversation.displayName || conversation.userName || "")}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">
                            {conversation.displayName || conversation.userName || `Utilisateur #${conversation.userId}`}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessageDate ? formatDate(conversation.lastMessageDate) : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessageContent || "Aucun message"}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.userRole && (
                          <div className="text-xs text-gray-500">{translateRole(conversation.userRole)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread">
          <Card>
            <CardHeader>
              <CardTitle>Conversations non lues</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.filter((c) => c.unreadCount > 0).length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Vous n'avez pas de messages non lus</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations
                    .filter((c) => c.unreadCount > 0)
                    .map((conversation) => (
                      <div
                        key={conversation.userId}
                        className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleOpenConversation(conversation.userId)}
                      >
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-900 text-white flex items-center justify-center mr-4">
                          {getInitials(conversation.displayName || conversation.userName || "")}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium truncate">
                              {conversation.displayName ||
                                conversation.userName ||
                                `Utilisateur #${conversation.userId}`}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageDate ? formatDate(conversation.lastMessageDate) : ""}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessageContent || "Aucun message"}
                            </p>
                            <Badge variant="destructive" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          </div>
                          {conversation.userRole && (
                            <div className="text-xs text-gray-500">{translateRole(conversation.userRole)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
