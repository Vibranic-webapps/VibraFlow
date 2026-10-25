/** Join class names, skipping falsy values. Tiny on purpose (no clsx dependency). */
export function cx(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(" ");
}
