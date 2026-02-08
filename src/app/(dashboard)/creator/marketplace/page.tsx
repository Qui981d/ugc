import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Clock, Package } from "lucide-react"
import { formatCHF } from "@/lib/validations/swiss"

// Mock data - will be replaced with real data from Supabase
const campaigns = [
    {
        id: "1",
        title: "Témoignage Montre Suisse",
        brand: "Horlogerie Genevoise",
        brandLogo: null,
        budget: 650,
        format: "9:16",
        scriptType: "Témoignage",
        deadline: "20 Feb 2026",
        requiresShipping: true,
        applications: 3,
    },
    {
        id: "2",
        title: "Unboxing Cosmétiques Bio",
        brand: "NaturSwiss",
        brandLogo: null,
        budget: 450,
        format: "9:16",
        scriptType: "Unboxing",
        deadline: "25 Feb 2026",
        requiresShipping: true,
        applications: 7,
    },
    {
        id: "3",
        title: "Review Application Fitness",
        brand: "SwissMove",
        brandLogo: null,
        budget: 380,
        format: "16:9",
        scriptType: "Review",
        deadline: "28 Feb 2026",
        requiresShipping: false,
        applications: 2,
    },
    {
        id: "4",
        title: "Lifestyle Café Artisanal",
        brand: "Café du Léman",
        brandLogo: null,
        budget: 520,
        format: "9:16",
        scriptType: "Lifestyle",
        deadline: "15 Mar 2026",
        requiresShipping: true,
        applications: 5,
    },
]

export default function MarketplacePage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
                <p className="text-muted-foreground mt-1">
                    Découvrez les opportunités de collaboration avec des marques suisses
                </p>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une campagne..."
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">Filtrer</Button>
            </div>

            {/* Campaigns Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                    <Card key={campaign.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{campaign.brand}</p>
                                    <h3 className="font-semibold text-foreground mt-1">{campaign.title}</h3>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                    {campaign.format}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-3">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="outline">{campaign.scriptType}</Badge>
                                {campaign.requiresShipping && (
                                    <Badge variant="outline" className="gap-1">
                                        <Package className="h-3 w-3" />
                                        Envoi produit
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {campaign.deadline}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Suisse
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-3 border-t border-border flex items-center justify-between">
                            <div>
                                <p className="text-lg font-bold text-foreground">
                                    {formatCHF(campaign.budget)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {campaign.applications} candidatures
                                </p>
                            </div>
                            <Link href={`/dashboard/creator/missions/${campaign.id}/apply`}>
                                <Button className="btn-swiss-red" size="sm">
                                    Postuler
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Load More */}
            <div className="text-center">
                <Button variant="outline">Charger plus de campagnes</Button>
            </div>
        </div>
    )
}
