"use client";
import { useState, useEffect, useRef } from "react";
import { Task, TaskFormValues, FormErrors, Category } from "@/app/types";
import { priorityOptions } from "@/app/constants";
import { IconPicker } from "@/app/components/IconPicker";
import ColorPicker from "./ColorPicker";
import DateTimePicker from "./DateTimePicker";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Card } from "@/app/components/ui/Card";
import { Pill } from "@/app/components/ui/Pill";
import { CategoryBadge } from "@/app/components/tasks/CategoryBadge";
import {
    CalendarIcon, ClockIcon, TagIcon, FlagIcon, RepeatIcon, ChevronRightIcon,
    CheckIcon, PlusIcon, TrashIcon, AlertIcon,
} from "@/app/components/ui/icons";
import { useCategoryActions } from "@/app/hooks/useCategoryActions";
import { parseValue } from "@/app/lib/calendar";
import { presetColors } from "@/app/lib/tokens";

type PickField = "startDateTime" | "endDateTime" | "recurrenceEnd";
type Panel = "category" | "priority" | "repeat";

export const fieldLabel = (p: PickField) =>
    p === "startDateTime" ? "start date & time"
    : p === "endDateTime" ? "end date & time"
    : "repeat-until date";

export interface SubView {
    title: string;
    onBack: () => void;
}

const displayValue = (s: string, withTime: boolean): string => {
    const d = parseValue(s);
    if (!d) return "";
    return withTime
        ? d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const weekdayOptions = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 0 },
];

/** One tappable line: icon, label, current value, chevron. Always 48px+ high. */
function PropertyRow({ icon, label, value, placeholder, onClick, error }: {
    icon: React.ReactNode; label: string; value?: React.ReactNode; placeholder: string; onClick: () => void; error?: string;
}) {
    return (
        <div>
            <button type="button" onClick={onClick}
                className="press focus-ring flex min-h-12 w-full min-w-0 items-center gap-3 px-3.5 py-2 text-left">
                <span className="shrink-0 text-ink-soft" aria-hidden="true">{icon}</span>
                <span className="shrink-0 text-body font-semibold text-ink">{label}</span>
                <span className="ml-auto flex min-w-0 items-center gap-1.5">
                    {value
                        ? <span className="flex min-w-0 items-center gap-1.5 truncate text-body text-ink">{value}</span>
                        : <span className="truncate text-body text-ink-soft">{placeholder}</span>}
                    <ChevronRightIcon aria-hidden="true" className="shrink-0 text-ink-soft" />
                </span>
            </button>
            {error && (
                <p role="alert" className="flex items-start gap-1.5 px-3.5 pb-2 text-caption font-semibold text-danger">
                    <AlertIcon width={16} height={16} className="mt-px shrink-0" /> <span>{error}</span>
                </p>
            )}
        </div>
    );
}

/** A list option (category, priority): 48px+ button with a check on the chosen one. */
function OptionRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} aria-pressed={selected}
            className="line press focus-ring flex min-h-12 w-full min-w-0 items-center gap-3 rounded-input border-ink bg-surface-raised px-3.5 py-2 text-left">
            {children}
            {selected && <CheckIcon aria-hidden="true" className="ml-auto shrink-0" />}
        </button>
    );
}

interface TaskFormProps {
    value: TaskFormValues;
    onChange: React.Dispatch<React.SetStateAction<TaskFormValues>>;
    errors: FormErrors;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onSubmit: () => void;
    /** id for the <form>. The sheet footer's submit button points at it (form="..."). */
    formId: string;
    onSubViewChange?: (sub: SubView | null) => void;
}

export default function TaskForm({ value, onChange, errors, categories, setCategories, setTasks, onSubmit, formId, onSubViewChange }: TaskFormProps) {
    const [picking, setPicking] = useState<PickField | null>(null);
    const [panel, setPanel] = useState<Panel | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const { createCategory, deleteCategory } = useCategoryActions(setCategories);
    const [creatingCat, setCreatingCat] = useState(false);
    const [newCat, setNewCat] = useState({ name: "", color: "", icon: "" });
    const [catError, setCatError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // After a failed submit, move focus to the first field that has a problem.
    useEffect(() => {
        if (Object.keys(errors).length === 0) return;
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }, [errors]);

    const startNewCategory = () => {
        setCatError(null);
        setNewCat({ name: "", color: presetColors()[0], icon: "" });
        setCreatingCat(true);
    };

    const handleDeleteCategory = async (id: string) => {
        const ok = await deleteCategory(id);
        if (ok) {
            setTasks(prev => prev.map(t =>
                t.category?.id === id ? { ...t, categoryId: null, category: null, categoryRemoved: true } : t));
            if (value.categoryId === id) onChange({ ...value, categoryId: "" });
        }
    };

    const handleCreateCategory = async () => {
        if (!newCat.name.trim()) { setCatError("Give the category a name, like Home."); return; }
        if (!newCat.icon) { setCatError("Pick an icon for it."); return; }
        const created = await createCategory({ name: newCat.name.trim(), color: newCat.color, icon: newCat.icon });
        if (created) {
            onChange({ ...value, categoryId: created.id });
            setCatError(null);
            setCreatingCat(false);
            setPanel(null);
        }
    };

    // Tell the sheet which sub-screen is open, so it can show a title and a Back button.
    useEffect(() => {
        if (!onSubViewChange) return;
        let sub: SubView | null = null;
        if (picking) sub = { title: `Select ${fieldLabel(picking)}`, onBack: () => setPicking(null) };
        else if (panel === "category") sub = creatingCat
            ? { title: "New category", onBack: () => setCreatingCat(false) }
            : { title: "Category", onBack: () => setPanel(null) };
        else if (panel === "priority") sub = { title: "Priority", onBack: () => setPanel(null) };
        else if (panel === "repeat") sub = { title: "Repeat", onBack: () => setPanel(null) };
        onSubViewChange(sub);
        return () => onSubViewChange(null);
    }, [picking, panel, creatingCat, onSubViewChange]);

    const toggleWeekday = (day: number) => {
        onChange({
            ...value,
            byWeekday: value.byWeekday.includes(day)
                ? value.byWeekday.filter(d => d !== day)
                : [...value.byWeekday, day],
        });
    };

    if (picking) {
        const isDateOnly = picking === "recurrenceEnd";
        const today = new Date();
        const start = parseValue(value.startDateTime);
        const min = picking === "startDateTime" ? today : (start && start > today ? start : today);

        return (
            <DateTimePicker
                key={picking}
                mode={isDateOnly ? "date" : "datetime"}
                value={value[picking]}
                min={min}
                showBack={!onSubViewChange}
                onCancel={() => setPicking(null)}
                onConfirm={(v) => { onChange({ ...value, [picking]: v }); setPicking(null); }}
                onClear={() => { onChange({ ...value, [picking]: "" }); setPicking(null); }}
            />
        );
    }

    if (panel === "category" && creatingCat) {
        return (
            <div className="flex flex-col gap-4">
                <Input label="Name" placeholder="Category name" autoFocus value={newCat.name}
                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
                <div className="flex flex-col gap-1.5">
                    <span className="text-body font-semibold text-ink">Colour</span>
                    <ColorPicker value={newCat.color} onChange={(col) => setNewCat({ ...newCat, color: col })} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-body font-semibold text-ink">Icon</span>
                    <IconPicker value={newCat.icon} onChange={(icon) => setNewCat({ ...newCat, icon })} />
                </div>
                {catError && (
                    <p role="alert" className="flex items-start gap-1.5 text-caption font-semibold text-danger">
                        <AlertIcon width={16} height={16} className="mt-px shrink-0" /> <span>{catError}</span>
                    </p>
                )}
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setCreatingCat(false); setCatError(null); }}>Cancel</Button>
                    <Button variant="primary" className="flex-1" onClick={handleCreateCategory}>Create</Button>
                </div>
            </div>
        );
    }

    if (panel === "category") {
        return (
            <div className="flex flex-col gap-2">
                <OptionRow selected={!value.categoryId} onClick={() => { onChange({ ...value, categoryId: "" }); setPanel(null); }}>
                    <span className="text-body text-ink">No category</span>
                </OptionRow>
                {categories.map(c => (
                    confirmDeleteId === c.id ? (
                        <Card key={c.id} tone="sunk" className="flex flex-col gap-2 p-3">
                            <p className="text-body text-ink">Delete &ldquo;{c.name}&rdquo;? Its tasks keep existing, just without a category.</p>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Keep it</Button>
                                <Button size="sm" variant="danger" className="flex-1"
                                    onClick={() => { handleDeleteCategory(c.id); setConfirmDeleteId(null); }}>Delete</Button>
                            </div>
                        </Card>
                    ) : (
                        <div key={c.id} className="flex items-stretch gap-2">
                            <div className="min-w-0 flex-1">
                                <OptionRow selected={value.categoryId === c.id} onClick={() => { onChange({ ...value, categoryId: c.id }); setPanel(null); }}>
                                    <CategoryBadge color={c.color} icon={c.icon} size="sm" />
                                    <span className="truncate text-body text-ink">{c.name}</span>
                                </OptionRow>
                            </div>
                            <button type="button" aria-label={`Delete category ${c.name}`} onClick={() => setConfirmDeleteId(c.id)}
                                className="line press focus-ring grid min-h-12 w-12 shrink-0 place-items-center rounded-input border-ink bg-surface text-ink">
                                <TrashIcon aria-hidden="true" />
                            </button>
                        </div>
                    )
                ))}
                <Button variant="secondary" onClick={startNewCategory} className="justify-start">
                    <PlusIcon aria-hidden="true" /> New category
                </Button>
            </div>
        );
    }

    if (panel === "priority") {
        return (
            <div className="flex flex-col gap-2">
                {priorityOptions.map(o => (
                    <OptionRow key={o.value} selected={value.priority === o.value}
                        onClick={() => { onChange({ ...value, priority: o.value as Task["priority"] }); setPanel(null); }}>
                        <span aria-hidden="true" className="line size-4 shrink-0 rounded-full border-ink" style={{ background: o.color }} />
                        <span className="text-body text-ink">{o.label}</span>
                    </OptionRow>
                ))}
            </div>
        );
    }

    if (panel === "repeat") {
        const unit = value.frequency === "DAILY" ? "day" : value.frequency === "WEEKLY" ? "week" : "month";
        return (
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <span className="text-body font-semibold text-ink">Frequency</span>
                    <div className="grid grid-cols-2 gap-2">
                        {([["", "Never"], ["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"]] as const).map(([val, label]) => {
                            const active = value.frequency === val;
                            return (
                                <Button key={val} variant={active ? "primary" : "secondary"} aria-pressed={active}
                                    onClick={() => onChange({ ...value, frequency: val })}>
                                    {label}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {value.frequency === "WEEKLY" && (
                    <div className="flex flex-col gap-2">
                        <span className="text-body font-semibold text-ink">On these days</span>
                        <div className="grid grid-cols-7 gap-1">
                            {weekdayOptions.map(d => {
                                const active = value.byWeekday.includes(d.value);
                                return (
                                    <button type="button" key={d.value} aria-pressed={active} aria-label={d.label}
                                        onClick={() => toggleWeekday(d.value)}
                                        className={`line press focus-ring grid h-11 min-w-0 place-items-center rounded-input border-ink text-caption font-semibold ${
                                            active ? "bg-accent text-on-accent shadow-lift-sm" : "bg-surface-raised text-ink"}`}>
                                        {d.label.slice(0, 2)}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.byWeekday && <p role="alert" className="text-caption font-semibold text-danger">{errors.byWeekday}</p>}
                    </div>
                )}

                {value.frequency && (
                    <div className="flex flex-col gap-2">
                        <span className="text-body font-semibold text-ink">Repeat every</span>
                        <div className="flex items-center gap-3">
                            <div className="line inline-flex items-center rounded-input border-ink bg-surface-raised">
                                <button type="button" aria-label="Fewer" onClick={() => onChange({ ...value, interval: Math.max(1, value.interval - 1) })}
                                    className="press focus-ring grid size-11 place-items-center rounded-input text-title leading-none text-ink">−</button>
                                <span className="w-10 text-center text-lead font-semibold tabular-nums text-ink" aria-live="polite">{value.interval}</span>
                                <button type="button" aria-label="More" onClick={() => onChange({ ...value, interval: value.interval + 1 })}
                                    className="press focus-ring grid size-11 place-items-center rounded-input text-title leading-none text-ink">+</button>
                            </div>
                            <span className="text-body text-ink-soft">{unit}{value.interval > 1 ? "s" : ""}</span>
                        </div>
                        {errors.interval && <p role="alert" className="text-caption font-semibold text-danger">{errors.interval}</p>}
                    </div>
                )}

                {value.frequency && (
                    <div className="flex flex-col gap-2">
                        <span className="text-body font-semibold text-ink">Repeat until</span>
                        <Button onClick={() => setPicking("recurrenceEnd")} className="justify-start">
                            <CalendarIcon aria-hidden="true" />
                            {value.recurrenceEnd
                                ? <span className="truncate">{displayValue(value.recurrenceEnd, false)}</span>
                                : <span className="text-ink-soft">No end date</span>}
                        </Button>
                        {errors.recurrenceEnd && <p role="alert" className="text-caption font-semibold text-danger">{errors.recurrenceEnd}</p>}
                    </div>
                )}

                <Button variant="primary" fullWidth onClick={() => setPanel(null)}>Done</Button>
            </div>
        );
    }

    const selectedCat = categories.find(c => c.id === value.categoryId);
    const selectedPriority = priorityOptions.find(o => o.value === value.priority);
    const repeatSummary = (() => {
        if (!value.frequency) return "";
        const unit = value.frequency === "DAILY" ? "day" : value.frequency === "WEEKLY" ? "week" : "month";
        if (value.interval > 1) return `Every ${value.interval} ${unit}s`;
        return value.frequency.charAt(0) + value.frequency.slice(1).toLowerCase();
    })();

    return (
        <form id={formId} ref={formRef} noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="flex flex-col gap-4">
            <Input label="Task name" placeholder="e.g. Water the herbs" value={value.name} error={errors.name}
                enterKeyHint="done" autoComplete="off"
                onChange={(e) => onChange({ ...value, name: e.target.value })} />
            <Textarea label="Notes" placeholder="Anything to remember (optional)" rows={2} value={value.description}
                onChange={(e) => onChange({ ...value, description: e.target.value })} />

            <Card className="flex flex-col divide-y-[1.5px] divide-ink/20 p-0" flush>
                <PropertyRow icon={<ClockIcon />} label="Starts" placeholder="Pick date & time"
                    value={displayValue(value.startDateTime, true)} error={errors.startDateTime}
                    onClick={() => setPicking("startDateTime")} />
                {!value.frequency && (
                    <PropertyRow icon={<ClockIcon />} label="Ends" placeholder="Pick date & time"
                        value={displayValue(value.endDateTime, true)} error={errors.endDateTime}
                        onClick={() => setPicking("endDateTime")} />
                )}
                <PropertyRow icon={<TagIcon />} label="Category" placeholder="None"
                    value={selectedCat ? (<><CategoryBadge color={selectedCat.color} icon={selectedCat.icon} size="sm" /><span className="truncate">{selectedCat.name}</span></>) : undefined}
                    onClick={() => setPanel("category")} />
                <PropertyRow icon={<FlagIcon />} label="Priority" placeholder="Medium"
                    value={selectedPriority ? (
                        <Pill tone="neutral">
                            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: selectedPriority.color }} />
                            {selectedPriority.label}
                        </Pill>
                    ) : undefined}
                    onClick={() => setPanel("priority")} />
                <PropertyRow icon={<RepeatIcon />} label="Repeat" placeholder="Never"
                    value={repeatSummary}
                    error={errors.interval || errors.byWeekday || errors.recurrenceEnd}
                    onClick={() => setPanel("repeat")} />
            </Card>
        </form>
    );
}

