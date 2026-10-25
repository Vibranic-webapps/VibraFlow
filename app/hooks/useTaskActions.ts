"use client";
import { Task } from "@/app/types";
import { toast } from "sonner";
import { toWireDateTimes } from "@/lib/datetime";

/** The API answers 400 with { error: "..." }; show that sentence instead of a generic failure. */
async function apiErrorMessage(res: Response, fallback: string): Promise<string> {
    if (res.status !== 400) return fallback;
    try {
        const body = await res.json();
        return typeof body?.error === "string" && body.error ? body.error : fallback;
    } catch {
        return fallback;
    }
}

export function useTaskActions(setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
    const createTask = async (rawPayload: Record<string, unknown>): Promise<Task | null> => {
        try {
            // Local wall-clock form values -> unambiguous ISO instants (see lib/datetime.ts).
            const payload = toWireDateTimes(rawPayload);
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newTask: Task = await res.json();
                setTasks(prev => [...prev, newTask]);
                toast.success("Task added successfully");
                return newTask;
            }
            toast.error(await apiErrorMessage(res, "Failed to add task."));
            return null;
        } catch (error) {
            console.error("Error adding task:", error);
            toast.error("Error adding task");
            return null;
        }
    };

    const updateTask = async (task: Task, rawUpdates: Partial<Task>): Promise<Task | null> => {
        // Local wall-clock form values -> unambiguous ISO instants; unchanged fields keep their stored value.
        const updates = toWireDateTimes(rawUpdates, task);
        // 1. Optimistic apply — flip the UI immediately, before the network call.
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...updates } : t)));
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                // 2. Reconcile with the server's authoritative copy (invisible swap).
                const updated: Task = await res.json();
                setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
                return updated;
            }
            // 3a. Server rejected — roll back to the pre-change snapshot.
            setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
            toast.error(await apiErrorMessage(res, "Failed to update task."));
            return null;
        } catch (error) {
            // 3b. Network error — roll back too.
            console.error("Error updating task:", error);
            setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
            toast.error("Error updating task");
            return null;
        }
    };

    const deleteTask = async (task: Task): Promise<boolean> => {
        try {
            const res = await fetch(`/api/tasks/${task.id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== task.id));
                toast.success("Task deleted successfully");
                return true;
            }
            toast.error(await apiErrorMessage(res, "Failed to delete task."));
            return false;
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Error deleting task");
            return false;
        }
    };

    return { createTask, updateTask, deleteTask };
}
