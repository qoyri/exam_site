"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: number
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true)
      try {
        // Simuler une requête API pour récupérer les notifications
        // Dans un cas réel, vous utiliseriez un service comme notificationService.getNotifications()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teacher/notifications`)

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setNotifications(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error)

        // Pour la démo, utilisons des données fictives
        setNotifications([
          {
            id: 1,
            message: "Nouvelle absence signalée dans votre classe",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            message: "Réunion des enseignants demain à 17h",
            isRead: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Hier
          },
          {
            id: 3,
            message: "Votre réservation de salle a été confirmée",
            isRead: true,
            createdAt: new Date(Date.now() - 172800000).toISOString(), // Avant-hier
          },
          {
            id: 4,
            message: "Rappel: Remise des notes pour le trimestre",
            isRead: true,
            createdAt: new Date(Date.now() - 259200000).toISOString(), // Il y a 3 jours
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markAsRead = async (id: number) => {
    try {
      // Simuler une requête API pour marquer une notification comme lue
      // Dans un cas réel, vous utiliseriez un service comme notificationService.markAsRead(id)
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teacher/notifications/${id}/read`, { method: 'PUT' })

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )

      toast({
        title: "Notification marquée comme lue",
        description: "La notification a été marquée comme lue avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors du marquage de la notification comme lue:", error)
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue.",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      // Simuler une requête API pour supprimer une notification
      // Dans un cas réel, vous utiliseriez un service comme notificationService.deleteNotification(id)
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teacher/notifications/${id}`, { method: 'DELETE' })

      // Mettre à jour l'état local
      setNotifications(notifications.filter((notification) => notification.id !== id))

      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification.",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      // Simuler une requête API pour marquer toutes les notifications comme lues
      // Dans un cas réel, vous utiliseriez un service comme notificationService.markAllAsRead()
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teacher/notifications/read-all`, { method: 'PUT' })

      // Mettre à jour l'état local
      setNotifications(notifications.map((notification) => ({ ...notification, isRead: true })))

      toast({
        title: "Toutes les notifications marquées comme lues",
        description: "Toutes les notifications ont été marquées comme lues avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues:", error)
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues.",
        variant: "destructive",
      })
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centre de notifications</CardTitle>
          <CardDescription>Gérez vos notifications et restez informé</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">Chargement des notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-4">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">Vous n'avez aucune notification</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    notification.isRead ? "bg-background" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${notification.isRead ? "bg-muted" : "bg-primary/10"}`}>
                      <Bell className={`h-5 w-5 ${notification.isRead ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${!notification.isRead && "font-semibold"}`}>{notification.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(notification.createdAt), "PPp", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.isRead && (
                      <Button variant="ghost" size="icon" onClick={() => markAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
