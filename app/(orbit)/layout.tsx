import { SpaceBackground } from '@/app/components/orbit/SpaceBackground'

export default function OrbitLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative h-dvh overflow-hidden bg-(--void)">
            <SpaceBackground />
            <main className="relative z-10 h-full overflow-y-auto overscroll-none scroll-space">{children}</main>
        </div>
    )
}
