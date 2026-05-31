import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { documentContent, projectId } = await req.json();

    if (!documentContent || !projectId) {
      return NextResponse.json({ error: 'Missing content or projectId' }, { status: 400 });
    }

    if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this project document and extract the core Requirements, APIs, Screens, and Test Cases as Nodes, and their relationships as Edges.

    DOCUMENT:
    ${documentContent}

    Return a JSON object:
    {
      "nodes": [
        { "nodeId": "REQ-1", "nodeType": "REQUIREMENT", "label": "User Login" },
        { "nodeId": "SCR-1", "nodeType": "SCREEN", "label": "Login Page" },
        { "nodeId": "TC-1", "nodeType": "TEST_CASE", "label": "Verify Login" }
      ],
      "edges": [
        { "fromNodeId": "REQ-1", "toNodeId": "SCR-1", "relationship": "RENDERS_ON" },
        { "fromNodeId": "TC-1", "toNodeId": "REQ-1", "relationship": "VERIFIED_BY" }
      ]
    }
    Return ONLY JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    let graphData;
    try {
      graphData = JSON.parse(text.replace(/```json|```/g, ''));
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      graphData = match ? JSON.parse(match[0]) : null;
    }

    if (!graphData || !graphData.nodes) {
      return NextResponse.json({ error: "Failed to extract graph" }, { status: 500 });
    }

    // Save to Database
    for (const node of graphData.nodes) {
      await prisma.graphNode.upsert({
        where: { projectId_nodeId: { projectId, nodeId: node.nodeId } },
        update: { label: node.label, nodeType: node.nodeType },
        create: { projectId, nodeId: node.nodeId, nodeType: node.nodeType, label: node.label }
      });
    }

    for (const edge of graphData.edges) {
      // Ensure nodes exist first
      const fromNode = await prisma.graphNode.findUnique({ where: { projectId_nodeId: { projectId, nodeId: edge.fromNodeId } } });
      const toNode = await prisma.graphNode.findUnique({ where: { projectId_nodeId: { projectId, nodeId: edge.toNodeId } } });
      
      if (fromNode && toNode) {
        await prisma.graphEdge.upsert({
          where: { projectId_fromNodeId_toNodeId_relationship: { 
            projectId, fromNodeId: fromNode.id, toNodeId: toNode.id, relationship: edge.relationship 
          }},
          update: {},
          create: { projectId, fromNodeId: fromNode.id, toNodeId: toNode.id, relationship: edge.relationship }
        });
      }
    }

    return NextResponse.json({ success: true, extractedNodes: graphData.nodes.length });

  } catch (error: any) {
    console.error("Graph Extract Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
