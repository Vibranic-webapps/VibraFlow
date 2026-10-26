"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import { CloseIcon } from "./icons";
import { IconButton } from "./IconButton";

export interface SheetPanelProps {
    /** Visible title. Also the dialog's accessible name. */
    title: string;
    titleId: string;
    onClose?: () => void;
    /** Show the X even without onClose (static preview inside a server component). */
    showClose?: boolean;
    children: ReactNode;
    /** Sticky actions row at the bottom (e.g. Cancel / Delete). */
    footer?: ReactNode;
    className?: string;
}

/**
 * The look of the bottom sheet, with no behaviour. Used by <Sheet> and by the /design page.
 * Scrolls inside itself (max 85% of the screen height); the page behind never scrolls.
 */
export function SheetPanel({ title, titleId, onClose, showClose = Boolean(onClose), children, footer, className }: SheetPanelProps) {
    return (
        <div
            className={cx(
                "line bg-grain mx-auto flex max-h-[85dvh] w-full max-w-column flex-col rounded-t-sheet border-ink bg-paper shadow-lift-up",
                className,
            )}
        >
            {/* grab handle: signals "swipe down to close" (the gesture lives in useSwipeToClose) */}
            <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-surface-edge" />
            <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-3">
                <h2 id={titleId} className="font-title min-w-0 text-heading font-semibold text-ink wrap-break-word">
                    {title}
                </h2>
                {showClose && <IconButton label="Close" icon={<CloseIcon />} variant="ghost" onClick={onClose} />}
            </div>
            <div data-sheet-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
            {footer && (
                <div className="line-t shrink-0 border-ink bg-surface px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {footer}
                </div>
            )}
        </div>
    );
}

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribeNoop = () => () => {};

/** Swipe-to-close tuning. */
const SWIPE = {
    /** Finger travel before a downward move counts as a sheet drag (not a tap). */
    startPx: 6,
    /** Close when dragged past this share of the sheet height... */
    closeRatio: 0.25,
    /** ...but never ask for less than this many px (short sheets). */
    closeMinPx: 80,
    /** Or close on a quick flick: px per ms, once past flickMinPx. */
    flickSpeed: 0.6,
    flickMinPx: 30,
    /** Snap-back / slide-out time. */
    settleMs: 200,
} as const;

/**
 * True when the touch started inside a scroller that should keep the gesture for itself:
 * the sheet body while it is scrolled down, or any other scroller inside it (time-picker wheels).
 */
function touchBelongsToScroller(target: EventTarget | null, panel: HTMLElement): boolean {
    let el = target instanceof Element ? target : null;
    while (el && el !== panel) {
        if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
            const overflowY = getComputedStyle(el).overflowY;
            if (overflowY === "auto" || overflowY === "scroll") {
                return el.hasAttribute("data-sheet-body") ? el.scrollTop > 0 : true;
            }
        }
        el = el.parentElement;
    }
    return false;
}

/**
 * Swipe down to close, like a native iOS sheet. A drag from the handle/title always works; a drag in
 * the content only when it is scrolled to the top (otherwise the finger scrolls the content back up).
 * Moves the panel with inline styles, so there is no re-render per frame.
 */
function useSwipeToClose(
    enabled: boolean,
    panelRef: RefObject<HTMLDivElement | null>,
    scrimRef: RefObject<HTMLDivElement | null>,
    onCloseRef: RefObject<() => void>,
) {
    useEffect(() => {
        const panel = panelRef.current;
        if (!enabled || !panel) return;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let startX = 0;
        let startY = 0;
        let startT = 0;
        let blocked = false;
        let dragging = false;
        let offset = 0;
        let settleTimer: number | undefined;

        const setOffset = (px: number, animate: boolean) => {
            const ease = `${SWIPE.settleMs}ms ease-out`;
            panel.style.transition = animate ? `transform ${ease}` : "none";
            panel.style.transform = px > 0 ? `translateY(${px}px)` : "";
            const scrim = scrimRef.current;
            if (scrim) {
                scrim.style.transition = animate ? `opacity ${ease}` : "none";
                scrim.style.opacity = px > 0 ? String(Math.max(0, 1 - px / panel.offsetHeight)) : "";
            }
        };

        function onStart(e: TouchEvent) {
            // A second finger, or a touch while the sheet is already sliding out: not a swipe.
            if (e.touches.length !== 1 || settleTimer !== undefined) {
                blocked = true;
                return;
            }
            const t = e.touches[0];
            startX = t.clientX;
            startY = t.clientY;
            startT = e.timeStamp;
            dragging = false;
            offset = 0;
            blocked = touchBelongsToScroller(e.target, panel!);
        }

        function onMove(e: TouchEvent) {
            if (blocked) return;
            const t = e.touches[0];
            const dy = t.clientY - startY;
            const dx = t.clientX - startX;
            if (!dragging) {
                // Upward or sideways first: that is a scroll or another gesture, leave it alone.
                if (dy < -SWIPE.startPx || Math.abs(dx) > Math.max(SWIPE.startPx, dy)) {
                    blocked = true;
                    return;
                }
                if (dy < SWIPE.startPx) return;
                dragging = true;
                startY = t.clientY; // measure from here so the sheet does not jump by startPx
                startT = e.timeStamp;
            }
            e.preventDefault(); // this gesture is ours now: no content scroll, no rubber band
            offset = Math.max(0, t.clientY - startY);
            setOffset(offset, false);
        }

        function onEnd(e: TouchEvent) {
            if (!dragging) return;
            dragging = false;
            const speed = offset / Math.max(1, e.timeStamp - startT);
            const pastThreshold = offset > Math.max(SWIPE.closeMinPx, panel!.offsetHeight * SWIPE.closeRatio);
            const flicked = speed > SWIPE.flickSpeed && offset > SWIPE.flickMinPx;
            if (!pastThreshold && !flicked) {
                setOffset(0, !reduceMotion); // not far enough: snap back
                return;
            }
            if (reduceMotion) {
                onCloseRef.current();
                return;
            }
            setOffset(panel!.offsetHeight, true); // slide the rest of the way out, then close
            settleTimer = window.setTimeout(() => onCloseRef.current(), SWIPE.settleMs);
        }

        panel.addEventListener("touchstart", onStart, { passive: true });
        panel.addEventListener("touchmove", onMove, { passive: false });
        panel.addEventListener("touchend", onEnd);
        panel.addEventListener("touchcancel", onEnd);
        return () => {
            window.clearTimeout(settleTimer);
            panel.removeEventListener("touchstart", onStart);
            panel.removeEventListener("touchmove", onMove);
            panel.removeEventListener("touchend", onEnd);
            panel.removeEventListener("touchcancel", onEnd);
        };
    }, [enabled, panelRef, scrimRef, onCloseRef]);
}

/**
 * Bottom-sheet shell. Closes with the X, the backdrop, Escape, or a swipe down. Focus moves in,
 * stays in, and returns to the button that opened it.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const scrimRef = useRef<HTMLDivElement>(null);
    // true on the client after hydration, false on the server (portal target only exists in the browser)
    const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

    // Keep the latest onClose without re-running the focus effect on every parent render.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useSwipeToClose(open && isClient, panelRef, scrimRef, onCloseRef);

    useEffect(() => {
        if (!open) return;
        const opener = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        // Land on the first control inside; fall back to the panel itself.
        const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panel)?.focus();

        const previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.stopPropagation();
                onCloseRef.current();
                return;
            }
            if (e.key !== "Tab" || !panel) return;
            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const firstEl = items[0];
            const lastEl = items[items.length - 1];
            if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.documentElement.style.overflow = previousOverflow;
            opener?.focus?.();
        };
    }, [open]);

    if (!open || !isClient) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end">
            {/* backdrop: tap to close. Hidden from assistive tech; the X and Escape cover them. */}
            <div ref={scrimRef} aria-hidden="true" onClick={onClose} className="animate-scrim-in absolute inset-0 bg-scrim" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="animate-sheet-in relative w-full outline-none"
            >
                <SheetPanel title={title} titleId={titleId} onClose={onClose} footer={footer}>
                    {children}
                </SheetPanel>
            </div>
        </div>,
        document.body,
    );
}
