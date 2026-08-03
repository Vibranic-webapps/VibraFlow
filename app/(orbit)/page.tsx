"use client";
import { useRef, useState } from "react";
import { useTasks } from "@/app/hooks/useTasks";
import { useCategories } from "@/app/hooks/useCategories";
import { useTodoStates } from "@/app/hooks/useTodoStates";
import ListView from "@/app/components/tasks/ListView";
import CalendarView from "@/app/components/CalendarView";
import TodoView from "@/app/components/TodoView";
import LogoutButton from "@/app/components/auth/LogoutButton";
import { LayoutList, Calendar, CircleCheckBig } from "lucide-react"

export default function Page() {
    const { tasks, setTasks, loading: tasksLoading } = useTasks();
    const { categories, setCategories } = useCategories();
    const { states, setStates, loading: statesLoading } = useTodoStates();
    const [view, setView] = useState<"tasks" | "calendar" | "categories" | "todos">("tasks");
    const [drawerOpen, setDrawerOpen] = useState(false);

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
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
            className={`transition-[margin] duration-300 ease-out ${drawerOpen ? "lg:mr-122.5" : "mr-0"}`}>
            <div className="flex items-center justify-center gap-3 p-4">
                <div className="inline-flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <button onClick={() => setView("tasks")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "tasks" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                        <LayoutList size={16} />
                        <span className="hidden sm:inline">Tasks</span>
                    </button>
                    <button onClick={() => setView("calendar")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "calendar" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                        <Calendar size={16} />
                        <span className="hidden sm:inline">Calendar</span>
                    </button>
                    <button onClick={() => setView("todos")} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${view === "todos" ? "text-(--vibranic) drop-shadow-[0_0_8px_var(--vibranic)]" : "text-white/50 hover:text-white"}`}>
                        <CircleCheckBig size={16} />
                        <span className="hidden sm:inline">Todos</span>
                    </button>
                </div>
                <LogoutButton />
            </div>
            {view === "tasks" && <ListView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} loading={tasksLoading} onDrawerOpenChange={setDrawerOpen} />}
            {view === "calendar" && <CalendarView tasks={tasks} setTasks={setTasks} categories={categories} setCategories={setCategories} onDrawerOpenChange={setDrawerOpen} />}
            {view === "todos" && (
                <div className="w-full max-w-360 mx-auto">
                    <TodoView tasks={tasks} setTasks={setTasks} states={states} setStates={setStates} loading={statesLoading} />
                </div>
            )}
        </div>
    );
}
