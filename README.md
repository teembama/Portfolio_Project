# Therese Chimbusonma Mbama — portfolio

Personal site for Therese Mbama, an AI automation and full-stack engineer in Lagos, Nigeria.

**Live:** https://portfolio-project-brown-two.vercel.app

## What's on it

- About, with a `therese.ts` card that types a rotating set of short facts
- The stack: a drag-to-spin globe and a skimmable grouped list
- Selected projects: recent AI agent and automation builds, then earlier work (thesis, hackathon and full-stack projects), with category filters, demo videos, GitHub links and a Details pop-up per project
- Experience, education and campus roles
- Contact: email form (Formspree), LinkedIn, GitHub, WhatsApp

## Stack

Plain HTML, CSS and JavaScript. There's no framework, package manager or build step, and the only external services are Google Fonts and Formspree.

## Run it locally

Any static server works, for example:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Where things live

| File | What it holds |
|---|---|
| `index.html` | All page content |
| `styles.css` | All styling. Colours are tokens in the `:root` block at the top |
| `script.js` | Nav, scroll reveal, skills globe, project hover preview, dialogs (contact form and project details), project filters |
| `terminal.js` | The `therese.ts` typing engine |
| `terminal-frames.js` | The text of terminal frames 2–8. Frame 1 is the static markup in `index.html`. Keep lines to 37 characters or fewer and frames to 14 lines or fewer, so the card never scrolls or changes height |
| `og-image.jpg`, `robots.txt`, `sitemap.xml` | Link previews and search |

### Adding a project screenshot

Cards without a screenshot end with a gradient placeholder:

```html
<div class="proj-media" data-title="Lead Studio" data-tags="Agent SDK · Apify · Firecrawl" aria-hidden="true"></div>
```

Replace that line with the image, keeping the class and the data attributes:

```html
<img class="proj-media" src="assets/projects/lead-studio.webp" alt="…" width="1440" height="900" loading="lazy" data-title="Lead Studio" data-tags="Agent SDK · Apify · Firecrawl">
```

Both views pick it up. On a desktop with a mouse it appears in the cursor-following hover preview, which hides while the pointer is over the card's button row. On touch screens, and at 900px and below, it shows as a static image inside the card.

### Adding a demo video

Demo videos are plain links in each card's link row, before GitHub. Lead Triage System has a ready-made one commented out in its link row: replace `VIDEO_LINK` with the video's share link (for Google Drive, shared as "Anyone with the link") and remove the comment markers around the link.

### Editing a project's details

The Details button opens one shared pop-up. Its title, meta line, Stack tags and Demo/GitHub buttons are copied from the card itself, so they're edited in the card. The rest comes from the `<template class="proj-detail">` at the end of each card:

```html
<template class="proj-detail">
  <h4>Problem</h4>
  <p>…</p>
  <h4>Why it matters</h4>
  <p>…</p>
  <h4>How it works</h4>
  <p>…</p>
  <h4>Design decisions</h4>
  <p>…</p>
  <div class="detail-results">
    <h4>Results</h4>
    <p>…</p>
  </div>
</template>
```

`detail-results` is the highlighted box. A new card needs a template and a Details button in its `.proj-links` row (copy both from an existing card). The buttons stay hidden until `script.js` runs, so without JavaScript the cards show as they always have.

### Project categories

Each card's `data-category` decides which filter shows it: `ai` (AI Agents & Automation), `fullstack` (Full-Stack & Mobile) or `research` (Research). A new category needs a matching `<button class="filter" data-filter="…">` in `.proj-filters`. Card numbers (`_01`, `_02`, …) are typed by hand and don't change when a filter is applied.

## Deploy

Vercel builds production from `main`; other branches get preview deployments. GitHub Pages also serves `main`, and the canonical tag points search engines at the Vercel URL.
