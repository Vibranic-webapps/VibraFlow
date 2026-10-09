import type { InputHTMLAttributes, Ref } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    inputRef?: Ref<HTMLInputElement>;
};

// Labelled input styled like the fields in AuthForm.
export default function AuthField({ label, hint, inputRef, ...inputProps }: AuthFieldProps) {
    return (
        <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-white/70">{label}</span>
            <input
                ref={inputRef}
                {...inputProps}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-(--vibranic) transition-colors disabled:opacity-50"
            />
            {hint && <span className="text-white/40 text-xs">{hint}</span>}
        </label>
    );
}
