import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CREATOR_PAGE } from '@/lib/constants/landing'

/**
 * The page itself is a client component — the product demo has a real tab
 * interaction — and a client component cannot export metadata. So the SEO for
 * /createurs lives here, next to the structured data, and both read from the
 * same approved copy as the page.
 */

export const metadata: Metadata = {
    title: CREATOR_PAGE.seo.title,
    description: CREATOR_PAGE.seo.description,
    alternates: { canonical: '/createurs' },
    openGraph: {
        type: 'website',
        locale: 'fr_CH',
        url: '/createurs',
        title: CREATOR_PAGE.seo.title,
        description: CREATOR_PAGE.seo.description,
    },
}

/**
 * FAQPage structured data, built from the same array the visible FAQ renders,
 * so the two can never drift apart.
 */
const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CREATOR_PAGE.faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
}

export default function CreatorsLayout({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
        </>
    )
}
