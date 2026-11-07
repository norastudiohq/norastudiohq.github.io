# Depop Fee Calculator tests (2026-10-31)

Fee rules read on Depop's Help Centre, "Seller fees and charges" (Chrome): US no selling fee; processing 3.3% + $0.45 on price + shipping + tax; Boosted Listings 12% (new listings from 23 March 2026) on price, plus shipping if no Depop label.

Math: `node projects/products/_build/test_depop_tool.js` ALL PASS.
- $40, $7.50 buyer shipping, 7% tax: tax 3.33, total 50.83, processing 2.13, payout 37.87.
- Boosted + Depop label: boost 4.80, payout 33.07. Boosted, no label: boost 5.70, payout 32.17.
- Seller pays shipping: processing 1.86, payout 30.64.
- $1, no shipping, no tax: processing 0.48, payout 0.52.
- priceFor brute-forced minimal across 6 scenarios x 8 payouts.

Live page (2026-10-31): defaults, boost, no label, seller shipping, text and negative price ($0.00, no NaN), name with HTML escaped in the list, CSV row present, 375px no horizontal scroll.
