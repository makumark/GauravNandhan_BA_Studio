import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { siteUrl, apiToken, email, projectKey, title, content } = await req.json();

    if (!siteUrl || !apiToken || !email || !projectKey) {
      return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 400 });
    }

    // Standard Jira Cloud API endpoint to create an issue
    const jiraUrl = `${siteUrl.replace(/\/$/, '')}/rest/api/3/issue`;
    
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    const response = await fetch(jiraUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: projectKey
          },
          summary: title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: content.substring(0, 30000) // Jira description limit
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: 'Task'
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessages?.[0] || 'Jira API Error');
    }

    return NextResponse.json({ success: true, issueKey: data.key, issueUrl: `${siteUrl.replace(/\/$/, '')}/browse/${data.key}` });
  } catch (error: any) {
    console.error('Jira Integration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
