"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";

/**
 * Pull-to-refresh for the main screen. A home-screen app has no browser refresh, so dragging
 * down at the top of the page does it here: the page follows the finger, a row of little paper
 * chips fills with harvest orange as you pull, and at the threshold it is full. Let go and the
 * chips pulse in a wave while `onRefresh` refetches data. The app itself is never reloaded.
 *
 * This renders the page's ONE scroll area (<main>), so it replaces that element.
 *
 * Touch only. The gesture starts only when the page is scrolled to the very top, the finger
 * moves mostly downward, and nothing modal is open, so normal scrolling, sideways swiping
 * between tabs and sheets are untouched. Put `data-no-pull` on anything with its own touch
 * dragging (the calendar time grid). The transform is applied only while pulling: a permanent
 * one would break position:fixed inside the page.
 */

// Words in one place (this app has no i18n layer yet).
const COPY = {
    pull: "Pull to refresh",
    release: "Release to refresh",
    refreshing: "Refreshing…",
    updated: "Up to date",
    failed: "Couldn't refresh",
};

// --- Feel (px / ms). Distances are the page's travel, not the finger's. -------------------
const SEGMENTS = 12;
const RESISTANCE = 0.7; // the page moves 70% of the finger's distance until the threshold
const THRESHOLD = 64; // travel at which letting go refreshes
const OVERSHOOT_DAMPING = 0.3; // past the threshold it gets heavier
const MAX_TRAVEL = 96;
const HOLD_TRAVEL = 56; // where the page rests while refreshing
const MIN_REFRESH_MS = 700; // a fast answer would flash by; show the wave at least this long
const DONE_HOLD_MS = 350; // the full row stays a moment so "done" registers
const START_SLOP = 8; // the finger must move this far before we decide pull vs scroll

type Phase = "idle" | "pulling" | "armed" | "refreshing" | "done" | "failed";

/** Page travel for a finger distance: linear, then heavier past the threshold, then capped. */
function travelFor(dy: number): number {
    const raw = dy * RESISTANCE;
    if (raw <= THRESHOLD) return raw;
    return Math.min(MAX_TRAVEL, THRESHOLD + (raw - THRESHOLD) * OVERSHOOT_DAMPING);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface PullToRefreshProps {
    /** Resolve = "up to date", reject = "couldn't refresh". Only refetch data. */
    onRefresh: () => Promise<unknown>;
    className?: string;
    children: ReactNode;
}

export function PullToRefresh({ onRefresh, className, children }: PullToRefreshProps) {
    const rootRef = useRef<HTMLElement | null>(null);
    const [phase, setPhase] = useState<Phase>("idle");
    const [travel, setTravel] = useState(0);
    const [dragging, setDragging] = useState(false);

    // The listeners are attached once; they read the latest values through refs.
    const phaseRef = useRef<Phase>("idle");
    const refreshRef = useRef(onRefresh);
    useEffect(() => {
        refreshRef.current = onRefresh;
    }, [onRefresh]);

    const setPhaseBoth = useCallback((p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    }, []);

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        let startX = 0;
        let startY = 0;
        let tracking = false;
        let pulling = false;
        let alive = true;

        /** True when the touch began inside something that scrolls on its own and isn't at its top. */
        const insideScrolledContainer = (target: EventTarget | null): boolean => {
            let node = target instanceof Element ? target : null;
            while (node && node !== el) {
                if (node.scrollTop > 0 && node.scrollHeight > node.clientHeight) {
                    const overflowY = getComputedStyle(node).overflowY;
                    if (overflowY === "auto" || overflowY === "scroll") return true;
                }
                node = node.parentElement;
            }
            return false;
        };

        const onTouchStart = (e: TouchEvent) => {
            tracking = false;
            pulling = false;
            if (phaseRef.current !== "idle" || e.touches.length !== 1) return;
            if (el.scrollTop > 0 || insideScrolledContainer(e.target)) return;
            // Things with their own touch dragging (the time grid) keep the gesture.
            if ((e.target as Element | null)?.closest?.("[data-no-pull]")) return;
            // A sheet or dialog is open: its own gestures win.
            if (document.querySelector('[aria-modal="true"]')) return;
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            tracking = true;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!tracking) return;
            const t = e.touches[0];
            const dy = t.clientY - startY;
            const dx = t.clientX - startX;

            if (!pulling) {
                // Not decided yet: upward or sideways means a normal scroll or a swipe between tabs.
                if (dy < -START_SLOP || Math.abs(dx) > START_SLOP) {
                    tracking = false;
                    return;
                }
                if (dy < START_SLOP || el.scrollTop > 0) return;
                pulling = true;
                setDragging(true);
            }

            // Take over from the browser's own overscroll.
            if (e.cancelable) e.preventDefault();
            const next = travelFor(Math.max(0, dy - START_SLOP));
            setTravel(next);
            setPhaseBoth(next >= THRESHOLD ? "armed" : "pulling");
        };

        const onTouchEnd = async () => {
            const wasPulling = pulling;
            tracking = false;
            pulling = false;
            if (!wasPulling) return;
            setDragging(false);

            if (phaseRef.current !== "armed") {
                setPhaseBoth("idle");
                setTravel(0);
                return;
            }

            setPhaseBoth("refreshing");
            setTravel(HOLD_TRAVEL);
            let ok = true;
            try {
                await Promise.all([refreshRef.current(), wait(MIN_REFRESH_MS)]);
            } catch {
                ok = false;
            }
            if (!alive) return;
            setPhaseBoth(ok ? "done" : "failed");
            await wait(ok ? DONE_HOLD_MS : DONE_HOLD_MS * 2);
            if (!alive) return;
            setPhaseBoth("idle");
            setTravel(0);
        };

        const onTouchCancel = () => {
            if (phaseRef.current === "pulling" || phaseRef.current === "armed") {
                setPhaseBoth("idle");
                setTravel(0);
            }
            setDragging(false);
            tracking = false;
            pulling = false;
        };

        el.addEventListener("touchstart", onTouchStart, { passive: true });
        // Not passive: we must be able to cancel the browser's own overscroll while pulling.
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd, { passive: true });
        el.addEventListener("touchcancel", onTouchCancel, { passive: true });
        return () => {
            alive = false;
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchCancel);
        };
    }, [setPhaseBoth]);

    const filled =
        phase === "refreshing" || phase === "armed" || phase === "done"
            ? SEGMENTS
            : Math.round(Math.min(1, travel / THRESHOLD) * SEGMENTS);

    const caption =
        phase === "armed" ? COPY.release
        : phase === "refreshing" ? COPY.refreshing
        : phase === "done" ? COPY.updated
        : phase === "failed" ? COPY.failed
        : COPY.pull;

    // What a screen reader hears. Pulling and armed are visual only.
    const announcement = phase === "refreshing" || phase === "done" || phase === "failed" ? caption : "";
    const emphasised = phase === "armed" || phase === "refreshing";

    return (
        <main
            ref={rootRef}
            className={cx("relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-none", className)}
        >
            {/* The room the page leaves behind as it moves down. Above the page, never takes touches. */}
            <div
                aria-hidden="true"
                className={cx(
                    "pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden",
                    !dragging && "transition-[height] duration-[220ms] ease-(--ease-out)",
                )}
                style={{ height: travel }}
            >
                {/* Anchored to the bottom of the gap, chips lowest: they are the first thing the pull
                    uncovers (the caption is secondary and arrives with the rest of the room). */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-2">
                    <span
                        className={cx(
                            "font-title text-caption font-semibold tracking-wider uppercase",
                            emphasised ? "text-ink" : "text-ink-soft",
                        )}
                    >
                        {caption}
                    </span>
                    <div className={cx("flex gap-1", phase === "refreshing" && "ptr-sweep")}>
                        {Array.from({ length: SEGMENTS }, (_, i) => (
                            <span
                                key={i}
                                className={cx(
                                    "ptr-seg block h-3 w-4 rounded-sign border-[1.5px] border-solid",
                                    i < filled ? "border-ink bg-accent" : "border-surface-edge bg-surface-sunk",
                                )}
                                style={{ "--i": i + 1 } as React.CSSProperties}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <p role="status" aria-live="polite" className="sr-only">
                {announcement}
            </p>
            <div
                className={cx("flex min-h-0 flex-1 flex-col", !dragging && "transition-transform duration-[220ms] ease-(--ease-out)")}
                style={travel > 0 ? { transform: `translateY(${travel}px)` } : undefined}
            >
                {children}
            </div>
        </main>
    );
}
