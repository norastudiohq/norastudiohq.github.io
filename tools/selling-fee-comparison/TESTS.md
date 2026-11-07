# Selling Fee Comparison tests (2026-10-31)

Fee rules are not newly researched: they are lifted from this site's five single-platform calculators, each of
which was verified on that platform's own help page (eBay "Selling fees" non-Store, Poshmark's fee page, Mercari
help center article 169, Depop Help Centre "Seller fees and charges", whatnot.com/seller/fees), all checked
October 2026.

Model stated on the page: the buyer pays shipping and the label costs what the buyer paid, so payout = price -
fees on all five. Order total = round2(price + shipping) + round2(that x tax%), rounded again — the same two-step
rounding the sibling tools use.

Math: `node projects/products/_build/test_comparison_tool.js` ALL PASS.

- **Cross-check, 1155 cases: every platform's fee in this tool equals the fee its own calculator on this site
  returns for the same sale.** 11 scenarios (shipping 0 / 7.50 / 12, tax 0 / 7 / 11.5%, 4 eBay categories, Depop
  boost, Mercari Instant Pay, Whatnot 8 / 4 / 3%) x 21 prices ($0.01 to $12,000, including every fee step) x 5
  platforms. This is the test that matters: if the comparison and a single-platform page ever disagree, one of
  them is lying to a visitor.
- Defaults ($40, $7.50 buyer shipping, 7% tax, $10 cost, $1 other): eBay $7.31 fee / $32.69 payout, Poshmark
  $8.00 / $32.00, Mercari $4.75 / $35.25, Depop $2.13 / $37.87, Whatnot $4.97 / $35.03. The Depop and Whatnot
  numbers match the published examples on those two pages.
- Toggles: Depop boosted $6.93 / $33.07 (matches the Depop page), Mercari Instant Pay $7.75, eBay media $8.18,
  eBay guitars $3.81, Whatnot at 4% $3.37.
- Fee steps: Poshmark $2.95 at $14.99 and 20% at $15; eBay's per-order fee $0.30 at a $10 order total, $0.40 at
  $10.01; eBay's 2.35% tier above $7,500 ($8,000 item -> $1,032.15).
- Break-even: brute-forced minimal to the cent across 270 cases, and for all 11 scenarios asserted both that the
  break-even price covers the basis and that a cent less does not.
- A 100% commission returns null rather than hanging.

**Bug caught and fixed by the cross-check:** the first version computed the order total as
`round2((price + shipping) x (1 + tax))` in one step. That disagreed with all three sibling tools by a cent when
the tax landed on a half-cent (a $499.50 item at 11.5% tax: $19.10 vs $19.11 on Depop). The platforms round the
tax on the order first, so the sibling model is the correct one. 1 failure in 1155 — hand-picked examples would
not have found it.

Live page (2026-10-31): see the "Growth sprint" section of journal/2026-10-31.md for what was checked in the
browser.
