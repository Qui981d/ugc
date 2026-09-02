import type { Metadata } from 'next'
import BrandLanding from '@/components/landing/BrandLanding'
import { BRAND_PAGE } from '@/lib/constants/landing'

/**
 * The brand landing lives at the root.
 *
 * The brief named /marques, but a company's main page belongs at the address
 * people actually type — it carries the most search authority and costs no
 * redirect hop. /marques still resolves and sends visitors here, so links
 * written against the brief keep working.
 *
 * The page itself is a client component (interactive tabs and filters), which
 * cannot export metadata; hence this server wrapper.
 */

export const metadata: Metadata = {
    title: BRAND_PAGE.seo.title,
    description: BRAND_PAGE.seo.description,
    alternates: { canonical: '/' },
    openGraph: {
        title: BRAND_PAGE.seo.title,
        description: BRAND_PAGE.seo.description,
        url: '/',
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

export default function HomePage() {
    return (
        <>
            <script
                type="application/ld+json"
                // Built from our own constants, never from user input.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <BrandLanding />
        </>
    )
}
