import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "./cx";
import { CONTROL, Field, errorId, hintId } from "./Field";
import { ChevronDownIcon } from "./icons";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    hint?: string;
    error?: string;
}

/** Native <select> (best picker on a phone) with the cozy look. Pass <option>s as children. */
export function Select({ label, hint, error, id, className, children, ...props }: SelectProps) {
    const auto = useId();
    const selectId = id ?? auto;
    return (
        <Field label={label} id={selectId} hint={hint} error={error}>
            <div className="relative min-w-0">
                <select
                    id={selectId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId(selectId) : hint ? hintId(selectId) : undefined}
                    className={cx(CONTROL, "h-12 appearance-none pr-11", className)}
                    {...props}
                >
                    {children}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink" />
            </div>
        </Field>
    );
}
