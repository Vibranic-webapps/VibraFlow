/**
 * Read colours from the design tokens (globals.css) at runtime.
 * Category and column colours are saved in the database as hex, so the preset swatches
 * are the token values converted to hex: change a token and the swatches follow.
 */

/** Which tokens offer themselves as preset colours for categories / todo columns. Edit this list to change the swatches. */
export const PRESET_COLOR_TOKENS = [
    "--accent",
    "--brick",
    "--forest",
    "--water",
    "--wood-light",
    "--forest-soft",
    "--sea-2",
    "--trail-rim",
] as const;

/** Fallback if the CSS variable can't be read (server render, tests). A plain mid orange, not a brand colour. */
const FALLBACK_HEX = "#E9A03B";

export function readTokenHex(name: string): string {
    if (typeof document === "undefined") return FALLBACK_HEX;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : FALLBACK_HEX;
}

/** Preset swatches as hex strings, ready to store in the database. Call on the client only. */
export function presetColors(): string[] {
    return PRESET_COLOR_TOKENS.map(readTokenHex);
}
