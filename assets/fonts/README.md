# Self-hosted type

Three families, latin subset only, 88 KB in total. Declared in
`website/assets/tokens.css` as `--font-display`, `--font-text` and `--font-mono`.

| File | Family | Weights | Licence |
|---|---|---|---|
| `archivo-var.woff2` | [Archivo](https://fonts.google.com/specimen/Archivo) | variable 100–900 | SIL Open Font License 1.1 |
| `public-sans-var.woff2` | [Public Sans](https://fonts.google.com/specimen/Public+Sans) | variable 100–900 | SIL Open Font License 1.1 |
| `plex-mono-400.woff2`, `plex-mono-600.woff2` | [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) | 400, 600 | SIL Open Font License 1.1 |

The OFL permits redistribution of the font files with the site, including
commercially, provided they are not sold on their own and the licence travels
with them. It also forbids using the reserved family names for a modified
version — these files are unmodified subsets, so the names stay as they are.

Self-hosted rather than linked from `fonts.googleapis.com` for two reasons: the
site previously pulled the Material Icons webfont from Google on every page,
which meant a third party saw every visitor's IP, and a render-blocking
stylesheet on another origin is the slowest way to load four small files.

## Replacing or adding a weight

Both variable files cover their whole weight range, so a new weight needs no
new download. To re-fetch, request the latin subset from the Google Fonts CSS
API with a modern browser user agent (older agents are served `.ttf`), then
pull the `.woff2` the `/* latin */` block points at.
