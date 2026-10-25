/**
 * Brand colours that must be plain hex because the web manifest and the <meta theme-color> tag
 * cannot read CSS variables. Keep these in sync with --paper in app/globals.css.
 * This is the ONE place in the app where a raw colour is allowed.
 */
export const BRAND = {
    name: "VibraFlow",
    /** Same value as --paper (page parchment). */
    paper: "#F1E6CC",
} as const;
