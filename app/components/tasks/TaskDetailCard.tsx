"use client";
import { Task } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { recurrenceLabel } from "@/app/lib/tasks";
import { Sheet } from "@/app/components/ui/Sheet";
import { Button } from "@/app/components/ui/Button";
import { Pill } from "@/app/components/ui/Pill";
import { CheckIcon, EditIcon, TrashIcon, RepeatIcon, HeartIcon } from "@/app/components/ui/icons";
import { CategoryBadge } from "./CategoryBadge";
import { TaskDue } from "./TaskDue";

const fmt = (iso: string | null) =>
    iso
        ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : null;

interface Props {
    /** Pass the live task from state (not a copy) so Mark done updates the sheet straight away. */
    task: Task | null;
    onClose: () => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onToggleDone: (task: Task) => void;
}

/** Task details in the shared Sheet. Mark done, Edit and Delete are always visible buttons, never hover-only. */
export default function TaskDetailCard({ task, onClose, onEdit, onDelete, onToggleDone }: Props) {
    const priority = task ? priorityOptions.find(o => o.value === task.priority) : undefined;
    const repeat = task ? recurrenceLabel(task) : null;
    const start = task ? fmt(task.startDateTime) : null;
    const end = task ? fmt(task.endDateTime) : null;

    return (
        <Sheet
            open={task !== null}
            onClose={onClose}
            title={task?.name ?? "Task"}
            footer={task && (
                <div className="flex flex-col gap-2">
                    <Button variant={task.completed ? "secondary" : "primary"} size="lg" fullWidth onClick={() => onToggleDone(task)}>
                        <CheckIcon aria-hidden="true" /> {task.completed ? "Undo done" : "Mark done"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => onEdit(task)}><EditIcon aria-hidden="true" /> Edit</Button>
                        <Button variant="danger" onClick={() => onDelete(task)}><TrashIcon aria-hidden="true" /> Delete</Button>
                    </div>
                </div>
            )}
        >
            {task && (
                <div className="flex flex-col gap-4">
                    {task.completed
                        ? <Pill tone="ok" className="self-start"><CheckIcon width={14} height={14} aria-hidden="true" /> Done</Pill>
                        : <TaskDue task={task} />}

                    <div className="flex flex-wrap gap-2">
                        {task.category && (
                            <Pill>
                                <CategoryBadge color={task.category.color} icon={task.category.icon} size="sm" />
                                {task.category.name}
                            </Pill>
                        )}
                        {priority && (
                            <Pill>
                                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: priority.color }} />
                                {priority.label} priority
                            </Pill>
                        )}
                        {repeat && <Pill><RepeatIcon width={14} height={14} aria-hidden="true" /> {repeat}</Pill>}
                        {task.favorite && <Pill tone="accent"><HeartIcon width={14} height={14} aria-hidden="true" /> Favourite</Pill>}
                    </div>

                    {(start || end) && (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body">
                            {start && (<><dt className="font-semibold text-ink">Starts</dt><dd className="text-ink-soft">{start}</dd></>)}
                            {end && !repeat && (<><dt className="font-semibold text-ink">Ends</dt><dd className="text-ink-soft">{end}</dd></>)}
                        </dl>
                    )}

                    {task.description
                        ? <p className="whitespace-pre-wrap break-words text-body text-ink">{task.description}</p>
                        : <p className="text-body text-ink-soft">No notes on this one.</p>}
                </div>
            )}
        </Sheet>
    );
}
