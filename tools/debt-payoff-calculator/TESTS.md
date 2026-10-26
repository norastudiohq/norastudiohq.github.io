# Debt Payoff Calculator tests (2026-10-26, built-in browser via window.__debtCalc vs _build/debt_sim.py)
- Example (Visa 4850/24.99/145, Store 1200/28.99/40, Car 11400/7.5/315, Medical 650/0/50, extra 200): min 58 mo $6,066.08; snowball 28 mo $2,737.64 payoffs 19/7/28/3; avalanche 28 mo $2,630.62 payoffs 19/6/28/13. All = debt_sim.py. PASS
- QA set (A 3000/22/90, B 800/18/30, Loan 6000/6/180, extra 300): min 52 $2,488.23; snow 18 $749.67; aval 18 $729.29; extra 0 snow 41 $2,350.78. All = debt_sim.py. PASS
- Negative amortization (A + Trap 5000/30/100): extra 0 -> "Never"/"Not within 50 years" + red verdict; extra 150 snow 35 mo $3,878.59 (= sim), minimums "Never", saved "All of it". PASS
- UI default: debt-free Feb 2029 (Oct 2026 + 28), verdict 2 yr 6 mo sooner, $3,435.46 less than minimums, avalanche $107.02 better than snowball. PASS
- Blank rows -> "Enter at least one debt", "-" cells; garbage (-500, abc, 1e20, APR 500, -3) -> 0 / capped 1e9 / APR 100, no NaN anywhere. 15-row cap, Add link hides. PASS
- Save list: name HTML-escaped; CSV '=HYPERLINK and '@plan prefixed; clear works. PASS
Simulation mirrors debt_sim.py and build_debt.py: change all together.
