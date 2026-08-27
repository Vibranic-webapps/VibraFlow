import { readSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse, after } from "next/server";
import { reportEvent } from "@/lib/vibradex";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;
        
        const { id } = await params;
        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const body = await request.json();
        const { name, description, startDateTime, endDateTime, priority, categoryId,
        favorite, completed, frequency, interval, byWeekday, recurrenceEnd, categoryRemoved,
        stateId, order } = body;


        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: {
                name,
                description,
                startDateTime: startDateTime ? new Date(startDateTime) : undefined,
                endDateTime: endDateTime ? new Date(endDateTime) : undefined,
                priority,
                categoryId: categoryId || undefined,
                favorite,
                completed,
                frequency,
                interval,
                byWeekday,
                recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : recurrenceEnd,
                categoryRemoved: categoryId ? false : categoryRemoved,
                stateId: stateId === undefined ? undefined : stateId,
                order: typeof order === "number" ? order : undefined,
            },
            include: { category: true, state: true }
        });

        after(() => reportEvent("Task updated", { details: { taskId: updatedTask.id, name: updatedTask.name, userId } }));

        return NextResponse.json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;

        const { id } = await params
        const task = await prisma.task.findFirst({ where: { id, userId }})
        if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        await prisma.task.delete({where: { id }})

        after(() => reportEvent("Task deleted", { details: { taskId: id, name: task.name, userId } }));

        return NextResponse.json({Response: "Task deleted succesfully"}, {status: 200})
    } catch(error) {
        console.error("Error Deleting task:", error)
        return NextResponse.json({error: "failed to delete task"}, {status: 500})
    }
}