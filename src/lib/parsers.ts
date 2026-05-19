/**
 * Deterministic Parsers for BA Studio
 * Converts structured JSON payloads into valid Markdown, Mermaid, and PlantUML.
 */

// --- Mermaid Flowchart Parser ---
export interface FlowchartJSON {
  nodes: { id: string; label: string }[];
  edges: { from: string; to: string; label?: string }[];
}

export function jsonToMermaid(data: FlowchartJSON): string {
  if (!data || !data.nodes || !data.edges) return 'graph TD\n  Error["Invalid Data"]';

  let mermaidStr = 'graph TD\n';
  
  // Create nodes with safe labels
  data.nodes.forEach(node => {
    // Strip characters that break Mermaid labels even inside quotes
    const safeLabel = (node.label || '').replace(/[()]/g, '').replace(/[/"]/g, ' ');
    mermaidStr += `  ${node.id}["${safeLabel}"]\n`;
  });

  // Create edges securely
  data.edges.forEach(edge => {
    if (edge.label) {
      const safeEdgeLabel = edge.label.replace(/[()]/g, '').replace(/[/"]/g, ' ');
      mermaidStr += `  ${edge.from} -- "${safeEdgeLabel}" --> ${edge.to}\n`;
    } else {
      mermaidStr += `  ${edge.from} --> ${edge.to}\n`;
    }
  });

  return mermaidStr;
}

// --- PlantUML Parser ---
export interface PlantUMLJSON {
  actors: string[];
  usecases: string[];
  relationships: { actor: string; usecase: string }[];
}

export function jsonToPlantUML(data: PlantUMLJSON): string {
  if (!data || !data.actors || !data.usecases) return '@startuml\nactor Error\n@enduml';

  let umlStr = '@startuml\nleft to right direction\n';

  data.actors.forEach((actor, index) => {
    const safeActor = actor.replace(/[()]/g, '').replace(/[/"]/g, '');
    umlStr += `actor "${safeActor}" as A${index}\n`;
  });

  umlStr += 'package "System" {\n';
  data.usecases.forEach((uc, index) => {
    const safeUc = uc.replace(/[()]/g, '').replace(/[/"]/g, '');
    umlStr += `  usecase "${safeUc}" as UC${index}\n`;
  });
  umlStr += '}\n\n';

  data.relationships.forEach(rel => {
    const actorIdx = data.actors.indexOf(rel.actor);
    const ucIdx = data.usecases.indexOf(rel.usecase);
    if (actorIdx !== -1 && ucIdx !== -1) {
      umlStr += `A${actorIdx} --> UC${ucIdx}\n`;
    }
  });

  umlStr += '@enduml\n';
  return umlStr;
}

// --- Generic Document Parser (FRD, BRD, PRD) ---
export interface DocumentJSON {
  title: string;
  sections: { heading: string; content: string[] }[];
  traceability?: { reqId: string; description: string }[];
}

export function jsonToMarkdown(data: DocumentJSON): string {
  if (!data || !data.sections) return '# Error\nInvalid Document Data';

  let mdStr = `# ${data.title || 'Document'}\n\n`;

  data.sections.forEach(section => {
    mdStr += `## ${section.heading}\n`;
    section.content.forEach(line => {
      mdStr += `${line}\n`;
    });
    mdStr += '\n';
  });

  if (data.traceability && data.traceability.length > 0) {
    mdStr += `## Traceability Matrix\n`;
    mdStr += `| ID | Description |\n|---|---|\n`;
    data.traceability.forEach(t => {
      mdStr += `| ${t.reqId} | ${t.description} |\n`;
    });
  }

  return mdStr;
}

// --- HTML Prototype Parser ---
export interface HTMLJSON {
  html: string;
}

export function jsonToHTML(data: HTMLJSON): string {
  if (!data || !data.html) return '<div>Error: Invalid HTML Data</div>';
  return "```html\n" + data.html + "\n```";
}
