import { redirect } from 'next/navigation'

/** The brief's URL. Kept so existing links resolve; the page lives at the root. */
export default function MarquesPage() {
    redirect('/')
}
