import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "./cx";
import { BackpackIcon, BoardIcon, CalendarIcon } from "./icons";

export type TabId = "board" | "calendar" | "backpack";

export interface TabItem {
    id: TabId;
    label: string;
    icon: ReactNode;
    /** Where the tab goes. Frontend decides the routes. */
    href: string;
    /** Small count badge (e.g. open tasks). Always paired with the label, never alone. */
    count?: number;
}

/** The three tabs from the Phase 0 pick. Routes are placeholders: frontend sets the real hrefs. */
export const COZY_TABS: TabItem[] = [
    { id: "board", label: "Board", icon: <BoardIcon />, href: "/" },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon />, href: "/calendar" },
    { id: "backpack", label: "Backpack", icon: <BackpackIcon />, href: "/backpack" },
];

export interface TabBarProps {
    /** Which tab is current. */
    active: TabId;
    items?: TabItem[];
    /** Render tabs with next/link: pass `linkAs={Link}`. Defaults to a plain <a>. */
    linkAs?: ElementType;
    /** Accessible name of the navigation landmark. */
    label?: string;
    className?: string;
}

/**
 * Bottom tab bar. Presentational: it does not know about routing.
 * Place it at the bottom of the phone column (sticky/fixed is the shell's job).
 * Bottom padding = the iPhone home-bar safe area, so the labels never sit under the home indicator.
 */
export function TabBar({ active, items = COZY_TABS, linkAs, label = "Main", className }: TabBarProps) {
    const Link: ElementType = linkAs ?? "a";
    return (
        <nav
            aria-label={label}
            className={cx("line-t bg-grain border-ink bg-surface pb-[env(safe-area-inset-bottom)]", className)}
        >
            <ul className="flex">
                {items.map((item) => {
                    const isActive = item.id === active;
                    const linkProps: ComponentPropsWithoutRef<"a"> = {
                        href: item.href,
                        "aria-current": isActive ? "page" : undefined,
                    };
                    return (
                        <li key={item.id} className="min-w-0 flex-1">
                            <Link
                                {...linkProps}
                                className={cx(
                                    "press focus-ring relative flex min-h-15 flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                                    "focus-visible:-outline-offset-4",
                                    isActive ? "bg-accent-soft text-ink" : "text-ink-soft",
                                )}
                            >
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="line absolute top-0 right-[22%] left-[22%] h-[5px] rounded-b-[4px] border-t-0 border-ink bg-accent"
                                    />
                                )}
                                {item.icon}
                                <span>{item.label}</span>
                                {item.count != null && item.count > 0 && (
                                    <span className="absolute top-1.5 left-[calc(50%+8px)] grid h-5 min-w-5 place-items-center rounded-pill bg-ink px-1.5 text-caption text-surface">
                                        <span className="sr-only">{item.count} open, </span>
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
