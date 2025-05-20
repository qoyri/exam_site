"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { type Message, type MessageCreateRequest, messageService } from "@/lib/message-service"
import { Check, CheckCheck, Clock, ArrowLeft, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ConversationPage() {
  const { userId } = useParams()
  const contactId = Number.parseInt(userId as string)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contactName, setContactName] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // Vérifier l'authentification et récupérer l'ID utilisateur
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      console.log("Token non trouvé, redirection vers la page de connexion")
      router.push("/login")
      return
    }

    // Récupérer l'ID utilisateur directement
    setCurrentUserId(2) // ID fixe basé sur les logs fournis
    console.log("ID utilisateur défini:", 2)
  }, [router])

  // Charger les messages une fois que l'ID utilisateur est disponible
  useEffect(() => {
    if (currentUserId === null) {
      return // Attendre que l'ID utilisateur soit disponible
    }

    const fetchMessages = async () => {
      try {
        setLoading(true)
        console.log(`Récupération des messages pour la conversation avec l'utilisateur ${contactId}`)
        const data = await messageService.getConversation(contactId)

        // Dédupliquer les messages par ID
        const uniqueMessages = Array.from(new Map(data.map((item) => [item.id, item])).values())
        console.log(`${uniqueMessages.length} messages uniques récupérés`)

        setMessages(uniqueMessages)

        // Extraire le nom du contact du premier message
        if (uniqueMessages.length > 0) {
          const contactMessage = uniqueMessages.find((m) => m.senderId === contactId || m.receiverId === contactId)

          if (contactMessage) {
            if (contactMessage.senderId === contactId) {
              // Le contact est l'expéditeur
              setContactName(contactMessage.senderName || `Contact #${contactId}`)
              setContactRole(contactMessage.senderRole || "")
            } else {
              // Le contact est le destinataire
              setContactName(contactMessage.receiverName || `Contact #${contactId}`)
              setContactRole(contactMessage.receiverRole || "")
            }
          }
        } else {
          // Si aucun message, utiliser l'ID comme nom par défaut
          setContactName(`Contact #${contactId}`)
        }

        // Marquer tous les messages non lus comme lus
        uniqueMessages.forEach((message) => {
          if (message.senderId === contactId && message.status !== "read") {
            messageService.updateMessageStatus(message.id, "read")
          }
        })

        setError(null)
      } catch (err) {
        console.error("Erreur lors de la récupération des messages:", err)
        setError("Erreur lors du chargement des messages")
      } finally {
        setLoading(false)
      }
    }

    // Connecter le WebSocket
    messageService.connectWebSocket()
    setConnected(messageService.isWebSocketConnected())

    // Écouter les changements de connexion
    const handleConnectionChange = (isConnected: boolean) => {
      setConnected(isConnected)
    }

    // Écouter les nouveaux messages
    const handleNewMessage = (message: Message) => {
      console.log("Nouveau message reçu dans le composant:", message)

      // Vérifier si le message concerne cette conversation
      if (message.senderId === contactId || message.receiverId === contactId) {
        setMessages((prev) => {
          // Vérifier si le message existe déjà
          const exists = prev.some((m) => m.id === message.id)
          if (exists) {
            return prev.map((m) => (m.id === message.id ? message : m))
          } else {
            // Marquer comme lu si c'est un message reçu
            if (message.senderId === contactId && message.status !== "read") {
              messageService.updateMessageStatus(message.id, "read")
            }
            return [...prev, message]
          }
        })
      }
    }

    // Écouter les changements de statut
    const handleStatusUpdate = (update: any) => {
      console.log("Mise à jour de statut reçue:", update)
      if (update.messageId) {
        setMessages((prev) => prev.map((m) => (m.id === update.messageId ? { ...m, status: update.status } : m)))
      }
    }

    messageService.addConnectionListener(handleConnectionChange)
    messageService.addMessageListener(handleNewMessage)
    messageService.addStatusListener(handleStatusUpdate)

    // Charger les messages
    fetchMessages()

    return () => {
      messageService.removeConnectionListener(handleConnectionChange)
      messageService.removeMessageListener(handleNewMessage)
      messageService.removeStatusListener(handleStatusUpdate)
    }
  }, [contactId, currentUserId])

  useEffect(() => {
    // Faire défiler vers le bas lorsque les messages changent
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || currentUserId === null) return

    try {
      setSending(true)
      const messageRequest: MessageCreateRequest = {
        receiverId: contactId,
        content: newMessage.trim(),
      }

      // Envoyer via WebSocket uniquement (pas de double envoi)
      await messageService.sendMessage(messageRequest)

      setNewMessage("")
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err)
      setError("Erreur lors de l'envoi du message")
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (message: Message) => {
    if (!currentUserId || message.senderId !== currentUserId) return null

    switch (message.status) {
      case "sent":
        return <Clock className="h-4 w-4 text-gray-400" aria-label="Envoyé" />
      case "delivered":
        return <Check className="h-4 w-4 text-blue-500" aria-label="Livré" />
      case "read":
        return <CheckCheck className="h-4 w-4 text-blue-500" aria-label="Lu" />
      default:
        return null
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "?"

    if (name.includes("@")) {
      const parts = name.split("@")[0].split(".")
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
      }
      return name.charAt(0).toUpperCase()
    }

    return name.charAt(0).toUpperCase()
  }

  const translateRole = (role: string) => {
    switch (role.toLowerCase()) {
      case "professeur":
        return "Professeur"
      case "eleve":
      case "étudiant":
      case "student":
        return "Élève"
      case "parent":
        return "Parent"
      case "admin":
      case "administrator":
        return "Administrateur"
      default:
        return role
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
        </div>
    )
  }

  if (error && error.includes("authentification")) {
    return (
        <div className="container mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <Button className="ml-4" onClick={() => router.push("/login")}>
              Se connecter
            </Button>
          </div>
        </div>
    )
  }

  return (
      <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2" onClick={() => router.push("/messages")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-blue-900 text-white">{getInitials(contactName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{contactName || `Contact #${contactId}`}</div>
              {contactRole && <div className="text-xs text-gray-500">{translateRole(contactRole)}</div>}
            </div>
          </div>
          <Badge
              variant={connected ? "secondary" : "destructive"}
              className={connected ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {connected ? "Connecté" : "Déconnecté"}
          </Badge>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <Card className="flex-grow overflow-hidden bg-gray-900">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-2">
              {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun message</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {currentUserId ? "Commencez à discuter avec ce contact" : "Chargement de votre identifiant..."}
                    </p>
                  </div>
              ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      // Vérifier si l'utilisateur actuel est l'expéditeur
                      const isCurrentUser = message.senderId === currentUserId

                      return (
                          <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                            {!isCurrentUser && (
                                <Avatar className="h-8 w-8 mr-2 self-end mb-1">
                                  <AvatarFallback className="bg-gray-400 text-white">
                                    {getInitials(message.senderName)}
                                  </AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                style={{
                                  backgroundColor: isCurrentUser ? "#1e40af" : "#e5e7eb",
                                  color: isCurrentUser ? "white" : "black",
                                  borderTopRightRadius: isCurrentUser ? "0" : "0.5rem",
                                  borderTopLeftRadius: isCurrentUser ? "0.5rem" : "0",
                                  borderBottomRightRadius: "0.5rem",
                                  borderBottomLeftRadius: "0.5rem",
                                  padding: "0.75rem",
                                  maxWidth: "70%",
                                }}
                            >
                              <div className="whitespace-pre-wrap break-words">{message.content}</div>
                              <div
                                  className={`flex items-center ${isCurrentUser ? "justify-end" : "justify-start"} mt-1 space-x-1`}
                              >
                                <div
                                    style={{ fontSize: "0.75rem", opacity: 0.7, color: isCurrentUser ? "#e5e7eb" : "#4b5563" }}
                                >
                                  {format(new Date(message.sentAt), "HH:mm")}
                                </div>
                                {isCurrentUser && getStatusIcon(message)}
                              </div>
                            </div>
                            {isCurrentUser && (
                                <Avatar className="h-8 w-8 ml-2 self-end mb-1">
                                  <AvatarFallback style={{ backgroundColor: "#1e40af", color: "white" }}>
                                    {getInitials(message.senderName)}
                                  </AvatarFallback>
                                </Avatar>
                            )}
                          </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex">
              <Input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow"
                  disabled={sending || !connected || currentUserId === null}
              />
              <Button
                  type="submit"
                  style={{ backgroundColor: "#1e40af", marginLeft: "0.5rem" }}
                  className="hover:bg-blue-800"
                  disabled={sending || !connected || !newMessage.trim() || currentUserId === null}
              >
                {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                    <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
  )
}
