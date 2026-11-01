import { useState, useEffect, useCallback } from "react";
import { TodoState } from "@/app/types";

export function useTodoStates() {
    const [states, setStates] = useState<TodoState[]>([]);
    const [loading, setLoading] = useState(true);

    /** Fetches the list again. Resolves true when it worked (pull-to-refresh needs to know). */
    const refresh = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch("/api/todo-states");
            if (!response.ok) return false;
            setStates(await response.json());
            return true;
        } catch (error) {
            console.error("Failed to fetch todo states:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        async function fetchStates() {
            try {
                const response = await fetch("/api/todo-states");
                if (response.ok) setStates(await response.json());
            } catch (error) {
                console.error("Failed to fetch todo states:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchStates();
    }, []);

    return { states, setStates, loading, refresh };
}
