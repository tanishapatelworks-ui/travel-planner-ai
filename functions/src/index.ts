import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";

import { applyChatCommand } from "./handler";

setGlobalOptions({ maxInstances: 10 });

export const aiChat = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method not allowed",
      });
      return;
    }

    try {
      const body = req.body;

      if (!body?.message || !body?.plan) {
        res.status(400).json({
          error: "message and plan are required",
        });
        return;
      }

      const result = applyChatCommand({
        message: body.message,
        plan: body.plan,
        history: body.history || [],
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("AI Chat error:", error);

      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    }
  }
);