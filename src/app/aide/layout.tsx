import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Centre d'aide | MOSH - Agence UGC Suisse",
    description: "FAQ et guide complet sur MOSH, l'agence UGC de référence en Suisse. Briefs, production, contrats, paiements en CHF — on répond à toutes vos questions.",
    keywords: [
        "MOSH agence UGC",
        "UGC Suisse aide",
        "créateur UGC Suisse",
        "agence contenu UGC Suisse romande",
        "FAQ UGC",
        "comment devenir créateur UGC",
        "agence UGC Suisse",
        "marketing UGC Suisse",
        "User Generated Content Suisse",
        "créateur contenu Suisse",
        "MOSH marque UGC",
        "contenu authentique Suisse",
        "UGC Genève",
        "UGC Lausanne",
        "devis UGC Suisse",
        "agence vidéo UGC"
    ],
    openGraph: {
        title: "Centre d'aide | MOSH - Agence UGC Suisse",
        description: "Guide complet et FAQ sur MOSH, l'agence UGC en Suisse. Briefs, production, contrats et paiements — tout ce que vous devez savoir.",
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
