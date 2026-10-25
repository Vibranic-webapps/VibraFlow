"use client";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { Task, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { taskBucket, taskStats, dueOf, priorityRank, groupByDay, groupByWeek, type DayGroup } from "@/app/lib/tasks";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import TaskDrawer, { type TaskDrawerHandle } from "../TaskDrawer";
import TaskDetailCard from "./TaskDetailCard";
import { CategoryBadge } from "./CategoryBadge";
import { TaskDue } from "./TaskDue";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { Card } from "@/app/components/ui/Card";
import { Pill, PillButton } from "@/app/components/ui/Pill";
import { CONTROL } from "@/app/components/ui/Field";
import { cx } from "@/app/components/ui/cx";
import {
    PlusIcon, SearchIcon, FilterIcon, SortIcon, CheckIcon, EditIcon, TrashIcon, HeartIcon, AlertIcon, BoardIcon,
} from "@/app/components/ui/icons";

interface ListViewProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    loading: boolean;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const LIST_COUNT_KEY = "orbit:listCount";
const subscribeNoop = () => () => {};

/**
 * The saved row count from the last visit, so the loading skeleton matches. Read with useSyncExternalStore
 * (null on the server) so it never causes a hydration mismatch or a set-state-in-effect.
 */
function useSavedListCount(): number {
    const raw = useSyncExternalStore(
        subscribeNoop,
        () => localStorage.getItem(LIST_COUNT_KEY),
        () => null,
    );
    const saved = Number(raw);
    return Number.isFinite(saved) && saved > 0 ? Math.min(saved, 12) : 3;
}

const STATUS_FILTERS = [["all", "All"], ["active", "Active"], ["completed", "Done"], ["favorite", "Favourites"]] as const;

export default function ListView({ tasks, setTasks, loading, categories, setCategories }: ListViewProps) {
    const drawer = useRef<TaskDrawerHandle>(null);
    const { updateTask } = useTaskActions(setTasks);
    // Keep only the id so the details sheet always shows the live task (Mark done updates it at once).
    const [detailId, setDetailId] = useState<string | null>(null);
    const detailTask = detailId ? tasks.find(t => t.id === detailId) ?? null : null;
    const [editingId, setEditingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "favorite">("all");
    const [sortBy, setSortBy] = useState<"date" | "priority">("date");
    const [catFilter, setCatFilter] = useState<string | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Non-default filters (search stays visible, so it is not counted). Drives the badge on the Filters button.
    const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (catFilter ? 1 : 0);
    const clearFilters = () => { setSearch(""); setStatusFilter("all"); setCatFilter(null); };

    const now = new Date();
    const visible = tasks.filter(t => t.startDateTime !== null);
    const stats = taskStats(visible, now);

    const skeletonCount = useSavedListCount();
    useEffect(() => {
        if (!loading) localStorage.setItem(LIST_COUNT_KEY, String(visible.length));
    }, [loading, visible.length]);

    const filtered = visible.filter(t => {
        if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (catFilter && t.categoryId !== catFilter) return false;
        if (statusFilter === "active" && t.completed) return false;
        if (statusFilter === "completed" && !t.completed) return false;
        if (statusFilter === "favorite" && !t.favorite) return false;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        if (sortBy === "priority") return priorityRank(b) - priorityRank(a);
        return (dueOf(a)?.getTime() ?? Infinity) - (dueOf(b)?.getTime() ?? Infinity);
    });

    const renderRow = (task: Task) => {
        const priority = priorityOptions.find(o => o.value === task.priority);
        const bucket = taskBucket(task, now);
        const isEditing = editingId === task.id;

        return (
            <Card
                key={task.id}
                as="article"
                tone={task.completed ? "sunk" : bucket === "overdue" ? "raised" : "default"}
                aria-label={task.name}
                className={cx(
                    "flex flex-col gap-3",
                    bucket === "overdue" && !task.completed && "border-danger",
                    isEditing && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
                )}
            >
                <div className="flex min-w-0 items-start gap-3">
                    {task.category
                        ? <CategoryBadge color={task.category.color} icon={task.category.icon} className="mt-1.5" />
                        : <span aria-hidden="true" className="line mt-1.5 size-8 shrink-0 rounded-full border-dashed border-ink-faint" />}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={() => setDetailId(task.id)}
                            className={cx(
                                "focus-ring font-title min-h-11 w-full rounded-input text-left text-title leading-snug font-semibold wrap-break-word line-clamp-2",
                                task.completed ? "text-ink-soft line-through decoration-2" : "text-ink",
                            )}
                        >
                            {task.name}
                        </button>
                        {task.completed
                            ? <Pill tone="ok" className="self-start"><CheckIcon width={14} height={14} aria-hidden="true" /> Done</Pill>
                            : <TaskDue task={task} />}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {task.category && <span className="sr-only">Category: {task.category.name}</span>}
                            {priority && (
                                <Pill>
                                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: priority.color }} />
                                    {priority.label}
                                </Pill>
                            )}
                            {task.categoryRemoved && (
                                <Pill tone="warn" className="pr-1">
                                    <AlertIcon width={14} height={14} aria-hidden="true" /> Category removed
                                </Pill>
                            )}
                        </div>
                        {task.categoryRemoved && (
                            <Button size="sm" variant="ghost" className="self-start -ml-2"
                                onClick={() => updateTask(task, { categoryRemoved: false })}>
                                Dismiss notice
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={task.completed ? "secondary" : "primary"}
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => updateTask(task, { completed: !task.completed })}
                    >
                        {task.completed ? "Undo done" : "Mark done"}
                    </Button>
                    <IconButton
                        label={task.favorite ? `Remove ${task.name} from favourites` : `Favourite ${task.name}`}
                        aria-pressed={task.favorite}
                        icon={<HeartIcon fill={task.favorite ? "currentColor" : "none"} />}
                        className={task.favorite ? "bg-accent-soft" : undefined}
                        onClick={() => updateTask(task, { favorite: !task.favorite })}
                    />
                    <IconButton label={`Edit ${task.name}`} icon={<EditIcon />} onClick={() => drawer.current?.openEdit(task)} />
                    <IconButton label={`Delete ${task.name}`} variant="danger" icon={<TrashIcon />}
                        onClick={() => drawer.current?.requestDelete(task)} />
                </div>
            </Card>
        );
    };

    const dayTone = (tone: DayGroup["tone"]) =>
        tone === "overdue" ? "text-danger" : "text-ink";

    const renderDay = (group: DayGroup) => (
        <div key={group.key} className="flex min-w-0 flex-col gap-3">
            <h3 className={cx("font-title flex items-center gap-2 text-lead font-semibold", dayTone(group.tone))}>
                {group.tone === "overdue" && <AlertIcon width={18} height={18} aria-hidden="true" />}
                {group.label}
                <Pill className="font-body">{group.items.length}</Pill>
            </h3>
            {group.items.map(renderRow)}
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
                onEditingChange={setEditingId}
            />

            <TaskDetailCard
                task={detailTask}
                onClose={() => setDetailId(null)}
                onToggleDone={(t) => updateTask(t, { completed: !t.completed })}
                onEdit={(t) => { setDetailId(null); drawer.current?.openEdit(t); }}
                onDelete={(t) => { setDetailId(null); drawer.current?.requestDelete(t); }}
            />

            {/* search + tools stay put; only the list below scrolls */}
            <div className="flex shrink-0 flex-col gap-2 px-4 pb-2">
                <div className="relative">
                    <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" />
                    <input
                        type="search"
                        aria-label="Search tasks"
                        placeholder="Search tasks"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className={cx(CONTROL, "h-12 pl-11")}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => setSortBy(s => s === "date" ? "priority" : "date")}>
                        <SortIcon aria-hidden="true" /> Sort: {sortBy === "date" ? "Date" : "Priority"}
                    </Button>
                    <Button size="sm" aria-expanded={filtersOpen} variant={filtersOpen || activeFilterCount > 0 ? "primary" : "secondary"}
                        onClick={() => setFiltersOpen(o => !o)}>
                        <FilterIcon aria-hidden="true" /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                    </Button>
                </div>

                {filtersOpen && (
                    <Card tone="sunk" className="flex flex-col gap-3 p-3">
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                            {STATUS_FILTERS.map(([val, label]) => (
                                <PillButton key={val} selected={statusFilter === val} onClick={() => setStatusFilter(val)}>{label}</PillButton>
                            ))}
                        </div>
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
                                <PillButton selected={catFilter === null} onClick={() => setCatFilter(null)}>Any category</PillButton>
                                {categories.map(c => (
                                    <PillButton key={c.id} selected={catFilter === c.id}
                                        onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}>
                                        <CategoryBadge color={c.color} size="sm" /> {c.name}
                                    </PillButton>
                                ))}
                            </div>
                        )}
                        {(activeFilterCount > 0 || search) && (
                            <Button size="sm" variant="ghost" className="self-start" onClick={clearFilters}>Clear all filters</Button>
                        )}
                    </Card>
                )}
            </div>

            {/* the ONE scroll area of this screen */}
            <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none px-4 pb-4">
                {loading ? (
                    <div className="flex flex-col gap-3" aria-hidden="true" aria-busy="true">
                        {Array.from({ length: skeletonCount }).map((_, i) => (
                            <Card key={i} tone="sunk" className="flex animate-pulse flex-col gap-3">
                                <div className="flex gap-3">
                                    <div className="size-8 shrink-0 rounded-full bg-surface-edge" />
                                    <div className="flex flex-1 flex-col gap-2">
                                        <div className="h-5 rounded-input bg-surface-edge" style={{ width: ["58%", "72%", "46%", "64%", "52%"][i % 5] }} />
                                        <div className="h-4 w-28 rounded-input bg-surface-edge" />
                                    </div>
                                </div>
                                <div className="h-11 rounded-btn bg-surface-edge" />
                            </Card>
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    visible.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <span className="line grid size-16 place-items-center rounded-full border-ink bg-surface text-ink"><BoardIcon width={30} height={30} /></span>
                            <h2 className="font-title text-heading font-semibold text-ink">No tasks yet</h2>
                            <p className="text-body text-ink-soft">Add your first one and it will show up here.</p>
                            <Button variant="primary" size="lg" onClick={() => drawer.current?.openAdd()}>
                                <PlusIcon aria-hidden="true" /> Add my first task
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-12 text-center">
                            <span className="line grid size-16 place-items-center rounded-full border-ink bg-surface text-ink"><SearchIcon width={30} height={30} /></span>
                            <h2 className="font-title text-heading font-semibold text-ink">Nothing matches</h2>
                            <p className="text-body text-ink-soft">Try another word, or clear the filters.</p>
                            <Button onClick={clearFilters}>Clear filters</Button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-6">
                        <p className="text-body text-ink-soft">
                            <strong className="font-semibold text-ink">{stats.active}</strong> to do
                            {stats.today > 0 && <> · <strong className="font-semibold text-ink">{stats.today}</strong> today</>}
                            {stats.overdue > 0 && <> · <strong className="font-semibold text-danger">{stats.overdue} overdue</strong></>}
                            {stats.completed > 0 && <> · {stats.completed} done</>}
                        </p>
                        {groupByWeek(groupByDay(sorted, now), now).map(section => (
                            <section key={section.key} aria-label={section.label} className="flex flex-col gap-4">
                                <h2 className="line-b font-title pb-1 text-caption font-semibold tracking-wide text-ink-soft uppercase">{section.label}</h2>
                                {section.days.map(renderDay)}
                            </section>
                        ))}
                    </div>
                )}
            </div>

            {/* one add button, docked inside the column: it can never sit on top of a row's actions */}
            <div className="line-t shrink-0 bg-paper px-4 py-3">
                <Button variant="primary" size="lg" fullWidth onClick={() => drawer.current?.openAdd()}>
                    <PlusIcon aria-hidden="true" /> Add task
                </Button>
            </div>
        </div>
    );
}
