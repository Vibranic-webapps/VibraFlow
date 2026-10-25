import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "./cx";
import { CONTROL, Field, errorId, hintId } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string;
}

export function Input({ label, hint, error, id, className, ...props }: InputProps) {
    const auto = useId();
    const inputId = id ?? auto;
    return (
        <Field label={label} id={inputId} hint={hint} error={error}>
            <input
                id={inputId}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId(inputId) : hint ? hintId(inputId) : undefined}
                className={cx(CONTROL, "h-12", className)}
                {...props}
            />
        </Field>
    );
}
