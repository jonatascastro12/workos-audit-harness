import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { createAiGateway } from "ai-gateway-provider";
import { createUnified } from "ai-gateway-provider/providers/unified";
import { generateText } from "ai";

interface WorkflowEnv {
  DB: D1Database;
  AI: Ai;
  UPDATE_WORKFLOW: Workflow;
  IMAGE_BUCKET: R2Bucket;
}

export class UpdateWorkflow extends WorkflowEntrypoint<WorkflowEnv, object> {
  async run(_event: WorkflowEvent<object>, step: WorkflowStep): Promise<void> {
    const aigateway = createAiGateway({
      binding: this.env.AI.gateway("internal-app-gateway"),
    });
    const unified = createUnified();

    const funFact = await step.do("generate-fun-fact", async () => {
      const { text } = await generateText({
        model: aigateway(unified("openai/gpt-4o-mini")),
        prompt:
          "Tell me one short, interesting, and surprising fun fact. " +
          "Keep it to 1-2 sentences. Do not include any preamble — just state the fact directly.",
      });

      console.log("Generated fun fact:", text);

      return text;
    });

    const imagePrompt = await step.do("generate-image-prompt", async () => {
      const { text } = await generateText({
        model: aigateway(unified("openai/gpt-4o-mini")),
        prompt:
          "Turn the following fun fact into a short visual scene description for an image generator. " +
          "Focus on imagery, mood, and metaphor. Avoid anatomical, medical, violent, or otherwise sensitive language — " +
          "translate any such concepts into safe visual symbols (e.g. a glowing orb instead of a heart). " +
          "No text or words in the scene. Keep it under 40 words and respond with only the description.\n\n" +
          `Fun fact: ${funFact}`,
      });

      console.log("Generated image prompt:", text);

      return text;
    });

    await step.do("generate-and-store-image", async () => {
      // ai-gateway-provider doesn't support image models yet, so we call the
      // AI Gateway binding directly. This still uses the stored OpenAI key.
      const gateway = this.env.AI.gateway("internal-app-gateway");
      const resp = await gateway.run([
        {
          provider: "openai",
          endpoint: "v1/images/generations",
          headers: { "Content-Type": "application/json" },
          query: {
            model: "dall-e-2",
            prompt: `A colorful, whimsical illustration with no text or words: ${imagePrompt}`,
            size: "512x512",
            n: 1,
          },
        },
      ]);

      // Defensive parse: when OpenAI/Gateway hiccups, the response is an
      // error envelope (e.g. `{error: {...}}`) rather than `{data: [...]}`.
      // Surface that envelope verbatim so retries get a useful error and the
      // failure mode isn't a cryptic TypeError from `result.data[0]`.
      const result = (await resp.json()) as unknown;
      const url = (result as { data?: Array<{ url: string }> }).data?.[0]?.url;
      if (!url) {
        throw new Error(
          `Unexpected gateway response shape: ${JSON.stringify(result)}`,
        );
      }
      const imageResp = await fetch(url);

      await this.env.IMAGE_BUCKET.put("fun-fact-image.png", imageResp.body, {
        httpMetadata: { contentType: "image/png" },
      });

      console.log("Generated and stored fun fact image");
    });

    await step.do("update-database", async () => {
      const now = new Date().toISOString();

      await this.env.DB.batch([
        this.env.DB.prepare(
          "INSERT OR REPLACE INTO app_state (key, value, updated_at) VALUES ('fun_fact', ?, ?)",
        ).bind(funFact, now),
        this.env.DB.prepare(
          "INSERT OR REPLACE INTO app_state (key, value, updated_at) VALUES ('last_updated', ?, ?)",
        ).bind(now, now),
      ]);
    });
  }
}

const worker: ExportedHandler<WorkflowEnv> = {
  async scheduled(_controller, env): Promise<void> {
    const instance = await env.UPDATE_WORKFLOW.create();
    console.log(`Workflow instance created: ${instance.id}`);
  },

  async fetch(_request, env): Promise<Response> {
    const instance = await env.UPDATE_WORKFLOW.create();
    return Response.json({
      message: "Workflow triggered",
      instanceId: instance.id,
    });
  },
};

export default worker;
