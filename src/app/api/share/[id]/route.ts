import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;

    let project;
    try {
      project = await prisma.project.findUnique({
        where: { id },
        include: {
          documents: true,
          messages: true
        }
      });
    } catch (e: any) {
      // Catch Prisma format errors (e.g., malformed cuid) gracefully
      return NextResponse.json({ error: 'Shared session not found' }, { status: 404 });
    }

    if (!project) {
      return NextResponse.json({ error: 'Shared session not found' }, { status: 404 });
    }

    // Return the project data for public viewing
    return NextResponse.json(project);
  } catch (err: any) {
    console.error("Share fetch error:", err);
    return NextResponse.json({ error: 'Failed to fetch shared session' }, { status: 500 });
  }
}
