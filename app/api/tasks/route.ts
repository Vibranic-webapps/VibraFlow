import { readSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse, after } from "next/server";
import { reportEvent } from "@/lib/vibradex";
import { readInstantField, readDateOnlyField } from "@/lib/datetime";

export async function GET() {
    try {
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;

        const tasks = await prisma.task.findMany({ where: { userId }, include: { category: true, state: true } })
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {        
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, priority, categoryId,
        frequency, interval, byWeekday, recurrenceEnd, stateId, order } = body;


        if (!name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Date-times must be unambiguous ISO instants: never parsed in the server's timezone.
        const start = readInstantField(startDateTime, "startDateTime");
        if (!start.ok) return NextResponse.json({ error: start.error, field: "startDateTime" }, { status: 400 });
        const end = readInstantField(endDateTime, "endDateTime");
        if (!end.ok) return NextResponse.json({ error: end.error, field: "endDateTime" }, { status: 400 });
        const until = readDateOnlyField(recurrenceEnd, "recurrenceEnd");
        if (!until.ok) return NextResponse.json({ error: until.error, field: "recurrenceEnd" }, { status: 400 });

        const newTask = await prisma.task.create({
            data: {
                name,
                description,
                startDateTime: start.value,
                endDateTime: end.value,
                priority,
                categoryId: categoryId || null,
                userId,
                frequency: frequency || null,
                interval: interval || 1,
                byWeekday: byWeekday || [],
                recurrenceEnd: until.value,
                stateId: stateId || null,
                order: typeof order === "number" ? order : 0,
            },
            include: { category: true, state: true }
        });

        after(() => reportEvent("Task created", { details: { taskId: newTask.id, name: newTask.name, userId } }));

        return NextResponse.json(newTask, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}