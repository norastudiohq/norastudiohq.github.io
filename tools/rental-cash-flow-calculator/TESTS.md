# Rental Property Cash Flow Calculator - tests (2026-10-22)

Expected values computed independently in Python (scratch hand.py), compared to `window.__rentalCalc.analyze(inputs())` and the rendered DOM in the built-in browser. All PASS (exact to the cent / 4 dp). No NaN/Infinity/undefined in DOM or CSV in any case.

Formulas: loan = price x (1 - down%); payment = L*r/(1-(1+r)^-n), r = rate/1200, n = years*12; 0% -> L/n; no loan or no term -> 0.
Rent after vacancy = rent x (1 - vac%). Opex/mo = tax/12 + ins/12 + HOA + other + maint% x rent + mgmt% x rent-after-vacancy.
NOI = (eff - opex) x 12. CF = eff - opex - payment. Cash invested = down + closing. Cap = NOI/price; CoC = CF/yr / cash; GRM = price/(rent x 12); DSCR = NOI/(payment x 12).

Inputs order: price, down%, rate%, term, closing, rent, vac%, tax/yr, ins/yr, HOA, other, maint%, mgmt%

| # | Case | Inputs | Loan | Pmt | Opex/mo | NOI/yr | CF/mo | CF/yr | Cap | CoC | GRM | DSCR | Verdict |
|---|------|--------|------|-----|---------|--------|-------|-------|-----|-----|-----|------|---------|
| 1 | Normal (defaults) | 250000,20,7,30,7500,2200,5,3000,1200,0,50,8,8 | 200000 | 1330.60 | 743.20 | 16161.60 | 16.20 | 194.34 | 6.46% | 0.34% | 9.47 | 1.01 | positive |
| 2 | 0% interest | 200000,25,0,15,5000,1800,5,2400,900,0,0,5,0 | 150000 | 833.33 | 365.00 | 16140.00 | 511.67 | 6140.00 | 8.07% | 11.16% | 9.26 | 1.61 | positive |
| 3 | 100% down | 180000,100,6.5,30,4000,1600,8,2000,1000,50,25,10,10 | 0 | 0 | 632.20 | 10077.60 | 839.80 | 10077.60 | 5.60% | 5.48% | 9.38 | no loan | positive |
| 4 | 0 rent | 300000,20,6,30,6000,0,5,3600,1500,100,0,8,8 | 240000 | 1438.92 | 525.00 | -6300.00 | -1963.92 | -23567.06 | -2.10% | -35.71% | n/a | -0.36 | negative |
| 5 | Negative cash flow | 400000,10,7.5,30,12000,2400,8,6000,2400,250,100,10,10 | 360000 | 2517.17 | 1510.80 | 8366.40 | -1819.97 | -21839.67 | 2.09% | -42.00% | 13.89 | 0.28 | negative |
| 6 | Garbage/blank | "150000","abc","","-5","1e999","1500","NaN","  ","-100","--","Infinity","x1","-" -> all but price/rent = 0 | 150000 | 0 (warning: enter a loan term) | 0 | 18000 | 1500 | 18000 | 12.00% | n/a | 8.33 | n/a | positive |
| 7 | Very large (1e15 capped to 1e12, % capped to 100) | 1e15,20,7,30,1e15,1e15,5,1e15,1e15,1e15,1e15,100,100 | 8.0e11 | 5322419961.43 | 4116666666666.67 | -3.8e13 | -3171989086628.10 | -38063869039537.20 | -3800% | -3171.99% | 0.08 | -594.97 | negative |
| 8 | % caps (down 150->100, vac 250->100) | 200000,150,5,30,0,2000,250,1200,600,0,0,5,5 | 0 | 0 | 250.00 | -3000.00 | -250.00 | -3000.00 | -1.50% | -1.50% | 8.33 | no loan | negative |

## Save / delete / CSV
- Saved 3: `Oak St, Unit "B"` (case 1, CF 16.20), `=HYPERLINK("http://x","y")` (case 5, -1819.97), `<img src=x onerror=alert(1)>` (case 5). 3 rows rendered; no <img> injected (escaped).
- Delete row 2 -> 2 left, count "(2)". Clear -> 0, table hidden, empty message shown.
- CSV: header rows name Nora Studio, the tool URL and the tracker Stripe link; comma/quote name -> `"Oak St, Unit ""B"""`; formula name -> `"'=HYPERLINK(""http://x"",""y"")"`; no NaN. PASS.
- Live site: localStorage persistence across reload and mobile 375px overflow checked after deploy (see journal).
