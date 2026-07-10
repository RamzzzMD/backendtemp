const ADJECTIVES = [
  'swift', 'quiet', 'lucky', 'bright', 'calm', 'brave', 'clever', 'gentle',
  'happy', 'jolly', 'keen', 'lively', 'mellow', 'nifty', 'proud', 'quick',
  'rapid', 'sunny', 'tidy', 'witty', 'zesty', 'bold', 'chill', 'eager',
];

const NOUNS = [
  'otter', 'falcon', 'maple', 'comet', 'ember', 'harbor', 'lantern', 'meadow',
  'nebula', 'pebble', 'quartz', 'raven', 'summit', 'tundra', 'willow', 'zephyr',
  'badger', 'canyon', 'delta', 'fjord', 'grove', 'heron', 'islet', 'juniper',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUsername() {
  const adjective = pick(ADJECTIVES);
  const noun = pick(NOUNS);
  const num = Math.floor(Math.random() * 900 + 100); // 100-999
  return `${adjective}-${noun}-${num}`;
}

// 3-64 chars, letters/numbers/dot/dash/underscore, must start & end alphanumeric.
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{1,62}[a-z0-9])?$/i;

export function isValidUsername(username) {
  return typeof username === 'string' && USERNAME_RE.test(username);
}
