import type { ElementType, HTMLAttributes } from "react";
import { cx } from "./cx";

export type CardTone = "default" | "raised" | "sunk" | "accent";

export interface CardProps extends HTMLAttributes<HTMLElement> {
    /** default = parchment, raised = lighter (highlighted / next), sunk = flat done state, accent = soft orange */
    tone?: CardTone;
    /** Element to render, e.g. "li" or "section". */
    as?: ElementType;
    /** Remove the default padding (when the card holds its own layout). */
    flush?: boolean;
}

const TONE: Record<CardTone, string> = {
    default: "bg-surface shadow-lift",
    raised: "bg-surface-raised shadow-lift",
    sunk: "bg-surface-sunk shadow-none", // done / inactive: sits flat in the page
    accent: "bg-accent-soft shadow-lift",
};

/** Solid parchment card with a 2px ink line and an offset lift. No glass, blur or glow. */
export function Card({ tone = "default", as: Tag = "div", flush, className, ...props }: CardProps) {
    return (
        <Tag
            className={cx("line bg-grain min-w-0 rounded-card border-ink", TONE[tone], !flush && "p-4", className)}
            {...props}
        />
    );
}
