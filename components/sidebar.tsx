"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  LayoutDashboard,
  Settings,
  User,
  Users,
  MessageSquare,
  Star,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    {
      name: "Tableau de bord",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Classes",
      href: "/classes",
      icon: Users,
    },
    {
      name: "Absences",
      href: "/absences",
      icon: Clock,
    },
    {
      name: "Points",
      href: "/points",
      icon: Star,
    },
    {
      name: "Salles",
      href: "/salles",
      icon: BookOpen,
    },
    {
      name: "Réservations",
      href: "/reservations",
      icon: Calendar,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Rapports",
      href: "/rapports",
      icon: FileText,
    },
    {
      name: "Statistiques",
      href: "/statistiques",
      icon: BarChart3,
    },
    {
      name: "Profil",
      href: "/profil",
      icon: User,
    },
    {
      name: "Paramètres",
      href: "/parametres",
      icon: Settings,
    },
  ]

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Gestion des absences</h2>
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  pathname === link.href ? "bg-muted text-primary" : "text-muted-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
