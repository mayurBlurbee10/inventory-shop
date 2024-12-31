import { ensureDirectory, logApiCall, readJsonFile, writeJsonFile } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";
import path from 'path';
const dir = path.join(process.cwd(), "src", "app", "data");
const filePath = path.join(dir, "content-type.json");
export async function GET(request) {
    try {
        await logApiCall(request);
        await ensureDirectory(dir);
        const contentTypes = await readJsonFile(filePath);
        return NextResponse.json(contentTypes, { status: 200 });
    } catch (error) {
        console.error('Error in GET /api/content-type:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content types', details: error.message },
            { status: 500 }
        );
    }
}
export async function POST(request) {
    try {
        await logApiCall(request);
        const contentTypeData = await request.json();
        if (!contentTypeData.title || !contentTypeData.type) {
            return NextResponse.json(
                { error: 'Missing required fields: title, type' },
                { status: 400 }
            );
        }
        await ensureDirectory(dir);
        const contentTypes = await readJsonFile(filePath);
        if (contentTypes.some((item) => item.title === contentTypeData.title)) {
            return NextResponse.json(
                { error: 'Content type with the same title already exists' },
                { status: 409 }
            );
        }
        const newContentType = {
            id: Date.now().toString(),
            title: contentTypeData.title,
            type: contentTypeData.type,
        };
        contentTypes.push(newContentType);
        await writeJsonFile(dir, filePath, contentTypes);
        return NextResponse.json(newContentType, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/content-type:', error);
        return NextResponse.json(
            { error: 'Failed to save content type', details: error.message },
            { status: 500 }
        );
    }
}