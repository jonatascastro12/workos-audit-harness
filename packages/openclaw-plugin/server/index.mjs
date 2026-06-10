import { runMcpServer } from '@workos-inc/audit-core/mcp-server';
import { configLoader } from '../scripts/config-file.mjs';

await runMcpServer({ configLoader, version: '0.1.0' });
