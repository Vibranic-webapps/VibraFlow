"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Task } from "@/app/types";
import { occursOn, isMultiDay, minutesIntoDay, startTimeLabel } from "@/app/lib/tasks";
import { isSameDay, toDateTimeValue } from "@/app/lib/calendar";

const HOUR_PX = 48;
const MIN_EVENT_PX = 44; // keeps every event a comfortable touch target
const SNAP = 15;

// Touch: a finger landing on a task is usually the start of a scroll through the day. A task is only
// picked up after it has been held still this long; moving more than PRESS_SLOP_PX first = a scroll.
const LONG_PRESS_MS = 400;
const PRESS_SLOP_PX = 8;

// The grid always shows the full day (00:00–24:00) so you can scroll anywhere. On opening a day it
// scrolls itself to the first task (minus a little headroom), else to now (today), else to a morning hour.
// (It used to render only the hours around the tasks: that hid early/late hours and, on quiet days,
// made the grid so short that it could not scroll at all.)
const START_HOUR = 0;
const END_HOUR = 24;
const SCROLL_HEADROOM_MIN = 60;
const DEFAULT_SCROLL_HOUR = 7;

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

    const startHour = START_HOUR;
    const endHour = END_HOUR;

    // Earliest timed task start (minutes into the day) among the days on screen, or null.
    const firstTaskMin = useMemo(() => {
        let min = Infinity;
        for (const day of days) {
            for (const t of tasks) {
                if (!t.startDateTime || isMultiDay(t) || !occursOn(t, day)) continue;
                min = Math.min(min, minutesIntoDay(new Date(t.startDateTime)));
            }
        }
        return isFinite(min) ? min : null;
    }, [days, tasks]);

    // Auto-scroll when the shown days change, and once more when tasks first appear for them
    // (they load after the grid). Never on other task edits, so a drag or save does not yank the view.
    const scrollerRef = useRef<HTMLDivElement>(null);
    const autoScrollKeyRef = useRef("");
    const daysKey = days.map(d => d.toDateString()).join("|");
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const key = `${daysKey}|${firstTaskMin !== null}`;
        if (autoScrollKeyRef.current === key) return;
        autoScrollKeyRef.current = key;
        const today = new Date();
        const showsToday = days.some(d => isSameDay(d, today));
        const targetMin = firstTaskMin ?? (showsToday ? minutesIntoDay(today) : DEFAULT_SCROLL_HOUR * 60);
        // The sticky day header sits on top of the scroller, so scrollTop = y lands that time just under it.
        scroller.scrollTop = Math.max(0, ((targetMin - SCROLL_HEADROOM_MIN - startHour * 60) / 60) * HOUR_PX);
    }, [daysKey, firstTaskMin, days, startHour]);

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

    const startDrag = (startY: number, task: Task, edge: DragEdge, origStart: number, origEnd: number) => {
        const originDayIndex = days.findIndex(day => isSameDay(day, new Date(task.startDateTime!)));
        dragRef.current = {
            task, edge, startY, origStart, origEnd, originDayIndex, moved: false,
            curStart: origStart, curEnd: origEnd, curDay: originDayIndex,
        };
        setDraft({ id: task.id, startMin: origStart, endMin: origEnd, dayIndex: originDayIndex });
        // Track on window so the drag continues even as the event relocates between columns.
        window.addEventListener("pointermove", moveDrag);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
    };

    // A touch press that is waiting to become a drag (see LONG_PRESS_MS).
    const pendingRef = useRef<{ timer: number; cleanup: () => void } | null>(null);
    const cancelPending = () => {
        const p = pendingRef.current;
        if (!p) return;
        pendingRef.current = null;
        window.clearTimeout(p.timer);
        p.cleanup();
    };

    // While a task is being dragged by touch, stop the finger from also scrolling the day.
    // Must be a non-passive listener: React's onTouchMove is passive and cannot preventDefault.
    useEffect(() => {
        const blockScroll = (e: TouchEvent) => { if (dragRef.current) e.preventDefault(); };
        window.addEventListener("touchmove", blockScroll, { passive: false });
        return () => {
            window.removeEventListener("touchmove", blockScroll);
            const p = pendingRef.current;
            if (p) { window.clearTimeout(p.timer); p.cleanup(); }
        };
    }, []);

    const onEventPointerDown = (e: React.PointerEvent, task: Task, edge: DragEdge, origStart: number, origEnd: number) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        const { pointerId, clientX: x, clientY: y } = e;

        // Mouse / pen: grab straight away, as before.
        if (e.pointerType !== "touch") {
            e.preventDefault();
            // Capture so move/up keep arriving once the pointer leaves the small handle.
            try { el.setPointerCapture(pointerId); } catch { }
            startDrag(y, task, edge, origStart, origEnd);
            return;
        }

        // Touch: let the browser scroll unless the finger is held still for LONG_PRESS_MS.
        cancelPending();
        const onMove = (ev: PointerEvent) => {
            if (ev.pointerId === pointerId && Math.hypot(ev.clientX - x, ev.clientY - y) > PRESS_SLOP_PX) cancelPending();
        };
        const onUp = (ev: PointerEvent) => {
            if (ev.pointerId !== pointerId) return;
            cancelPending();
            onEditTask(task); // a quick tap opens the task
        };
        const onCancel = (ev: PointerEvent) => { if (ev.pointerId === pointerId) cancelPending(); };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        const timer = window.setTimeout(() => {
            cancelPending();
            try { el.setPointerCapture(pointerId); } catch { }
            startDrag(y, task, edge, origStart, origEnd);
        }, LONG_PRESS_MS);
        pendingRef.current = {
            timer,
            cleanup: () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onCancel);
            },
        };
    };

    return (
        // The parent gives this a bounded height; this is the ONE vertical scroller of the view.
        <div className="line flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-surface">
            <div ref={scrollerRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none">
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
                                    const handle = "absolute inset-x-0 h-2 cursor-ns-resize touch-pan-y z-10";

                                    return (
                                        <div key={t.id}
                                            style={{ top, height, background: `color-mix(in srgb, ${color} 28%, var(--surface))`, borderLeft: `4px solid ${color}` }}
                                            // select-none + no callout: a long press picks the task up instead of selecting text / opening the iOS menu
                                            onContextMenu={(e) => e.preventDefault()}
                                            className={`absolute right-0.5 left-0.5 overflow-hidden rounded-input select-none [-webkit-touch-callout:none] ${live ? "z-20 ring-2 ring-accent shadow-lift" : ""}`}>
                                            <div className={`${handle} top-0`}
                                                onPointerDown={(e) => onEventPointerDown(e, t, "top", baseStart, baseEnd)} />

                                            <div
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`${t.name}, ${startTimeLabel(t)}`}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(t); } }}
                                                onPointerDown={(e) => onEventPointerDown(e, t, "move", baseStart, baseEnd)}
                                                className={`focus-ring h-full w-full cursor-grab touch-pan-y px-1 py-0.5 text-left text-caption active:cursor-grabbing ${t.completed ? "text-ink-soft line-through" : "text-ink"}`}>
                                                <span className="block truncate font-semibold">{t.name}</span>
                                                <span className="block truncate text-ink-soft tabular-nums">{startTimeLabel(t)}</span>
                                            </div>

                                            <div className={`${handle} bottom-0`}
                                                onPointerDown={(e) => onEventPointerDown(e, t, "bottom", baseStart, baseEnd)} />
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
