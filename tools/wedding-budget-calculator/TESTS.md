# Wedding Budget Calculator tests (2026-10-25, built-in browser via window.__weddingCalc)
- Default 30,000 / 100 guests: per guest $300; venue $6,000 (20%); catering $7,500 (25%); venue+catering $13,500; catering/guest $75; extra guest $96 (per-head 32% = 9,600 / 100); cut 10 = $960; split 100%. PASS
- 45,000 / 150: per guest $300, venue $9,000, extra guest $96. PASS
- Venue 30% -> 110%, "Over budget by $4,500", red verdict. Venue 15% -> 95%, "$2,250 still to assign". PASS
- Guests blank -> "Add guests", n/a fields; budget -5 + guests "abc" -> $0 + "Enter your total budget". No NaN. PASS
- 20,000 / 5 guests: $4,000/guest, label "Cutting 5 guests" ($6,400 = all per-head). 2.7 guests -> floored to 2. 1e20 -> capped 1e12, no overflow text. PASS
- Save list: HTML name escaped in table; CSV '=HYPERLINK' prefixed with ', header 42 cols = row 42 cols; remove/clear work. PASS
- Live mobile 375px: scrollWidth 375, no overflow. PASS
Category % list mirrors build_wedding.py: change both together.
