import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface SignProps extends HTMLAttributes<HTMLHeadingElement> {
    /** Heading level to render. Pick the right one for the page outline. */
    as?: "h1" | "h2" | "h3";
    /** Optional control at the right edge (e.g. an IconButton). Keep it >= 44px. */
    trailing?: ReactNode;
}

/** Wooden sign: the header of a screen or a section. Parchment text on wood (5.9:1). */
export function Sign({ as: Heading = "h2", trailing, className, children, ...props }: SignProps) {
    return (
        <div
            className={cx(
                "line bg-grain flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-sign border-ink bg-wood px-3.5 py-2 shadow-lift-sm",
                className,
            )}
        >
            <Heading className="font-title min-w-0 text-title font-semibold text-surface-raised wrap-break-word" {...props}>
                {children}
            </Heading>
            {trailing}
        </div>
    );
}
