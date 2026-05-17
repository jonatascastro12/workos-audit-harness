import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { maskSecret } from './util.mjs';
import { runHarnessJson } from './send-event.mjs';

const MAX_QUERY_MAX_ROWS = 200;

export async function runMcpServer({ configLoader, serverName = 'workos-audit', version = '0.1.0' }) {
  const config = configLoader.loadConfig();
  const queryConfig = configLoader.loadQueryConfig
    ? configLoader.loadQueryConfig()
    : { apiKey: config.apiKey, organizationId: config.organizationId };

  const server = new McpServer({ name: serverName, version });

  server.registerTool(
    'workos_audit_status',
    {
      title: 'WorkOS Audit Status',
      description: 'Show WorkOS audit plugin configuration status.',
      inputSchema: z.object({}).strict(),
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            enabled: true,
            configPath: configLoader.getConfigFilePath(),
            credentialSource: config.apiKey ? 'api-key' : 'workos-cli',
            apiKey: maskSecret(config.apiKey),
            organizationId: config.organizationId || null,
            organizationResolution: config.organizationId
              ? 'explicit'
              : 'auto-find-or-create Audit Log Harness',
            recordingEnabled: config.recordingEnabled !== false,
            actionPrefix: config.actionPrefix,
            actorId: config.actorId,
            actorType: config.actorType,
            actorName: config.actorName,
            location: config.location,
            userAgent: config.userAgent,
            sources: config.sources,
          }, null, 2),
        },
      ],
    }),
  );

  server.registerTool(
    'workos_audit_query',
    {
      title: 'WorkOS Audit Query',
      description: 'Export filtered WorkOS audit logs, parse the CSV, and return summaries plus sample rows.',
      inputSchema: z.object({
        question: z.string(),
        rangeStart: z.string().optional(),
        rangeEnd: z.string().optional(),
        actions: z.array(z.string()).optional(),
        actorIds: z.array(z.string()).optional(),
        actorNames: z.array(z.string()).optional(),
        targets: z.array(z.string()).optional(),
        maxRows: z.number().int().min(1).max(MAX_QUERY_MAX_ROWS).optional(),
      }),
    },
    async (payload) => {
      try {
        const result = runHarnessJson({ command: 'query', payload, config: queryConfig });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.details,
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error.stderr?.toString?.() || error.message || String(error) }],
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
