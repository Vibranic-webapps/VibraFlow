import type { ElementType, ReactNode } from "react";
import { cx } from "./cx";
import { BackpackIcon, BoardIcon, CalendarIcon } from "./icons";

export type TabId = "board" | "calendar" | "backpack";

export interface TabItem {
    /** Any string: the Board/Calendar/Backpack set uses TabId, Phase 1 uses its own ids. */
    id: string;
    label: string;
    icon: ReactNode;
    /** Link tabs: where the tab goes. Leave out for in-page tabs (the shell passes onSelect instead). */
    href?: string;
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
    active: string;
    items?: TabItem[];
    /** Render tabs with next/link: pass `linkAs={Link}`. Defaults to a plain <a>. */
    linkAs?: ElementType;
    /** In-page tabs (items without href): called with the tapped tab's id. */
    onSelect?: (id: string) => void;
    /** Accessible name of the navigation landmark. */
    label?: string;
    className?: string;
}

/**
 * Bottom tab bar. Presentational: it does not know about routing.
 * Place it at the bottom of the phone column (sticky/fixed is the shell's job).
 * Bottom padding = the iPhone home-bar safe area, so the labels never sit under the home indicator.
 */
export function TabBar({ active, items = COZY_TABS, linkAs, onSelect, label = "Main", className }: TabBarProps) {
    const Link: ElementType = linkAs ?? "a";
    return (
        <nav
            aria-label={label}
            className={cx("line-t bg-grain border-ink bg-surface pb-[env(safe-area-inset-bottom)]", className)}
        >
            <ul className="flex">
                {items.map((item) => {
                    const isActive = item.id === active;
                    const itemClass = cx(
                        "press focus-ring relative flex min-h-15 w-full flex-col items-center justify-center gap-0.5 text-caption font-semibold",
                        "focus-visible:-outline-offset-4",
                        isActive ? "bg-accent-soft text-ink" : "text-ink-soft",
                    );
                    const content = (
                        <>
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
                        </>
                    );
                    return (
                        <li key={item.id} className="min-w-0 flex-1">
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    aria-current={isActive ? "page" : undefined}
                                    className={itemClass}
                                >
                                    {content}
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    aria-current={isActive ? "page" : undefined}
                                    onClick={() => onSelect?.(item.id)}
                                    className={itemClass}
                                >
                                    {content}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
