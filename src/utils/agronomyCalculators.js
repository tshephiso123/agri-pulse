export function calculateNPK({ cropTargetN, areaHectares, activeRatio }) {
  const targetNutrientKg = cropTargetN * areaHectares;
  const totalProductKg = Math.round(targetNutrientKg / activeRatio);

  const bags = Math.ceil(totalProductKg / 50);
  const buckets = Math.round(totalProductKg / 15);
  const capsPerPlant = areaHectares <= 0.05 ? 1 : 2;

  return {
    totalProductKg,
    bags,
    buckets: buckets < 1 ? 1 : buckets,
    capsPerPlant
  };
}
