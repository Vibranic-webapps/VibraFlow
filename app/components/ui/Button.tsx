import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** primary = harvest orange (one per screen), secondary = parchment, ghost = no outline, danger = destructive */
    variant?: ButtonVariant;
    /** sm = 44px, md = 48px (default), lg = 56px. Never below 44. */
    size?: ButtonSize;
    /** Stretch to the full width of the parent. */
    fullWidth?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
    primary: "bg-accent text-on-accent border-ink shadow-lift-sm",
    secondary: "bg-surface text-ink border-ink shadow-lift-sm",
    ghost: "bg-transparent text-ink border-transparent shadow-none",
    danger: "bg-danger text-surface-raised border-ink shadow-lift-sm",
};

const SIZE: Record<ButtonSize, string> = {
    sm: "min-h-11 px-3.5 text-body",
    md: "min-h-12 px-4.5 text-body",
    lg: "min-h-14 px-6 text-lead",
};

export function Button({
    variant = "secondary",
    size = "md",
    fullWidth,
    type = "button",
    className,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                "line press focus-ring inline-flex min-w-0 items-center justify-center gap-2 rounded-btn font-semibold select-none",
                VARIANT[variant],
                SIZE[size],
                // disabled: flat, dashed, sunk. Wins over every variant.
                "disabled:cursor-not-allowed disabled:border-dashed disabled:border-ink disabled:bg-surface-sunk disabled:text-ink-soft disabled:shadow-none",
                fullWidth && "w-full",
                className,
            )}
            {...props}
        />
    );
}
