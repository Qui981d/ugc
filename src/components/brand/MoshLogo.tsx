/**
 * MOSH wordmark — the exact paths shipped on moshlesite.com (viewBox 0 0 156 40),
 * wrapped in `currentColor` the same way the site does, so one component serves
 * both light and dark grounds.
 *
 * Do not derive cropped variants from these paths: the square app icon is a
 * separate asset the brand owns (moshlesite.com/img/favicon.png), not something
 * to reconstruct here.
 */
export function MoshLogo({
    className = '',
    title = 'MOSH',
}: {
    className?: string
    /** Pass null when a visible "MOSH" label already names the mark. */
    title?: string | null
}) {
    return (
        <svg
            viewBox="0 0 156 40"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role={title ? 'img' : undefined}
            aria-label={title ?? undefined}
            aria-hidden={title ? undefined : true}
        >
            {title && <title>{title}</title>}
            <g fill="currentColor">
                <path d="M104.6,30.4l3.9-.8c1,3.9,3.2,6.9,9.2,6.9s6.8-1.7,6.8-4.8-2.1-4.2-8.3-5.2c-7.2-1.2-9.9-3.8-9.9-8.2s3.5-8.1,10.4-8.1,9.8,3.2,11.1,8.3l-3.9.9c-1-4.4-3.3-5.9-7.2-5.9s-6.3,1.7-6.3,4.5,1.8,4.2,7.5,5.1c7.8,1.3,10.9,3.8,10.9,8.4s-3.3,8.4-11,8.4-11.7-3.7-13-9.5h0Z" />
                <path d="M135.5,39.2h-4.2V0h4.2v18.1h.4c1.6-4.8,5.2-8,10.6-8s9.5,4.2,9.5,10.5v18.5h-4.2v-17.7c0-4.2-1.8-7.6-6.8-7.6s-9.5,3.5-9.5,8.9v16.4h0Z" />
                <path d="M97.5,10.8h-3.6c3.1,4,4.9,8.9,4.9,14.2s-1.8,10.2-4.9,14.2h3.6c3.4-4,5.3-8.9,5.3-14.2s-2-10.2-5.3-14.2Z" />
                <path d="M62.1,39.2c-3.1-4-4.9-8.9-4.9-14.2s1.8-10.2,4.9-14.2h-3.6c-3.4,4-5.3,8.9-5.3,14.2s2,10.2,5.3,14.2h3.6Z" />
                <path d="M39,10.2c-6.6,0-10.4,3.4-11.8,8.5h-.3c-.7-5.1-4.1-8.5-10.6-8.5s-10.2,3.2-11.7,8h-.5v-7.3H0v28.4h4.2v-16.4c0-5.3,4.2-8.9,10.8-8.9s7.8,3.3,7.8,7.6v17.7h4.2v-16.4c0-5.3,4.1-8.9,10.7-8.9s7.7,3.3,7.7,7.6v17.7h4.2v-18.5c0-6.2-3.4-10.5-10.6-10.5h0Z" />
            </g>
        </svg>
    )
}
