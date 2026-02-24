// Mulberry32 seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a string to a 32-bit integer
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash >>> 0;
}

// Fisher-Yates shuffle using seeded RNG
function shuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function initializeRandomization(email, prompts) {
  const seed = hashString(email.toLowerCase().trim());
  const rng = mulberry32(seed);

  const indices = prompts.map((_, i) => i);
  const promptOrder = shuffle(indices, rng);

  const sideAssignments = {};
  for (const idx of promptOrder) {
    // false = model[0] on left, true = model[0] on right (swap)
    sideAssignments[prompts[idx].id] = rng() < 0.5;
  }

  return { seed, promptOrder, sideAssignments };
}
