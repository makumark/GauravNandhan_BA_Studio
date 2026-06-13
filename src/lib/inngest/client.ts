import { Inngest } from "inngest";

// Create a client to send and receive events
// This client is used to trigger background jobs without causing UI timeouts
export const inngest = new Inngest({ id: "ba-studio" });
