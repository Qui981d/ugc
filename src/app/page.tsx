import { redirect } from 'next/navigation'

/**
 * The public entry point is the brand landing.
 *
 * A redirect rather than a duplicate of /marques: two identical pages would
 * compete in search results, and the brief asks for one indexable URL per
 * audience.
 */
export default function HomePage() {
    redirect('/marques')
}
