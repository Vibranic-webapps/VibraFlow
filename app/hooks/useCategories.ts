import { useState, useEffect, useCallback } from "react";
import { Category } from "@/app/types";

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    /** Fetches the list again. Resolves true when it worked (pull-to-refresh needs to know). */
    const refresh = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) return false;
            setCategories(await response.json());
            return true;
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch("/api/categories");
                if (response.ok) setCategories(await response.json());
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        }
        void fetchCategories();
    }, []);

    return { categories, setCategories, loading, refresh }
}