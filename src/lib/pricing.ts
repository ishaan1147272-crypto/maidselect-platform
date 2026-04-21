// Simple hash to get a stable pseudo-random number from a string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function stableRandom(id: string, salt: string, min: number, max: number): number {
  const h = hashCode(id + salt);
  return min + (h % (max - min + 1));
}

// Override map for special-case maids (e.g. test profiles)
const RATE_OVERRIDES: Record<string, { hourly: number; weekly: number; monthly: number }> = {
  '501119b8-0905-4c8a-a744-afbba21d0621': { hourly: 5, weekly: 5, monthly: 5 },
};

export function getMaidRates(id: string) {
  if (RATE_OVERRIDES[id]) return RATE_OVERRIDES[id];
  return {
    hourly: stableRandom(id, 'hourly', 200, 400),
    weekly: stableRandom(id, 'weekly', 4000, 7000),
    monthly: stableRandom(id, 'monthly', 21000, 24000),
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
