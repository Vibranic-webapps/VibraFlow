"use client";
import { useMemo, useRef, useState } from "react";
import { Task } from "@/app/types";
import { occursOn, isMultiDay, minutesIntoDay, startTimeLabel } from "@/app/lib/tasks";
import { isSameDay, toDateTimeValue } from "@/app/lib/calendar";

const HOUR_PX = 48;
const MIN_EVENT_PX = 44; // keeps every event a comfortable touch target
const SNAP = 15;

// Dynamic hour window: render only the hours around the day's tasks so the grid
// fits the screen instead of forcing a full 24h scroll.
const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 22;
const WINDOW_PAD_HOURS = 1;
const MIN_WINDOW_HOURS = 6;

interface TimeGridViewProps {
    days: Date[];
    tasks: Task[];
    onEditTask: (t: Task) => void;
    onUpdateTask: (t: Task, updates: Partial<Task>) => void;
    /** Fired when an empty part of a day column is clicked, with a 1h slot at the clicked time. */
    onCreateAt: (startDateTime: string, endDateTime: string) => void;
}

const hourLabel = (h: number) => {
    if (h === 0) return "";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${h < 12 ? "AM" : "PM"}`;
};

const clampMin = (m: number) => Math.max(0, Math.min(24 * 60, m));

const withMinutes = (base: Date, minutes: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes / 60), minutes % 60);

type DragEdge = "top" | "bottom" | "move";
interface DragState {
    task: Task; edge: DragEdge; startY: number;
    origStart: number; origEnd: number; originDayIndex: number;
    moved: boolean;
    // Live values, kept on the ref so the drag survives the event relocating between columns.
    curStart: number; curEnd: number; curDay: number;
}

export default function TimeGridView({ days, tasks, onEditTask, onUpdateTask, onCreateAt }: TimeGridViewProps) {
    const now = new Date();
    const cols = `repeat(${days.length}, minmax(0, 1fr))`; // always fits the width: no sideways scroll

    // Derive the visible hour window from the tasks currently on screen.
    const [startHour, endHour] = useMemo(() => {
        let min = Infinity, max = -Infinity;
        for (const day of days) {
            for (const t of tasks) {
                if (!t.startDateTime || isMultiDay(t) || !occursOn(t, day)) continue;
                const s = new Date(t.startDateTime);
                const e = t.endDateTime ? new Date(t.endDateTime) : s;
                min = Math.min(min, minutesIntoDay(s));
                max = Math.max(max, isSameDay(e, s) ? minutesIntoDay(e) : 24 * 60);
            }
        }
        if (!isFinite(min)) return [DEFAULT_START_HOUR, DEFAULT_END_HOUR];
        let startH = Math.max(0, Math.floor(min / 60) - WINDOW_PAD_HOURS);
        let endH = Math.min(24, Math.ceil(max / 60) + WINDOW_PAD_HOURS);
        if (endH - startH < MIN_WINDOW_HOURS) {
            endH = Math.min(24, startH + MIN_WINDOW_HOURS);
            startH = Math.max(0, endH - MIN_WINDOW_HOURS);
        }
        return [startH, endH];
    }, [days, tasks]);

    const visibleHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    const winStartMin = startHour * 60;
    const winEndMin = endHour * 60;
    const gridHeight = (endHour - startHour) * HOUR_PX;
    const yFromMin = (min: number) => ((min - winStartMin) / 60) * HOUR_PX;

    const dragRef = useRef<DragState | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    // Swallow the click the browser fires right after a drag ends, so releasing a
    // drag over empty space doesn't also create a task.
    const suppressClickRef = useRef(false);
    const [draft, setDraft] = useState<{ id: string; startMin: number; endMin: number; dayIndex?: number } | null>(null);

    const timedForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && !isMultiDay(t) && t.startDateTime);
    const allDayForDay = (day: Date) =>
        tasks.filter(t => occursOn(t, day) && isMultiDay(t));

    const moveDrag = (e: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const deltaMin = Math.round(((e.clientY - d.startY) / HOUR_PX) * 60 / SNAP) * SNAP;
        if (deltaMin !== 0) d.moved = true;
        let startMin = d.origStart;
        let endMin = d.origEnd;
        if (d.edge === "top") startMin = clampMin(Math.min(d.origStart + deltaMin, d.origEnd - SNAP));
        else if (d.edge === "bottom") endMin = clampMin(Math.max(d.origEnd + deltaMin, d.origStart + SNAP));
        else {
            // Move the whole event (time), preserving its duration.
            const dur = d.origEnd - d.origStart;
            startMin = Math.max(0, Math.min(d.origStart + deltaMin, 24 * 60 - dur));
            endMin = startMin + dur;
        }

        // For a move drag, map the pointer's X to a day column (cross-day move).
        let dayIndex = d.originDayIndex;
        if (d.edge === "move") {
            const grid = gridRef.current;
            if (grid) {
                const r = grid.getBoundingClientRect();
                const col = Math.floor(((e.clientX - r.left) / r.width) * days.length);
                dayIndex = Math.max(0, Math.min(col, days.length - 1));
            }
            if (dayIndex !== d.originDayIndex) d.moved = true;
        }
        d.curStart = startMin; d.curEnd = endMin; d.curDay = dayIndex;
        setDraft({ id: d.task.id, startMin, endMin, dayIndex });
    };

    const endDrag = () => {
        const d = dragRef.current;
        dragRef.current = null;
        setDraft(null);
        window.removeEventListener("pointermove", moveDrag);
        window.removeEventListener("pointerup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
        if (!d) return;
        suppressClickRef.current = true;
        setTimeout(() => { suppressClickRef.current = false; }, 0);
        // A "move" grab that never moved is really a click → open the task.
        if (d.edge === "move" && !d.moved) { onEditTask(d.task); return; }

        const unchanged = d.curDay === d.originDayIndex && d.curStart === d.origStart && d.curEnd === d.origEnd;
        if (unchanged) return;

        // Rebuild start/end on the target day (handles both time and cross-day moves).
        const targetDay = days[d.curDay] ?? new Date(d.task.startDateTime!);
        onUpdateTask(d.task, {
            startDateTime: toDateTimeValue(withMinutes(targetDay, d.curStart)),
            endDateTime: toDateTimeValue(withMinutes(targetDay, d.curEnd)),
        });
    };

    const beginDrag = (e: React.PointerEvent, task: Task, edge: DragEdge, origStart: number, origEnd: number) => {
        e.stopPropagation();
        e.preventDefault();
        // Capture the pointer so touch drags keep delivering move/up events even
        // once the finger leaves the tiny handle — without this the browser can
        // hijack the gesture as a scroll and the drag dies on mobile.
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { }
        const originDayIndex = days.findIndex(day => isSameDay(day, new Date(task.startDateTime!)));
        dragRef.current = {
            task, edge, startY: e.clientY, origStart, origEnd, originDayIndex, moved: false,
            curStart: origStart, curEnd: origEnd, curDay: originDayIndex,
        };
        setDraft({ id: task.id, startMin: origStart, endMin: origEnd, dayIndex: originDayIndex });
        // Track on window so the drag continues even as the event relocates between columns.
        window.addEventListener("pointermove", moveDrag);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    };

    return (
        // The parent gives this a bounded height; this is the ONE vertical scroller of the view.
        <div className="line flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-surface">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none">
                <div className="sticky top-0 z-30 bg-surface">
                    <div className="line-b flex">
                        <div className="w-12 shrink-0" />
                        <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: cols }}>
                            {days.map((d, i) => {
                                const today = isSameDay(d, now);
                                return (
                                    <div key={i} className={`border-l border-surface-edge px-1 py-1.5 text-center ${today ? "bg-accent-soft" : ""}`}>
                                        <div className="text-caption font-semibold text-ink-soft uppercase">
                                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                                        </div>
                                        <div className={`font-title text-lead font-semibold ${today ? "text-accent-deep" : "text-ink"}`}>
                                            {d.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="line-b flex bg-surface-sunk">
                        <div className="grid w-12 shrink-0 place-items-center text-caption text-ink-soft">all-day</div>
                        <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: cols }}>
                            {days.map((d, i) => (
                                <div key={i} className="flex min-h-11 min-w-0 flex-col gap-1 border-l border-surface-edge p-1">
                                    {allDayForDay(d).map(t => {
                                        const color = t.category?.color ?? "var(--accent)";
                                        return (
                                            <button key={t.id} type="button" onClick={() => onEditTask(t)}
                                                aria-label={t.name}
                                                style={{ background: `color-mix(in srgb, ${color} 28%, var(--surface))`, borderLeft: `4px solid ${color}` }}
                                                className={`press focus-ring min-h-11 truncate rounded-input px-1.5 text-left text-caption font-semibold ${t.completed ? "text-ink-soft line-through" : "text-ink"}`}>
                                                {t.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-12 shrink-0">
                        {visibleHours.map(h => (
                            <div key={h} style={{ height: HOUR_PX }} className="relative">
                                <span className="absolute -top-2 right-1 text-caption whitespace-nowrap text-ink-soft">{hourLabel(h)}</span>
                            </div>
                        ))}
                    </div>

                    <div ref={gridRef} className="relative grid min-w-0 flex-1" style={{ gridTemplateColumns: cols, height: gridHeight }}>
                        {visibleHours.map(h => (
                            <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-surface-edge"
                                style={{ top: (h - startHour) * HOUR_PX }} />
                        ))}

                        {days.some(d => isSameDay(d, now)) && minutesIntoDay(now) >= winStartMin && minutesIntoDay(now) <= winEndMin && (
                            <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-danger"
                                style={{ top: yFromMin(minutesIntoDay(now)) }} />
                        )}

                        {days.map((day, ci) => {
                            // While move-dragging, show the event in the hovered column.
                            const dragTask = draft?.dayIndex != null ? tasks.find(x => x.id === draft.id) ?? null : null;
                            let items = timedForDay(day);
                            if (dragTask) {
                                items = items.filter(t => t.id !== dragTask.id);
                                if (ci === draft!.dayIndex) items = [...items, dragTask];
                            }
                            return (
                            <div key={ci} className={`relative min-w-0 border-l border-surface-edge ${isSameDay(day, now) ? "bg-accent-soft/40" : ""}`}
                                onClick={(e) => {
                                    // Only fire on the empty background — not on events or drag handles.
                                    if (suppressClickRef.current) return;
                                    if (e.target !== e.currentTarget) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const rawMin = ((e.clientY - rect.top) / HOUR_PX) * 60 + winStartMin;
                                    let startMin = clampMin(Math.round(rawMin / SNAP) * SNAP);
                                    if (startMin > 24 * 60 - 60) startMin = 24 * 60 - 60;
                                    onCreateAt(
                                        toDateTimeValue(withMinutes(day, startMin)),
                                        toDateTimeValue(withMinutes(day, startMin + 60)),
                                    );
                                }}>
                                {items.map(t => {
                                    const start = new Date(t.startDateTime!);
                                    const end = t.endDateTime ? new Date(t.endDateTime) : start;
                                    const baseStart = minutesIntoDay(start);
                                    const baseEnd = isSameDay(end, start) ? minutesIntoDay(end) : 24 * 60;

                                    const live = draft?.id === t.id ? draft : null;
                                    const startMin = live ? live.startMin : baseStart;
                                    const endMin = live ? live.endMin : baseEnd;

                                    // Clamp the event to the visible hour window.
                                    const vis0 = Math.max(startMin, winStartMin);
                                    const vis1 = Math.min(endMin, winEndMin);
                                    const top = yFromMin(vis0);
                                    const height = Math.max(MIN_EVENT_PX, ((vis1 - vis0) / 60) * HOUR_PX);
                                    const color = t.category?.color ?? "var(--accent)";
                                    // Resize handles are thin drag strips; the body of the event is the big tap target.
                                    const handle = "absolute inset-x-0 h-2 cursor-ns-resize touch-none z-10";

                                    return (
                                        <div key={t.id}
                                            style={{ top, height, background: `color-mix(in srgb, ${color} 28%, var(--surface))`, borderLeft: `4px solid ${color}` }}
                                            className={`absolute right-0.5 left-0.5 overflow-hidden rounded-input ${live ? "ring-2 ring-accent" : ""}`}>
                                            <div className={`${handle} top-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "top", baseStart, baseEnd)} />

                                            <div
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`${t.name}, ${startTimeLabel(t)}`}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(t); } }}
                                                onPointerDown={(e) => beginDrag(e, t, "move", baseStart, baseEnd)}
                                                className={`focus-ring h-full w-full cursor-grab touch-none px-1 py-0.5 text-left text-caption active:cursor-grabbing ${t.completed ? "text-ink-soft line-through" : "text-ink"}`}>
                                                <span className="block truncate font-semibold">{t.name}</span>
                                                <span className="block truncate text-ink-soft tabular-nums">{startTimeLabel(t)}</span>
                                            </div>

                                            <div className={`${handle} bottom-0`}
                                                onPointerDown={(e) => beginDrag(e, t, "bottom", baseStart, baseEnd)} />
                                        </div>
                                    );
                                })}
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
