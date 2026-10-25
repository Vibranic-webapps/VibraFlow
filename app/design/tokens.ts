/**
 * Documentation data for the /design page. The real values live in app/globals.css (:root).
 * The hex strings here are only *text* shown to Kilian; swatches paint with var(--token), so if
 * a value changes in globals.css the swatch follows and only this label needs updating.
 */

export interface Swatch {
    /** CSS custom property name without the leading dashes, e.g. "surface" */
    token: string;
    hex: string;
    /** Tailwind class to use, e.g. "bg-surface" */
    cls: string;
    note: string;
}

export interface SwatchGroup {
    title: string;
    blurb: string;
    swatches: Swatch[];
}

export const COLOR_GROUPS: SwatchGroup[] = [
    {
        title: "Paper and surfaces",
        blurb: "Solid parchment. Cards sit on paper; wells and done states sit lower.",
        swatches: [
            { token: "paper", hex: "#F1E6CC", cls: "bg-paper", note: "Page" },
            { token: "backdrop", hex: "#E9DFC4", cls: "bg-backdrop", note: "Desktop edges" },
            { token: "surface", hex: "#F8F0DB", cls: "bg-surface", note: "Card" },
            { token: "surface-raised", hex: "#FFF8E4", cls: "bg-surface-raised", note: "Inputs, highlight" },
            { token: "surface-sunk", hex: "#E7D8B2", cls: "bg-surface-sunk", note: "Disabled, done" },
            { token: "surface-edge", hex: "#C9B386", cls: "bg-surface-edge", note: "Hairline (decoration)" },
        ],
    },
    {
        title: "Ink",
        blurb: "Text and the 2px line. Same dark brown as the character outline.",
        swatches: [
            { token: "ink", hex: "#2E2A24", cls: "text-ink", note: "Text, line" },
            { token: "ink-soft", hex: "#5E5444", cls: "text-ink-soft", note: "Secondary text" },
            { token: "ink-faint", hex: "#857A66", cls: "text-ink-faint", note: "Decoration only" },
            { token: "on-accent", hex: "#2E2A24", cls: "text-on-accent", note: "Text on orange" },
        ],
    },
    {
        title: "Accent: harvest orange",
        blurb: "The one UI accent. Text on orange is ink, never white.",
        swatches: [
            { token: "accent", hex: "#E9A03B", cls: "bg-accent", note: "Primary button, active" },
            { token: "accent-soft", hex: "#F6D9A3", cls: "bg-accent-soft", note: "Selected, goal chip" },
            { token: "accent-deep", hex: "#B4690F", cls: "text-accent-deep", note: "Large bold text only" },
        ],
    },
    {
        title: "Status",
        blurb: "Always an icon and words next to the colour, never colour alone.",
        swatches: [
            { token: "ok", hex: "#4E6B3A", cls: "text-ok", note: "Done, saved" },
            { token: "warn", hex: "#B4690F", cls: "text-warn", note: "Large or with icon" },
            { token: "danger", hex: "#9C4429", cls: "text-danger", note: "Error, delete" },
            { token: "water", hex: "#3E5C7A", cls: "ring / text-water", note: "Focus ring, links" },
        ],
    },
    {
        title: "Wood and nature",
        blurb: "Materials for signs, the board and the world art.",
        swatches: [
            { token: "wood", hex: "#7A5A3A", cls: "bg-wood", note: "Sign" },
            { token: "wood-dark", hex: "#4E3922", cls: "bg-wood-dark", note: "Shadow side" },
            { token: "wood-light", hex: "#A67F55", cls: "bg-wood-light", note: "Planks, dashed drop" },
            { token: "forest", hex: "#4E6B3A", cls: "bg-forest", note: "Trees, fields" },
            { token: "forest-soft", hex: "#8FA66F", cls: "bg-forest-soft", note: "Leaves" },
            { token: "brick", hex: "#B65A3C", cls: "bg-brick", note: "Roofs (art only)" },
        ],
    },
    {
        title: "World backdrop",
        blurb: "Calm, low-contrast land and sea behind the board (Phase 2).",
        swatches: [
            { token: "land", hex: "#D3D8A9", cls: "bg-land", note: "Land" },
            { token: "land-2", hex: "#C6CD98", cls: "bg-land-2", note: "Land, mid" },
            { token: "land-3", hex: "#B8C189", cls: "bg-land-3", note: "Land, deep" },
            { token: "trail", hex: "#E8DBB4", cls: "bg-trail", note: "Path" },
            { token: "trail-rim", hex: "#C6B27F", cls: "bg-trail-rim", note: "Path edge" },
            { token: "sea", hex: "#A9C3C4", cls: "bg-sea", note: "Sea" },
            { token: "sea-2", hex: "#96B4B6", cls: "bg-sea-2", note: "Sea, deep" },
            { token: "sand", hex: "#E4D3A0", cls: "bg-sand", note: "Beach" },
        ],
    },
    {
        title: "Folded paper",
        blurb: "The unexplored next chapter at the edge of the world.",
        swatches: [
            { token: "fold-a", hex: "#EEDFB8", cls: "bg-fold-a", note: "Light face" },
            { token: "fold-b", hex: "#DCC99B", cls: "bg-fold-b", note: "Shaded face" },
            { token: "fold-crease", hex: "#B39B66", cls: "bg-fold-crease", note: "Crease" },
            { token: "fold-print", hex: "#F2CF86", cls: "bg-fold-print", note: "Printed sun" },
            { token: "fold-cloud", hex: "#F8F0DB", cls: "bg-fold-cloud", note: "Printed cloud" },
        ],
    },
    {
        title: "Wax stamp (violet)",
        blurb: "The only violet in the app. Reserved for the future wax stamp. Not for UI.",
        swatches: [
            { token: "stamp", hex: "#7A4FD0", cls: "bg-stamp", note: "Seal" },
            { token: "stamp-deep", hex: "#4F2FA0", cls: "bg-stamp-deep", note: "Seal shadow" },
            { token: "stamp-hi", hex: "#A98BEA", cls: "bg-stamp-hi", note: "Seal highlight" },
        ],
    },
];

export interface ContrastRow {
    /** class used for the sample's text */
    text: string;
    /** class used for the sample's background */
    bg: string;
    label: string;
    ratio: number;
    /** Where this pair is used */
    use: string;
}

/** Ratios computed with the WCAG 2.1 relative-luminance formula. AA body text needs 4.5. */
export const CONTRAST_ROWS: ContrastRow[] = [
    { text: "text-ink", bg: "bg-surface", label: "ink on surface", ratio: 12.55, use: "Body text on cards" },
    { text: "text-ink", bg: "bg-paper", label: "ink on paper", ratio: 11.5, use: "Body text on the page" },
    { text: "text-ink", bg: "bg-surface-raised", label: "ink on raised", ratio: 13.44, use: "Input text" },
    { text: "text-ink", bg: "bg-surface-sunk", label: "ink on sunk", ratio: 10.09, use: "Chips, wells" },
    { text: "text-ink", bg: "bg-accent-soft", label: "ink on accent-soft", ratio: 10.44, use: "Selected tab, goal chip" },
    { text: "text-on-accent", bg: "bg-accent", label: "on-accent on accent", ratio: 6.49, use: "Primary button" },
    { text: "text-ink-soft", bg: "bg-surface", label: "ink-soft on surface", ratio: 6.54, use: "Secondary text" },
    { text: "text-ink-soft", bg: "bg-paper", label: "ink-soft on paper", ratio: 5.99, use: "Secondary text on page" },
    { text: "text-ink-soft", bg: "bg-surface-raised", label: "ink-soft on raised", ratio: 7.0, use: "Placeholder" },
    { text: "text-ink-soft", bg: "bg-surface-sunk", label: "ink-soft on sunk", ratio: 5.26, use: "Disabled, done" },
    { text: "text-ink-soft", bg: "bg-accent-soft", label: "ink-soft on accent-soft", ratio: 5.44, use: "Inactive in soft orange" },
    { text: "text-surface-raised", bg: "bg-wood", label: "raised on wood", ratio: 5.91, use: "Sign title" },
    { text: "text-surface", bg: "bg-ink", label: "surface on ink", ratio: 12.55, use: "Count badge, toast" },
    { text: "text-surface-raised", bg: "bg-danger", label: "raised on danger", ratio: 6.05, use: "Danger button" },
    { text: "text-danger", bg: "bg-surface", label: "danger on surface", ratio: 5.65, use: "Error text" },
    { text: "text-danger", bg: "bg-paper", label: "danger on paper", ratio: 5.17, use: "Error text on page" },
    { text: "text-ok", bg: "bg-surface", label: "ok on surface", ratio: 5.3, use: "Success text" },
    { text: "text-ok", bg: "bg-paper", label: "ok on paper", ratio: 4.85, use: "Success text on page" },
    { text: "text-water", bg: "bg-surface", label: "water on surface", ratio: 6.13, use: "Links; focus ring (3:1 needed)" },
];

/** Pairs that must NOT carry normal text. Shown so nobody reaches for them. */
export const CONTRAST_WARNINGS: ContrastRow[] = [
    { text: "text-accent-deep", bg: "bg-surface", label: "accent-deep on surface", ratio: 3.72, use: "Large (24px+) or bold 19px+ only" },
    { text: "text-ink-faint", bg: "bg-surface", label: "ink-faint on surface", ratio: 3.72, use: "Decoration only, never words" },
    { text: "text-ink-soft", bg: "bg-accent", label: "ink-soft on accent", ratio: 3.38, use: "Never. Use on-accent" },
    { text: "text-brick", bg: "bg-surface", label: "brick on surface", ratio: 4.09, use: "Art only. Text uses danger" },
];

export const TYPE_SCALE = [
    { cls: "text-caption", name: "caption", px: 13, use: "Hints, times, chips", font: "Inter" },
    { cls: "text-body", name: "body", px: 16, use: "Everything you read and type (never smaller in inputs)", font: "Inter" },
    { cls: "text-lead", name: "lead", px: 18, use: "Large buttons, intro lines", font: "Inter" },
    { cls: "text-title font-title font-semibold", name: "title", px: 20, use: "Sign headers, card titles", font: "Fredoka 600" },
    { cls: "text-heading font-title font-semibold", name: "heading", px: 24, use: "Sheet titles, empty states", font: "Fredoka 600" },
    { cls: "text-display font-title font-semibold", name: "display", px: 30, use: "Big numbers, level", font: "Fredoka 600" },
    { cls: "text-hero font-title font-semibold", name: "hero", px: 38, use: "Day summary, one short line", font: "Fredoka 600" },
] as const;

export const RADII = [
    { token: "r-card", cls: "rounded-card", px: 14, use: "Cards" },
    { token: "r-sheet", cls: "rounded-t-sheet", px: 22, use: "Sheet top corners" },
    { token: "r-btn", cls: "rounded-btn", px: 12, use: "Buttons" },
    { token: "r-input", cls: "rounded-input", px: 10, use: "Inputs" },
    { token: "r-sign", cls: "rounded-sign", px: 7, use: "Wooden sign" },
    { token: "r-pill", cls: "rounded-pill", px: 999, use: "Chips, badges" },
] as const;

export const LIFTS = [
    { token: "lift", cls: "shadow-lift", use: "Cards (3px)" },
    { token: "lift-sm", cls: "shadow-lift-sm", use: "Buttons, signs (2px)" },
    { token: "lift-down", cls: "shadow-lift-down", use: "Pressed (1px)" },
    { token: "lift-up", cls: "shadow-lift-up", use: "Sheet, upward (3px)" },
] as const;

export const SPACING = [
    { token: "s-1", cls: "p-1 / gap-1", px: 4 },
    { token: "s-2", cls: "p-2 / gap-2", px: 8 },
    { token: "s-3", cls: "p-3 / gap-3", px: 12 },
    { token: "s-4", cls: "p-4 / gap-4", px: 16 },
    { token: "s-5", cls: "p-6 / gap-6", px: 24 },
    { token: "s-6", cls: "p-8 / gap-8", px: 32 },
] as const;
