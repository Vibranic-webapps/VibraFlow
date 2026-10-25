"use client";
import { useRef, useState } from "react";
import { Task, Category } from "@/app/types";
import { useCalendarGrid } from "@/app/hooks/useCalendarGrid";
import { WEEKDAYS, isSameDay, addDays } from "@/app/lib/calendar";
import { startTimeLabel, occursOn, weekStart } from "@/app/lib/tasks";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import TaskDrawer, { type TaskDrawerHandle } from "./TaskDrawer";
import TimeGridView from "./TimeGridView";
import TaskDetailCard from "./tasks/TaskDetailCard";
import { CategoryBadge } from "./tasks/CategoryBadge";
import { TaskDue } from "./tasks/TaskDue";
import { Sheet } from "@/app/components/ui/Sheet";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { PillButton } from "@/app/components/ui/Pill";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, FilterIcon } from "@/app/components/ui/icons";
import { cx } from "@/app/components/ui/cx";

interface CalendarViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

type ViewMode = "month" | "week" | "3day" | "day";

const VIEW_TABS: ReadonlyArray<readonly [ViewMode, string]> = [
    ["month", "Month"], ["week", "Week"], ["3day", "3 days"], ["day", "Day"],
];

/** Dots shown in a month cell before it collapses to "+N". */
const MAX_DOTS = 3;
const UNCATEGORIZED_COLOR = "var(--ink-faint)";

const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function CalendarView({ tasks, setTasks, categories, setCategories }: CalendarViewProps) {
    const { viewDate, setViewDate, cells, goToPrevMonth, goToNextMonth, goToToday } = useCalendarGrid();
    const drawer = useRef<TaskDrawerHandle>(null);
    const { updateTask } = useTaskActions(setTasks);

    const [viewMode, setViewMode] = useState<ViewMode>("month");
    // Keep only the id so the details sheet always shows the live task.
    const [detailId, setDetailId] = useState<string | null>(null);
    const detailTask = detailId ? tasks.find(t => t.id === detailId) ?? null : null;
    const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());
    const [filterOpen, setFilterOpen] = useState(false);

    const catKeyOf = (t: Task) => t.category?.id ?? "none";
    const toggleCat = (id: string) => setHiddenCats(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const visibleTasks = tasks.filter(t => !hiddenCats.has(catKeyOf(t)));

    const filterCats = [
        ...categories.map(c => ({ id: c.id, name: c.name, color: c.color })),
        ...(tasks.some(t => !t.category) ? [{ id: "none", name: "Uncategorized", color: UNCATEGORIZED_COLOR }] : []),
    ];

    const tasksForDay = (day: Date) => visibleTasks.filter(t => occursOn(t, day));
    const today = atMidnight(new Date());

    const rangeStart = viewMode === "week" ? weekStart(viewDate) : atMidnight(viewDate);
    const rangeLen = viewMode === "3day" ? 3 : viewMode === "day" ? 1 : 7;
    const rangeDays = Array.from({ length: rangeLen }, (_, i) => addDays(rangeStart, i));

    const rangeStep = viewMode === "week" ? 7 : viewMode === "day" ? 1 : 3;
    const goPrev = () => viewMode === "month" ? goToPrevMonth() : setViewDate(addDays(viewDate, -rangeStep));
    const goNext = () => viewMode === "month" ? goToNextMonth() : setViewDate(addDays(viewDate, rangeStep));

    // Jump to the single-day view for a date (from a month cell or a week-agenda day header).
    const openDayView = (d: Date) => { setViewDate(d); setViewMode("day"); };

    const rangeLabel = () => {
        if (viewMode === "month") return viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
        if (viewMode === "day")
            return rangeDays[0].toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${fmt(rangeDays[0])} – ${fmt(rangeDays[rangeDays.length - 1])}`;
    };

    const monthCell = (date: Date, inCurrentMonth: boolean) => {
        const items = tasksForDay(date);
        const isToday = isSameDay(date, today);
        // One dot per task, coloured by category; hollow when done.
        const dots = items.slice(0, MAX_DOTS);
        const extra = items.length - dots.length;
        const label = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        return (
            <button
                key={date.getTime()}
                type="button"
                onClick={() => openDayView(date)}
                aria-label={`${label}, ${items.length === 0 ? "nothing planned" : `${items.length} ${items.length === 1 ? "task" : "tasks"}`}`}
                className={cx(
                    "press focus-ring flex min-h-11 min-w-0 flex-col items-center justify-start gap-1 rounded-input px-0.5 py-1",
                    isToday ? "line bg-accent-soft" : "bg-surface",
                    !inCurrentMonth && "opacity-50",
                )}
            >
                <span className={cx("text-body font-semibold", isToday ? "text-accent-deep" : "text-ink")}>{date.getDate()}</span>
                {items.length > 0 && (
                    <span aria-hidden="true" className="flex max-w-full flex-wrap items-center justify-center gap-0.5">
                        {dots.map(t => {
                            const color = t.category?.color ?? UNCATEGORIZED_COLOR;
                            return (
                                <span key={t.id} className="size-2 rounded-full border"
                                    style={{ borderColor: color, background: t.completed ? "transparent" : color }} />
                            );
                        })}
                        {extra > 0 && <span className="text-caption leading-none font-semibold text-ink-soft">+{extra}</span>}
                    </span>
                )}
            </button>
        );
    };

    const renderMonth = () => (
        <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-none px-4 pb-3">
            <div className="mb-1 grid shrink-0 grid-cols-7 gap-1" aria-hidden="true">
                {WEEKDAYS.map(d => (
                    <div key={d} className="py-1 text-center text-caption font-semibold text-ink-soft uppercase">{d}</div>
                ))}
            </div>
            <div className="grid min-h-72 flex-1 grid-cols-7 grid-rows-6 gap-1">
                {cells.map(c => monthCell(c.date, c.inCurrentMonth))}
            </div>
        </div>
    );

    // Week = an agenda of all seven days in one list, so nothing hides in a sideways scroller.
    const renderWeek = () => (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-none px-4 pb-4">
            {rangeDays.map(day => {
                const items = tasksForDay(day).sort((a, b) =>
                    (a.startDateTime ?? "").localeCompare(b.startDateTime ?? ""));
                const isToday = isSameDay(day, today);
                return (
                    <section key={day.getTime()} aria-label={day.toDateString()} className="flex min-w-0 flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => openDayView(day)}
                            className={cx(
                                "press focus-ring font-title line-b flex min-h-11 items-center justify-between gap-2 text-left text-lead font-semibold",
                                isToday ? "text-accent-deep" : "text-ink",
                            )}
                        >
                            <span>{day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}{isToday && " · Today"}</span>
                            <ChevronRightIcon aria-hidden="true" className="shrink-0 text-ink-soft" />
                        </button>
                        {items.length === 0 ? (
                            <p className="text-body text-ink-soft">Nothing planned.</p>
                        ) : items.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                aria-haspopup="dialog"
                                onClick={() => setDetailId(t.id)}
                                className="press focus-ring line flex min-h-11 w-full min-w-0 items-start gap-3 rounded-card bg-surface p-3 text-left"
                            >
                                <CategoryBadge color={t.category?.color ?? UNCATEGORIZED_COLOR} icon={t.category?.icon} size="sm" />
                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className={cx("font-title text-body leading-snug font-semibold wrap-break-word",
                                        t.completed ? "text-ink-soft line-through" : "text-ink")}>
                                        {t.name}
                                    </span>
                                    {t.completed
                                        ? <span className="text-caption text-ink-soft">Done · {startTimeLabel(t)}</span>
                                        : <TaskDue task={t} />}
                                </span>
                            </button>
                        ))}
                    </section>
                );
            })}
        </div>
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <TaskDrawer
                ref={drawer}
                tasks={tasks}
                setTasks={setTasks}
                categories={categories}
                setCategories={setCategories}
            />

            <TaskDetailCard
                task={detailTask}
                onClose={() => setDetailId(null)}
                onToggleDone={(t) => updateTask(t, { completed: !t.completed })}
                onEdit={(t) => { setDetailId(null); drawer.current?.openEdit(t); }}
                onDelete={(t) => { setDetailId(null); drawer.current?.requestDelete(t); }}
            />

            <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Show categories"
                footer={<Button variant="primary" size="lg" fullWidth onClick={() => setFilterOpen(false)}>Done</Button>}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Categories to show">
                    {filterCats.map(c => (
                        <PillButton key={c.id} selected={!hiddenCats.has(c.id)} onClick={() => toggleCat(c.id)}>
                            <CategoryBadge color={c.color} size="sm" /> {c.name}
                        </PillButton>
                    ))}
                </div>
            </Sheet>

            <header className="flex shrink-0 flex-col gap-2 px-4 pb-2">
                <h1 className="font-title text-title font-semibold text-ink" aria-live="polite">{rangeLabel()}</h1>

                {/* row 1: which view */}
                <div className="grid grid-cols-4 gap-1" role="group" aria-label="Calendar view">
                    {VIEW_TABS.map(([val, label]) => (
                        <Button key={val} size="sm" variant={viewMode === val ? "primary" : "secondary"}
                            aria-pressed={viewMode === val} className="px-1" onClick={() => setViewMode(val)}>
                            {label}
                        </Button>
                    ))}
                </div>

                {/* row 2: where in time */}
                <div className="flex items-center gap-2">
                    <IconButton label="Previous" icon={<ChevronLeftIcon />} onClick={goPrev} />
                    <Button size="sm" className="min-w-0 flex-1" onClick={goToToday}>Today</Button>
                    <IconButton label="Next" icon={<ChevronRightIcon />} onClick={goNext} />
                    {filterCats.length > 1 && (
                        <IconButton
                            label={hiddenCats.size > 0 ? `Filter categories, ${hiddenCats.size} hidden` : "Filter categories"}
                            icon={<FilterIcon />}
                            className={hiddenCats.size > 0 ? "bg-accent-soft" : undefined}
                            onClick={() => setFilterOpen(true)}
                        />
                    )}
                </div>
            </header>

            {viewMode === "month" && renderMonth()}
            {viewMode === "week" && renderWeek()}
            {(viewMode === "3day" || viewMode === "day") && (
                <div className="flex min-h-0 flex-1 flex-col px-4 pb-3">
                    <TimeGridView
                        days={rangeDays}
                        tasks={visibleTasks}
                        onEditTask={(t) => setDetailId(t.id)}
                        onUpdateTask={updateTask}
                        onCreateAt={(startDateTime, endDateTime) => drawer.current?.openAdd({ startDateTime, endDateTime })}
                    />
                </div>
            )}

            {/* one add button, docked inside the column: it can never sit on top of a row's actions */}
            <div className="line-t shrink-0 bg-paper px-4 py-3">
                <Button variant="primary" size="lg" fullWidth onClick={() => drawer.current?.openAdd()}>
                    <PlusIcon aria-hidden="true" /> Add task
                </Button>
            </div>
        </div>
    );
}
