import { useState, useEffect, useCallback } from "react";
import { Task } from "@/app/types";

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    /** Fetches the list again. Resolves true when it worked (pull-to-refresh needs to know). */
    const refresh = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch("/api/tasks");
            if (!response.ok) return false;
            setTasks(await response.json());
            return true;
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        async function fetchTasks() {
            try {
                const response = await fetch("/api/tasks");
                if (response.ok) setTasks(await response.json());
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchTasks();
    }, []);

    return { tasks, setTasks, loading, refresh }
}