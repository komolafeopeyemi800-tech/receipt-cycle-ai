---
name: ai-search-content
description: Plan, write and review Receipt Cycle blog posts and landing pages so they earn citations in ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews, and convert readers. Use before publishing or when auditing any page. Pairs with the human-writing skill.
---

# AI Search Content (ranking in LLMs and AI Overviews)

Goal: every public page should be the cleanest, most citable answer to a buyer's question, and should turn readers into web app trials or Android installs.

This skill has two jobs:

1. **Write mode.** Use the rules while drafting so the page is built right the first time.
2. **Review mode.** A separate reviewer reads the finished page against the checklist in section 10 and returns a scored report. Always run review mode before publishing, and again after any large edit.

Always read `human-writing/SKILL.md` first. This skill decides *what* a page must contain. The human-writing skill decides *how it sounds*. A page that checks every box but reads like AI slop fails.

---

## 0. Ground rules (never break these)

These come before any ranking tactic, because a fabricated page loses trust and can get the site penalized.

1. **No made-up proof.** Never invent customer reviews, quotes, testimonials, case-study customers, ratings, statistics, awards or author credentials. If a checklist item needs proof we do not have (a testimonial, a named expert), mark it **Needs owner input**. Do not fill it with something plausible.
2. **Illustrative examples must be labeled.** A made-up persona or example numbers must say so in the text. Never present an invented person as a real customer.
3. **Facts come from sources.** Tax, legal and pricing claims need a primary source (IRS, official pricing page). Read the source page, put its link in the post, and note the date reviewed. If you cannot verify a claim, soften it or delete it.
4. **Describe only what the product does today.** Receipt Cycle does not do GPS mileage, live bank feeds, email forwarding, tax filing or a general ledger. Check `docs/` and the code before writing a feature claim. State limits plainly. Honest limits are citable.
5. **Never use a competitor's name, wording or screenshots as ours.** You may name competitors in an honest comparison, with their public facts and the date read.
6. **No ranking promises.** Do not tell the owner a page will rank. Say what was done and what is measurable.
7. **Do not change a URL.** An existing page keeps its slug. Improve the title, body and schema only.
8. **Style rules:** no em dashes or en dashes, no bold markers in blog text (the renderer shows `**` literally), plain words, short sentences.

---

## 1. How AI search picks what to cite

LLMs and AI Overviews do not rank pages. They pull passages. A page gets cited when:

- A **passage answers a question completely on its own** (no "as mentioned above").
- The answer is **specific and checkable**: numbers, dates, names, sources.
- The page is **clearly written by someone accountable** (a named human, an organization with a real footprint).
- The page is **fresh**, and says so.
- The page **covers the follow-up questions** the model will also ask (query fan-out).
- The structure is **easy to lift**: question headings, short paragraphs, tables, lists, FAQ.

Write for the passage, not the page.

---

## 2. Page anatomy (build every article in this order)

| # | Element | Rule |
|---|---|---|
| 1 | **Title and H1** | Main keyword first. Same keyword in the slug. Benefit or year after it. Under about 70 characters. |
| 2 | **Byline block** | A named human author linked to a real profile, a published date and a visible "Updated" date. |
| 3 | **Answer first** | The direct answer in the first 100 to 150 words. In this repo that is `tldr`. |
| 4 | **Key takeaways** | 4 to 6 bullets, each a complete, quotable fact. In this repo that is `keyTakeaways`. |
| 5 | **Call to action** | Directly after the takeaways. In this repo `QuickSummaryCta` renders it for every post. |
| 6 | **Definition** | One short section: what is this, and what it is not. |
| 7 | **Methodology** | For "best", "vs" and list posts only: how we chose and compared, as bullets. |
| 8 | **Body sections** | Question-style H2s, each a self-contained island. |
| 9 | **Comparison table** | At least one table with numbers, criteria or labeled "best for" columns. |
| 10 | **Best for / not for** | For every option or approach, say who it fits and who it does not. |
| 11 | **Visuals** | A real screenshot or unique image, with keyword-rich alt text and a caption. |
| 12 | **Proof** | First-hand detail, real product screenshots, sourced numbers. |
| 13 | **Mid-article CTA** | A `cta` block roughly in the middle, matched to the topic. |
| 14 | **FAQ** | 6 to 8 questions in `faq`, answers 2 to 3 sentences, direct. |
| 15 | **Resources** | Primary sources in `resources`, each with a short note. |
| 16 | **Closing CTA** | A last `cta` block. |
| 17 | **Internal links** | At least 4 to related posts and landing pages, with plain anchor text. |

---

## 3. Titles, slugs and keywords

- Put the **primary keyword at the front** of the title, and keep **title, H1 and slug on the same keyword**. Title and H1 are one field (`title`). Do not change a live slug.
- Target **bottom-of-funnel** phrases, the ones buyers type when they are close to choosing: "receipt scanner app", "expense tracker for gig workers", "invoice software for freelancers", "best receipt scanner app for small business", "free trial", "Android receipt scanner", "digital receipt storage", "receipt organizer", "tax receipt organizer".
- Use each main keyword **naturally 4 to 8 times** in a 2,000 word article: title, first 100 words, one or two H2s, body, FAQ, image alt text, meta description. More than that reads stuffed.
- Add **semantic and secondary terms** a human expert would naturally use: write-offs, deductions, Schedule C, estimated taxes, OCR, audit trail, 1099, mileage log, and so on.
- Make titles **clickable**: a benefit, a year, a number, or a specific audience. Keep it honest.
- Write a **meta description** (`description`) of 140 to 160 characters: keyword, outcome, one proof point.

---

## 4. Author and trust (E-E-A-T)

- Every article needs a **named human author** with a real profile link (LinkedIn or a site bio), a role and a short line of expertise. "Receipt Cycle Team" is a weak signal.
- **Do not invent an author.** If none exists, mark **Needs owner input** and ask who the author is and what link to use. A reviewer or fact-checker line is a plus if real.
- Show **published** and **updated** dates. Only change `dateModified` when the content really changed.
- Link the author and the company to **social profiles** that exist (check that they resolve).
- Add an **"About this guide" or methodology note** where it fits: how the facts were checked, when, and from which sources.

---

## 5. Copy that machines can lift

- **Question-based headers.** "How long should you keep digital receipts?" beats "Record retention".
- **Bottom line up front** in every section: the answer in the first sentence, then the detail.
- **Every H2 is an island.** A reader (or a model) who sees only that section should understand it. Re-state the subject instead of writing "this" or "as above".
- **Short paragraphs**, 1 to 3 sentences. Short sentences.
- **Semantic triples.** Write sentences as subject, verb, object, with real entities.
  - Weak: "The benefits of this tool are many."
  - Strong: "Receipt Cycle reads the merchant, date, total and tax from a receipt photo and saves it with the original image."
- **Entity-rich.** Name the brand, the product, the form, the agency, the place. "IRS Publication 463" beats "official guidance".
- **Specific numbers with sources.** A fact with a number and a source link is the most citable thing on the page.
- **No vague claims** that could read as biased ("the best", "revolutionary") unless you back them with criteria.
- **Lists and tables** for anything that is a list or a comparison.
- **Plain, balanced tone.** Say who an option is *not* for. Do not claim one option fits everyone.

---

## 6. Differentiation: what only we have

Generic pages are not cited. Add at least **three** of these to every article, using only what is real:

- **Real product screenshots** of Receipt Cycle in use (take them from the live app with the demo account).
- **First-party facts**: exactly how a feature works, file types and limits, what exports contain.
- **A worked example** with labeled example numbers.
- **A named framework** we coined and defined, such as "The 5-Step Proof Check" (ask the owner before coining one).
- **A methodology section** showing how we compared options.
- **A video**, once the owner records one (the demo guide is in `docs/marketing/DEMO_VIDEO_GUIDE.md`). Embed it with a transcript summary.
- **Original data** we really have. Do not make surveys up.
- **Named expert input** only if the owner supplies a real, consenting expert.
- **Contrarian but evidence-backed positions**, with sources.

---

## 7. Calls to action (more of them, matched to the topic)

The product is **a web app (7-day free trial) and an Android app**. Every CTA sends the reader to one of three things: start the web app or 7-day free trial (`/signup`), download the Android app (`PLAY_STORE_URL`), or see pricing (`/pricing`).

- Minimum **three** CTAs per article: after the key takeaways, mid-article, and at the end. Four or five is fine. Ten is too many.
- **Match the CTA to the topic.** A tax post: "Scan your first receipt free". A gig post: "Start tracking your gig expenses". An invoice post: "Create your first invoice".
- Use **clear, plain button text**. "Start your 7-day free trial" beats a clever line.
- Repo support:
  - `QuickSummaryCta` already appears under the key takeaways on every post.
  - Add `{ kind: "cta", ... }` blocks in the body for the middle and the end.
  - **Not built yet:** a sticky or floating sidebar CTA that stays visible while the reader scrolls. When the owner approves, build it in `src/pages/BlogPost.tsx` (desktop sidebar, a slim bar on phones) and run the layout audit.
- Never claim "free" or a price that is not on the pricing page. Facts: free plan = 7-day Pro trial and up to 25 transactions; Pro $3.50 a month, $35 a year, or $60 once.

---

## 8. Freshness

- Show a visible **"Updated"** date (the hero already does).
- **Refresh time-sensitive posts every 30 days, or at least every quarter** (rates, thresholds, prices, feature lists). Mention what changed ("Updated October 29, 2026: added the 2026 mileage rates").
- Put the **current year** in the title or text where it is true and useful.
- Re-read cited sources at each refresh and update the "reviewed" dates in `resources`.

---

## 9. Query fan-out: cover every bucket

When someone asks an AI "best receipt scanner app for taxes", the model quietly asks many related questions. A page that answers all of them gets cited. Cover each bucket, in the page or in a linked page:

| Bucket | The page must answer | Example sections |
|---|---|---|
| **A. Core intent** | The direct answer in 100 to 150 words. Who it is for. A plain-language definition. What "best" means here. A short recommendation. | Short version, definition |
| **B. Related topics** | What else to know before deciding. Definitions, examples. | What is it, how does it work, who is it for, when to use it |
| **C. Implicit questions** | Cost. Setup time. Effort. Risks and limits. What happens next. "What should I know before I choose?" | How much does it cost, how long does it take, risks, who it is not for |
| **D. Comparisons** | The main option against alternatives, in a table, with pros, cons and "better fit when". Never "best for everyone". | Option A vs B, alternatives, in-house vs software |
| **E. Freshness** | A visible updated date. The current year. Current prices and features. What changed. | Last updated, what is new |
| **F. Context variation** | How the answer changes by audience, budget, size or goal. "Best for" labels. | Best for freelancers, small business, beginners |
| **G. Next steps** | What to do next. A decision framework. Post-decision FAQs. Deeper links. | How to choose, how to get started, what to avoid |
| **H. Evidence and trust** | Reputable sources. First-hand experience. Screenshots or data. How the recommendation was made. Author expertise. Limitations. | Author, methodology, supporting evidence, limits |

---

## 10. The review checklist (use this to score a page)

Review a page by reading its source (`src/content/posts/*.ts` or the landing page file) and, when needed, the built page. Score each item **Pass**, **Partial**, **Fail**, or **Needs owner input**. Never mark Pass for something you did not see.

### A. On-page components
- [ ] Comparison table with real, sourced or criteria-based data
- [ ] Key takeaways (4 to 6, quotable)
- [ ] FAQ section (6 to 8 questions, 2 to 3 sentence answers)
- [ ] Specific numbers, dates and facts, each with a source
- [ ] No vague or biased-sounding claims
- [ ] Short paragraphs, bullets where a list belongs
- [ ] Customer reviews or quotes (only real ones; else **Needs owner input**)
- [ ] Screenshots or unique images with descriptive alt text
- [ ] First-hand experience, not generic advice
- [ ] Multimedia (image, table, video)
- [ ] Links to real social profiles
- [ ] Author named, linked to a real profile

### B. Differentiation
- [ ] Real product screenshots
- [ ] First-party facts about the product
- [ ] A methodology section (best, vs and list posts)
- [ ] A worked example with labeled numbers
- [ ] A named framework (only if the owner approved)
- [ ] Video (or marked **Needs owner input**)
- [ ] Original data or a contrarian, evidence-backed point

### C. Copy structure
- [ ] Question-style H2s
- [ ] Direct answer in the first 100 to 150 words
- [ ] Every H2 reads on its own
- [ ] Extractable passages: sentences that fully answer a question alone
- [ ] Entity-rich writing (named brands, forms, people, places)
- [ ] Facts carry source links

### D. Writing mechanics
- [ ] Short, simple sentences
- [ ] Semantic triples (subject, verb, object) in key claims
- [ ] No em or en dashes, no `**` markers, no AI-sounding filler (see human-writing)
- [ ] Image and table present, interactive element if any

### E. Freshness
- [ ] Visible updated date, and it is true
- [ ] Current year, current rates and prices
- [ ] Sources re-read within the last 30 to 90 days
- [ ] A note on what changed

### F. Query fan-out
- [ ] Buckets A to H each covered (see section 9). List any bucket that is missing.

### G. Conversion
- [ ] A CTA right after the key takeaways
- [ ] A CTA in the middle and at the end, 3 to 5 in total
- [ ] CTAs match the topic and use clear text
- [ ] Every CTA goes to the web app trial, the Android app, or pricing
- [ ] Sticky or sidebar CTA (note: not built yet)

### H. SEO plumbing
- [ ] Primary keyword in title, slug, H1, first 100 words, meta description
- [ ] Title is clickable and under about 70 characters
- [ ] Slug unchanged from the live URL
- [ ] 4 or more internal links, 3 or more external authoritative links
- [ ] Image alt text is descriptive
- [ ] Schema is complete (see section 11)
- [ ] Page passes the mobile layout audit

### I. Truth and trust
- [ ] Every product claim matches what the app does today
- [ ] Every tax or legal claim has a primary source and a reviewed date
- [ ] Illustrative examples are labeled
- [ ] Nothing fabricated (reviews, quotes, authors, statistics)

### Report format

```
Page: <title> (<slug>)
Score: <passes> / <total checked>   Verdict: Ready | Needs work | Blocked

Blocking problems (fix before publishing):
1. ...

Fix next (ordered by impact):
1. ...

Needs owner input:
- ... (e.g. named author and profile link, real testimonial, video)

Buckets missing from query fan-out: ...
What passed: (short list)
```

Verdict rules: **Blocked** if any item in section I fails, or a slug changed. **Needs work** if CTAs, answer-first, FAQ or sources are missing. **Ready** only when sections A to I pass or are explicitly **Needs owner input** with the owner informed.

---

## 11. Schema and discoverability in this repo

Structured data is generated from post data, so a complete post gets complete schema automatically. Fill these fields in the post object (`src/content/posts/*.ts`):

- `title`, `description`, `slug`, `datePublished`, `dateModified`, `author`, `readMinutes`, `tags`
- `tldr` and `keyTakeaways` (they feed the short answer and speakable text)
- `faq` (feeds `FAQPage` JSON-LD, which must match visible text)
- `resources` (primary sources, with notes)
- `featuredImage`, `featuredImageAlt`, `featuredImageWidth`, `featuredImageHeight`

The build produces `BlogPosting`, `FAQPage`, `BreadcrumbList`, `WebPage`, `ImageObject`, `Organization`, `WebSite` and `SoftwareApplication`, plus the sitemap, `llms.txt` and `llms-full.txt`. After a content change, always:

1. `npm run build` (this runs the SEO asset step and the prerender; never use a bare `vite build` before deploying).
2. `npx vitest run` (the schema tests check word counts, dashes, FAQ and sitemap sync).
3. Read `dist/blog/<slug>/index.html` and confirm the title, canonical URL and the JSON-LD types.
4. Deploy with `CI=1 npx wrangler deploy`, then fetch the live URL with `curl -L` and confirm 200 and the JSON-LD.

To improve AI discovery further (owner decisions): allow AI crawlers in Cloudflare (turn off "Block AI bots"), keep `robots.txt` open to GPTBot, ClaudeBot and PerplexityBot, submit the sitemap in Search Console and Bing Webmaster Tools, and keep `llms.txt` current.

---

## 12. Writing workflow

1. **Brief.** Decide the primary keyword, the page type (guide, case study, best-of, vs, landing), the reader, and the one action you want them to take.
2. **Gather facts.** Read the primary sources. Note their review dates. Check the product code for what is really supported.
3. **Outline** with question H2s and the fan-out buckets. Decide which tables and screenshots you will use.
4. **Draft** answer-first, using the human-writing skill.
5. **Add proof**: real screenshots, labeled examples, sources.
6. **Place CTAs** (takeaways, middle, end).
7. **Fill every schema field.**
8. **Self-check** against section 10, then hand to the reviewer agent.
9. **Build, test, preview at phone and desktop widths, deploy, verify live.**

## 13. Known gaps in the site today (fix when the owner approves)

- Authors are "Receipt Cycle Team". Ask for a named author, role and profile link.
- No sticky sidebar CTA on blog posts.
- No embedded video on posts.
- No real customer testimonials or first-party survey data.
- Competitor product screenshots are not used. If the owner wants them, check each site's terms first.
- Several older post slugs do not match their titles. Fix with redirects only if the owner approves.
