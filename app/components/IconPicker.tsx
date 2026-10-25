"use client";
import { useState } from "react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { CONTROL } from "@/app/components/ui/Field";
import { SearchIcon } from "@/app/components/ui/icons";

const ALL_ICONS = iconNames as IconName[];
// Only show a screenful: a long grid would add a second scroll area inside the sheet. Search narrows it.
const LIMIT = 24;

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [query, setQuery] = useState("");
    const q = query.trim().toLowerCase();
    const matches = q ? ALL_ICONS.filter(n => n.includes(q)) : ALL_ICONS;
    const shown = matches.slice(0, LIMIT);

    return (
        <div className="flex flex-col gap-2">
            <div className="relative">
                <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" />
                <input
                    type="search"
                    aria-label="Search icons"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search icons, e.g. home"
                    className={`${CONTROL} h-12 pl-11`}
                />
            </div>

            <div className="grid grid-cols-6 gap-1.5">
                {shown.map(icon => (
                    <button key={icon} type="button" onClick={() => onChange(icon)} aria-label={icon} aria-pressed={value === icon}
                        className={`line press focus-ring grid h-12 min-w-0 place-items-center rounded-input border-ink text-ink ${
                            value === icon ? "bg-accent shadow-lift-sm" : "bg-surface-raised"
                        }`}>
                        <DynamicIcon name={icon} size={20} strokeWidth={2.4} />
                    </button>
                ))}
                {shown.length === 0 && <p className="col-span-6 py-2 text-body text-ink-soft">No icons found. Try another word.</p>}
            </div>

            {matches.length > LIMIT && (
                <p className="text-caption text-ink-soft">Showing {LIMIT} of {matches.length}. Search to find more.</p>
            )}
        </div>
    );
}
