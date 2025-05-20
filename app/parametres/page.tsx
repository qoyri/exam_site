"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { settingsService, type Settings, type UpdateSettingsDto } from "@/lib/settings-service"
import { toast } from "@/hooks/use-toast"
import { Loader2, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"

export default function ParametresPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { setTheme } = useTheme()

  // État local pour les modifications
  const [nickname, setNickname] = useState("")
  const [theme, setThemeLocal] = useState("light")
  const [language, setLanguage] = useState("fr")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const data = await settingsService.getSettings()
        setSettings(data)

        // Initialiser les états locaux
        setNickname(data.nickname || "")
        setThemeLocal(data.theme || "light")
        setLanguage(data.language || "fr")
        setNotificationsEnabled(data.notificationsEnabled)
        setProfileImage(data.profileImage)
      } catch (error) {
        console.error("Erreur lors de la récupération des paramètres:", error)
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos paramètres. Veuillez réessayer.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Modifier la fonction handleSaveSettings pour appliquer immédiatement le thème

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const updateDto: UpdateSettingsDto = {
        nickname,
        theme,
        language,
        notificationsEnabled,
      }

      // Ne pas inclure l'image de profil si elle n'a pas changé
      if (profileImage !== settings?.profileImage) {
        updateDto.profileImage = profileImage || undefined
      }

      const updatedSettings = await settingsService.updateSettings(updateDto)
      setSettings(updatedSettings)

      // Mettre à jour le thème global immédiatement
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(theme)
      setTheme(theme)

      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres ont été mis à jour avec succès.",
      })
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos paramètres. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 5 Mo.",
          variant: "destructive",
        })
        return
      }

      // Convertir en base64
      const base64Image = await settingsService.uploadProfileImage(file)

      // Compresser l'image
      const compressedImage = await settingsService.compressImage(base64Image)

      setProfileImage(compressedImage)

      toast({
        title: "Image téléchargée",
        description: "Cliquez sur Enregistrer pour appliquer les changements.",
      })
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error)
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'image. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Paramètres</h1>

      <Tabs defaultValue="profil">
        <TabsList className="mb-6">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Informations de profil</CardTitle>
              <CardDescription>Modifiez vos informations personnelles et votre image de profil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {profileImage ? (
                      <AvatarImage src={profileImage || "/placeholder.svg"} alt="Photo de profil" />
                    ) : (
                      <AvatarFallback className="text-2xl">{nickname?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                    )}
                  </Avatar>

                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <Label htmlFor="profile-image" className="block mb-2">
                    Photo de profil
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("profile-image")?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Changer l'image
                    </Button>
                    {profileImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setProfileImage(null)}
                        disabled={uploadingImage}
                      >
                        Supprimer
                      </Button>
                    )}
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formats acceptés: JPG, PNG, GIF. Taille maximale: 5 Mo.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Surnom</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Votre surnom"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>Personnalisez l'apparence et le comportement de l'application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Thème</Label>
                <Select value={theme} onValueChange={setThemeLocal}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Sélectionnez un thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Sélectionnez une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">Anglais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des notifications sur les nouvelles absences et événements.
                  </p>
                </div>
                <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  )
}
