const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/styles-data.js');
const { search, srmToHex, fold } = require('../assets/styleguide.js');

const { styles, categories } = globalThis.BJCP_STYLES;
const ids = list => list.map(s => s.id);

test('style data is complete and consistent', () => {
  assert.equal(styles.length, 110);
  assert.equal(new Set(ids(styles)).size, styles.length, 'style ids are unique');
  assert.ok(categories.length >= 30);
  for (const s of styles) {
    assert.ok(s.text.overall, `${s.id} has an overall impression`);
    if (!s.stats) continue;
    for (const [key, [min, max]] of Object.entries(s.stats)) {
      assert.ok(min <= max, `${s.id} ${key} range ${min}–${max}`);
    }
  }
});

test('spot-check stats against the BJCP 2021 guidelines', () => {
  const byId = id => styles.find(s => s.id === id);
  assert.deepEqual(byId('1A').stats, { og: [1.028, 1.04], fg: [0.998, 1.008], ibu: [8, 12], srm: [2, 3], abv: [2.8, 4.2] });
  assert.deepEqual(byId('21A').stats.ibu, [40, 70]);
  assert.equal(byId('29A').stats, null, 'fruit beer stats depend on the base style');
});

test('searching by number finds the exact style first', () => {
  assert.equal(search(styles, '21a')[0].id, '21A');
  assert.deepEqual(ids(search(styles, '21')), ['21A', '21B', '21C']);
});

test('search ignores accents and case', () => {
  assert.equal(fold('Bière de Garde'), 'biere de garde');
  assert.equal(search(styles, 'kolsch')[0].id, '5B');
  assert.equal(search(styles, 'MARZEN')[0].id, '6A');
});

test('multi-word search needs every word to match', () => {
  const r = ids(search(styles, 'oatmeal stout'));
  assert.equal(r[0], '16B');
  assert.ok(!r.includes('20C'), 'imperial stout does not mention oatmeal');
});

test('filters combine: OR within a group, AND across groups', () => {
  const darkStrong = ids(search(styles, '', { colour: ['dark'], strength: ['strong'] }));
  assert.ok(darkStrong.includes('20C'), 'Imperial Stout is dark and strong');
  assert.ok(!darkStrong.includes('15B'), 'Irish Stout is not strong');
  const paleOrDark = search(styles, '', { colour: ['pale', 'dark'] });
  assert.ok(paleOrDark.some(s => s.tags.includes('pale-color')) && paleOrDark.some(s => s.tags.includes('dark-color')));
  assert.ok(!paleOrDark.some(s => s.tags.includes('amber-color') && !s.tags.includes('pale-color') && !s.tags.includes('dark-color')));
});

test('SRM maps to a beer colour', () => {
  assert.match(srmToHex(4), /^#[0-9A-F]{6}$/);
  assert.notEqual(srmToHex(2), srmToHex(35));
  assert.equal(srmToHex(500), srmToHex(40), 'clamps very dark beers');
});
