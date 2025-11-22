const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const MINUTES_PER_DAY = 1440;
const NAKSHATRA_SIZE = 13.333333333333334;
const PADA_SIZE = 3.3333333333333335;

export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const DASA_ORDER = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];

const DASA_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const NAKSHATRA_LORD_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];

function normalizeAngle(angle) {
  const mod = angle % 360;
  return mod < 0 ? mod + 360 : mod;
}

function roundToPrecision(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function parseDate(dateStr) {
  const parts = dateStr.split("-").map(Number);
  return { year: parts[0], month: parts[1], day: parts[2] };
}

function parseTime(timeStr) {
  const segments = timeStr.split(":").map(Number);
  const [hour, minute = 0, second = 0] = segments;
  return { hour, minute, second };
}

export function parseInputs(raw) {
  if (!raw) {
    throw new Error("Missing inputs object");
  }
  const { name, birth_date, birth_time, location_text, time_zone, precision, lat, lon } = raw;

  if (!birth_date) {
    const error = new Error("Missing required field: birth_date");
    error.code = 400;
    error.hint = "Provide birth_date in YYYY-MM-DD";
    throw error;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) {
    const error = new Error("Invalid date format");
    error.code = 422;
    error.hint = "Use YYYY-MM-DD";
    throw error;
  }

  if (!birth_time) {
    const error = new Error("Missing required field: birth_time");
    error.code = 400;
    error.hint = "Provide birth_time in HH:mm or HH:mm:ss";
    throw error;
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(birth_time)) {
    const error = new Error("Invalid time format");
    error.code = 422;
    error.hint = "Use HH:mm or HH:mm:ss";
    throw error;
  }

  const parsedPrecision = Number.isFinite(Number(precision)) ? Math.max(1, Math.min(6, Number(precision))) : 4;

  return {
    name: name?.trim() || "",
    birth_date,
    birth_time,
    location_text: location_text?.trim() || "",
    time_zone: time_zone?.trim() || null,
    precision: parsedPrecision,
    lat: lat != null ? Number(lat) : null,
    lon: lon != null ? Number(lon) : null,
  };
}

export function julianDate(dateParts, tzOffsetMinutes) {
  const { year, month, day } = parseDate(dateParts.dateString);
  const { hour, minute, second } = parseTime(dateParts.timeString);
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const rawMinutes = hour * 60 + minute + second / 60;
  const correctedMinutes = rawMinutes - tzOffsetMinutes;
  const dayShift = Math.floor(correctedMinutes / MINUTES_PER_DAY);
  const normalizedMinutes = correctedMinutes - dayShift * MINUTES_PER_DAY;
  const fractionalDay = normalizedMinutes / MINUTES_PER_DAY;
  const dayValue = day + dayShift + fractionalDay;

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayValue + B - 1524.5;
  return jd;
}

export function calculatePlanets(jd, precision = 4) {
  const D = jd - 2451545.0;
  const T = (jd - 2451545.0) / 36525.0;
  const planets = {};

  const formulas = {
    Sun: 280.460 + 0.9856474 * D,
    Moon: 218.316 + 13.176396 * D,
    Mercury: 60.750 + 4.0923388 * D,
    Venus: 88.307 + 1.6021305 * D,
    Mars: 18.602 + 0.52402075 * D,
    Jupiter: 19.895 + 0.08308529 * D,
    Saturn: 316.967 + 0.03344414 * D,
  };

  Object.entries(formulas).forEach(([body, value]) => {
    const longitude = normalizeAngle(value);
    const zodiac_sign = getZodiacSign(longitude);
    const degree_in_sign = roundToPrecision(longitude % 30, precision);
    planets[body] = {
      longitude: roundToPrecision(longitude, precision),
      normalized_longitude: roundToPrecision(longitude, precision),
      zodiac_sign,
      degree_in_sign,
    };
  });

  const rahu = normalizeAngle(125.04 - 1934.136 * T);
  const ketu = normalizeAngle(rahu + 180);
  planets.Rahu = {
    longitude: roundToPrecision(rahu, precision),
    normalized_longitude: roundToPrecision(rahu, precision),
    zodiac_sign: getZodiacSign(rahu),
    degree_in_sign: roundToPrecision(rahu % 30, precision),
  };
  planets.Ketu = {
    longitude: roundToPrecision(ketu, precision),
    normalized_longitude: roundToPrecision(ketu, precision),
    zodiac_sign: getZodiacSign(ketu),
    degree_in_sign: roundToPrecision(ketu % 30, precision),
  };

  return planets;
}

export function calculateAscendant(jd, lat, lon, precision = 4) {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T ** 2 - (T ** 3) / 38710000;
  gmst = normalizeAngle(gmst);
  const lst = normalizeAngle(gmst + lon);

  const epsilon = (23.4393 - 0.01300 * T) * DEG2RAD;
  const latRad = lat * DEG2RAD;
  const lstRad = lst * DEG2RAD;

  let rawAsc = Math.atan2(
    Math.sin(lstRad),
    Math.cos(lstRad) * Math.cos(epsilon) - Math.tan(latRad) * Math.sin(epsilon),
  );
  rawAsc = normalizeAngle(rawAsc * RAD2DEG);

  return {
    longitude: roundToPrecision(rawAsc, precision),
    zodiac_sign: getZodiacSign(rawAsc),
    degree_in_sign: roundToPrecision(rawAsc % 30, precision),
    lst: lst,
    gmst: gmst,
  };
}

export function calculateHouses(ascLon, precision = 4) {
  const cusps = [];
  for (let i = 0; i < 12; i += 1) {
    const cuspLon = normalizeAngle(ascLon + i * 30);
    cusps.push({
      cusp_number: i + 1,
      cusp_longitude: roundToPrecision(cuspLon, precision),
      zodiac_sign: getZodiacSign(cuspLon),
      degree_in_sign: roundToPrecision(cuspLon % 30, precision),
    });
  }
  return cusps;
}

export function getZodiacSign(longitude) {
  return Math.floor(normalizeAngle(longitude) / 30);
}

export function getNakshatra(longitude) {
  const normalized = normalizeAngle(longitude);
  const index = Math.floor(normalized / NAKSHATRA_SIZE);
  const name = NAKSHATRAS[index];
  const pada = Math.floor(((normalized % NAKSHATRA_SIZE) / PADA_SIZE)) + 1;
  const lord = NAKSHATRA_LORD_SEQUENCE[index % NAKSHATRA_LORD_SEQUENCE.length];
  return { index, name, pada, lord };
}

export function getSubLord(longitude) {
  const normalized = normalizeAngle(longitude);
  const fraction = (normalized % NAKSHATRA_SIZE) / NAKSHATRA_SIZE;
  const subIndex = Math.floor(fraction * 9);
  return NAKSHATRA_LORD_SEQUENCE[subIndex];
}

function angleBetween(lon, start, end) {
  const normLon = normalizeAngle(lon);
  const normStart = normalizeAngle(start);
  const normEnd = normalizeAngle(end);
  if (normStart <= normEnd) {
    return normLon >= normStart && normLon < normEnd;
  }
  return normLon >= normStart || normLon < normEnd;
}

export function getHouseNumber(longitude, cusps) {
  for (let i = 0; i < cusps.length; i += 1) {
    const start = cusps[i].cusp_longitude;
    const end = cusps[(i + 1) % cusps.length].cusp_longitude;
    if (angleBetween(longitude, start, end)) {
      return cusps[i].cusp_number;
    }
  }
  return 12;
}

function jdToDate(jd) {
  let J = jd + 0.5;
  const Z = Math.floor(J);
  const F = J - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const dayInt = Math.floor(day);
  const fracDay = day - dayInt;
  const hours = fracDay * 24;
  const hour = Math.floor(hours);
  const minutes = (hours - hour) * 60;
  const minute = Math.floor(minutes);
  const seconds = Math.round((minutes - minute) * 60);

  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${dayInt
    .toString()
    .padStart(2, "0")}`;
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  return { iso: `${iso}T${time}Z`, date: iso, time };
}

export function calculateVimshottariDasha(moonLongitude, jd, precision = 4) {
  const nak = getNakshatra(moonLongitude);
  const nakFraction = (normalizeAngle(moonLongitude) % NAKSHATRA_SIZE) / NAKSHATRA_SIZE;
  const currentLord = nak.lord;
  const currentDuration = DASA_YEARS[currentLord];
  const balanceYears = (1 - nakFraction) * currentDuration;

  const dayLength = 365.25;
  const startIndex = DASA_ORDER.indexOf(currentLord);
  const sequence = [];
  let cursor = jd - (currentDuration - balanceYears) * dayLength;

  for (let i = 0; i < DASA_ORDER.length; i += 1) {
    const lord = DASA_ORDER[(startIndex + i) % DASA_ORDER.length];
    const durationYears = DASA_YEARS[lord];
    const startJD = cursor;
    const endJD = cursor + durationYears * dayLength;
    const startStamp = jdToDate(startJD);
    const endStamp = jdToDate(endJD);
    sequence.push({
      lord,
      duration_years: roundToPrecision(durationYears, 4),
      start_jd: roundToPrecision(startJD, 6),
      end_jd: roundToPrecision(endJD, 6),
      start_date: startStamp.iso,
      end_date: endStamp.iso,
    });
    cursor = endJD;
  }

  const current = sequence[0];
  current.balance_years = roundToPrecision(balanceYears, precision);

  return {
    current,
    sequence,
  };
}

function labelForBody(body) {
  const map = {
    Sun: "Su",
    Moon: "Mo",
    Mercury: "Me",
    Venus: "Ve",
    Mars: "Ma",
    Jupiter: "Ju",
    Saturn: "Sa",
    Rahu: "Ra",
    Ketu: "Ke",
  };
  return map[body] || body.slice(0, 2);
}

function polarPoint(angleDeg, radius, center) {
  const angle = (angleDeg - 90) * DEG2RAD;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function generateSVGWheel(ascendant, planets, cusps, options = {}) {
  const size = options.size || 420;
  const center = size / 2;
  const outerRadius = center - 20;
  const innerRadius = outerRadius * 0.65;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Astrology wheel">`;
  svg += `<circle cx="${center}" cy="${center}" r="${outerRadius}" fill="none" stroke="#0a2540" stroke-width="2" />`;
  svg += `<circle cx="${center}" cy="${center}" r="${innerRadius}" fill="none" stroke="#0a2540" stroke-width="1" />`;

  const canvasInstructions = [
    { type: "circle", cx: center, cy: center, r: outerRadius },
    { type: "circle", cx: center, cy: center, r: innerRadius },
  ];

  cusps.forEach((cusp) => {
    const { x, y } = polarPoint(cusp.cusp_longitude, outerRadius, center);
    svg += `<line x1="${center}" y1="${center}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#0a2540" stroke-width="1" />`;
    canvasInstructions.push({ type: "line", x1: center, y1: center, x2: x, y2: y });

    const signIndex = cusp.zodiac_sign;
    const labelAngle = cusp.cusp_longitude + 15;
    const labelPoint = polarPoint(labelAngle, (outerRadius + innerRadius) / 2, center);
    svg += `<text x="${labelPoint.x.toFixed(2)}" y="${labelPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#0a2540">${ZODIAC_SIGNS[signIndex].slice(0, 3)}</text>`;
  });

  Object.entries(planets).forEach(([body, data]) => {
    const { longitude } = data;
    const radius = outerRadius - 30;
    const point = polarPoint(longitude, radius, center);
    const highlight = ["Ascendant", "Rahu", "Ketu", "Moon"].includes(body);
    const fill = highlight ? "#FFAFCC" : "#0a2540";
    svg += `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="6" fill="${fill}" opacity="0.85" />`;
    svg += `<text x="${point.x.toFixed(2)}" y="${(point.y + 3).toFixed(2)}" text-anchor="middle" font-size="10" fill="#0a2540">${labelForBody(body)}</text>`;
    canvasInstructions.push({ type: "planet", body, x: point.x, y: point.y, label: labelForBody(body) });
  });

  const ascPoint = polarPoint(ascendant.longitude, outerRadius - 10, center);
  svg += `<text x="${ascPoint.x.toFixed(2)}" y="${(ascPoint.y - 8).toFixed(2)}" text-anchor="middle" font-size="12" fill="#0a2540">Asc</text>`;

  svg += "</svg>";
  return { svg, canvas_instructions: canvasInstructions };
}

export function buildKpTable(planetEntries, cusps, precision = 4) {
  const rows = [];
  Object.entries(planetEntries).forEach(([body, data]) => {
    const nak = getNakshatra(data.longitude);
    const subLord = getSubLord(data.longitude);
    const house = getHouseNumber(data.longitude, cusps);
    rows.push({
      body,
      longitude: data.longitude,
      zodiac_sign: data.zodiac_sign,
      degree_in_sign: roundToPrecision(data.longitude % 30, precision),
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatra_lord: nak.lord,
      sub_lord: subLord,
      house_number: house,
    });
  });

  cusps.forEach((cusp) => {
    const nak = getNakshatra(cusp.cusp_longitude);
    const subLord = getSubLord(cusp.cusp_longitude);
    rows.push({
      body: `Cusp ${cusp.cusp_number}`,
      longitude: cusp.cusp_longitude,
      zodiac_sign: cusp.zodiac_sign,
      degree_in_sign: roundToPrecision(cusp.cusp_longitude % 30, precision),
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatra_lord: nak.lord,
      sub_lord: subLord,
      house_number: cusp.cusp_number,
    });
  });

  return rows;
}

export function organizeHouses(planets, cusps) {
  const houses = {};
  cusps.forEach((cusp) => {
    houses[String(cusp.cusp_number)] = [];
  });
  Object.entries(planets).forEach(([body, data]) => {
    const houseNumber = getHouseNumber(data.longitude, cusps);
    houses[String(houseNumber)].push(body);
  });
  return houses;
}
