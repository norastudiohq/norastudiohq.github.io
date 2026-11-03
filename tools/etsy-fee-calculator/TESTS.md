# Etsy Fee Calculator tests (2026-10-27, all PASS)
Automated: `node projects/products/_build/test_etsy_fee_tool.js` evaluates this page's own fee code against hand-worked numbers. Result: 17/17.
- Defaults ($25 item, qty 1, $5 shipping, $6 cost, $4.50 postage): transaction 1.95, processing 1.15, listing 0.20, total 3.30, profit 16.20.
- Break-even price $7.10 (= 10.95/0.905 - 5); 40% target price $16.68 (= 10.95/0.505 - 5).
- Offsite Ads 15% -> 4.50, 12% -> 3.60; a $1,000 sale caps ads at $100 (total fees 195.45).
- $2 sales tax raises processing to 1.21 (tax is in the processing base only). Qty 3 at $10 + $5 shipping: tx 2.275, listing 0.60, total 4.175.
- $5 digital download: fees 0.925. $0 sale: 0.45 fixed fees.
Inputs: negative, blank or text values count as 0 (num()); qty rounds to a whole number of at least 1; target margin capped at 80%.
