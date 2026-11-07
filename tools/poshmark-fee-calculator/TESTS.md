# Poshmark Fee Calculator tests (2026-10-28 growth sprint, built-in browser via window.__poshCalc, all PASS)
Rule: Poshmark US $2.95 flat under $15, 20% from $15 (checked 2026-10-28 web search; matches reseller tool + build_reseller.py).
Defaults price 35, disc 0, cost 8, extra 1, target 15, want 30 -> fee 7.00, earn 28.00, profit 19.00, lowest offer 30.00, list at 37.50.
Offers: 33.25/6.65/26.60/17.60, 31.50/6.30/25.20/16.20 (highlighted >= 15), 29.75/5.95/23.80/14.80 (not), 24.50/4.90/19.60/10.60.
Ladder: $5 2.95/2.05/59.0%, $10 2.95/7.05/29.5%, $14 11.05, $15 3.00/12.00, $100 20/80.
Boundary: fee(14.99)=2.95 earn 12.04; fee(15)=3.00. priceFor: 12->14.95, 12.04->14.99, 12.05->15.06, 30->37.50, 0/-5->0.
Brute force: priceFor(n) for every n = $0.01..$200.00: payout >= n and one cent less is not enough (0 failures).
Shipping discount 2.50 -> earn 25.50, profit 16.50, lowest 33.12, list 40.62 (hand math).
Garbage price "abc", cost -4 -> $0.00, no NaN. Name =HYPERLINK("x")<b> escaped in HTML, prefixed ' in CSV. 375px: scrollWidth 375, nothing overflows.
