import { runWorkos } from '../../workos-client.mjs';

export async function run() {
  runWorkos(['auth', 'login'], { stdio: 'inherit' });
}
