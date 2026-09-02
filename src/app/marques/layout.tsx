import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BRAND_PAGE } from '@/lib/constants/landing'

/**
 * The page itself is a client component (the demo tab strip and the case
 * filters are interactive), and a client component cannot export metadata.
 * The SEO surface therefore lives here, next to the FAQ structured data built
 * from the same approved copy the page renders.
 */

export const metadata: Metadata = {
    title: BRAND_PAGE.seo.title,
    description: BRAND_PAGE.seo.description,
    alternates: { canonical: '/marques' },
    openGraph: {
        title: BRAND_PAGE.seo.title,
        description: BRAND_PAGE.seo.description,
        url: '/marques',
        type: 'website',
    },
}

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BRAND_PAGE.faq.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
}

export default function MarquesLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                // Built from our own constants, never from user input.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            {children}
        </>
    )
}
