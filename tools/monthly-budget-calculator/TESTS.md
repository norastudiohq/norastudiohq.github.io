# Tests: 50/30/20 Monthly Budget Calculator

INTERNAL. Never deploy this file (the deploy step deletes every TESTS.md; 13 of them were found public on
2026-11-04 and removed).

Runner: `node projects/products/_build/qa_budget_tool.js <path-to-index.html>`
It pulls the page's inline script out of the HTML, stubs the DOM, and drives `analyze()`, `current()` and
`toCSV()` directly. The expected category table is read **out of the page**, so the test cannot quietly
drift away from what ships.

## Result

| Date | Target | Result |
|---|---|---|
| 2026-11-04 | local `projects/site/tools/monthly-budget-calculator/index.html` | **112/112** |
| 2026-11-04 | the **downloaded live page** `https://norastudiohq.github.io/tools/monthly-budget-calculator/` | **112/112**, md5 `b3495df7a310ab3b54b9d39d8e642fdc`, identical to the tested local file |

## What is covered

- **Structure:** 24 spending categories, 3 buckets, unique names, no income row leaked in from the paid
  planner's list, every default bucket index and amount valid.
- **The example plan, by hand:** needs 2700, wants 705, savings and debt 1120, planned 4525, income 5000,
  left over 475, shares 54% / 14.1% / 22.4%, targets 2500 / 1500 / 1000. Bucket sums equal the sum of all
  24 amounts, and the three shares add up to planned-as-a-share-of-income.
- **Income:** zero (no NaN share, no divide-by-zero, targets 0, `run()` does not throw), negative, text,
  empty, `1e400` (becomes 0, never Infinity), `1e13` (clamps to the 1e12 ceiling), and "other income"
  adding on with cents intact.
- **Targets:** over 100 clamps, negative clamps to 0, text clamps to 0, and targets are allowed not to
  total 100 (the page says so in words rather than forcing it).
- **Amounts and buckets:** negative, text and non-finite amounts; an out-of-range or blank bucket value
  falling back to the category's default; moving a category between buckets (the dollars move, `planned`
  does not change, and the emergency-fund runway stops counting it once it is savings); all-zero (planned
  0, left over = income, runway 0 not Infinity, top-5 empty); over budget (negative leftover, share above
  100%).
- **Top 5:** exactly 5, descending, zero rows dropped, each row carrying a bucket label.
- **Cents:** 3333.33 income against 1111.11 planned leaves exactly 2222.22.
- **Snapshot (`current()`):** blank name gets a fallback, 24 amounts and 24 buckets kept, bucket dollars
  add to planned, left over = income - planned, each percentage matches its own dollars, every value
  rounded to whole cents.
- **CSV:** CRLF endings, 10 + 24 + 24 = 58 columns in the header and in every data row, the paid planner
  and the tool both linked, every category named twice ($ and bucket), bucket names written as words not
  indexes, no Stripe/Upwork/Fiverr link, and two saved plans writing two rows.
- **Spreadsheet formula injection:** a leading `=`, `+`, `@` and `-` in the plan name are each neutralised
  with a leading apostrophe. A name containing `"`, a comma, or a CRLF stays inside one properly quoted
  field: an RFC 4180 splitter parses `Plan "A", two` back out whole and the row still has 58 columns.
- **Page and content:** canonical URL, title length, meta description length, `../../` paths for a
  two-deep page, the Etsy monthly-budget and personal-finance-bundle links, **no Stripe link**, **no
  Upwork or Fiverr mention** (the identity wall), no em dash, exactly one JSON-LD block that parses, with
  WebApplication + BreadcrumbList + FAQPage, the app URL matching the canonical, price 0, 3 breadcrumb
  steps, 5 FAQ questions, and **every FAQ question and answer present in the page's visible text** (Google
  requires the rendered page to match the schema).

## Known limits, stated rather than hidden

- The DOM is stubbed, so this does not prove the rendered layout, the saved-plan list, the localStorage
  path or the download click. `run()` is called and must not throw, but its HTML output is not inspected.
- Not opened in a real browser this run, and not checked at phone width.
- The 50/30/20 default bucket assignment is a judgement, not arithmetic: debt starts in savings-and-debt
  while strict 50/30/20 counts minimum payments as needs. The page says this in the panel note and in the
  FAQ, and every category has a dropdown, so the test asserts the mechanism works, not that the default
  is the one right answer.

## If the paid planner changes

The `CATS` table here is the Monthly Budget Planner's own category list from
`projects/products/_build/build_budget.py` minus its 3 income rows. Change both together, then re-run this
test and the planner's `qa_budget.ps1`.
