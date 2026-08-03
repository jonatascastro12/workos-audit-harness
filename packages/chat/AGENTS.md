# internal-app-example

Internal WorkOS apps should look and behave like WorkOS product surfaces. Use the vendored WorkOS design system in `app/vendor/design-system` before introducing custom UI primitives.

## Design system

`@workos-inc/design-system` is private to the `workos/workos` monorepo and is not published to npm. This repo vendors the design system using the same pattern as `horizon-web-ui`:

- Import components from direct component paths like `@workos-inc/design-system/components/button` or `~/vendor/design-system/components/button` so unused vendored components are not bundled.
- Keep the TypeScript aliases in `tsconfig.cloudflare.json` when moving files around.
- Keep the vendored WorkDS CSS imports in `app/app.css`.
- Wrap routes in the vendored `Theme` component from `app/root.tsx`.
- Keep the PostCSS plugins in `postcss.config.mjs`; they compile WorkDS breakpoint/custom-media CSS.

Prefer WorkDS primitives for layout, typography, cards, forms, dialogs, badges, and status UI. Reach for Tailwind only for app-specific layout glue or one-off styles that do not duplicate a WorkDS primitive.

## Keeping WorkDS in sync

Vendoring is intentionally explicit: internal apps do not automatically receive WorkDS changes from the monorepo. To refresh the vendored copy from a local `workos/workos` checkout, run:

```bash
npm run sync-design-system -- ../workos/packages/design-system
npm install
npm run verify
```

Commit the generated vendored diff through a normal PR. Do not hand-edit files under `app/vendor/design-system`; make local patches in app code or upstream them to `workos/workos`.

## UI rules

- Use the vendored `Theme` defaults: purple accent, slate gray scale, medium radius.
- Use semantic WorkDS/Radix colors (`gray`, `purple`, `green`, `yellow`, `red`, `blue`) instead of hard-coded colors.
- Use WorkDS typography components (`Heading`, `Text`, `Code`, `Em`) instead of raw headings/paragraphs when practical.
- Use `Card`, `Flex`, `Grid`, `Box`, `Separator`, `Badge`, `Button`, `TextField`, `Select`, `Checkbox`, `Dialog`, and `AlertDialog` before building custom equivalents.
- For destructive confirmation, use `AlertDialog`; for create/edit flows, use `Dialog`.
- Button copy should be sentence case and specific (`Create report`, `Save changes`), never `Submit`, `OK`, or `Confirm`.
- Error copy should be complete, specific sentences.

## Validation

Run these before opening a PR:

```bash
npm run lint
npm run format:check
npm run verify
```

The lint script intentionally ignores `app/vendor/design-system` because it is vendored source copied from the WorkOS monorepo.
