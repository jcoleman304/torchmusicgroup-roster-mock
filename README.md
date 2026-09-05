# torchmusicgroup.com — Roster Mock

**Not the live site.** A copy of torchmusicgroup.com used to imagine new artists on the Torch Music Group roster. Pages are `noindex`.

- Live preview: https://jcoleman304.github.io/torchmusicgroup-roster-mock/
- Live site source: https://github.com/jcoleman304/torchmusicgroup.com

## Editing the roster
All roster content lives in `roster.json`. Add, remove, or rewrite artists there; `roster.html`, `artist.html`, and the homepage featured strip render from it.

- `photo`: drop a JPG into `images/` and point to it. Placeholder portraits are in `images/mock/`.
- `real`: `true` for actual TMG artists / prospects, `false` for imagined ones (shows an "Imagined artist" note).
- `status`: `Flagship` · `New Signing` · `In Development` · `Publishing`
- `division`: `Management` · `Publishing` · `Development`

Mock-only files: `roster.json`, `mock.css`, `mock.js`, `artist.html`, `images/mock/`. Everything else mirrors the live repo (minus CNAME and the Spotify sync workflow).
