// Brewing water maths for a Grainfather G40. Loaded by index.html and by the tests.
(function (root) {
  const DEFAULTS = {
    deadSpace: 8,      // L lost under the false bottom, pump and plumbing on a G40
    absorption: 0.8,   // L of water held back per kg of grain
    mashRatio: 3.0,    // L of strike water per kg of grain, on top of dead space
  };

  function round(n, places = 1) {
    const f = 10 ** places;
    return Math.round(n * f) / f;
  }

  // All volumes in litres, grain in kg, boil time in minutes, boil-off in L/hour.
  function calculate({
    batchLitres,
    grainKg,
    boilMinutes,
    boilOffPerHour,
    deadSpace = DEFAULTS.deadSpace,
    absorption = DEFAULTS.absorption,
    mashRatio = DEFAULTS.mashRatio,
  }) {
    const inputs = { batchLitres, grainKg, boilMinutes, boilOffPerHour, deadSpace, absorption, mashRatio };
    for (const [name, value] of Object.entries(inputs)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a non-negative number`);
      }
    }

    const boilOff = boilOffPerHour * (boilMinutes / 60);
    const grainAbsorption = grainKg * absorption;
    const total = batchLitres + deadSpace + grainAbsorption + boilOff;

    // Strike covers the mash thickness plus the dead space below the false bottom.
    // A very big grain bill can ask for more than the total; then everything goes in the mash.
    const idealStrike = grainKg * mashRatio + deadSpace;
    const strike = Math.min(idealStrike, total);
    const sparge = total - strike;

    return {
      total,
      strike,
      sparge,
      breakdown: { batch: batchLitres, deadSpace, grainAbsorption, boilOff },
      preBoil: total - deadSpace - grainAbsorption,
      noSparge: idealStrike >= total,
    };
  }

  const api = { calculate, round, DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BrewCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
