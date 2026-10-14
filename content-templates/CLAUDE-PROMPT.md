# Prompt for writing a TekkTech article with Claude

Copy everything inside the box below into a new Claude chat. Replace the first line with your topic, then paste Claude's answer into a new file in `src/content/articles/` (see docs/PUBLISHING-ON-GITHUB.md).

````text
Write a TekkTech article about: [YOUR TOPIC HERE]

TekkTech is an independent technology publication with a calm, expert, honest tone (British English). Output ONLY one Markdown file inside a single code block, ready to paste, in exactly this format:

---
title: 'Headline in single quotes'
slug: lowercase-words-with-hyphens
excerpt: 'One or two sentences summarising the article.'
category: consumer-tech
type: explainer
status: published
publishDate: YYYY-MM-DD
tags:
  - lowercase tag
featured: false
seoDescription: 'A search-result description of 120–160 characters.'
sources:
  - title: 'Title of the source page'
    url: 'https://full-address-of-the-page'
    publisher: 'Who published it'
---

Article body in Markdown here.

RULES FOR THE TOP SECTION (it is validated by the website; mistakes stop it publishing):
- title: 5–120 characters. excerpt: 20–300 characters. seoDescription: max 170 characters.
- Wrap title, excerpt, seoDescription and every source field in single quotes. If the text contains an apostrophe, write it twice ('it''s').
- slug: only lowercase letters, numbers and single hyphens, e.g. best-budget-keyboards. Not "page", "rss", "search", "admin", "index", "feed" or "preview".
- category: exactly one of consumer-tech, gaming, crypto, productivity.
- type: exactly one of review, comparison, ranking, explainer, guide, opinion.
- publishDate: today's date as YYYY-MM-DD.
- tags: 1–4 short lowercase tags, e.g. buying advice, displays, security, privacy, gaming peripherals, blockchain, productivity apps.
- Do not include any image lines.
- If type is review, add this block after sources (handsOn must be false, and do not add a score):
review:
  productName: 'Product name'
  summary: 'One- or two-sentence verdict.'
  handsOn: false
  strengths:
    - 'A strength'
  weaknesses:
    - 'A weakness'
  bestFor: 'Who should consider it'
  avoidIf: 'Who should look elsewhere'

RULES FOR THE ARTICLE BODY:
- 600–1,000 words. Start with an introduction paragraph (no heading, and do not repeat the title as a heading).
- Use ## for section headings and ### for sub-sections. Never use a single #.
- Use short paragraphs, bullet lists, and a Markdown table where it genuinely helps (e.g. comparisons).
- End with a section called "## The bottom line".
- Plain Markdown only: no HTML, no emoji.

HONESTY RULES (essential):
- Never invent facts, specifications, prices, release dates, benchmark results, statistics or quotations. If unsure, leave it out or say it is uncertain.
- Never claim TekkTech tested, used or reviewed a product hands-on. Reviews are research-based.
- Only list sources whose exact web address you are confident exists (official manufacturer pages, documentation, standards bodies, research). If you are not confident, list fewer sources rather than guessing a URL.
- For crypto topics: no investment advice and no price predictions.
- For opinion pieces, start the body with: *This is an opinion piece. It reflects TekkTech's editorial view.*

After the code block, add one line saying: "Save as: <slug>.md" and then list any claims I should double-check before publishing.
````

## After Claude replies

1. **Check the facts** it lists, and open every source link to make sure it works and says what the article claims.
2. Copy only what's inside the code block, from the first `---` to the end of the article.
3. Create the file `src/content/articles/<slug>.md` on GitHub, paste, and commit to `main`.
4. If the Actions run turns red, the error names the problem. The table in docs/PUBLISHING-ON-GITHUB.md explains the common ones.
