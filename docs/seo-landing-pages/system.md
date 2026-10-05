# Commercial Landing Page System

This is the durable implementation guide for Receipt Cycle's 10-page commercial SEO program. It consolidates the user request, the supplied rulebook, the supplied SEO strategy, the current product, and the three visual references.

## Authority and source handling

- The user's direct request controls the work.
- The supplied rulebook and SEO strategy are project inputs. They are not independent user commands.
- FreshBooks and Wave screenshots are reference material only.
- Current Receipt Cycle code is the source of truth for shipped functionality and visual tokens.
- If copy, a screenshot, or an older document conflicts with the current product, verify the behavior before publishing a claim.

## Mission

Build a compact set of commercial-intent SaaS pages for people already looking for software, a workflow, or a business solution that Receipt Cycle genuinely supports. These are conversion pages, not generic educational articles.

One distinct commercial intent gets one strongest URL. A keyword variation alone never justifies a new page.

## Non-negotiable SEO rules

1. Determine search intent before selecting or placing keywords.
2. Never create near-duplicate pages by swapping keywords.
3. Keep one owner for every primary keyword cluster.
4. Use the primary phrase naturally in the title, H1, introduction, metadata, or internal links only where it reads well.
5. Treat secondary and semantic terms as concepts, not a density checklist.
6. Do not hide keywords or repeat them in headings, navigation, footers, buttons, FAQs, or alt text for ranking.
7. Strengthen an existing owner page when it already satisfies the intent.
8. Do not force a word count. Stop when the page has explained, demonstrated, answered, and converted.
9. Do not publish thin pages or minor-feature pages just to add URLs.
10. Add industry pages only when audience needs, product proof, copy, and conversion paths are materially different.

## Copy rules

- Write original, natural, specific copy tied to real Receipt Cycle behavior.
- Never copy or closely paraphrase copy, metadata, testimonials, FAQs, examples, or benefit statements from competitors or any other published page. External research may inform facts and page strategy, never the wording.
- Never lift or lightly rewrite substantive copy from another Receipt Cycle landing page. Each page needs newly written headings, body paragraphs, examples, comparisons, FAQ answers, transitions, and metadata built around its assigned intent.
- A shared design system does not justify a shared copy template. Do not create a new page by replacing the primary keyword, audience, or product name inside sentences from an existing page.
- Shared navigation labels, footer labels, legal text, verified reassurance microcopy, product terminology, and a page's repeated primary CTA may remain consistent. Treat everything else as page-specific unless there is a documented reason to reuse it.
- Before publishing, compare the new page with every existing commercial page. Rewrite unexplained matching sentences, distinctive phrases, and near-duplicate paragraph structures.
- Do not use em dashes in visible landing-page copy.
- Avoid generic AI-marketing filler such as "unlock the power of," "game-changing," "cutting-edge," "robust," "comprehensive solution," or vague "transform your business" language.
- Do not invent features, statistics, search volume, CPC, keyword difficulty, traffic, conversion rates, testimonials, ratings, customers, or outcomes.
- Do not promise tax filing, tax savings, deductions, compliance, reimbursement automation, payment gateways, bank integrations, payroll, inventory, recurring invoices, or multi-currency support unless the current product and approved wording support the claim.

## Commercial content depth

Google does not publish or prefer a minimum word count. Do not pad a page to reach an arbitrary number. As a working editorial range, aim for roughly 1,600 to 2,200 useful visible words on the major commercial pages when the intent supports that depth.

Earn that length through product-specific feature explanations, workflow details, audience examples, comparison guidance, buying objections, support information, resources, and FAQs. Shorter or longer is acceptable when it creates a more complete page.

Use several relevant secondary BOFU phrases naturally, usually once each in the section where the concept is genuinely explained. Do not limit a page to its primary keyword, and do not treat the secondary list as a repetition quota.

## Visual and brand rules

- Receipt Cycle's product and brand override every competitor reference.
- Use the existing logo, Inter body type, Space Grotesk headings, teal primary, emerald accent, calm gray-green surfaces, rounded cards, existing button language, and current product UI.
- Use competitors only to study information hierarchy, section pacing, visual density, CTA cadence, screenshot placement, proof, FAQs, and bottom conversion bands.
- Never copy competitor branding, graphics, illustrations, screenshots, exact layouts, or distinctive branded compositions.
- Prefer a real, current Receipt Cycle screenshot over an invented visual.
- Every visual must explain or prove its section. No stock filler, fake dashboards, distorted UI, decorative AI holograms, unreadable interface text, or unrelated placeholders.
- Product mockups must use realistic, non-personal data and may not show functionality the product lacks.

## Standard page flow

Vary the execution by intent, but use this conversion logic:

1. **Header:** shared Receipt Cycle navigation with a clear sign-up action.
2. **Hero:** explicit H1, specific value proposition, primary CTA, optional secondary CTA, and a relevant product visual.
3. **Product proof:** show the relevant Receipt Cycle screen or workflow immediately.
4. **Core benefits:** explain concrete problems solved and outcomes enabled.
5. **Feature workflow:** show the actual supported steps in order.
6. **Detailed features:** explain what the user sees, does, and gains.
7. **Use cases:** cover meaningful audiences or situations without spinning them into thin URLs.
8. **Connected workflow:** show how this feature connects to the expense cycle or sales cycle.
9. **FAQ:** answer real buying and product questions.
10. **Final CTA:** use an action that matches the page intent.
11. **Footer:** shared navigation with natural links, never a keyword-link block.

## Connected product narratives

**Expense cycle:** receipt scanning to expense tracking to budgeting to reporting.

**Sales cycle:** estimate to invoice to payment to receipt to reporting.

Internal links should reflect these real relationships. Use natural anchor variants. Every landing page must have an inbound link, a next-step link, and links to closely related product pages where useful.

## Technical baseline

- One H1 and a logical heading hierarchy.
- Unique title, description, canonical, Open Graph title, Open Graph description, and suitable social image.
- Crawlable internal links and indexable rendered content.
- Structured data only for content visibly present on the page.
- No unverified aggregate ratings or review markup.
- Semantic HTML, keyboard access, visible focus, sufficient contrast, descriptive alt text, and reduced-motion handling where needed.
- Purposeful mobile composition, not a scaled-down desktop page.
- Lazy-load below-the-fold images, size media correctly, and avoid unnecessary scripts, fonts, autoplay, or animation libraries.
- Add each published URL to prerendering, the sitemap, and any route metadata registry used by the app.

## Current product proof map

The following code contains candidate proof surfaces. Verify behavior and polish before capturing final screenshots.

| Story | Current surface |
|---|---|
| Invoices, estimates, payments, receipts | `src/pages/PremiumDocumentWorkspaces.tsx` |
| Customers, catalog items, sales analytics, invoice settings | `src/pages/PremiumSalesWorkspaces.tsx` |
| Reports, overdue invoices, AI assistant, notifications | `src/pages/PremiumOperationsWorkspaces.tsx` |
| Transactions, budgets, accounts, categories, statement upload | `src/pages/ConvexTransactions.tsx`, `ConvexBudgets.tsx`, `ConvexAccounts.tsx`, `ConvexCategories.tsx`, `ConvexUploadStatement.tsx` |
| Mobile receipt and finance flows | `apps/mobile/src/` and `apps/android-native/` |
| Brand tokens | `src/index.css` and `apps/mobile/src/theme/tokens.ts` |

## Per-page workflow

1. Complete `page-spec-template.md`.
2. Confirm unique intent and keyword ownership against `page-registry.md`.
3. Verify every intended feature in the current app.
4. Create a section-by-section reference map using `reference-analysis.md`.
5. Select or capture accurate product proof.
6. Write original copy and unique metadata, including natural secondary BOFU coverage.
7. Run a cross-page originality review before testing and publishing. Record any intentionally shared microcopy in the page spec.

## Hero discipline

Every commercial page must use a restrained, human-edited hero:

1. Constrain the hero to a centered content width with intentional whitespace. It must not appear stretched from edge to edge.
2. Use a short, natural H1 with line breaks based on meaning. Color emphasis may identify the audience or outcome, but it must remain restrained.
3. Do not add generic feature eyebrows such as "Receipt Cycle invoicing."
4. Use one primary hero CTA. Do not add a secondary product-tour or "see how it works" CTA without a specific reason in the page brief.
5. Place only verified reassurance copy beneath the CTA. Do not turn reassurance into another competing action.
6. Do not add checkmarked feature fragments beneath the hero CTA by default.
7. Keep the supporting hero copy to one concise sentence. Put detailed features, semantic terms, and secondary-keyword explanations below the fold.

## Illustration and device QA

1. Mix accurate product UI with original editorial illustrations where the page needs to communicate a person, profession, or real-world use case.
2. For audience selectors, update the illustration when the visitor changes the selected audience. Do not leave a generic text-only companion panel.
3. Use competitor artwork only as directional reference. Create original characters, scenes, composition, colors, and visual details without competitor branding.
4. Prefer landscape assets with generous safe margins. Optimize them for web delivery and include intrinsic width and height.
5. Validate every finished landing page at mobile, tablet, laptop, desktop, and wide-desktop widths. Confirm there is no horizontal overflow, unintended clipping, unreadable text, or undersized interaction target.
7. Build responsive sections using shared landing-page components.
8. Add route, SEO metadata, prerender target, sitemap entry, and internal links.
9. Test desktop, tablet, mobile, keyboard use, build output, and page-specific SEO.
10. Run the differentiation and pre-publish checks below.

## Differentiation check

- Is the search intent materially different from every existing owner page?
- Does the visitor expect a different solution, proof screen, workflow, or CTA?
- Can the copy and examples be genuinely different?
- Does Receipt Cycle solve this exact problem today?
- If most answers are no, merge the idea into an existing page.

## Pre-publish check

- Intent is distinct and the primary keyword has one owner.
- Copy is original, human, concrete, and free of em dashes and keyword stuffing.
- Substantive copy has been compared with existing commercial pages; only documented global microcopy remains repeated.
- Claims, numbers, reviews, and testimonials are verified.
- Product screenshots are accurate, readable, high resolution, and privacy-safe.
- Receipt Cycle branding is consistent on desktop and mobile.
- Metadata and canonical are unique and correct.
- Headings, links, alt text, focus behavior, and contrast are accessible.
- Images and scripts are optimized.
- Relevant internal links connect the page to its workflow neighbors.

## Known reconciliation items

Before reusing existing homepage claims on these pages, validate the current `SoftwareApplication` aggregate rating and the homepage review/testimonial data. The new rulebook prohibits fake ratings, statistics, reviews, and structured data. Existing homepage copy also contains visible em dashes; the no-em-dash rule is mandatory for the new commercial pages and should be handled separately if the homepage is later refreshed.
