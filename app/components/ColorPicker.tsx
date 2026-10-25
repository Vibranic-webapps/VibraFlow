"use client";
import { useRef, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { CheckIcon } from "@/app/components/ui/icons";
import { CONTROL } from "@/app/components/ui/Field";
import { presetColors } from "@/app/lib/tokens";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function hexToHsv(hex: string) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    if ([r, g, b].some(Number.isNaN)) return { h: 0, s: 0, v: 0.5 };
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let hue = 0;
    if (d) {
        if (max === r) hue = ((g - b) / d) % 6;
        else if (max === g) hue = (b - r) / d + 2;
        else hue = (r - g) / d + 4;
        hue *= 60;
        if (hue < 0) hue += 360;
    }
    return { h: hue, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

// Hue strip drawn with hsl() steps, so there are no raw hex colours in the UI code.
const HUE_STRIP = "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))";

interface ColorPickerProps {
    value: string;
    onChange: (hex: string) => void;
}

/**
 * Colour choice for a category: preset swatches (read from the design tokens) first,
 * with an optional "Custom colour" area for anything else. The result is saved as hex.
 */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [presets] = useState(presetColors);
    const [showCustom, setShowCustom] = useState(false);
    const [hsv, setHsv] = useState(() => hexToHsv(value));
    const svRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<null | "sv" | "hue">(null);

    const emit = (next: { h: number; s: number; v: number }) => {
        setHsv(next);
        onChange(hsvToHex(next.h, next.s, next.v));
    };

    const handleSv = (clientX: number, clientY: number) => {
        const r = svRef.current!.getBoundingClientRect();
        emit({ ...hsv, s: clamp01((clientX - r.left) / r.width), v: 1 - clamp01((clientY - r.top) / r.height) });
    };
    const handleHue = (clientX: number) => {
        const r = hueRef.current!.getBoundingClientRect();
        emit({ ...hsv, h: clamp01((clientX - r.left) / r.width) * 360 });
    };

    const onMove = (e: React.PointerEvent) => {
        if (dragging.current === "sv") handleSv(e.clientX, e.clientY);
        else if (dragging.current === "hue") handleHue(e.clientX);
    };
    const endDrag = () => { dragging.current = null; };

    const hueColor = hsvToHex(hsv.h, 1, 1);
    const current = hsvToHex(hsv.h, hsv.s, hsv.v);

    return (
        <div className="flex flex-col gap-3">
            <div role="radiogroup" aria-label="Colour" className="grid grid-cols-4 gap-2">
                {presets.map((hex) => {
                    const on = value.toUpperCase() === hex;
                    return (
                        <button
                            key={hex}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={hex}
                            onClick={() => { setHsv(hexToHsv(hex)); onChange(hex); }}
                            style={{ background: hex }}
                            className="line press focus-ring grid h-11 min-w-0 place-items-center rounded-input border-ink text-ink shadow-lift-sm"
                        >
                            {on && <CheckIcon strokeWidth={3.4} />}
                        </button>
                    );
                })}
            </div>

            <Button variant="ghost" size="sm" aria-expanded={showCustom} onClick={() => setShowCustom(o => !o)} className="self-start">
                {showCustom ? "Hide custom colour" : "Custom colour"}
            </Button>

            {showCustom && (
                <div className="flex flex-col gap-3">
                    <div ref={svRef} className="line relative h-40 w-full cursor-crosshair touch-none rounded-input border-ink"
                        style={{ background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, ${hueColor})` }}
                        onPointerDown={(e) => { dragging.current = "sv"; e.currentTarget.setPointerCapture(e.pointerId); handleSv(e.clientX, e.clientY); }}
                        onPointerMove={onMove} onPointerUp={endDrag}>
                        <span className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink shadow-lift-sm"
                            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current }} />
                    </div>

                    {/* tall touch area around a slim visible strip */}
                    <div ref={hueRef} className="relative flex h-11 w-full cursor-pointer touch-none items-center"
                        onPointerDown={(e) => { dragging.current = "hue"; e.currentTarget.setPointerCapture(e.pointerId); handleHue(e.clientX); }}
                        onPointerMove={onMove} onPointerUp={endDrag}>
                        <span aria-hidden="true" className="line block h-4 w-full rounded-pill border-ink" style={{ background: HUE_STRIP }} />
                        <span className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink shadow-lift-sm"
                            style={{ left: `${(hsv.h / 360) * 100}%`, background: hueColor }} />
                    </div>

                    <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="line size-12 shrink-0 rounded-input border-ink" style={{ background: current }} />
                        <input
                            aria-label="Colour as hex"
                            value={current}
                            onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{6}$/.test(v)) emit(hexToHsv(v)); else onChange(v); }}
                            className={`${CONTROL} h-12 w-32 tabular-nums`} />
                    </div>
                </div>
            )}
        </div>
    );
}
