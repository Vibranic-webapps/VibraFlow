import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import { CheckIcon } from "./icons";

export interface CheckButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Whether the task is done. Exposed as aria-checked. */
    checked: boolean;
    /** Name for screen readers, e.g. "Water the herbs". */
    label: string;
}

/** The round "finish" button. 48px tap area around a 30px circle. */
export function CheckButton({ checked, label, type = "button", className, ...props }: CheckButtonProps) {
    return (
        <button
            type={type}
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            className={cx("group focus-ring grid size-12 shrink-0 place-items-center rounded-full", className)}
            {...props}
        >
            <span
                className={cx(
                    "line grid size-7.5 place-items-center rounded-full border-ink",
                    "transition-[background-color,transform] duration-(--t-pop) ease-(--ease-pop)",
                    "group-active:scale-90 group-active:bg-accent-soft",
                    checked ? "bg-accent text-on-accent" : "bg-surface-raised text-transparent",
                )}
            >
                <CheckIcon width={18} height={18} strokeWidth={3.4} />
            </span>
        </button>
    );
}
