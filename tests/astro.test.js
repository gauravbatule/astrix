import assert from 'assert/strict';
import {
  julianDate,
  calculatePlanets,
  getZodiacSign,
  getNakshatra,
  getSubLord,
} from '../static/astro.js';

function nearlyEqual(actual, expected, places = 4) {
  const factor = 10 ** places;
  assert.equal(Math.round(actual * factor) / factor, Math.round(expected * factor) / factor);
}

(function testJulianDate() {
  const jd = julianDate({ dateString: '2000-01-01', timeString: '12:00:00' }, 0);
  nearlyEqual(jd, 2451545.0, 4);
  console.log('✓ julianDate baseline test passed');
})();

(function testPlanetaryLongitude() {
  const planets = calculatePlanets(2451545.0, 4);
  nearlyEqual(planets.Sun.longitude, 280.46, 2);
  nearlyEqual(planets.Moon.longitude, 218.316, 3);
  console.log('✓ calculatePlanets mean longitude test passed');
})();

(function testZodiacNakshatra() {
  assert.equal(getZodiacSign(29.0), 0);
  assert.equal(getZodiacSign(30.1), 1);
  const nak = getNakshatra(15);
  assert.equal(nak.index, 1);
  assert.equal(nak.name, 'Bharani');
  const sub = getSubLord(15);
  assert.ok(['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'].includes(sub));
  console.log('✓ zodiac and nakshatra mapping tests passed');
})();
