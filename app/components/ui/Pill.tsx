import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { cx } from "./cx";

export type PillTone = "neutral" | "goal" | "accent" | "ok" | "warn" | "danger";

const TONE: Record<PillTone, string> = {
    neutral: "bg-surface-sunk text-ink",
    goal: "bg-accent-soft text-ink",
    accent: "bg-accent text-on-accent",
    ok: "bg-surface text-ok",
    warn: "bg-surface text-ink", // orange meaning comes from the dot/icon + words, not the text colour
    danger: "bg-surface text-danger",
};

interface PillBase {
    /** Colour is never the only signal: always put words (and ideally an icon) inside. */
    tone?: PillTone;
}

export interface PillProps extends PillBase, HTMLAttributes<HTMLSpanElement> {}

/** Small label (a chip). Static: for status, size, goal. Use PillButton for something you can tap. */
export function Pill({ tone = "neutral", className, ...props }: PillProps) {
    return (
        <span
            className={cx(
                "inline-flex min-h-6 items-center gap-1.5 rounded-pill border-[1.5px] border-solid border-ink px-2.5 text-caption font-semibold whitespace-nowrap",
                TONE[tone],
                className,
            )}
            {...props}
        />
    );
}

export interface PillButtonProps extends PillBase, ButtonHTMLAttributes<HTMLButtonElement> {
    /** For filter chips: whether the chip is on. Exposed as aria-pressed. */
    selected?: boolean;
}

/** Tappable pill (filters). 44px high so a thumb can hit it. */
export function PillButton({ tone = "neutral", selected, type = "button", className, ...props }: PillButtonProps) {
    return (
        <button
            type={type}
            aria-pressed={selected}
            className={cx(
                "line press focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-pill border-ink px-4 text-body font-semibold shadow-lift-sm",
                selected ? "bg-accent text-on-accent" : TONE[tone],
                "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-sunk disabled:text-ink-soft disabled:shadow-none",
                className,
            )}
            {...props}
        />
    );
}
