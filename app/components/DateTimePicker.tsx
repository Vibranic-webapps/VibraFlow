"use client";
import { useState } from "react";
import Calendar from "./Calendar";
import WheelColumn from "./WheelColumn";
import { Button } from "@/app/components/ui/Button";
import { CalendarIcon, ChevronLeftIcon, ClockIcon } from "@/app/components/ui/icons";
import { parseValue, toDateValue, toDateTimeValue, isSameDay } from "@/app/lib/calendar";

interface DateTimePickerProps {
    mode: "date" | "datetime";
    value: string;
    min?: Date | null;
    showBack?: boolean;
    onCancel: () => void;
    onConfirm: (value: string) => void;
    onClear?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function DateTimePicker({ mode, value, min, showBack = true, onCancel, onConfirm, onClear }: DateTimePickerProps) {
    const [draft, setDraft] = useState<Date | null>(parseValue(value));

    const minMinute = mode === "datetime" && min
        ? new Date(min.getFullYear(), min.getMonth(), min.getDate(), min.getHours(), min.getMinutes())
        : null;

    const clamp = (d: Date) => (minMinute && d.getTime() < minMinute.getTime() ? new Date(minMinute) : d);

    const onMinDay = !!(minMinute && draft && isSameDay(draft, minMinute));
    const hourDisabled = (h: number) => onMinDay && h < minMinute!.getHours();
    const minuteDisabled = (m: number) =>
        onMinDay && draft!.getHours() === minMinute!.getHours() && m < minMinute!.getMinutes();

    const handleDay = (day: Date) => {
        const base = draft ?? new Date();
        setDraft(clamp(new Date(
            day.getFullYear(), day.getMonth(), day.getDate(),
            mode === "datetime" ? base.getHours() : 0,
            mode === "datetime" ? base.getMinutes() : 0,
        )));
    };

    const setTime = (hours: number, minutes: number) => {
        const base = draft ?? new Date();
        setDraft(clamp(new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes)));
    };

    const confirm = () => {
        if (!draft) return;
        onConfirm(mode === "datetime" ? toDateTimeValue(draft) : toDateValue(draft));
    };

    const preview = draft
        ? (mode === "datetime"
            ? draft.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : draft.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }))
        : (mode === "datetime" ? "Pick a date & time" : "Pick a date");

    return (
        <div className="flex w-full min-w-0 flex-col gap-4">
            {showBack && (
                <Button variant="ghost" size="sm" onClick={onCancel} className="self-start">
                    <ChevronLeftIcon /> Back
                </Button>
            )}

            {/* what you have picked so far, in words */}
            <div className="line flex items-center gap-2 rounded-input border-ink bg-surface-raised px-3.5 py-2.5" aria-live="polite">
                {mode === "datetime" ? <ClockIcon className="text-ink" /> : <CalendarIcon className="text-ink" />}
                <span className={`min-w-0 text-body font-semibold ${draft ? "text-ink" : "text-ink-soft"}`}>{preview}</span>
            </div>

            <Calendar selected={draft} onSelect={handleDay} min={min} />

            {mode === "datetime" && (
                <div className="flex flex-col gap-1">
                    <h3 className="font-title flex items-center gap-1.5 text-lead font-semibold text-ink">
                        <ClockIcon width={18} height={18} /> Time
                    </h3>
                    <div className="flex items-start justify-center gap-3">
                        <WheelColumn ariaLabel="Hours" label="Hour" values={HOURS}
                            value={draft ? draft.getHours() : 0}
                            isDisabled={hourDisabled}
                            onChange={(h) => setTime(h, draft ? draft.getMinutes() : 0)} />
                        <span aria-hidden="true" className="mt-9 text-title font-bold text-ink">:</span>
                        <WheelColumn ariaLabel="Minutes" label="Min" values={MINUTES}
                            value={draft ? draft.getMinutes() : 0}
                            isDisabled={minuteDisabled}
                            onChange={(m) => setTime(draft ? draft.getHours() : 0, m)} />
                    </div>
                </div>
            )}

            <div className="line-t sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap gap-2 border-ink bg-surface px-4 pt-3 pb-4">
                {onClear && value && (
                    <Button variant="ghost" onClick={onClear} className="text-danger">Clear</Button>
                )}
                <Button onClick={onCancel} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={confirm} disabled={!draft} className="flex-1">Confirm</Button>
            </div>
        </div>
    );
}
