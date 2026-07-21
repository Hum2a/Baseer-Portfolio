import { Hono } from "hono";
import { z } from "zod";
import { createDb, withOwnerRls } from "../db/client";
import { siteIntegrations } from "../db/schema";
import type { AppVariables, Env } from "../env";
import { requireAdmin } from "../lib/session";

export const aiRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

const completeSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]).default("openai"),
  prompt: z.string().min(1).max(20000),
  model: z.string().max(80).optional(),
});

aiRoutes.use("/admin/*", requireAdmin);

aiRoutes.post("/admin/complete", async (c) => {
  const body = completeSchema.parse(await c.req.json());
  const { db, pool } = createDb(c.env);
  try {
    const keys = await withOwnerRls(db, c.get("userId"), async (tx) => {
      const [row] = await tx.select().from(siteIntegrations).limit(1);
      return row?.aiKeys ?? {};
    });
    const apiKey = keys[body.provider];
    if (!apiKey) {
      return c.json(
        {
          error: `No ${body.provider} API key saved. Add your own key in Studio → Design / Integrations.`,
        },
        400,
      );
    }

    if (body.provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model ?? "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You help edit marketing portfolio copy. Reply with only the revised text.",
            },
            { role: "user", content: body.prompt },
          ],
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return c.json({ error: `OpenAI error: ${errText.slice(0, 300)}` }, 502);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return c.json({ text: json.choices?.[0]?.message?.content?.trim() ?? "" });
    }

    if (body.provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: body.model ?? "claude-3-5-haiku-latest",
          max_tokens: 1024,
          messages: [{ role: "user", content: body.prompt }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return c.json({ error: `Anthropic error: ${errText.slice(0, 300)}` }, 502);
      }
      const json = (await res.json()) as {
        content?: { text?: string }[];
      };
      return c.json({ text: json.content?.[0]?.text?.trim() ?? "" });
    }

    return c.json(
      {
        error:
          "Google provider proxy is stubbed — save a key and use OpenAI/Anthropic for now, or extend /ai/admin/complete.",
      },
      501,
    );
  } finally {
    await pool.end();
  }
});
