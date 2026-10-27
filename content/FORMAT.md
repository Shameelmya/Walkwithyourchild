# Content format

Files (same structure in both languages; `en` and `ml` are parallel, block-for-block):
- `{en,ml}/book.md` – the whole book: intro + 5 parts + 13 chapters
- `{en,ml}/professionals.md` – appendix for professionals
- `workbook.json` – the 11 notebook sheets (bilingual labels, column/field definitions, input types)
- `meta.json` – titles, about, disclaimer, privacy text, helpline numbers, colours, callout labels, core UI terms, talk-board cards
- `updates/{en,ml}/*.md` – update posts with YAML front matter (id, date, title)

Headings
- `# part:N | Title` – part N (1–5)
- `## chapter:N | Title` – chapter N (0 = introduction "Before you begin"; 1–14)
- `## appendix | Title` – professionals appendix
- `###` – section heading inside a chapter

Callouts (blockquote whose first line is a tag; label text comes from `meta.json → calloutLabels`):
- `> [!ask]` + `> - "question"` lines – "Ask your team" box. Each question should get an "add to my questions" action.
- `> [!try]` – activity box ("Try this")
- `> [!why]` – short "Why it matters" note
- `> [!urgent]` – red help box (self-harm / crisis; contains Tele-MANAS 14416)
- `> [!alert]` – red emergency box (call 108)
- `> [!soft]` – paragraph with red left border (important safety line)
- `> [!note]` – small muted note (about the stories)
- `> [!care]` – compassion-fatigue warning (professionals appendix)

Other: `- [ ]` = interactive checklist item; ordered lists = numbered steps; GFM tables.
Parallel structure: the n-th block of a chapter in `en` matches the n-th block in `ml`, so checklist state and reading position can be shared across languages by (chapter, block index).
