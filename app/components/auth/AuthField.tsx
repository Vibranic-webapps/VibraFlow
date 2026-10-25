import { useId } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { Field, CONTROL, hintId } from "@/app/components/ui/Field";
import { cx } from "@/app/components/ui/cx";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    inputRef?: Ref<HTMLInputElement>;
};

// Labelled input for the auth screens: 48px high, 16px text (no iOS zoom), full width.
export default function AuthField({ label, hint, inputRef, className, ...inputProps }: AuthFieldProps) {
    const id = useId();
    return (
        <Field label={label} id={id} hint={hint}>
            <input
                id={id}
                ref={inputRef}
                aria-describedby={hint ? hintId(id) : undefined}
                {...inputProps}
                className={cx(CONTROL, "h-12", className)}
            />
        </Field>
    );
}
