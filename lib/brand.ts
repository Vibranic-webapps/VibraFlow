/**
 * Brand colours that must be plain hex because the web manifest and the <meta theme-color> tag
 * cannot read CSS variables. Keep these in sync with --paper in app/globals.css.
 * This is the ONE place in the app where a raw colour is allowed.
 */
export const BRAND = {
    name: "VibraFlow",
    /** Same value as --paper (page parchment). */
    paper: "#F1E6CC",
    /**
     * What --paper looks like once the bg-grain texture sits on top (measured on an iPhone screenshot).
     * Used as the status-bar colour: iOS paints that strip flat, so a plain --paper strip showed a hard
     * edge against the grainy page. Re-measure if --grain or --paper changes.
     */
    paperGrain: "#E4D8BD",
} as const;
