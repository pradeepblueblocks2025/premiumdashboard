export function executiveAvatarUrl(seed: string): string {
  const params = new URLSearchParams({
    seed,
    clothing: "blazerAndShirt,blazerAndSweater",
    accessoriesProbability: "0",
    facialHairProbability: "20",
  });
  return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
}
