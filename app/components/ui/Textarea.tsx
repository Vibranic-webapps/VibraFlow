import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "./cx";
import { CONTROL, Field, errorId, hintId } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    hint?: string;
    error?: string;
}

export function Textarea({ label, hint, error, id, className, rows = 3, ...props }: TextareaProps) {
    const auto = useId();
    const areaId = id ?? auto;
    return (
        <Field label={label} id={areaId} hint={hint} error={error}>
            <textarea
                id={areaId}
                rows={rows}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId(areaId) : hint ? hintId(areaId) : undefined}
                className={cx(CONTROL, "min-h-24 resize-y py-3", className)}
                {...props}
            />
        </Field>
    );
}
