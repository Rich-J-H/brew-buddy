const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate, round } = require('./brewcalc.js');

// Worked by hand: 19 L batch, 4.2 kg grain, 60 min boil at 3 L/h on a G40.
//   boil-off   = 3 L/h × 1 h            = 3.00
//   absorption = 4.2 kg × 0.8 L/kg       = 3.36
//   total      = 19 + 8 + 3.36 + 3       = 33.36
//   strike     = 4.2 kg × 3.0 L/kg + 8   = 20.60
//   sparge     = 33.36 − 20.60           = 12.76
test('19 L batch, 4.2 kg grain, 60 min at 3 L/h', () => {
  const r = calculate({ batchLitres: 19, grainKg: 4.2, boilMinutes: 60, boilOffPerHour: 3 });
  assert.equal(round(r.total, 2), 33.36);
  assert.equal(round(r.strike, 2), 20.6);
  assert.equal(round(r.sparge, 2), 12.76);
  assert.equal(round(r.preBoil, 2), 22);
  assert.equal(r.noSparge, false);
});

test('boil-off scales with boil time', () => {
  // 90 min at 3 L/h = 4.5 L; 23 + 8 + 4.0 + 4.5 = 39.5
  const r = calculate({ batchLitres: 23, grainKg: 5, boilMinutes: 90, boilOffPerHour: 3 });
  assert.equal(round(r.breakdown.boilOff, 2), 4.5);
  assert.equal(round(r.total, 2), 39.5);
  assert.equal(round(r.strike + r.sparge, 2), round(r.total, 2));
});

test('huge grain bill puts all water in the mash rather than a negative sparge', () => {
  // total = 10 + 8 + 9.6 + 3 = 30.6; ideal strike = 36 + 8 = 44 > total
  const r = calculate({ batchLitres: 10, grainKg: 12, boilMinutes: 60, boilOffPerHour: 3 });
  assert.equal(r.noSparge, true);
  assert.equal(round(r.strike, 2), 30.6);
  assert.equal(r.sparge, 0);
});

test('rejects bad input', () => {
  assert.throws(() => calculate({ batchLitres: -1, grainKg: 4, boilMinutes: 60, boilOffPerHour: 3 }), RangeError);
  assert.throws(() => calculate({ batchLitres: 19, grainKg: NaN, boilMinutes: 60, boilOffPerHour: 3 }), RangeError);
});
