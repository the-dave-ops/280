/**
 * Calculate prescription price based on index, discount source, and other factors
 */
export interface PriceCalculationParams {
  index?: string | null;
  discountSource?: string | null;
  campaign280?: boolean | null;
  basePrice?: number;
}

export function calculatePrice(params: PriceCalculationParams): number {
  const { index, discountSource, campaign280, basePrice = 0 } = params;

  let price = basePrice;

  // Price calculation based on index
  if (index) {
    const indexNum = parseFloat(index);

    // Index 1.5 rules
    if (index === '1.5') {
      // This would need base price to determine if above/below 70
      // For now, we'll use a default calculation
      price = basePrice || 200;
    }

    // Index 1.56 rules
    if (index === '1.56') {
      // Would need to check if above/below 112
      price = basePrice || 250;
    }

    // Index 1.6 rules
    if (index === '1.6') {
      price = basePrice || 270;
    }

    // Index above 1.6
    if (indexNum > 1.6) {
      price = basePrice || 300;
    }
  }

  // Discount source handling
  if (discountSource === 'מאוחדת שיא') {
    // Apply discount for Meuhedet
    price = price * 0.9; // 10% discount (adjust as needed)
  }

  // Campaign 280
  if (campaign280) {
    price = price * 0.85; // 15% discount (adjust as needed)
  }

  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

/**
 * Update price based on prescription values
 * This implements the business logic from the legacy queries
 */
export function updatePriceBasedOnIndex(
  index: string | null | undefined,
  r: number | null | undefined,
  l: number | null | undefined,
  basePrice: number = 0
): number {
  if (!index) return basePrice;

  const indexNum = parseFloat(index);
  const maxSphere = Math.max(
    Math.abs(r || 0),
    Math.abs(l || 0)
  );

  let price = basePrice;

  // Index 1.5 above 70
  if (index === '1.5' && maxSphere > 70) {
    price = 300;
  }

  // Index 1.5 below 71
  if (index === '1.5' && maxSphere <= 70) {
    price = 200;
  }

  // Index 1.56 greater than 112
  if (index === '1.56' && maxSphere > 112) {
    price = 350;
  }

  // Index 1.56 below 112
  if (index === '1.56' && maxSphere <= 112) {
    price = 250;
  }

  // Index 1.6 = 270
  if (index === '1.6' && maxSphere === 270) {
    price = 270;
  }

  // Index 1.6 above 270
  if (index === '1.6' && maxSphere > 270) {
    price = 350;
  }

  // Index above 1.6
  if (indexNum > 1.6) {
    price = 400;
  }

  return price;
}

