/**
 * App shell: a phone-width column of paper, centred on a backdrop on wide screens.
 * The page itself never scrolls; each screen scrolls ONE region inside this column.
 * Safe areas: top (notch) is padded by the page header, left/right (landscape) here,
 * bottom (home bar) by the tab bar.
 */
export default function OrbitLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative h-dvh overflow-hidden overscroll-none bg-backdrop">
            <div className="bg-grain mx-auto flex h-full w-full max-w-column flex-col overflow-hidden bg-paper pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] text-ink md:line md:border-y-0 md:border-ink">
                {children}
            </div>
        </div>
    )
}
