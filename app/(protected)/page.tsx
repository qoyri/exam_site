import type { Metadata } from "next"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentAbsences } from "@/components/recent-absences"

export const metadata: Metadata = {
    title: "Tableau de bord | Portail Professeurs",
    description: "Tableau de bord du portail de gestion pour les professeurs",
}

export default function Home() {
    return (
        <main className="p-6">
            <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
            <DashboardStats />
            <RecentAbsences />
        </main>
    )
}
