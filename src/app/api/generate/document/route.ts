import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canGenerateDocuments } from '@/lib/permissions';
import { rateLimit } from '@/lib/rate-limit';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    // Role-gate
    if (userRole && !canGenerateDocuments(userRole)) {
      return NextResponse.json(
        { error: 'Your role (Viewer) does not have permission to generate documents.' },
        { status: 403 }
      );
    }

    const limiter = await rateLimit(userId || userEmail, 20, 60000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${Math.ceil((limiter.reset - Date.now()) / 1000)}s.` },
        { status: 429, headers: { 'X-RateLimit-Reset': limiter.reset.toString() } }
      );
    }

    const {
      projectId,
      documentRequested,
      messages,
      domainDetected,
      functionalContext,
      glossary
    } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required to generate documents in the background. Please save your session first.' }, { status: 400 });
    }

    if (!documentRequested) {
      return NextResponse.json({ error: 'documentRequested is required' }, { status: 400 });
    }

    // Trigger background generation job via Inngest
    await inngest.send({
      name: 'app/document.generate',
      data: {
        projectId,
        documentRequested,
        messages,
        domainDetected,
        functionalContext,
        glossary,
        userEmail
      }
    });

    return NextResponse.json({ success: true, message: 'Document generation started in background' }, { status: 202 });

  } catch (error: any) {
    console.error('Error triggering document generation:', error);
    return NextResponse.json(
      { error: `Engine Error: ${error.message}` },
      { status: 500 }
    );
  }
}
