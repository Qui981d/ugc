import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Centre d'aide | UGC Suisse - FAQ, Guide & Support",
    description: "Trouvez des réponses à toutes vos questions sur UGC Suisse. Guide complet pour créateurs UGC et marques suisses : inscription, campagnes, paiements en CHF, et plus.",
    keywords: [
        "UGC Suisse aide",
        "créateur UGC Suisse",
        "contenu UGC Suisse romande",
        "FAQ UGC",
        "comment devenir créateur UGC",
        "plateforme UGC Suisse",
        "marketing UGC Suisse",
        "User Generated Content Suisse",
        "créateur contenu Suisse",
        "marque UGC Suisse",
        "contenu authentique Suisse",
        "UGC Genève",
        "UGC Lausanne",
        "campagne UGC prix",
        "UGC freelance Suisse"
    ],
    openGraph: {
        title: "Centre d'aide | UGC Suisse",
        description: "Guide complet et FAQ pour créateurs UGC et marques en Suisse. Tout savoir sur la plateforme UGC Suisse.",
        type: "website",
        locale: "fr_CH",
    },
    alternates: {
        canonical: "/aide",
    },
}

export default function AideLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
