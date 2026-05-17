import { configFromFlags, print, readJsonFileOrStdin, readOptionalStdin } from '../args.mjs';
import { emitEvent } from '../emit-event.mjs';

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  const stdinText = await readOptionalStdin(flags.file);
  const payload = readJsonFileOrStdin(flags.file, stdinText);
  const event = payload.event || payload;
  print(await emitEvent(event, config), json);
}
