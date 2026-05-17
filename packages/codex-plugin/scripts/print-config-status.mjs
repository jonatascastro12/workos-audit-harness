import { printConfigStatus } from '@workos-inc/audit-core/print-config-status';
import { configLoader } from './config-file.mjs';

printConfigStatus({ configLoader });
