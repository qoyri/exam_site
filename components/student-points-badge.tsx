import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface StudentPointsBadgeProps {
  points: number
}

export function StudentPointsBadge({ points }: StudentPointsBadgeProps) {
  // Déterminer la couleur du badge en fonction du nombre de points
  const getVariant = () => {
    if (points >= 90) return "success"
    if (points >= 70) return "default"
    if (points >= 50) return "secondary"
    if (points >= 30) return "warning"
    return "destructive"
  }

  return (
    <Badge variant={getVariant() as any} className="flex items-center gap-1">
      <Star className="h-3 w-3" />
      <span>{points} pts</span>
    </Badge>
  )
}
