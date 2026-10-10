export function calculateNPK({ cropTargetN, areaHectares, activeRatio, soilCredit = 0, plantCount, capGrams, bucketKg = 15, soil = 'unknown' }) {
  for (const n of [cropTargetN, areaHectares, activeRatio, soilCredit, bucketKg]) if (!Number.isFinite(n)) throw new Error('Enter valid numbers.');
  if (cropTargetN < 0 || cropTargetN > 500 || areaHectares < 0.0001 || areaHectares > 10000 || activeRatio <= 0 || activeRatio > 1 || soilCredit < 0 || soilCredit > 500 || bucketKg <= 0) throw new Error('Check the field size, nutrient target and product values.');
  const netN = Math.max(0, cropTargetN - soilCredit);
  const product = netN * areaHectares / activeRatio;
  let capsPerPlant = null;
  if (plantCount !== undefined || capGrams !== undefined) {
    if (!Number.isInteger(plantCount) || plantCount <= 0 || !Number.isFinite(capGrams) || capGrams <= 0 || capGrams > 100) throw new Error('Enter a positive whole plant count and a measured cap mass in grams.');
    capsPerPlant = Number((product * 1000 / plantCount / capGrams).toFixed(2));
  }
  return { totalProductKg: Number(product.toFixed(3)), bags: Math.ceil(product / 50), buckets: Number((product / bucketKg).toFixed(2)), capsPerPlant, netN, caution: soil === 'sandy' || netN > 100 };
}
// Convert only an explicitly supplied product-label rate; never infer a pesticide rate.
export function calculateTank(labelMlPerL, tankLitres) {
  if (![labelMlPerL,tankLitres].every(Number.isFinite) || labelMlPerL <= 0 || labelMlPerL > 1000 || tankLitres <= 0 || tankLitres > 1000) throw new Error('Enter a valid label rate in mL/L and tank size in litres.');
  return Number((labelMlPerL * tankLitres).toFixed(2));
}
