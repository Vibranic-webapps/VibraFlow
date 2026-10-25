"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { ClockIcon, AlertIcon, CheckIcon, EditIcon, TrashIcon } from "@/app/components/ui/icons";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";
import { Pill } from "@/app/components/ui/Pill";
import { Select } from "@/app/components/ui/Select";
import { Sheet } from "@/app/components/ui/Sheet";

/**
 * Example task card. It answers the three questions at a glance (N1):
 *   what do I do (title) · when (time line) · what is my next move (ONE primary button).
 * Edit and delete are always visible 44px buttons (N2), no hover, no swipe needed.
 * Delete asks first, then offers undo. This is a demo: state is local, no data.
 */
export interface TaskCardDemoProps {
    title: string;
    when: string;
    /** Short status chip text, shown with an icon. */
    badge?: { text: string; tone: "accent" | "danger" | "ok" | "neutral" };
    startDone?: boolean;
}

export function TaskCardDemo({ title, when, badge, startDone = false }: TaskCardDemoProps) {
    const [done, setDone] = useState(startDone);
    const [gone, setGone] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [editing, setEditing] = useState(false);

    if (gone) {
        return (
            <Card tone="sunk" className="flex items-center justify-between gap-3">
                <p className="text-body text-ink">Task deleted.</p>
                <Button size="sm" onClick={() => setGone(false)}>
                    Undo
                </Button>
            </Card>
        );
    }

    return (
        <>
            <Card as="article" tone={done ? "sunk" : "default"} aria-label={title} className="flex flex-col gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <h3
                        className={
                            "font-title line-clamp-2 text-title font-semibold wrap-break-word " +
                            (done ? "text-ink-soft line-through decoration-2" : "text-ink")
                        }
                    >
                        {title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-body text-ink-soft">
                        <span className="inline-flex items-center gap-1.5">
                            <ClockIcon width={18} height={18} />
                            {when}
                        </span>
                        {badge && !done && (
                            <Pill tone={badge.tone}>
                                {badge.tone === "danger" && <AlertIcon width={14} height={14} />}
                                {badge.text}
                            </Pill>
                        )}
                        {done && (
                            <Pill tone="ok">
                                <CheckIcon width={14} height={14} />
                                Done
                            </Pill>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={done ? "secondary" : "primary"}
                        size="sm"
                        className="min-w-0 flex-1"
                        onClick={() => setDone((d) => !d)}
                    >
                        {done ? "Undo done" : "Mark done"}
                    </Button>
                    <IconButton label={`Edit ${title}`} icon={<EditIcon />} onClick={() => setEditing(true)} />
                    <IconButton
                        label={`Delete ${title}`}
                        icon={<TrashIcon />}
                        variant="danger"
                        onClick={() => setConfirming(true)}
                    />
                </div>
            </Card>

            <Sheet
                open={confirming}
                onClose={() => setConfirming(false)}
                title="Delete this task?"
                footer={
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setConfirming(false)}>
                            Keep it
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => {
                                setConfirming(false);
                                setGone(true);
                            }}
                        >
                            Delete task
                        </Button>
                    </div>
                }
            >
                <p className="text-body text-ink">
                    <strong className="font-semibold">{title}</strong> will disappear from your board. You can undo it right after.
                </p>
            </Sheet>

            <Sheet
                open={editing}
                onClose={() => setEditing(false)}
                title="Edit task"
                footer={
                    <Button variant="primary" fullWidth onClick={() => setEditing(false)}>
                        Save task
                    </Button>
                }
            >
                <div className="flex flex-col gap-4">
                    <Input label="What needs doing?" defaultValue={title} />
                    <Input label="When" defaultValue={when} hint="Pick a day and a time." />
                    <Select label="Priority" defaultValue="normal">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                    </Select>
                </div>
            </Sheet>
        </>
    );
}
