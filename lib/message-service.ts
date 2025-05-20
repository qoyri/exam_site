import { apiClient } from "./api-client"

export interface Message {
  id: number
  senderId: number
  senderName: string
  senderRole: string
  receiverId: number
  receiverName: string
  receiverRole: string
  content: string
  sentAt: string
  deliveredAt: string | null
  readAt: string | null
  status: string
}

export interface Conversation {
  userId: number
  userName: string
  userRole: string
  displayName?: string
  lastMessageDate: string
  lastMessageContent: string
  unreadCount: number
}

export interface MessageCreateRequest {
  receiverId: number
  content: string
}

export interface MessageUpdateRequest {
  status: string
}

export interface User {
  id: number
  email: string
  role: string
}

class MessageService {
  private socket: WebSocket | null = null
  private messageListeners: ((message: Message) => void)[] = []
  private statusListeners: ((update: any) => void)[] = []
  private connectionListeners: ((connected: boolean) => void)[] = []
  private reconnectInterval: NodeJS.Timeout | null = null
  private isConnected = false

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<Conversation[]>("/api/message/conversations")
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error)
      return []
    }
  }

  async getConversation(userId: number): Promise<Message[]> {
    try {
      const response = await apiClient.get<Message[]>(`/api/message/conversation/${userId}`)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération de la conversation:", error)
      return []
    }
  }

  async getUsers(role?: string | null): Promise<User[]> {
    try {
      const url = role ? `/api/message/users?role=${role}` : "/api/message/users"
      const response = await apiClient.get<User[]>(url)
      return response.data
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error)
      return []
    }
  }

  async sendMessage(message: MessageCreateRequest): Promise<Message | null> {
    try {
      // Si le WebSocket est connecté, envoyer le message via WebSocket uniquement
      if (this.isWebSocketConnected()) {
        console.log("Envoi du message via WebSocket uniquement")
        this.sendWebSocketMessage(message)
        // Le message sera créé côté serveur et renvoyé via WebSocket
        return null
      } else {
        // Sinon, utiliser l'API REST
        console.log("Envoi du message via API REST")
        const response = await apiClient.post<Message>("/api/message", message)
        return response.data
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      return null
    }
  }

  async updateMessageStatus(messageId: number, status: string): Promise<void> {
    try {
      // Si le WebSocket est connecté, envoyer la mise à jour via WebSocket
      if (this.isWebSocketConnected()) {
        this.sendWebSocketStatusUpdate(messageId, status)
      } else {
        // Sinon, utiliser l'API REST
        await apiClient.put(`/api/message/${messageId}/status`, { status })
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut du message:", error)
    }
  }

  connectWebSocket(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Impossible de se connecter au WebSocket: Token manquant")
      return
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || window.location.host
    const url = `${protocol}//${host}/ws/messages`

    console.log(`Connexion WebSocket à ${url}`)
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      console.log("WebSocket connecté")
      this.isConnected = true

      // Envoyer le token pour authentification
      if (this.socket) {
        // Envoyer le token sans le préfixe "Bearer "
        const cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token
        this.socket.send(JSON.stringify({ type: "auth", token: cleanToken }))
      }

      // Notifier les écouteurs
      this.notifyConnectionListeners(true)

      // Annuler la reconnexion automatique si elle est en cours
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null
      }
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("Message WebSocket reçu:", data)

        if (data.type === "auth_success") {
          console.log("Authentification WebSocket réussie")
        } else if (data.type === "auth_error") {
          console.error("Erreur d'authentification WebSocket:", data.message)
          // Déconnecter le WebSocket en cas d'erreur d'authentification
          this.disconnectWebSocket()
        } else if (data.type === "message") {
          // Nouveau message reçu
          console.log("Nouveau message reçu:", data.message)
          this.notifyMessageListeners(data.message)
        } else if (data.type === "message_sent") {
          // Confirmation de message envoyé
          console.log("Message envoyé avec succès:", data.message)
          this.notifyMessageListeners(data.message)
        } else if (data.type === "status_update") {
          // Mise à jour de statut
          console.log("Mise à jour de statut:", data.update)
          this.notifyStatusListeners(data.update)
        }
      } catch (error) {
        console.error("Erreur lors du traitement du message WebSocket:", error)
      }
    }

    this.socket.onclose = (event) => {
      console.log("WebSocket déconnecté:", event)
      this.isConnected = false

      // Notifier les écouteurs
      this.notifyConnectionListeners(false)

      // Reconnexion automatique
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          console.log("Tentative de reconnexion WebSocket...")
          this.connectWebSocket()
        }, 5000)
      }
    }

    this.socket.onerror = (error) => {
      console.error("Erreur WebSocket:", error)
    }
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
    }

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
  }

  sendWebSocketMessage(message: MessageCreateRequest): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket non connecté, impossible d'envoyer le message")
      return
    }

    console.log("Envoi du message via WebSocket:", message)
    this.socket.send(
      JSON.stringify({
        type: "message",
        data: message,
      }),
    )
  }

  sendWebSocketStatusUpdate(messageId: number, status: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket non connecté, impossible d'envoyer la mise à jour de statut")
      return
    }

    console.log(`Envoi de la mise à jour de statut via WebSocket: messageId=${messageId}, status=${status}`)
    this.socket.send(
      JSON.stringify({
        type: "status_update",
        data: {
          messageId,
          status,
        },
      }),
    )
  }

  isWebSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN
  }

  // Gestion des écouteurs
  addMessageListener(listener: (message: Message) => void): void {
    this.messageListeners.push(listener)
  }

  removeMessageListener(listener: (message: Message) => void): void {
    this.messageListeners = this.messageListeners.filter((l) => l !== listener)
  }

  addStatusListener(listener: (update: any) => void): void {
    this.statusListeners.push(listener)
  }

  removeStatusListener(listener: (update: any) => void): void {
    this.statusListeners = this.statusListeners.filter((l) => l !== listener)
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener)
  }

  removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter((l) => l !== listener)
  }

  private notifyMessageListeners(message: Message): void {
    this.messageListeners.forEach((listener) => listener(message))
  }

  private notifyStatusListeners(update: any): void {
    this.statusListeners.forEach((listener) => listener(update))
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((listener) => listener(connected))
  }
}

export const messageService = new MessageService()
