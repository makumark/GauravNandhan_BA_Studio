import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processChatChunks } from "@/lib/inngest/functions";

// Create an API that serves zero-downtime background apps
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processChatChunks,
  ],
});
