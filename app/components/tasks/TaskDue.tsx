import { Pill } from "@/app/components/ui/Pill";
import { AlertIcon, ClockIcon } from "@/app/components/ui/icons";
import { cx } from "@/app/components/ui/cx";
import type { Task } from "@/app/types";
import { dueLabel, relativeDue, taskBucket } from "@/app/lib/tasks";

interface TaskDueProps {
    task: Task;
    className?: string;
}

/**
 * "When" line for a task: clock + time, and a loud "Overdue" pill (icon + word + brick colour, never colour alone).
 * Used on list rows, the details sheet and the calendar agenda so the same task always reads the same way.
 */
export function TaskDue({ task, className }: TaskDueProps) {
    const overdue = taskBucket(task) === "overdue";
    return (
        <div className={cx("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}>
            {overdue && (
                <Pill tone="danger" className="border-danger">
                    <AlertIcon width={14} height={14} /> Overdue
                </Pill>
            )}
            <span className={cx("flex min-w-0 items-center gap-1.5 text-body", overdue ? "font-semibold text-danger" : "text-ink-soft")}>
                <ClockIcon width={16} height={16} />
                <span className="truncate">{overdue ? dueLabel(task) : relativeDue(task)}</span>
            </span>
        </div>
    );
}
