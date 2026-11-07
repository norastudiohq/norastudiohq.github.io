// Break-test for the free Quote & Estimate Calculator page.
// Same approach as projects/products/_build/qa_budget_tool.js: pull the page's own
// inline script out of the real file, stub only the DOM it touches, then drive
// parseNum()/analyze()/toText()/toCSV()/save()/restore() with real and hostile input.
// skills/spreadsheet-qa.md gate, web-tool variant.
// Usage: node qa_quote_tool.js <path to index.html>
const fs = require('fs');
const file = process.argv[2] || require('path').join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.log('FAIL: no inline script found'); process.exit(1); }
const src = m[1];

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; } else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); }
};

/* ---------------- DOM stub: only what the maths path touches ---------------- */
const vals = {};
const nodes = {};
function el(id) {
  return {
    get value() { return vals[id] === undefined ? '' : vals[id]; },
    set value(v) { vals[id] = String(v); },
    textContent: '', innerHTML: '', className: '',
    style: {}, addEventListener() { }, appendChild() { }, remove() { },
    setAttribute() { }, select() { }, getAttribute() { return null; }
  };
}
const document = {
  getElementById: id => nodes[id] || (nodes[id] = el(id)),
  querySelector: () => ({ innerHTML: '', addEventListener() { }, appendChild() { } }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, click() { }, remove() { }, setAttribute() { }, select() { } }),
  body: { appendChild() { } },
  execCommand() { return true; }
};
// a real in-memory localStorage, so save/restore can actually be round-tripped
let store = {};
const localStorage = {
  getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
const win = {};
const navigator = {};
const alert = () => { };
const Blob = function () { };
const URL = { createObjectURL: () => 'x', revokeObjectURL() { } };
const setTimeoutStub = () => { };

const fn = new Function('document', 'localStorage', 'window', 'navigator', 'alert', 'Blob', 'URL', 'setTimeout', 'console',
  src + '\nreturn window.__quoteCalc;');
const api = fn(document, localStorage, win, navigator, alert, Blob, URL, setTimeoutStub, console);
const { MAXROWS, START_ROWS, KEY, parseNum, r2, usd, pct, lines, inputs, analyze, toText, toCSV, state, save, restore, apply, clearAll, loadExample } = api;

const A = () => analyze(inputs());
const reset = () => { loadExample(); };          // the page's own first-visit example
reset();

// RFC 4180 field splitter, so a quoted comma does not look like a new column
function csvFields(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur); return out;
}
const blankAll = () => { for (let i = 0; i < MAXROWS; i++) { vals['d' + i] = ''; vals['q' + i] = ''; vals['p' + i] = ''; } };
const oneRow = (q, p, d) => { blankAll(); vals['d0'] = d === undefined ? 'Item' : d; vals['q0'] = q; vals['p0'] = p; };

console.log('--- structure ---');
ok('12 line-item rows, same as the paid Word template', MAXROWS === 12, MAXROWS);
ok('starts with 4 rows showing', START_ROWS === 4, START_ROWS);
ok('localStorage key is namespaced and versioned', /^nora-.*-v\d+$/.test(KEY), KEY);
ok('lines() returns one entry per row', lines().length === 12, lines().length);
ok('r2 is exposed and rounds to cents', r2(1.005) === 1.01, r2(1.005));
ok('usd formats with thousands separators', usd(1250.5) === '$1,250.50', usd(1250.5));
ok('usd shows a negative with the sign outside', usd(-5) === '-$5.00', usd(-5));
ok('pct keeps a 3-decimal rate uncut', pct(6.625) === '6.625%', pct(6.625));
ok('pct drops noise on a whole rate', pct(20) === '20%', pct(20));
ok('pct of zero is 0%', pct(0) === '0%', pct(0));

console.log('--- parseNum: what counts as a number ---');
ok('plain integer', parseNum('12') === 12);
ok('decimal', parseNum('12.5') === 12.5);
ok('trailing dot', parseNum('12.') === 12, parseNum('12.'));
ok('leading dot', parseNum('.5') === 0.5, parseNum('.5'));
ok('thousands separator stripped', parseNum('1,250.50') === 1250.5, parseNum('1,250.50'));
ok('leading dollar sign stripped', parseNum('$45') === 45, parseNum('$45'));
ok('dollar sign + thousands together', parseNum('$1,250.50') === 1250.5, parseNum('$1,250.50'));
ok('pound and euro signs stripped too', parseNum('£99') === 99 && parseNum('€99') === 99);
ok('surrounding spaces ignored', parseNum('  7  ') === 7);
ok('zero is a real value, not blank', parseNum('0') === 0);
ok('blank is null, not 0', parseNum('') === null);
ok('whitespace only is null', parseNum('   ') === null);
ok('undefined is null', parseNum(undefined) === null);
ok('pure text rejected', parseNum('abc') === null);
ok('number followed by text rejected', parseNum('3 widgets') === null, parseNum('3 widgets'));
ok('negative rejected', parseNum('-5') === null, parseNum('-5'));
ok('negative decimal rejected', parseNum('-0.01') === null);
ok('plus sign rejected', parseNum('+5') === null);
ok('exponent notation rejected', parseNum('1e9') === null, parseNum('1e9'));
ok('huge exponent cannot become Infinity', parseNum('1e400') === null);
ok('fraction rejected', parseNum('1/2') === null);
ok('the string NaN rejected', parseNum('NaN') === null);
ok('the string Infinity rejected', parseNum('Infinity') === null);
ok('accounting parentheses rejected', parseNum('(12)') === null);
ok('absurd but finite value clamps to 1e12', parseNum('99999999999999999') === 1e12, parseNum('99999999999999999'));
ok('a capped field clamps at its cap', parseNum('200', 100) === 100);

console.log('--- the example quote ---');
let a = A();
ok('3 active lines', a.count === 3, a.count);
ok('line 1: 8 x $65.00 = $520.00', lines()[0].total === 520, lines()[0].total);
ok('line 2: 3 x $42.50 = $127.50', lines()[1].total === 127.5, lines()[1].total);
ok('line 3: 1 x $45.00 = $45.00', lines()[2].total === 45, lines()[2].total);
ok('subtotal 692.50', a.subtotal === 692.5, a.subtotal);
ok('no tax, no discount, no deposit by default', a.tax === 0 && a.discount === 0 && a.deposit === 0, [a.tax, a.discount, a.deposit]);
ok('total equals subtotal when nothing is applied', a.total === 692.5, a.total);
ok('balance equals total when no deposit', a.balance === a.total, [a.balance, a.total]);
ok('average per line 230.83', a.avg === 230.83, a.avg);
ok('no row is flagged bad', a.bad === 0, a.bad);

console.log('--- blank rows stay blank ---');
let L = lines();
ok('rows 4 to 12 are inactive', L.slice(3).every(l => !l.active), L.slice(3).filter(l => l.active).length);
ok('an inactive row has a null line total, not 0', L.slice(3).every(l => l.total === null), L[3].total);
ok('an inactive row is not flagged bad', L.slice(3).every(l => !l.bad));
blankAll(); a = A();
ok('all rows blank: subtotal 0', a.subtotal === 0, a.subtotal);
ok('all rows blank: 0 lines', a.count === 0, a.count);
ok('all rows blank: total 0, not NaN', a.total === 0, a.total);
ok('all rows blank: average 0, not NaN', a.avg === 0, a.avg);
oneRow('', '65'); ok('price without a quantity stays blank', lines()[0].total === null && !lines()[0].bad, lines()[0]);
oneRow('8', ''); ok('quantity without a price stays blank', lines()[0].total === null && !lines()[0].bad, lines()[0]);
oneRow('0', '65'); ok('quantity 0 stays blank rather than showing $0.00', lines()[0].total === null && A().count === 0);
oneRow('2', '0');
ok('unit price 0 IS a real line (an item included at no charge)', lines()[0].active && lines()[0].total === 0, lines()[0].total);
blankAll(); vals['d5'] = 'Only the sixth row'; vals['q5'] = '2'; vals['p5'] = '10';
ok('a filled row below blank rows still counts', A().subtotal === 20 && A().count === 1, A().subtotal);
reset();

console.log('--- garbage input must not poison the subtotal ---');
vals['q0'] = 'eight'; a = A();
ok('text quantity: that line contributes nothing', a.subtotal === 127.5 + 45, a.subtotal);
ok('text quantity: the row is flagged bad', lines()[0].bad === true);
ok('text quantity: 2 lines left', a.count === 2, a.count);
reset();
vals['p0'] = 'sixty five'; a = A();
ok('text price: that line contributes nothing', a.subtotal === 127.5 + 45, a.subtotal);
ok('text price: the row is flagged bad', lines()[0].bad === true);
reset();
vals['q0'] = '-4'; a = A();
ok('negative quantity: line ignored, subtotal unchanged', a.subtotal === 127.5 + 45, a.subtotal);
ok('negative quantity: row flagged bad so the user sees it', lines()[0].bad === true);
ok('negative quantity: never produces a negative subtotal', a.subtotal > 0 && a.total > 0);
reset();
vals['p1'] = '-42.50'; a = A();
ok('negative price: line ignored', a.subtotal === 520 + 45, a.subtotal);
ok('negative price: row flagged bad', lines()[1].bad === true);
reset();
vals['q0'] = 'x'; vals['p1'] = 'y'; a = A();
ok('two bad rows are both counted', a.bad === 2, a.bad);
reset();
vals['q0'] = '1,2,3'; ok('comma soup parses as 123, not NaN', lines()[0].total === 123 * 65, lines()[0].total);
reset();
vals['p0'] = '1e400'; a = A();
ok('an exponent that would overflow is rejected, never Infinity', isFinite(a.subtotal) && a.subtotal === 127.5 + 45, a.subtotal);
reset();

console.log('--- thousands and dollar signs on a real line ---');
oneRow('1', '$1,250.50'); ok('$1,250.50 unit price', lines()[0].total === 1250.5, lines()[0].total);
oneRow('2', '$1,250.50'); ok('2 x $1,250.50 = $2,501.00', A().subtotal === 2501, A().subtotal);
oneRow('1,000', '1.5'); ok('quantity with a thousands comma', A().subtotal === 1500, A().subtotal);
ok('formatted subtotal reads $1,500.00', usd(A().subtotal) === '$1,500.00', usd(A().subtotal));
reset();

console.log('--- decimals and cent rounding ---');
oneRow('2.5', '19.99');
ok('2.5 x 19.99 rounds the half cent up to 49.98', A().subtotal === 49.98, A().subtotal);
ok('that case really is below the true 49.975 in binary float', 2.5 * 19.99 < 49.975, 2.5 * 19.99);
ok('the Number.EPSILON nudge alone would have given 49.97',
  Math.round((2.5 * 19.99 + Number.EPSILON) * 100) / 100 === 49.97, Math.round((2.5 * 19.99 + Number.EPSILON) * 100) / 100);
ok('r2 is sign-safe: r2(-0) is 0, not -0', Object.is(r2(-0), 0) || r2(-0) === 0, r2(-0));
ok('r2 of a non-finite value is 0, never NaN', r2(NaN) === 0 && r2(Infinity) === 0, [r2(NaN), r2(Infinity)]);
oneRow('3', '0.145');
ok('3 x 0.145 = 0.44 (naive float gives 0.43500000000000005)', lines()[0].total === 0.44, lines()[0].total);
ok('the naive float really is off here', 3 * 0.145 !== 0.435, 3 * 0.145);
oneRow('1', '0.615');
ok('1 x 0.615 = 0.62, not the 0.61 toFixed(2) gives', lines()[0].total === 0.62, lines()[0].total);
ok('toFixed(2) on 0.615 really is wrong', (0.615).toFixed(2) === '0.61', (0.615).toFixed(2));
blankAll();
for (let i = 0; i < 10; i++) { vals['d' + i] = 'Cents ' + i; vals['q' + i] = '1'; vals['p' + i] = '0.07'; }
ok('ten lines of 0.07 sum to exactly 0.70', A().subtotal === 0.7, A().subtotal);
ok('every money field is a whole number of cents', (() => {
  const z = A(); return [z.subtotal, z.discount, z.tax, z.total, z.deposit, z.balance]
    .every(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6);
})());
reset();

console.log('--- tax / VAT ---');
vals['tax'] = '0'; a = A();
ok('tax 0: tax amount 0', a.tax === 0 && a.total === a.subtotal, [a.tax, a.total]);
vals['tax'] = '6.625'; a = A();
ok('tax 6.625% of 692.50 = 45.88', a.tax === 45.88, a.tax);
ok('tax 6.625%: total 738.38', a.total === 738.38, a.total);
ok('tax rate survives as 6.625, not cent-rounded', a.taxRate === 6.625, a.taxRate);
vals['tax'] = '20'; a = A();
ok('tax 20% of 692.50 = 138.50', a.tax === 138.5, a.tax);
ok('tax 20%: total 831.00', a.total === 831, a.total);
vals['tax'] = 'twenty'; ok('text tax rate falls back to 0', A().tax === 0 && A().taxRate === 0);
vals['tax'] = '-5'; ok('negative tax rate falls back to 0', A().taxRate === 0);
vals['tax'] = '500'; ok('tax rate clamps at 100%', A().taxRate === 100 && A().tax === 692.5, [A().taxRate, A().tax]);
vals['tax'] = ''; ok('blank tax rate is 0', A().taxRate === 0);
vals['tax'] = '0';

console.log('--- discount: percent vs flat ---');
vals['discmode'] = 'pct'; vals['discval'] = '10'; a = A();
ok('10% off 692.50 = 69.25', a.discount === 69.25, a.discount);
ok('10% off: total 623.25', a.total === 623.25, a.total);
vals['discval'] = '0'; ok('0% off: discount 0', A().discount === 0);
vals['discval'] = '150'; a = A();
ok('a percent discount clamps at 100%', a.discPct === 100 && a.discount === 692.5, [a.discPct, a.discount]);
ok('a 100% discount gives total 0, never negative', a.total === 0, a.total);
vals['discval'] = 'half off'; ok('text discount is 0', A().discount === 0);
vals['discval'] = '-10'; ok('negative discount is 0', A().discount === 0);
vals['discmode'] = 'flat'; vals['discval'] = '100'; a = A();
ok('flat $100 off: discount 100', a.discount === 100, a.discount);
ok('flat $100 off: total 592.50', a.total === 592.5, a.total);
vals['discval'] = '692.50'; ok('a flat discount equal to the subtotal gives total 0', A().total === 0 && A().discount === 692.5);
vals['discval'] = '10000'; a = A();
ok('a flat discount bigger than the subtotal is capped at the subtotal', a.discount === 692.5, a.discount);
ok('an over-sized discount can never make the total negative', a.total === 0, a.total);
ok('an over-sized discount leaves nothing taxable', a.taxable === 0, a.taxable);
vals['discval'] = '$1,000'; ok('a flat discount typed with $ and a comma still caps', A().discount === 692.5, A().discount);
vals['discval'] = '0.005'; ok('a sub-cent flat discount rounds to 0.01', A().discount === 0.01, A().discount);
vals['discmode'] = 'pct'; vals['discval'] = '10'; vals['tax'] = '20'; a = A();
ok('tax is charged after the discount: 623.25 taxable', a.taxable === 623.25, a.taxable);
ok('tax 20% on the discounted amount = 124.65', a.tax === 124.65, a.tax);
ok('discount then tax: total 747.90', a.total === 747.9, a.total);
vals['discmode'] = 'flat'; vals['discval'] = '10000'; a = A();
ok('a full discount leaves 0 tax even at 20%', a.tax === 0 && a.total === 0, [a.tax, a.total]);
vals['tax'] = '0'; vals['discmode'] = 'pct'; vals['discval'] = '0';

console.log('--- deposit ---');
vals['deposit'] = '0'; a = A();
ok('deposit 0: nothing up front', a.deposit === 0 && a.balance === a.total, [a.deposit, a.balance]);
vals['deposit'] = '50'; a = A();
ok('deposit 50% of 692.50 = 346.25', a.deposit === 346.25, a.deposit);
ok('deposit 50%: balance 346.25', a.balance === 346.25, a.balance);
ok('deposit + balance = total exactly', r2(a.deposit + a.balance) === a.total, [a.deposit, a.balance, a.total]);
vals['deposit'] = '100'; a = A();
ok('deposit 100%: the whole total up front', a.deposit === a.total, [a.deposit, a.total]);
ok('deposit 100%: balance 0', a.balance === 0, a.balance);
vals['deposit'] = '150'; ok('deposit clamps at 100%', A().depositPct === 100 && A().balance === 0);
vals['deposit'] = '-20'; ok('negative deposit is 0', A().depositPct === 0);
vals['deposit'] = 'half'; ok('text deposit is 0', A().depositPct === 0);
vals['deposit'] = '33'; vals['tax'] = '6.625'; a = A();
ok('an awkward split still adds back to the total', r2(a.deposit + a.balance) === a.total, [a.deposit, a.balance, a.total]);
ok('deposit 33% of 738.38 = 243.67', a.deposit === 243.67, a.deposit);
vals['tax'] = '0'; vals['deposit'] = '50'; blankAll(); oneRow('3', '0.145'); a = A();
ok('a 50% deposit on $0.44 splits 0.22 / 0.22', a.deposit === 0.22 && a.balance === 0.22, [a.deposit, a.balance]);
vals['deposit'] = '33'; a = A();
ok('a 33% deposit on $0.44 still adds back exactly', r2(a.deposit + a.balance) === a.total, [a.deposit, a.balance, a.total]);
vals['deposit'] = '0'; reset();

console.log('--- Copy as text ---');
let x = inputs(), t = toText(x, analyze(x));
ok('text has the subtotal line', t.includes('Subtotal: $692.50'), t.split('\n').filter(s => s.indexOf('Subtotal') === 0));
ok('text has the total due line', t.includes('Total due: $692.50'));
ok('text has a zero tax line', t.includes('Tax (0%): $0.00'));
ok('text names every line item', t.includes('Labour, on site') && t.includes('Materials, supplied') && t.includes('Call-out fee'));
ok('text shows qty x unit price per line', t.includes('(8 x $65.00): $520.00'), t.split('\n')[5]);
ok('text has no discount line when there is no discount', !/Discount/.test(t));
ok('text has no deposit line when there is no deposit', !/Deposit/.test(t));
ok('text links back to the tool', t.includes('/tools/quote-estimate-calculator/'));
ok('text has no Etsy, Stripe, Upwork or Fiverr link', !/etsy\.com|buy\.stripe\.com|upwork|fiverr/i.test(t));
vals['tax'] = '6.625'; vals['discmode'] = 'pct'; vals['discval'] = '10'; vals['deposit'] = '50';
vals['qnum'] = '1042'; vals['qdate'] = '7 Nov 2026'; vals['qfrom'] = 'Smith & Sons'; vals['qclient'] = 'Jane Doe';
vals['notes'] = 'Valid for 30 days.';
x = inputs(); a = analyze(x); t = toText(x, a);
ok('text header carries the quote number', t.split('\n')[0] === 'QUOTE #1042', t.split('\n')[0]);
ok('text carries date, from and for', t.includes('Date: 7 Nov 2026') && t.includes('From: Smith & Sons') && t.includes('For: Jane Doe'));
ok('text discount line shows the percent', t.includes('Discount (10%): -$69.25'), a.discount);
ok('text tax line shows the 6.625% rate', t.includes('Tax (6.625%): $41.29'), a.tax);
ok('text total matches analyze()', t.includes('Total due: ' + usd(a.total)), [a.total, usd(a.total)]);
ok('text deposit line shows the percent and amount', t.includes('Deposit due now (50%): ' + usd(a.deposit)), a.deposit);
ok('text balance line is present', t.includes('Balance due on completion: ' + usd(a.balance)));
ok('text carries the notes line', t.includes('Valid for 30 days.'));
blankAll(); t = toText();
ok('an empty quote says so instead of printing junk', t.includes('No line items yet'));
ok('an empty quote still shows a $0.00 total', t.includes('Total due: $0.00'));
reset();

console.log('--- CSV ---');
let csv = toCSV(), rows = csv.split('\r\n');
ok('CSV uses CRLF line endings', csv.indexOf('\r\n') > 0);
ok('CSV row 10 is the item header', rows[9] === 'Description,Qty,Unit price,Line total', rows[9]);
ok('CSV writes one row per active line', rows.slice(10, 13).length === 3 && rows[13] === '', [rows[10], rows[13]]);
ok('CSV item row 1 is the labour line', csvFields(rows[10]).join('|') === 'Labour, on site|8|65|520', csvFields(rows[10]));
ok('CSV item rows have 4 columns each', [10, 11, 12].every(i => csvFields(rows[i]).length === 4), [10, 11, 12].map(i => csvFields(rows[i]).length));
ok('CSV has the 6 totals rows', ['Subtotal', 'Discount', 'Tax (', 'Total due', 'Deposit due', 'Balance due'].every(s => csv.includes(s)));
ok('CSV subtotal matches analyze()', csv.includes('Subtotal,,,692.5'), rows.filter(r => r.indexOf('Subtotal') === 0));
ok('CSV links back to the tool', csv.includes('/tools/quote-estimate-calculator/'));
ok('CSV points at the Nora Studio products anchor', csv.includes('#products'));
ok('CSV invents no Etsy listing and no Stripe link', !/etsy\.com|buy\.stripe\.com/i.test(csv));
ok('CSV has no Upwork or Fiverr mention', !/upwork|fiverr/i.test(csv));
blankAll(); rows = toCSV().split('\r\n');
ok('an empty quote writes 0 item rows', rows[10] === '', rows[10]);
ok('an empty quote still writes the totals block', toCSV().includes('Total due,,,0'));
reset();
vals['d0'] = 'Labour, 8 hrs, "rush" rate';
rows = toCSV().split('\r\n');
ok('a comma and a quote in a description are escaped', rows[10].startsWith('"Labour, 8 hrs, ""rush"" rate"'), rows[10].slice(0, 40));
ok('a comma in a description adds no column', csvFields(rows[10]).length === 4, csvFields(rows[10]).length);
ok('the escaped description parses back out whole', csvFields(rows[10])[0] === 'Labour, 8 hrs, "rush" rate', csvFields(rows[10])[0]);
vals['d0'] = '=cmd|' + String.fromCharCode(39) + ' /C calc' + String.fromCharCode(39) + '!A0';
rows = toCSV().split('\r\n');
ok('a leading = is neutralised with a quote', /^"?'=cmd/.test(rows[10]), rows[10].slice(0, 20));
vals['d0'] = '+1+1'; rows = toCSV().split('\r\n');
ok('a leading + is neutralised', /^"?'\+1\+1/.test(rows[10]), rows[10].slice(0, 12));
vals['d0'] = '@SUM(A1)'; rows = toCSV().split('\r\n');
ok('a leading @ is neutralised', /^"?'@SUM/.test(rows[10]), rows[10].slice(0, 12));
vals['d0'] = '-5 hours'; rows = toCSV().split('\r\n');
ok('a leading - is neutralised', /^"?'-5 hours/.test(rows[10]), rows[10].slice(0, 14));
vals['d0'] = 'two\r\nlines'; rows = toCSV().split('\r\n');
ok('a newline in a description stays inside one quoted field', rows[10].startsWith('"two'), rows[10].slice(0, 10));
vals['qnum'] = '=HYPERLINK("http://x")'; csv = toCSV();
ok('a formula in the quote number is neutralised too', csv.includes('"\'=HYPERLINK(""http://x"")"'), csv.split('\r\n')[6]);
reset();

console.log('--- save and restore (localStorage) ---');
store = {};
ok('save() reports success', save() === true);
ok('save() writes the namespaced key', typeof store[KEY] === 'string' && store[KEY].length > 10);
ok('what is written is valid JSON', (() => { try { JSON.parse(store[KEY]); return true; } catch (e) { return false; } })());
vals['d0'] = 'Round trip line'; vals['q0'] = '7'; vals['p0'] = '1,999.95';
vals['tax'] = '6.625'; vals['discmode'] = 'flat'; vals['discval'] = '25'; vals['deposit'] = '40';
vals['qfrom'] = 'Round Trip Ltd'; vals['qclient'] = 'A Client'; vals['qnum'] = 'RT-1'; vals['qdate'] = '1 Jan 2027';
vals['notes'] = 'Round trip notes';
const before = analyze(inputs());
save();
const saved = store[KEY];
clearAll();
ok('clearAll() really empties the quote', analyze(inputs()).count === 0 && inputs().from === '', inputs());
store[KEY] = saved;
ok('restore() reports success', restore() === true);
const after = analyze(inputs());
ok('restored: description', vals['d0'] === 'Round trip line', vals['d0']);
ok('restored: quantity text exactly as typed', vals['q0'] === '7', vals['q0']);
ok('restored: price keeps its thousands comma', vals['p0'] === '1,999.95', vals['p0']);
ok('restored: tax rate', inputs().tax === 6.625, inputs().tax);
ok('restored: discount mode', inputs().discMode === 'flat', inputs().discMode);
ok('restored: discount value', inputs().discVal === 25, inputs().discVal);
ok('restored: deposit', inputs().deposit === 40, inputs().deposit);
ok('restored: business, client, number, date, notes',
  inputs().from === 'Round Trip Ltd' && inputs().client === 'A Client' && inputs().qnum === 'RT-1'
  && inputs().qdate === '1 Jan 2027' && inputs().notes === 'Round trip notes', inputs());
ok('restored: subtotal identical', after.subtotal === before.subtotal, [after.subtotal, before.subtotal]);
ok('restored: total identical', after.total === before.total, [after.total, before.total]);
ok('restored: deposit and balance identical', after.deposit === before.deposit && after.balance === before.balance);
store = {};
ok('restore() with nothing saved returns false', restore() === false);
store[KEY] = 'not json at all {';
ok('restore() with corrupt JSON returns false and does not throw',
  (() => { try { return restore() === false; } catch (e) { return false; } })());
store[KEY] = JSON.stringify({ v: 1 });
ok('restore() with a state missing its rows does not throw',
  (() => { try { restore(); return analyze(inputs()).count === 0; } catch (e) { return false; } })());
store[KEY] = JSON.stringify({ v: 1, rows: 'nope', tax: {}, shown: 999, discmode: 'weird' });
ok('restore() with hostile types does not throw', (() => { try { restore(); return true; } catch (e) { return false; } })());
ok('a hostile saved tax rate becomes 0', analyze(inputs()).taxRate === 0, analyze(inputs()).taxRate);
ok('a hostile saved discount mode falls back to percent', inputs().discMode === 'pct', inputs().discMode);
ok('a saved row count out of range falls back to 4', api.shown === START_ROWS, api.shown);
ok('apply(null) is refused, not thrown', apply(null) === false);
store = {}; reset();
const st = state();
ok('state() carries all 12 rows', Array.isArray(st.rows) && st.rows.length === 12, st.rows && st.rows.length);
ok('state() stores the raw typed text, not parsed numbers', st.rows[1][2] === '42.50', st.rows[1][2]);

console.log('--- run(): the render path must never throw ---');
const runs = () => { try { api.run(); return true; } catch (e) { console.log('    ' + e.message); return false; } };
reset(); ok('run() survives the example quote', runs());
ok('run() wrote the total into the page', nodes['total'].textContent === '$692.50', nodes['total'].textContent);
ok('run() wrote the subtotal into the page', nodes['subtotal'].textContent === '$692.50', nodes['subtotal'].textContent);
ok('run() leaves a blank row total empty, not $0.00', nodes['t5'].textContent === '', nodes['t5'].textContent);
ok('run() fills an active row total', nodes['t0'].textContent === '$520.00', nodes['t0'].textContent);
blankAll(); ok('run() survives a completely empty quote', runs());
ok('empty quote prompts instead of showing a false total', /Add a description/.test(nodes['verdict'].textContent), nodes['verdict'].textContent);
reset(); vals['q0'] = 'eight'; ok('run() survives a bad row', runs());
ok('a bad row is called out in the verdict', /not a positive number/.test(nodes['verdict'].textContent), nodes['verdict'].textContent);
ok('a bad row gets the red class', nodes['r0'].className.indexOf('bad') > -1, nodes['r0'].className);
reset(); ok('a fixed row loses the red class', runs() && nodes['r0'].className === 'qrow', nodes['r0'].className);
vals['tax'] = '6.625'; vals['deposit'] = '50'; ok('run() survives tax and a deposit', runs());
ok('run() labels the tax row with the rate', nodes['taxlabel'].textContent === 'Tax (6.625%)', nodes['taxlabel'].textContent);
ok('run() labels the deposit row with the percent', nodes['deplabel'].textContent === 'Deposit due (50%)', nodes['deplabel'].textContent);
ok('run() shows a discount as a negative', (() => { vals['discval'] = '10'; api.run(); return nodes['discount'].textContent.indexOf('-$') === 0; })(), nodes['discount'].textContent);
ok('run() saves to localStorage as a side effect', (() => { store = {}; api.run(); return typeof store[KEY] === 'string'; })());
vals['discmode'] = 'flat'; api.run();
ok('switching to a flat discount relabels the field', nodes['disclabel'].textContent === '($)', nodes['disclabel'].textContent);
reset(); api.run();

console.log('--- page and content ---');
ok('canonical url is the tool url', html.includes('rel="canonical" href="https://norastudiohq.github.io/tools/quote-estimate-calculator/"'));
const title = html.match(/<title>(.*?)<\/title>/)[1];
ok('title under 70 chars before the brand', title.split('|')[0].trim().length <= 70, title.split('|')[0].trim().length);
ok('title carries the target phrase', /quote calculator/i.test(title), title);
ok('meta description is 80-320 chars', /<meta name="description" content=".{80,320}">/.test(html));
ok('stylesheet path is correct for a 2-deep page', html.includes('href="../../style.css"'));
ok('nav links resolve 2 levels up', html.includes('href="../../index.html"'));
ok('footer links resolve 2 levels up', html.includes('href="../../terms.html"') && html.includes('href="../../privacy.html"'));
ok('funnel card points at the site products anchor', html.includes('href="../../index.html#products"'));
ok('no invented Etsy listing url', !/etsy\.com/i.test(html));
ok('no Stripe link on the page', !/buy\.stripe\.com/.test(html));
ok('identity wall: no Upwork or Fiverr mention', !/upwork|fiverr/i.test(html));
ok('no em dash in the copy', !html.includes('—'));
ok('the localStorage promise is stated in plain words', html.includes('Saved locally in your browser only - nothing is uploaded'));
ok('negative-quantity decision is documented on the page', /negative quantity/i.test(html));
ok('discount cap decision is documented on the page', /discount can never be bigger than the subtotal/i.test(html));
ok('blank-row decision is documented on the page', /Blank rows stay blank/.test(html));
ok('cent rounding is documented on the page', /rounded to the nearest cent/.test(html));
ok('tax-after-discount order is documented on the page', /Tax is charged after the discount/.test(html));
ok('all four buttons are on the page', ['id="addrow"', 'id="copy"', 'id="csv"', 'id="clear"'].every(s => html.includes(s)));
ok('viewport meta is present for mobile', html.includes('name="viewport" content="width=device-width, initial-scale=1"'));
ok('a narrow-screen breakpoint stacks the item rows', /@media\(max-width:560px\)/.test(html));
const ld = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g);
ok('exactly one JSON-LD block', ld && ld.length === 1, ld ? ld.length : 0);
let graph = null;
try { graph = JSON.parse(ld[0].replace(/<\/?script[^>]*>/g, '')); } catch (e) { }
ok('JSON-LD parses', !!graph);
if (graph) {
  const types = graph['@graph'].map(n => n['@type']);
  ok('JSON-LD has WebApplication + BreadcrumbList + FAQPage',
    types.includes('WebApplication') && types.includes('BreadcrumbList') && types.includes('FAQPage'), types);
  const app = graph['@graph'].find(n => n['@type'] === 'WebApplication');
  ok('JSON-LD url matches the canonical', app.url === 'https://norastudiohq.github.io/tools/quote-estimate-calculator/');
  ok('JSON-LD price is 0', app.offers.price === '0');
  ok('JSON-LD description matches the meta description',
    html.includes('content="' + app.description + '"'), app.description.slice(0, 40));
  const bc = graph['@graph'].find(n => n['@type'] === 'BreadcrumbList');
  ok('breadcrumb has 3 steps', bc.itemListElement.length === 3, bc.itemListElement.length);
  const faq = graph['@graph'].find(n => n['@type'] === 'FAQPage');
  ok('FAQ has 5 questions', faq.mainEntity.length === 5, faq.mainEntity.length);
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&middot;/g, '.').replace(/\s+/g, ' ');
  faq.mainEntity.forEach(q => ok('FAQ question is visible: ' + q.name.slice(0, 34), visible.includes(q.name), q.name));
  faq.mainEntity.forEach(q => ok('FAQ answer is visible: ' + q.name.slice(0, 26),
    visible.includes(q.acceptedAnswer.text.slice(0, 60)), q.acceptedAnswer.text.slice(0, 60)));
}

console.log('\nSUMMARY: ' + pass + ' passed, ' + fail + ' failed  (' + pass + '/' + (pass + fail) + ')');
process.exit(fail ? 1 : 0);
