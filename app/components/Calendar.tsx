"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/ui/icons";
import { useCalendarGrid } from "@/app/hooks/useCalendarGrid";
import { WEEKDAYS, isSameDay, isDisabled, addDays, toDateValue } from "@/app/lib/calendar";

interface CalendarProps {
    selected: Date | null;
    onSelect: (date: Date) => void;
    min?: Date | null;
    max?: Date | null;
}

export default function Calendar({ selected, onSelect, min, max }: CalendarProps) {
    const { viewDate, setViewDate, year, month, cells, goToPrevMonth, goToNextMonth, goToToday } =
        useCalendarGrid(selected ?? new Date());

    const today = new Date();

    const [focusedDate, setFocusedDate] = useState<Date>(selected ?? today);
    const gridRef = useRef<HTMLDivElement>(null);
    const shouldFocus = useRef(false);

    useEffect(() => {
        if (!shouldFocus.current) return;
        shouldFocus.current = false;
        gridRef.current
            ?.querySelector<HTMLButtonElement>(`[data-day="${toDateValue(focusedDate)}"]`)
            ?.focus();
    }, [focusedDate]);

    const moveFocus = (next: Date) => {
        shouldFocus.current = true;
        setFocusedDate(next);
        if (next.getFullYear() !== year || next.getMonth() !== month) {
            setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const weekdayIndex = (focusedDate.getDay() + 6) % 7;
        switch (e.key) {
            case "ArrowLeft":  moveFocus(addDays(focusedDate, -1)); break;
            case "ArrowRight": moveFocus(addDays(focusedDate, 1)); break;
            case "ArrowUp":    moveFocus(addDays(focusedDate, -7)); break;
            case "ArrowDown":  moveFocus(addDays(focusedDate, 7)); break;
            case "Home":       moveFocus(addDays(focusedDate, -weekdayIndex)); break;
            case "End":        moveFocus(addDays(focusedDate, 6 - weekdayIndex)); break;
            case "PageUp":     moveFocus(new Date(year, month - 1, focusedDate.getDate())); break;
            case "PageDown":   moveFocus(new Date(year, month + 1, focusedDate.getDate())); break;
            default: return;
        }
        e.preventDefault();
    };

    return (
        <div className="w-full min-w-0">
            <header className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-baseline gap-2">
                    <span className="font-title text-title font-semibold text-ink">
                        {viewDate.toLocaleString("en-US", { month: "long" })}
                    </span>
                    <span className="text-body text-ink-soft">{year}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <IconButton label="Previous month" icon={<ChevronLeftIcon />} onClick={goToPrevMonth} />
                    <Button size="sm" onClick={goToToday}>Today</Button>
                    <IconButton label="Next month" icon={<ChevronRightIcon />} onClick={goToNextMonth} />
                </div>
            </header>

            <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-caption font-semibold text-ink-soft">
                        {d}
                    </div>
                ))}
            </div>

            <div ref={gridRef} role="grid" onKeyDown={onKeyDown} className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                    const { date, inCurrentMonth } = cell;

                    const disabled = isDisabled(date, min, max);
                    const isSelected = selected ? isSameDay(date, selected) : false;
                    const isToday = isSameDay(date, today);
                    const isFocusTarget = isSameDay(date, focusedDate);

                    return (
                        <button
                            type="button"
                            key={i}
                            role="gridcell"
                            data-day={toDateValue(date)}
                            aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                            aria-selected={isSelected}
                            aria-disabled={disabled}
                            tabIndex={isFocusTarget ? 0 : -1}
                            onClick={() => { if (!disabled) onSelect(date); }}
                            className={`press focus-ring grid h-11 min-w-0 place-items-center rounded-input text-body font-semibold ${
                                disabled
                                    ? "cursor-not-allowed text-ink-soft line-through opacity-50"
                                    : isSelected
                                        ? "line border-ink bg-accent text-on-accent shadow-lift-sm"
                                        : isToday
                                            ? "line border-ink bg-surface-raised text-ink"
                                            : "text-ink"
                            } ${!inCurrentMonth && !isSelected ? "opacity-50" : ""}`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
