"use client";
import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useId } from "react";
import { Task, Category, TaskFormValues, FormErrors } from "@/app/types";
import TaskForm, { type SubView } from "./TaskForm";
import { Sheet } from "@/app/components/ui/Sheet";
import { Button } from "@/app/components/ui/Button";
import { ChevronLeftIcon } from "@/app/components/ui/icons";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import { toast } from "sonner";
import { isoToLocalInput, isoToDateOnly } from "@/lib/datetime";

export const initialForm: TaskFormValues = {
    name: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    priority: "MEDIUM",
    categoryId: "",
    frequency: "",
    interval: 1,
    byWeekday: [],
    recurrenceEnd: "",
};

export interface TaskDrawerHandle {
    openAdd: (prefill?: Partial<TaskFormValues>) => void;
    openEdit: (task: Task) => void;
    requestDelete: (task: Task) => void;
}

interface TaskDrawerProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onEditingChange?: (id: string | null) => void;
}

function validateTask(form: TaskFormValues): FormErrors {
    const errors: FormErrors = {};
    const isRecurring = !!form.frequency;

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.startDateTime) errors.startDateTime = "Start date is required.";

    if (!isRecurring) {
        if (!form.endDateTime) errors.endDateTime = "End date is required.";
        else if (form.startDateTime && new Date(form.startDateTime) >= new Date(form.endDateTime)) {
            errors.endDateTime = "End must be after start.";
        }
    }

    if (isRecurring) {
        if (!Number.isInteger(form.interval) || form.interval < 1) {
            errors.interval = "Repeat every must be a whole number of at least 1.";
        }
        if (form.frequency === "WEEKLY" && form.byWeekday.length === 0) {
            errors.byWeekday = "Pick at least one weekday.";
        }
        // Compare calendar dates as strings (YYYY-MM-DD sorts correctly); same day is allowed.
        if (form.recurrenceEnd && form.startDateTime &&
            form.recurrenceEnd < form.startDateTime.slice(0, 10)) {
            errors.recurrenceEnd = "Repeat-until can't be before the start date.";
        }
    }
    return errors;
}

const TaskDrawer = forwardRef<TaskDrawerHandle, TaskDrawerProps>(function TaskDrawer(
    { tasks, setTasks, categories, setCategories, onEditingChange }, ref,
) {
    const { createTask, updateTask, deleteTask } = useTaskActions(setTasks);
    const formId = useId();

    const [form, setForm] = useState<TaskFormValues>(initialForm);
    const [editForm, setEditForm] = useState<TaskFormValues>(initialForm);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [editErrors, setEditErrors] = useState<FormErrors>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [subView, setSubView] = useState<SubView | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
    // Blocks a second tap on Save while the first request is still running.
    const [busy, setBusy] = useState(false);

    useEffect(() => { onEditingChange?.(editingId); }, [editingId, onEditingChange]);

    const closeForm = useCallback(() => {
        setFormOpen(false);
        setEditingId(null);
    }, []);

    useImperativeHandle(ref, () => ({
        openAdd: (prefill) => {
            setEditingId(null);
            setForm({ ...initialForm, ...prefill });
            setFormErrors({});
            setFormOpen(true);
        },
        openEdit: (task) => {
            setEditErrors({});
            setEditingId(task.id);
            setEditForm({
                name: task.name,
                description: task.description ?? "",
                startDateTime: task.startDateTime ? isoToLocalInput(task.startDateTime) : "",
                endDateTime: task.endDateTime ? isoToLocalInput(task.endDateTime) : "",
                priority: task.priority,
                categoryId: task.categoryId ?? "",
                frequency: task.frequency ?? "",
                interval: task.interval ?? 1,
                byWeekday: task.byWeekday,
                recurrenceEnd: task.recurrenceEnd ? isoToDateOnly(task.recurrenceEnd) : "",
            });
            setFormOpen(true);
        },
        requestDelete: (task) => setConfirmDelete(task),
    }), []);

    const handleAddTask = async () => {
        if (busy) return;
        const errs = validateTask(form);
        setFormErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setBusy(true);
        try {
            const created = await createTask({
                ...form,
                endDateTime: form.frequency ? form.startDateTime : form.endDateTime,
            });
            if (created) { setForm(initialForm); setFormErrors({}); setFormOpen(false); }
        } finally {
            setBusy(false);
        }
    };

    const handleEditSubmit = async () => {
        if (busy) return;
        const task = tasks.find(t => t.id === editingId);
        if (!task) return;
        const errs = validateTask(editForm);
        setEditErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setBusy(true);
        try {
            await updateTask(task, {
                ...editForm,
                endDateTime: editForm.frequency ? editForm.startDateTime : editForm.endDateTime,
                frequency: editForm.frequency ? (editForm.frequency as Task["frequency"]) : null,
                recurrenceEnd: editForm.recurrenceEnd || null,
            });
            toast.success("Task updated successfully");
            closeForm();
        } finally {
            setBusy(false);
        }
    };

    // Escape, backdrop and the X step back out of a sub-screen first, then close the sheet.
    const handleClose = () => {
        if (subView) subView.onBack();
        else closeForm();
    };

    const title = subView?.title ?? (editingId ? "Edit task" : "Add task");

    return (
        <>
            <Sheet
                open={formOpen}
                onClose={handleClose}
                title={title}
                footer={!subView && (
                    <Button type="submit" form={formId} variant="primary" size="lg" fullWidth disabled={busy}>
                        {busy ? "Saving…" : editingId ? "Save changes" : "Add task"}
                    </Button>
                )}
            >
                {subView && (
                    <Button variant="ghost" size="sm" onClick={subView.onBack} className="mb-3 -ml-2">
                        <ChevronLeftIcon aria-hidden="true" /> Back
                    </Button>
                )}
                {editingId ? (
                    <TaskForm formId={formId} value={editForm} onChange={setEditForm} errors={editErrors} categories={categories}
                        setCategories={setCategories} setTasks={setTasks} onSubmit={handleEditSubmit} onSubViewChange={setSubView} />
                ) : (
                    <TaskForm formId={formId} value={form} onChange={setForm} errors={formErrors} categories={categories}
                        setCategories={setCategories} setTasks={setTasks} onSubmit={handleAddTask} onSubViewChange={setSubView} />
                )}
            </Sheet>

            <Sheet
                open={confirmDelete !== null}
                onClose={() => setConfirmDelete(null)}
                title="Delete this task?"
                footer={
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setConfirmDelete(null)}>Keep it</Button>
                        <Button variant="danger" className="flex-1" onClick={() => {
                            const t = confirmDelete;
                            setConfirmDelete(null);
                            if (!t) return;
                            deleteTask(t);
                            if (editingId === t.id) closeForm();
                        }}>Delete task</Button>
                    </div>
                }
            >
                <p className="text-body text-ink">
                    &ldquo;{confirmDelete?.name}&rdquo; will be removed for good. This can&apos;t be undone.
                </p>
            </Sheet>
        </>
    );
});

export default TaskDrawer;
