# Mercari Fee Calculator tests (2026-10-29, node on extracted functions + built-in browser via window.__mercariCalc, all PASS)
Rule: Mercari US 10% of item price + buyer-paid shipping, no processing fee, Instant Pay $3 (mercari.com help center article 169, fetched 2026-10-29). Matches reseller tool PLATS row (10%, onShip).
Defaults price 40, ship 7.50 (you pay), cost 10, extra 1, target 15, want 30 -> fee 4.00, earn 28.50, profit 17.50, lowest offer 37.22 (fee rounds to 3.72, payout exactly 26.00), list at 41.67, buyer-pays alt 35.25.
Buyer pays + Instant Pay -> fee 4.75 (10% of 47.50), earn 32.25, lowest 33.06, list 37.50, you-pay alt 25.50.
Offers (defaults): full 28.50/17.50 and 5% off 26.70/15.70 highlighted; 10% off 24.90/13.90 not.
Ladder ($7.50 ship): $10 1.00/1.50 | 1.75/8.25; $15 1.50/6.00 | 2.25/12.75; $20 2.00/10.50 | 2.75/17.25.
Brute force: priceFor(n) for n = $0.01..$200.00 under 5 shipping/instant combos: payout >= n and one cent less is not enough (0 failures). earn() monotone in price to $300.
Garbage price "abc", cost -4 -> $0.00, fee $0.00, profit -$1.00 (extra 1), no NaN anywhere. Name =HYPERLINK("x")<b> escaped in HTML, prefixed ' in CSV. 375px: scrollWidth 375, nothing overflows.
