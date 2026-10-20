const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate, round } = require('../assets/brewcalc.js');

// Worked by hand: 19 L batch, 4.2 kg grain, 60 min boil at 3 L/h on a G40, no kettle loss.
//   boil-off   = 3 L/h × 1 h            = 3.00
//   absorption = 4.2 kg × 0.8 L/kg       = 3.36
//   total      = 19 + 0 + 3.36 + 3       = 25.36   (8 L dead space is recovered, not lost)
//   strike     = 4.2 kg × 3.0 L/kg + 8   = 20.60
//   sparge     = 25.36 − 20.60           = 4.76
test('19 L batch, 4.2 kg grain, 60 min at 3 L/h', () => {
  const r = calculate({ batchLitres: 19, grainKg: 4.2, boilMinutes: 60, boilOffPerHour: 3 });
  assert.equal(round(r.total, 2), 25.36);
  assert.equal(round(r.strike, 2), 20.6);
  assert.equal(round(r.sparge, 2), 4.76);
  assert.equal(round(r.preBoil, 2), 22);
  assert.equal(r.noSparge, false);
});

test('dead space changes strike but not total', () => {
  const base = { batchLitres: 19, grainKg: 4.2, boilMinutes: 60, boilOffPerHour: 3 };
  const a = calculate({ ...base, deadSpace: 8 });
  const b = calculate({ ...base, deadSpace: 4 });
  assert.equal(round(a.total, 2), round(b.total, 2));
  assert.equal(round(a.strike - b.strike, 2), 4);
});

test('kettle loss and boil time both add to the total', () => {
  // 90 min at 3 L/h = 4.5 L; total = 23 + 2 + 4.0 + 4.5 = 33.5; strike = 15 + 8 = 23
  const r = calculate({ batchLitres: 23, grainKg: 5, boilMinutes: 90, boilOffPerHour: 3, kettleLoss: 2 });
  assert.equal(round(r.breakdown.boilOff, 2), 4.5);
  assert.equal(round(r.total, 2), 33.5);
  assert.equal(round(r.preBoil, 2), 29.5);
  assert.equal(round(r.strike, 2), 23);
  assert.equal(round(r.sparge, 2), 10.5);
});

test('huge grain bill puts all water in the mash rather than a negative sparge', () => {
  // total = 10 + 9.6 + 3 = 22.6; ideal strike = 36 + 8 = 44 > total
  const r = calculate({ batchLitres: 10, grainKg: 12, boilMinutes: 60, boilOffPerHour: 3 });
  assert.equal(r.noSparge, true);
  assert.equal(round(r.strike, 2), 22.6);
  assert.equal(r.sparge, 0);
});

test('rejects bad input', () => {
  assert.throws(() => calculate({ batchLitres: -1, grainKg: 4, boilMinutes: 60, boilOffPerHour: 3 }), RangeError);
  assert.throws(() => calculate({ batchLitres: 19, grainKg: NaN, boilMinutes: 60, boilOffPerHour: 3 }), RangeError);
  assert.throws(() => calculate({ batchLitres: 19, grainKg: 4, boilMinutes: 60, boilOffPerHour: 3, kettleLoss: -1 }), RangeError);
});
