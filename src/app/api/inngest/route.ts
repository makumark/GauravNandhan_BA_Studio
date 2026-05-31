import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateVisualArtifacts } from "@/lib/inngest/functions";

export const maxDuration = 60;

// Create an API that serves zero-downtime background functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateVisualArtifacts,
  ],
});
