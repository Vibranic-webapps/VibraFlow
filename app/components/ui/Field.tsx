import type { ReactNode } from "react";
import { cx } from "./cx";
import { AlertIcon } from "./icons";

export interface FieldProps {
    /** Always visible. Never use a placeholder as the label. */
    label: string;
    /** Id of the control (so the label and messages are linked). */
    id: string;
    /** Short help under the control. */
    hint?: string;
    /** Say how to fix it, e.g. "Add a title, like Water the herbs". Shows an icon and words, not just colour. */
    error?: string;
    children: ReactNode;
    className?: string;
}

export function hintId(id: string) {
    return `${id}-hint`;
}
export function errorId(id: string) {
    return `${id}-error`;
}

/** Label + control + hint/error. Used by Input, Textarea and Select. */
export function Field({ label, id, hint, error, children, className }: FieldProps) {
    return (
        <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-body font-semibold text-ink">
                {label}
            </label>
            {children}
            {hint && !error && (
                <p id={hintId(id)} className="text-caption text-ink-soft">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId(id)} role="alert" className="flex items-start gap-1.5 text-caption font-semibold text-danger">
                    <AlertIcon width={16} height={16} className="mt-px" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}

/** Shared control look. 48px high, 16px text (no iOS zoom), full width, min-w-0 (no sideways scroll). */
export const CONTROL =
    "line focus-ring block w-full min-w-0 rounded-input border-ink bg-surface-raised px-3.5 text-body text-ink " +
    "placeholder:text-ink-soft disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-sunk disabled:text-ink-soft " +
    "aria-invalid:border-danger";
