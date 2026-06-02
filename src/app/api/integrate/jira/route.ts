import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = (session?.user as any)?.organizationId;
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email || 'anonymous';

    // The frontend sends these via the JiraModal form
    const { siteUrl, email, apiToken, projectKey, title, content } = await req.json();

    if (!siteUrl || !email || !apiToken || !projectKey) {
      return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 400 });
    }

    // Clean up siteUrl. If user pastes a full browser navigation URL (e.g. including paths), extract the base domain.
    let baseUrl = siteUrl.trim();
    try {
      const parsedUrl = new URL(baseUrl);
      baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch (e) {
      baseUrl = baseUrl.replace(/\/$/, '');
    }
    
    // Atlassian Basic Auth
    const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;

    // Create the Jira Issue using Atlassian Document Format (ADF) for Jira Cloud
    const issueData = {
      fields: {
        project: {
          key: projectKey
        },
        summary: title || "Exported from BA Studio",
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: content ? content.substring(0, 32000) : "No content provided."
                }
              ]
            }
          ]
        },
        issuetype: {
          name: "Task" // Assuming 'Task' exists. If not, Jira will return an error and we catch it.
        }
      }
    };

    const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any = {};
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Jira API Non-JSON response:", text);
      return NextResponse.json({ 
        error: `Jira returned an unexpected HTML/text response (HTTP ${response.status}). Please verify that your JIRA SITE URL is correct and in the format 'https://your-domain.atlassian.net'.` 
      }, { status: response.status });
    }

    if (!response.ok) {
      console.error("Jira API Error:", data);
      const errorMsg = data.errorMessages?.[0] || (data.errors ? JSON.stringify(data.errors) : 'Failed to create Jira issue');
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    await logAudit({
      organizationId: orgId,
      userId: userId,
      userEmail: userEmail,
      action: 'JIRA_SYNC',
      resourceType: 'Project',
      resourceId: projectKey,
      metadata: { issueKey: data.key }
    });

    return NextResponse.json({
      issueKey: data.key,
      issueUrl: `${baseUrl}/browse/${data.key}`
    });

  } catch (error: any) {
    console.error("Jira API Catch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
