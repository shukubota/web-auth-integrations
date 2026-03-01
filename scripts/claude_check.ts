/**
 * Claude API healthcheck script
 *
 * Usage:
 *   tsx claude_check.ts <question>
 *   tsx claude_check.ts 素を番号1の元素をおしえて
 *
 * Connection: Google Vertex AI (ANTHROPIC_VERTEX_PROJECT_ID / CLAUDE_CODE_USE_VERTEX)
 *   or direct Anthropic API (ANTHROPIC_API_KEY)
 */

import Anthropic from "@anthropic-ai/sdk";

async function main() {
  const question = process.argv.slice(2).join(" ");
  if (!question) {
    console.error("Usage: tsx claude_check.ts <question>");
    console.error("Example: tsx claude_check.ts 素を番号1の元素をおしえて");
    process.exit(1);
  }

  // Vertex AI mode (Claude Code default)
  const useVertex = process.env.CLAUDE_CODE_USE_VERTEX === "true";
  const vertexProject = process.env.ANTHROPIC_VERTEX_PROJECT_ID;
  const vertexRegion = process.env.CLOUD_ML_REGION || "us-east5";

  let client: Anthropic;

  if (useVertex && vertexProject) {
    const AnthropicVertex = (await import("@anthropic-ai/vertex-sdk")).AnthropicVertex as unknown as typeof Anthropic;
    client = new AnthropicVertex({
      projectId: vertexProject,
      region: vertexRegion,
    } as ConstructorParameters<typeof Anthropic>[0]);
    console.log(`[Vertex AI] project=${vertexProject} region=${vertexRegion}\n`);
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Error: ANTHROPIC_API_KEY or CLAUDE_CODE_USE_VERTEX+ANTHROPIC_VERTEX_PROJECT_ID required.");
      process.exit(1);
    }
    client = new Anthropic({ apiKey });
    console.log("[Direct API]\n");
  }

  const model = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "claude-sonnet-4-6";

  console.log(`Question: ${question}\n`);

  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: question }],
  });

  const responseText = message.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("\n");

  console.log(`Answer:\n${responseText}`);
  console.log(`\n[model: ${message.model}, tokens: input=${message.usage.input_tokens} output=${message.usage.output_tokens}]`);
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
