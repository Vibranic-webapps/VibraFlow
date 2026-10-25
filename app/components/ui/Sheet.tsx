"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
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
            {/* grab handle: purely decorative for now (frontend adds drag later) */}
            <div aria-hidden="true" className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-pill bg-surface-edge" />
            <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-3">
                <h2 id={titleId} className="font-title min-w-0 text-heading font-semibold text-ink wrap-break-word">
                    {title}
                </h2>
                {showClose && <IconButton label="Close" icon={<CloseIcon />} variant="ghost" onClick={onClose} />}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
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

/**
 * Bottom-sheet shell. Closes with the X, the backdrop or Escape. Focus moves in, stays in, and returns
 * to the button that opened it. No drag gestures yet: frontend adds those on top.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    // true on the client after hydration, false on the server (portal target only exists in the browser)
    const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

    // Keep the latest onClose without re-running the focus effect on every parent render.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

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
            <div aria-hidden="true" onClick={onClose} className="animate-scrim-in absolute inset-0 bg-scrim" />
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
