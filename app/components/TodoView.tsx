"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Task, TodoState } from "@/app/types";
import { useTaskActions } from "@/app/hooks/useTaskActions";
import { presetColors } from "@/app/lib/tokens";
import { Button } from "@/app/components/ui/Button";
import { IconButton } from "@/app/components/ui/IconButton";
import { Card } from "@/app/components/ui/Card";
import { PillButton } from "@/app/components/ui/Pill";
import { CONTROL } from "@/app/components/ui/Field";
import { cx } from "@/app/components/ui/cx";
import { PlusIcon, TrashIcon, MoreIcon, CloseIcon, CheckIcon, BoardIcon } from "@/app/components/ui/icons";

// Starter columns use the first preset colours (read from the tokens when clicked, never hardcoded here).
const STARTERS = [
    { name: "To do", colorIndex: 0 },
    { name: "Doing", colorIndex: 4 },
    { name: "Done", colorIndex: 2 },
];

const COLUMN_WIDTH = "w-[82vw] max-w-72 shrink-0 snap-start sm:w-72";

interface Props {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    states: TodoState[];
    setStates: React.Dispatch<React.SetStateAction<TodoState[]>>;
    loading: boolean;
}

export default function TodoView({ tasks, setTasks, states, setStates, loading }: Props) {
    const { createTask, updateTask, deleteTask } = useTaskActions(setTasks);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    // "card:<id>" = the Move-to list of a card, "col:<id>" = the options of a column. Both open inline, no popups.
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [confirmDel, setConfirmDel] = useState<string | null>(null);
    // Todo delete asks first (rule N2), same inline pattern as the column delete.
    const [confirmTodo, setConfirmTodo] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const todos = tasks.filter(t => t.startDateTime === null);
    const orphan = todos.filter(t => !t.stateId);
    const inState = (id: string) =>
        todos.filter(t => t.stateId === id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    async function createState(name: string, color: string, order: number) {
        const res = await fetch("/api/todo-states", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, order }),
        });
        if (res.ok) { const created = await res.json(); setStates(prev => [...prev, created]); return; }
        toast.error("Failed to add column");
    }

    async function addStarters() {
        const colors = presetColors();
        for (let i = 0; i < STARTERS.length; i++) {
            await createState(STARTERS[i].name, colors[STARTERS[i].colorIndex % colors.length], i);
        }
    }

    async function patchState(id: string, updates: Partial<TodoState>) {
        setStates(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
        const res = await fetch(`/api/todo-states/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        if (!res.ok) toast.error("Failed to update column");
    }

    async function removeState(id: string) {
        setConfirmDel(null);
        setStates(prev => prev.filter(s => s.id !== id));
        setTasks(prev => prev.map(t => (t.stateId === id ? { ...t, stateId: null, state: null } : t)));
        const res = await fetch(`/api/todo-states/${id}`, { method: "DELETE" });
        if (!res.ok) toast.error("Failed to delete column");
    }

    async function addTodo(stateId: string, name: string) {
        if (!name.trim()) return;
        await createTask({ name: name.trim(), stateId, order: inState(stateId).length });
    }

    function moveTodo(task: Task, stateId: string | null) {
        if (task.stateId === stateId) return;
        const target = states.find(s => s.id === stateId) ?? null;
        const order = stateId ? inState(stateId).length : 0;
        setTasks(prev => prev.map(t =>
            t.id === task.id
                ? { ...t, stateId, order, state: target ? { id: target.id, name: target.name, color: target.color } : null }
                : t));
        updateTask(task, { stateId, order });
    }

    if (loading) {
        return (
            <div data-hscroll className="flex gap-4 overflow-x-auto p-4" aria-busy="true" aria-label="Loading board">
                {[0, 1, 2].map(i => (
                    <Card key={i} tone="sunk" className={cx(COLUMN_WIDTH, "animate-pulse")}>
                        <div className="h-5 w-24 rounded-input bg-surface-edge" />
                        <div className="mt-3 space-y-2">
                            {[0, 1].map(j => <div key={j} className="h-12 rounded-card bg-surface-edge" />)}
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    if (states.length === 0) {
        return (
            <div className="mx-auto flex max-w-column flex-col items-center gap-3 px-4 py-12 text-center">
                <span className="line grid size-16 place-items-center rounded-full border-ink bg-surface text-ink"><BoardIcon width={30} height={30} /></span>
                <h2 className="font-title text-heading font-semibold text-ink">Set up your board</h2>
                <p className="text-body text-ink-soft">Sort todos into columns by status. Start with a classic set or build your own.</p>
                <Button variant="primary" size="lg" fullWidth onClick={addStarters}>
                    <PlusIcon aria-hidden="true" /> Add To do · Doing · Done
                </Button>
                <Button variant="ghost" onClick={() => createState("New column", presetColors()[0], 0)}>
                    Or add a custom column
                </Button>
            </div>
        );
    }

    const renderCard = (task: Task) => {
        const menuKey = `card:${task.id}`;
        const open = menuFor === menuKey;
        return (
            <Card
                key={task.id}
                as="article"
                draggable
                onDragStart={() => setDraggingId(task.id)}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                className={cx("flex flex-col gap-2 p-3", draggingId === task.id && "opacity-40")}
            >
                <p className="min-h-6 text-body font-semibold break-words text-ink">{task.name}</p>
                {confirmTodo === task.id ? (
                    <div className="flex flex-col gap-2">
                        <span className="text-body font-semibold text-ink">Delete this todo?</span>
                        <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => setConfirmTodo(null)}>Keep it</Button>
                            <Button size="sm" variant="danger" className="flex-1"
                                onClick={() => { setConfirmTodo(null); deleteTask(task); }}>
                                Delete
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button size="sm" className="min-w-0 flex-1" aria-expanded={open}
                            onClick={() => setMenuFor(open ? null : menuKey)}>
                            Move to…
                        </Button>
                        <IconButton label={`Delete ${task.name}`} variant="danger" icon={<TrashIcon />}
                            onClick={() => { setMenuFor(null); setConfirmTodo(task.id); }} />
                    </div>
                )}
                {open && confirmTodo !== task.id && (
                    <div className="flex flex-wrap gap-2" role="group" aria-label={`Move ${task.name} to`}>
                        {states.filter(s => s.id !== task.stateId).map(s => (
                            <PillButton key={s.id} onClick={() => { moveTodo(task, s.id); setMenuFor(null); }}>
                                <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
                            </PillButton>
                        ))}
                    </div>
                )}
            </Card>
        );
    };

    const renderColumn = (state: TodoState) => {
        const items = inState(state.id);
        const isOver = dragOver === state.id;
        const menuKey = `col:${state.id}`;
        const menuOpen = menuFor === menuKey;
        return (
            <section
                key={state.id}
                aria-label={state.name}
                onDragOver={e => { e.preventDefault(); setDragOver(state.id); }}
                onDragLeave={() => setDragOver(prev => (prev === state.id ? null : prev))}
                onDrop={e => { e.preventDefault(); const t = todos.find(t => t.id === draggingId); if (t) moveTodo(t, state.id); setDragOver(null); }}
                className={cx("line flex flex-col rounded-card", COLUMN_WIDTH, isOver ? "border-accent bg-accent-soft" : "bg-surface-sunk")}
            >
                <div className="line-b flex items-center gap-2 p-2">
                    {confirmDel === state.id ? (
                        <div className="flex w-full flex-col gap-2 p-1">
                            <span className="text-body font-semibold text-ink">Delete this column?</span>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1" onClick={() => setConfirmDel(null)}>Keep it</Button>
                                <Button size="sm" variant="danger" className="flex-1" onClick={() => removeState(state.id)}>Delete</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span aria-hidden="true" className="ml-1 size-3 shrink-0 rounded-full border border-ink" style={{ background: state.color }} />
                            {editing === state.id ? (
                                <input autoFocus defaultValue={state.name} aria-label="Column name"
                                    onBlur={e => { patchState(state.id, { name: e.target.value || state.name }); setEditing(null); }}
                                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditing(null); }}
                                    className={cx(CONTROL, "h-11 min-w-0 flex-1")} />
                            ) : (
                                <h3 className="font-title min-w-0 flex-1 truncate text-lead font-semibold text-ink">{state.name}</h3>
                            )}
                            <span className="shrink-0 text-caption font-semibold text-ink-soft">{items.length}</span>
                            <IconButton label={`Options for ${state.name}`} variant="ghost" icon={<MoreIcon />}
                                aria-expanded={menuOpen} onClick={() => setMenuFor(menuOpen ? null : menuKey)} />
                        </>
                    )}
                </div>

                {menuOpen && confirmDel !== state.id && (
                    <div className="line-b flex flex-col gap-2 p-3">
                        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Column colour">
                            {presetColors().map(c => (
                                <button key={c} type="button" role="radio" aria-checked={state.color.toUpperCase() === c}
                                    aria-label={c}
                                    onClick={() => patchState(state.id, { color: c })}
                                    className="press focus-ring line grid h-11 place-items-center rounded-input text-ink"
                                    style={{ background: c }}>
                                    {state.color.toUpperCase() === c && <CheckIcon aria-hidden="true" />}
                                </button>
                            ))}
                        </div>
                        <Button size="sm" onClick={() => { setEditing(state.id); setMenuFor(null); }}>Rename column</Button>
                        <Button size="sm" variant="danger" onClick={() => { setConfirmDel(state.id); setMenuFor(null); }}>
                            <TrashIcon aria-hidden="true" /> Delete column
                        </Button>
                    </div>
                )}

                <div className="flex flex-1 flex-col gap-2 p-2">
                    {items.length === 0 && (
                        <div className="rounded-card border-2 border-dashed border-surface-edge py-4 text-center text-caption text-ink-soft">
                            Nothing here yet
                        </div>
                    )}
                    {items.map(renderCard)}
                </div>

                <AddTodo columnName={state.name} onAdd={name => addTodo(state.id, name)} />
            </section>
        );
    };

    return (
        <div data-hscroll className="flex snap-x snap-mandatory scroll-p-4 items-start gap-4 overflow-x-auto p-4">
            {orphan.length > 0 && (
                <section
                    aria-label="Unassigned"
                    onDragOver={e => { e.preventDefault(); setDragOver("unassigned"); }}
                    onDrop={e => { e.preventDefault(); const t = todos.find(t => t.id === draggingId); if (t) moveTodo(t, null); setDragOver(null); }}
                    className={cx("line flex flex-col rounded-card", COLUMN_WIDTH, dragOver === "unassigned" ? "border-accent bg-accent-soft" : "bg-surface-sunk")}>
                    <div className="line-b flex items-center gap-2 p-3">
                        <h3 className="font-title flex-1 text-lead font-semibold text-ink-soft">Unassigned</h3>
                        <span className="text-caption font-semibold text-ink-soft">{orphan.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 p-2">{orphan.map(renderCard)}</div>
                </section>
            )}

            {[...states].sort((a, b) => a.order - b.order).map(renderColumn)}

            <div className={COLUMN_WIDTH}>
                {adding ? (
                    <AddColumn
                        onAdd={name => {
                            const colors = presetColors();
                            if (name.trim()) createState(name.trim(), colors[states.length % colors.length], states.length);
                            setAdding(false);
                        }}
                        onCancel={() => setAdding(false)}
                    />
                ) : (
                    <Button fullWidth size="lg" onClick={() => setAdding(true)}>
                        <PlusIcon aria-hidden="true" /> Add column
                    </Button>
                )}
            </div>
        </div>
    );
}

function AddTodo({ columnName, onAdd }: { columnName: string; onAdd: (name: string) => void }) {
    const [name, setName] = useState("");
    const submit = () => { onAdd(name); setName(""); };
    return (
        <form className="line-t flex gap-2 p-2" onSubmit={e => { e.preventDefault(); submit(); }}>
            <input
                value={name}
                onChange={e => setName(e.target.value)}
                aria-label={`Add a todo to ${columnName}`}
                placeholder="Add a todo"
                enterKeyHint="done"
                className={cx(CONTROL, "h-12 min-w-0 flex-1")}
            />
            <IconButton type="submit" label={`Add todo to ${columnName}`} icon={<PlusIcon />} disabled={!name.trim()} className="size-12" />
        </form>
    );
}

function AddColumn({ onAdd, onCancel }: { onAdd: (name: string) => void; onCancel: () => void }) {
    const [name, setName] = useState("");
    return (
        <form className="line flex flex-col gap-2 rounded-card bg-surface p-3"
            onSubmit={e => { e.preventDefault(); onAdd(name); }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
                aria-label="Column name"
                placeholder="Column name"
                className={cx(CONTROL, "h-12")} />
            <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" className="flex-1">Add</Button>
                <IconButton label="Cancel" icon={<CloseIcon />} onClick={onCancel} />
            </div>
        </form>
    );
}
