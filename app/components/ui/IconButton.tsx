import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Required: icon-only buttons need a name for screen readers (e.g. "Edit task"). */
    label: string;
    icon: ReactNode;
    variant?: "secondary" | "ghost" | "danger";
}

const VARIANT = {
    secondary: "bg-surface text-ink border-ink shadow-lift-sm",
    ghost: "bg-transparent text-ink border-transparent shadow-none",
    danger: "bg-surface text-danger border-danger shadow-lift-sm",
} as const;

/** 44 x 44 square tap target for edit / delete / close. Always visible, never hover-only. */
export function IconButton({ label, icon, variant = "secondary", type = "button", className, ...props }: IconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={cx(
                "line press focus-ring grid size-11 shrink-0 place-items-center rounded-btn",
                VARIANT[variant],
                "disabled:cursor-not-allowed disabled:border-dashed disabled:border-ink disabled:bg-surface-sunk disabled:text-ink-soft disabled:shadow-none",
                className,
            )}
            {...props}
        >
            {icon}
        </button>
    );
}
