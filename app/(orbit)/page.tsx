"use client";
import { useRef, useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import { useTodoStates } from "@/app/hooks/useTodoStates";
import ListView from "@/app/components/tasks/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import AccountMenu from "@/app/components/auth/AccountMenu";
import { TabBar, type TabItem } from "@/app/components/ui/TabBar";
import { BoardIcon, CalendarIcon, CheckIcon } from "@/app/components/ui/icons";

type View = "tasks" | "calendar" | "categories" | "todos";

// Phase 1 tab labels match today's content. Phase 2 swaps these for Board / Calendar / Backpack.
const PHASE1_TABS: TabItem[] = [
    { id: "tasks", label: "Tasks", icon: <BoardIcon /> },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon /> },
    { id: "todos", label: "Todos", icon: <CheckIcon /> },
];

const VIEW_TITLES: Record<View, string> = {
    tasks: "Tasks",
    calendar: "Calendar",
    categories: "Categories",
    todos: "Todos",
};

export default function Page() {
    const { tasks, setTasks, loading: tasksLoading } = useTasks();
    const { categories, setCategories } = useCategories();
    const { states, setStates, loading: statesLoading } = useTodoStates();
    const [view, setView] = useState<View>("tasks");

    // Swipe sideways to move between tabs. We ignore swipes that begin inside a
    // horizontally-scrollable region (calendar time grid, todos board) so those
    // keep their own horizontal scroll.
    const SWIPE_TABS = ["tasks", "calendar", "todos"] as const;
    const touchStart = useRef<{ x: number; y: number; skip: boolean } | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        const skip = Boolean((e.target as HTMLElement).closest?.("[data-hscroll]"));
        touchStart.current = { x: t.clientX, y: t.clientY, skip };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        const s = touchStart.current;
        touchStart.current = null;
        if (!s || s.skip) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        // Require a clearly horizontal swipe.
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        const cur = SWIPE_TABS.indexOf(view as (typeof SWIPE_TABS)[number]);
        if (cur === -1) return;
        const next = dx < 0 ? cur + 1 : cur - 1; // swipe left → next tab
        if (next < 0 || next >= SWIPE_TABS.length) return;
        setView(SWIPE_TABS[next]);
    };

    return (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
                <h1 className="font-title min-w-0 truncate text-heading font-semibold text-ink">{VIEW_TITLES[view]}</h1>
                <AccountMenu />
            </header>
            {/* The ONE scroll area. A view that wants the full height (calendar) fills it with flex-1 + min-h-0. */}
            <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-none">
                {view === "tasks" && <ListView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} loading={tasksLoading} onDrawerOpenChange={() => {}} />}
                {view === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} onDrawerOpenChange={() => {}} />}
                {view === "todos" && (
                    <div className="w-full">
                        <TodoView tasks={tasks} setTasks={setTasks} states={states} setStates={setStates} loading={statesLoading} />
                    </div>
                )}
            </main>
            <TabBar
                active={view}
                items={PHASE1_TABS}
                onSelect={(id) => setView(id as View)}
                label="Main"
                className="shrink-0"
            />
        </div>
    );
}
