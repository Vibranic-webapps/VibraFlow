"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Sheet } from "@/app/components/ui/Sheet";

/** Opens the real Sheet (backdrop, Escape, focus handling) so the behaviour can be tried on a phone. */
export function SheetDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="primary" fullWidth onClick={() => setOpen(true)}>
                Open the sheet
            </Button>
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title="Add a task"
                footer={
                    <Button variant="primary" fullWidth onClick={() => setOpen(false)}>
                        Add task
                    </Button>
                }
            >
                <Input label="What needs doing?" placeholder="Water the herbs" />
                <p className="mt-3 text-caption text-ink-soft">Tap outside, press Escape or use the X to close.</p>
            </Sheet>
        </>
    );
}
