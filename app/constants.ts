/**
 * Priority levels. `color` is a design-token reference (never a raw hex), so a re-skin only edits globals.css.
 * Priority is shown as a coloured dot PLUS its label, never colour alone.
 */
export const priorityOptions = [
    { value: "EXTRA_SMALL", label: "Very Low",  color: "var(--forest-soft)" },
    { value: "SMALL",       label: "Low",       color: "var(--water)" },
    { value: "MEDIUM",      label: "Medium",    color: "var(--wood-light)" },
    { value: "LARGE",       label: "High",      color: "var(--accent)" },
    { value: "EXTRA_LARGE", label: "Very High", color: "var(--danger)" },
];
