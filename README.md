# Therese Chimbusonma Mbama — portfolio

Personal site for Therese Mbama, an AI automation and full-stack engineer in Lagos, Nigeria.

**Live:** https://portfolio-project-brown-two.vercel.app

## What's on it

- About, with a `therese.ts` card that types a rotating set of short facts
- The stack: a drag-to-spin globe and a skimmable grouped list
- Selected projects: AI agents and automation builds, each with tools and links
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
| `script.js` | Nav, scroll reveal, skills globe, project hover preview, contact form |
| `terminal.js` | The `therese.ts` typing engine |
| `terminal-frames.js` | The text of terminal frames 2–8. Frame 1 is the static markup in `index.html`. Keep lines to 37 characters or fewer and frames to 14 lines or fewer, so the card never scrolls or changes height |
| `og-image.jpg`, `robots.txt`, `sitemap.xml` | Link previews and search |

### Adding a project screenshot

Each project card ends with a placeholder:

```html
<div class="proj-media" data-title="Lead Studio" data-tags="Agent SDK · Apify · Firecrawl" aria-hidden="true"></div>
```

Replace that line with the image, keeping the class and the data attributes:

```html
<img class="proj-media" src="assets/projects/lead-studio.webp" alt="…" width="1440" height="900" loading="lazy" data-title="Lead Studio" data-tags="Agent SDK · Apify · Firecrawl">
```

The card and the desktop hover preview both pick it up.

## Deploy

Vercel builds production from `main`; other branches get preview deployments. GitHub Pages also serves `main`, and the canonical tag points search engines at the Vercel URL.
