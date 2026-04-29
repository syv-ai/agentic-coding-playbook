# Shared deck assets

Assets reused across more than one audience deck. Logos, presenter photos, recurring diagrams, accent imagery.

## Convention

- **Shared assets live here.** Reference from a deck via `../../assets/<filename>`.
- **Deck-specific assets** (audience logos, single-use illustrations, custom diagrams) live in `decks/audiences/<slug>/assets/` and are referenced via `./assets/<filename>`.
- **Format:** SVG when you have it (scales cleanly, smaller, theme-friendly). PNG with transparent background otherwise. Avoid JPGs for logos.
- **Naming:** kebab-case, no spaces. `syv-logo.svg`, `syv-logo-dark.svg`, `rasmus-portrait.jpg`.

## Current contents

- `syv-logo.svg` — syv.ai logo (drop file here; decks reference it on title and closing slides).

## How decks reference assets

In `slides.md`:

```markdown
<img src="../../assets/syv-logo.svg" class="h-8" />
```

Or as a Slidev image:

```markdown
![syv.ai](../../assets/syv-logo.svg)
```

Slidev resolves the path at build time from the location of `slides.md`. From `decks/audiences/<slug>/slides.md`, `../../assets/` lands in this directory.
