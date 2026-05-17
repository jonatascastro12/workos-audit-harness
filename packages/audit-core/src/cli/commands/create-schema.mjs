import { configFromFlags, print, readJsonFileOrStdin, readOptionalStdin } from '../args.mjs';
import { createSchema } from '../schema.mjs';

export async function run({ flags, json }) {
  const config = configFromFlags(flags);
  const stdinText = await readOptionalStdin(flags.file);
  const schema = readJsonFileOrStdin(flags.file, stdinText);
  print(await createSchema(config, schema), json);
}
