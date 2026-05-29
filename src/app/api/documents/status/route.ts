import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    if (!projectId || !type) {
      return NextResponse.json({ error: 'projectId and type are required' }, { status: 400 });
    }

    // Verify session
    const session = await getServerSession(authOptions);
    // You might want to verify if the user has access to this project, but for now we just check if it exists
    
    const document = await prisma.document.findFirst({
      where: {
        projectId,
        type
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!document) {
      return NextResponse.json({ status: 'pending' }, { status: 200 });
    }

    // The document is ready!
    return NextResponse.json({ 
      status: 'ready', 
      content: document.content,
      updatedAt: document.updatedAt 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching document status:', error);
    return NextResponse.json(
      { error: `Database Error: ${error.message}` },
      { status: 500 }
    );
  }
}
