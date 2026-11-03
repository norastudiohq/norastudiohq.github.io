# Mileage Deduction Calculator tests (2026-10-28, built-in browser, window.__mileageCalc)
Rates mirror build_mileage.py (0.725, 0.76 from Jul 1). Hand math, all passed:
- Default 2,400 / 2,600 mi, $120 parking, 12% + SE: d1 $1,740.00, d2 $1,976.00, mileage $3,716.00, total $3,836.00, saving $1,002.33 (3836 x (0.12 + 0.9235 x 0.153)), gain vs one rate $91.00, blended $0.7432.
- Total mode 5,000 mi: split 181/365 -> 2,479.5 / 2,520.5 mi, mileage $3,713.22 (5000 x 0.725 + 2520.548 x 0.035), total $3,833.22.
- Garbage (m1 "abc", m2 -5, parking blank): $0.00, no NaN, "Enter your 2026 business miles".
- 1,000 mi Jan-Jun only: $725.00, verdict "all before July 1".
- 1,000 mi Jul-Dec, 37%, not SE: $760.00, saving $281.20, gain $35.00.
- 1e12 miles capped at 1e7: $7,600,000.00.
- CSV: name "=HYPERLINK(...)" exported as '=..., "<b>x</b>" escaped in the list HTML; header rows carry tool URL + Stripe link.
- Mobile 375px: scrollWidth 375 (no horizontal scroll).
