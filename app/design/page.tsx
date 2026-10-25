import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { CheckButton } from "@/app/components/ui/CheckButton";
import { EditIcon, TrashIcon, CloseIcon, CheckIcon, AlertIcon } from "@/app/components/ui/icons";
import { IconButton } from "@/app/components/ui/IconButton";
import { Input } from "@/app/components/ui/Input";
import { Pill, PillButton } from "@/app/components/ui/Pill";
import { Select } from "@/app/components/ui/Select";
import { SheetPanel } from "@/app/components/ui/Sheet";
import { Sign } from "@/app/components/ui/Sign";
import { TabBar } from "@/app/components/ui/TabBar";
import { Textarea } from "@/app/components/ui/Textarea";
import { SheetDemo } from "./SheetDemo";
import { TaskCardDemo } from "./TaskCardDemo";
import {
    COLOR_GROUPS,
    CONTRAST_ROWS,
    CONTRAST_WARNINGS,
    LIFTS,
    RADII,
    SPACING,
    TYPE_SCALE,
    type ContrastRow,
} from "./tokens";

export const metadata: Metadata = {
    title: "Design system · VibraFlow",
    robots: { index: false, follow: false },
};

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
    return (
        <section aria-labelledby={id} className="flex flex-col gap-4">
            <Sign as="h2" id={id}>
                {title}
            </Sign>
            {intro && <p className="text-body text-ink-soft">{intro}</p>}
            {children}
        </section>
    );
}

function Demo({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    return (
        <div className={"flex min-w-0 flex-col gap-1.5 " + (className ?? "")}>
            <p className="text-caption font-semibold text-ink-soft">{label}</p>
            {children}
        </div>
    );
}

function ContrastLine({ row, warn }: { row: ContrastRow; warn?: boolean }) {
    return (
        <li className="flex min-w-0 items-center gap-3">
            <span
                className={`line grid h-11 w-20 shrink-0 place-items-center rounded-input border-ink font-title text-title font-semibold ${row.bg} ${row.text}`}
            >
                Aa
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-body font-semibold text-ink">{row.label}</span>
                <span className="block text-caption text-ink-soft">{row.use}</span>
            </span>
            <span className="shrink-0 text-right">
                <span className="block font-title text-title font-semibold text-ink">{row.ratio.toFixed(2)}</span>
                <span className="block text-caption font-semibold text-ink-soft">{warn ? "limited" : row.ratio >= 4.5 ? "AA pass" : "large only"}</span>
            </span>
        </li>
    );
}

export default function DesignPage() {
    return (
        <div className="relative isolate min-h-dvh shrink-0 font-sans text-ink"><div aria-hidden="true" className="absolute inset-0 -z-10 bg-backdrop" />
            <div className="bg-grain mx-auto min-h-dvh w-full max-w-column overflow-x-clip bg-paper md:line md:border-y-0 md:border-ink">
                <main className="flex flex-col gap-8 px-4 pt-6 pb-12">
                    {/* ---------- intro ---------- */}
                    <header className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <span className="font-sticker -rotate-3 rounded-sign border-2 border-ink bg-accent px-3 py-0.5 text-display text-on-accent shadow-lift-sm">
                                Cozy
                            </span>
                            <Pill tone="neutral">Phase 1 · day only</Pill>
                        </div>
                        <Sign as="h1">VibraFlow design system</Sign>
                        <p className="text-body text-ink">
                            Every token and primitive of the cozy paper look, drawn for an iPhone at 390 × 844. Tap, focus and press the
                            things below: they are real.
                        </p>
                        <nav aria-label="On this page" className="flex flex-wrap gap-2">
                            {[
                                ["#colours", "Colours"],
                                ["#type", "Type"],
                                ["#shape", "Shape"],
                                ["#buttons", "Buttons"],
                                ["#forms", "Forms"],
                                ["#pills", "Pills"],
                                ["#cards", "Cards"],
                                ["#tabs", "Tab bar"],
                                ["#sheet", "Sheet"],
                            ].map(([href, label]) => (
                                <a
                                    key={href}
                                    href={href}
                                    className="press focus-ring line inline-flex min-h-11 items-center rounded-pill border-ink bg-surface px-3.5 text-body font-semibold text-ink shadow-lift-sm"
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                    </header>

                    {/* ---------- colours ---------- */}
                    <Section
                        id="colours"
                        title="Colours"
                        intro="Names say the job, not the colour. Use the Tailwind class under each swatch; never type a hex in a component."
                    >
                        {COLOR_GROUPS.map((group) => (
                            <div key={group.title} className="flex flex-col gap-2.5">
                                <h3 className="font-title text-title font-semibold text-ink">{group.title}</h3>
                                <p className="text-caption text-ink-soft">{group.blurb}</p>
                                <ul className="grid grid-cols-2 gap-3">
                                    {group.swatches.map((s) => (
                                        <li key={s.token} className="min-w-0">
                                            <Card flush className="overflow-hidden">
                                                <div
                                                    className="line-b h-14 border-ink"
                                                    style={{ backgroundColor: `var(--${s.token})` }}
                                                    role="img"
                                                    aria-label={`${s.token} swatch`}
                                                />
                                                <div className="p-2.5">
                                                    <p className="text-caption font-semibold break-all text-ink">--{s.token}</p>
                                                    <p className="text-caption text-ink-soft">{s.hex}</p>
                                                    <p className="text-caption break-all text-ink-soft">{s.cls}</p>
                                                    <p className="text-caption text-ink-soft">{s.note}</p>
                                                </div>
                                            </Card>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        <div className="flex flex-col gap-2.5">
                            <h3 className="font-title text-title font-semibold text-ink">Text contrast (WCAG 2.1)</h3>
                            <p className="text-caption text-ink-soft">Body text needs 4.5 or more. Every pair below is what we ship.</p>
                            <Card>
                                <ul className="flex flex-col gap-3">
                                    {CONTRAST_ROWS.map((row) => (
                                        <ContrastLine key={row.label} row={row} />
                                    ))}
                                </ul>
                            </Card>
                            <h3 className="mt-2 font-title text-title font-semibold text-ink">Do not use for words</h3>
                            <Card tone="sunk">
                                <ul className="flex flex-col gap-3">
                                    {CONTRAST_WARNINGS.map((row) => (
                                        <ContrastLine key={row.label} row={row} warn />
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    </Section>

                    {/* ---------- type ---------- */}
                    <Section
                        id="type"
                        title="Type"
                        intro="Fredoka 600 for titles and numbers, Inter for everything you read, Caveat Brush only on stickers."
                    >
                        <Card className="flex flex-col gap-4">
                            {TYPE_SCALE.map((t) => (
                                <div key={t.name} className="min-w-0">
                                    <p className={`${t.cls} text-ink wrap-break-word`}>Water the herbs</p>
                                    <p className="text-caption text-ink-soft">
                                        {t.name} · {t.px}px · {t.font} · {t.use}
                                    </p>
                                </div>
                            ))}
                            <div className="min-w-0">
                                <p className="font-sticker inline-block -rotate-3 rounded-sign border-2 border-ink bg-accent px-4 py-0.5 text-display text-on-accent shadow-lift-sm">
                                    Day done!
                                </p>
                                <p className="mt-2 text-caption text-ink-soft">
                                    sticker · Caveat Brush · font-sticker · rare reward moments only, never for UI text
                                </p>
                            </div>
                        </Card>
                    </Section>

                    {/* ---------- shape ---------- */}
                    <Section id="shape" title="Shape and depth" intro="A 2px ink line on everything, a hard offset lift instead of a blur, a little paper grain.">
                        <Demo label="Radii">
                            <ul className="grid grid-cols-3 gap-3">
                                {RADII.map((r) => (
                                    <li key={r.token} className="min-w-0 text-center">
                                        <div className={`line h-14 border-ink bg-surface ${r.cls}`} />
                                        <p className="mt-1 text-caption font-semibold text-ink">{r.cls}</p>
                                        <p className="text-caption text-ink-soft">{r.px === 999 ? "full" : `${r.px}px`}</p>
                                    </li>
                                ))}
                            </ul>
                        </Demo>
                        <Demo label="Lift (offset shadow, never blurred)">
                            <ul className="grid grid-cols-2 gap-4 pb-1">
                                {LIFTS.map((l) => (
                                    <li key={l.token} className="min-w-0">
                                        <div className={`line grid h-14 place-items-center rounded-card border-ink bg-surface ${l.cls}`} />
                                        <p className="mt-1.5 text-caption font-semibold break-all text-ink">{l.cls}</p>
                                        <p className="text-caption text-ink-soft">{l.use}</p>
                                    </li>
                                ))}
                            </ul>
                        </Demo>
                        <Demo label="Press state: sinks 2px and the shadow flattens. Left is resting, right is pressed.">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="line press grid h-14 place-items-center rounded-btn border-ink bg-accent text-body font-semibold text-on-accent shadow-lift-sm">
                                    Resting
                                </div>
                                <div
                                    data-force-pressed
                                    className="line press grid h-14 place-items-center rounded-btn border-ink bg-accent text-body font-semibold text-on-accent shadow-lift-sm"
                                >
                                    Pressed
                                </div>
                            </div>
                        </Demo>
                        <Demo label="Paper grain (bg-grain) on paper and surface">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="line bg-grain grid h-16 place-items-center rounded-card border-ink bg-paper text-caption font-semibold text-ink">paper</div>
                                <div className="line bg-grain grid h-16 place-items-center rounded-card border-ink bg-surface text-caption font-semibold text-ink">surface</div>
                            </div>
                        </Demo>
                        <Demo label="Spacing (4px base, Tailwind scale)">
                            <ul className="flex flex-col gap-1.5">
                                {SPACING.map((s) => (
                                    <li key={s.token} className="flex items-center gap-3">
                                        <span className="w-24 shrink-0 text-caption font-semibold text-ink">--{s.token}</span>
                                        <span className="line h-3 rounded-sign border-ink bg-accent" style={{ width: `${s.px * 3}px` }} />
                                        <span className="text-caption text-ink-soft">{s.px}px · {s.cls}</span>
                                    </li>
                                ))}
                            </ul>
                        </Demo>
                    </Section>

                    {/* ---------- buttons ---------- */}
                    <Section id="buttons" title="Buttons" intro="One orange button per screen. All are at least 44px tall.">
                        {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => {
                            const label = variant === "danger" ? "Delete task" : variant === "primary" ? "Save task" : "Cancel";
                            return (
                                <Demo key={variant} label={variant}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant={variant}>{label}</Button>
                                        <Button variant={variant} data-force-pressed>
                                            {label}
                                        </Button>
                                        <Button variant={variant} disabled>
                                            {label}
                                        </Button>
                                        <Button variant={variant} data-force-focus>
                                            {label}
                                        </Button>
                                    </div>
                                    <p className="text-caption text-ink-soft">default · pressed · disabled · focus</p>
                                </Demo>
                            );
                        })}
                        <Demo label="Sizes: sm 44px · md 48px · lg 56px">
                            <div className="flex flex-col gap-3">
                                <Button variant="primary" size="sm">Small, 44px</Button>
                                <Button variant="primary" size="md">Medium, 48px</Button>
                                <Button variant="primary" size="lg" fullWidth>Large, full width, 56px</Button>
                            </div>
                        </Demo>
                        <Demo label="Icon buttons (44 × 44) and the round check">
                            <div className="flex flex-wrap items-center gap-3">
                                <IconButton label="Edit task" icon={<EditIcon />} />
                                <IconButton label="Edit task, pressed" icon={<EditIcon />} data-force-pressed />
                                <IconButton label="Delete task" icon={<TrashIcon />} variant="danger" />
                                <IconButton label="Close" icon={<CloseIcon />} variant="ghost" />
                                <IconButton label="Edit task, disabled" icon={<EditIcon />} disabled />
                                <IconButton label="Edit task, focus" icon={<EditIcon />} data-force-focus />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <CheckButton checked={false} label="Not done" />
                                <CheckButton checked label="Done" />
                                <CheckButton checked={false} label="Disabled" disabled className="opacity-60" />
                                <CheckButton checked={false} label="Focus" data-force-focus />
                            </div>
                        </Demo>
                    </Section>

                    {/* ---------- forms ---------- */}
                    <Section id="forms" title="Forms" intro="Label always visible. 48px high, 16px text (iPhone never zooms), full width, never past the edge.">
                        <Card className="flex flex-col gap-4">
                            <Input label="What needs doing?" placeholder="Water the herbs" hint="A few words are enough." />
                            <Input label="Focused" defaultValue="Water the herbs" data-force-focus />
                            <Input
                                label="What needs doing?"
                                defaultValue=""
                                error="Add a title, like Water the herbs."
                            />
                            <Input label="Disabled" defaultValue="Locked while saving" disabled />
                            <Input
                                label="A very long value must not push the page sideways"
                                defaultValue="Supercalifragilisticexpialidocious-and-then-some-more-words-that-never-end"
                            />
                            <Textarea label="Notes" placeholder="Anything to remember?" hint="Optional." />
                            <Textarea label="Notes" defaultValue="" error="Notes can be 500 characters at most. Cut a few words." />
                            <Select label="Priority" defaultValue="normal" hint="High tasks show first.">
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                            </Select>
                            <Select label="Category" defaultValue="" error="Pick a category so the task has a colour.">
                                <option value="" disabled>Choose one</option>
                                <option value="home">Home</option>
                                <option value="work">Work</option>
                            </Select>
                        </Card>
                    </Section>

                    {/* ---------- pills ---------- */}
                    <Section id="pills" title="Pills" intro="Small labels. Words always, colour is a bonus.">
                        <Demo label="Static">
                            <div className="flex flex-wrap gap-2">
                                <Pill>Neutral</Pill>
                                <Pill tone="goal">Goal: Cottage</Pill>
                                <Pill tone="accent">Next up</Pill>
                                <Pill tone="ok"><CheckIcon width={14} height={14} />Done</Pill>
                                <Pill tone="warn">Due soon</Pill>
                                <Pill tone="danger"><AlertIcon width={14} height={14} />Overdue</Pill>
                            </div>
                        </Demo>
                        <Demo label="Tappable filters (44px): off · on · pressed · disabled · focus">
                            <div className="flex flex-wrap gap-2">
                                <PillButton selected={false}>All</PillButton>
                                <PillButton selected>Today</PillButton>
                                <PillButton data-force-pressed>Pressed</PillButton>
                                <PillButton disabled>Disabled</PillButton>
                                <PillButton data-force-focus>Focus</PillButton>
                            </div>
                        </Demo>
                    </Section>

                    {/* ---------- cards ---------- */}
                    <Section id="cards" title="Cards" intro="Solid parchment. No glass, no glow.">
                        <div className="grid grid-cols-2 gap-3">
                            <Card tone="default"><p className="text-caption font-semibold text-ink">default</p></Card>
                            <Card tone="raised"><p className="text-caption font-semibold text-ink">raised</p></Card>
                            <Card tone="sunk"><p className="text-caption font-semibold text-ink">sunk (done)</p></Card>
                            <Card tone="accent"><p className="text-caption font-semibold text-ink">accent</p></Card>
                        </div>

                        <h3 className="font-title text-title font-semibold text-ink">Task card</h3>
                        <p className="text-body text-ink-soft">
                            Title, when, and one next move. Edit and delete are always there. Try them: delete asks first, then offers undo.
                        </p>
                        <div className="flex flex-col gap-3">
                            <TaskCardDemo title="Water the herbs" when="Today, 14:00 – 14:30" badge={{ text: "In 20 min", tone: "accent" }} />
                            <TaskCardDemo title="Send the invoice to the bakery" when="Yesterday, 17:00" badge={{ text: "Overdue", tone: "danger" }} />
                            <TaskCardDemo title="Call mum" when="Tomorrow, 09:30" />
                            <TaskCardDemo title="Fold the laundry" when="Today, 08:00" startDone />
                            <TaskCardDemo
                                title="Book the long-weekend trip to the coast, check the ferry times and ask whether the dog can come along"
                                when="Fri 31 Oct, 18:00 – 19:00"
                                badge={{ text: "In 6 days", tone: "neutral" }}
                            />
                        </div>

                        <Card tone="raised" className="flex flex-col gap-2">
                            <h3 className="font-title text-heading font-semibold text-ink">Nothing planned yet</h3>
                            <p className="text-body text-ink-soft">Add your first task and it lands on the board.</p>
                            <Button variant="primary" className="mt-1 self-start">Add a task</Button>
                        </Card>
                    </Section>

                    {/* ---------- tab bar ---------- */}
                    <Section
                        id="tabs"
                        title="Tab bar"
                        intro="Bottom of the screen, in thumb reach. Pads for the iPhone home bar (env(safe-area-inset-bottom)). The shell decides where it sits."
                    >
                        {(["board", "calendar", "backpack"] as const).map((tab) => (
                            <Demo key={tab} label={`${tab} active`}>
                                <div className="line overflow-hidden rounded-card border-ink">
                                    <TabBar active={tab} label={`Preview: ${tab}`} className="border-t-0" />
                                </div>
                            </Demo>
                        ))}
                    </Section>

                    {/* ---------- sheet ---------- */}
                    <Section
                        id="sheet"
                        title="Sheet"
                        intro="Task details, add and edit open here on a phone. Static look first, then the real one."
                    >
                        <div className="bg-scrim -mx-4 flex min-h-72 items-end overflow-hidden px-4 pt-6">
                            <SheetPanel
                                title="Water the herbs"
                                titleId="sheet-preview-title"
                                showClose
                                footer={
                                    <div className="flex gap-2">
                                        <Button className="flex-1">Edit</Button>
                                        <Button variant="primary" className="flex-1">Mark done</Button>
                                    </div>
                                }
                            >
                                <p className="text-body text-ink">Today, 14:00 – 14:30</p>
                                <p className="mt-1 text-body text-ink-soft">Basil first, then the mint on the windowsill.</p>
                            </SheetPanel>
                        </div>
                        <SheetDemo />
                    </Section>
                </main>
            </div>
        </div>
    );
}
