import type React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import AuthGuard from "@/components/auth-guard"

export default function ProtectedLayout({
                                            children,
                                        }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <AuthGuard>
            <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1">
                    <Sidebar />
                    <div className="flex-1">{children}</div>
                </div>
            </div>
        </AuthGuard>
    )
}
