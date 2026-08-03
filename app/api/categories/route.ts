import { readSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;

        const categories = await prisma.category.findMany({ where: { userId } })
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {        
        const session = await readSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { userId } = session;

        const body = await request.json();
        const { name, color, icon } = body;

        if (!name || !color || !icon) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newCategory = await prisma.category.create({
            data: {
                name,
                color,
                icon,
                userId
            }
        });

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}