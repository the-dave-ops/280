/**
 * קבועים עבור שדות מרשם משקפיים
 * Constants for prescription fields
 */

// Visual Acuity options
export const VA_OPTIONS = [
  '6/5',
  '6/6',
  '6/7',
  '6/8',
  '6/9',
  '6/12',
  '6/18',
  '6/24',
  '6/36',
  '6/120',
] as const;

export type VAOption = typeof VA_OPTIONS[number];

// Index options
export const INDEX_OPTIONS = [
  '1.5',
  '1.56',
  '1.6',
  '1.67',
  '1.71',
  '1.74',
  '1.76',
  'ייצור',
  'סופר פלט',
  'דק סכין',
] as const;

export type IndexOption = typeof INDEX_OPTIONS[number];

// Frame color options
export const FRAME_COLOR_OPTIONS = [
  'אדום',
  'ירוק',
  'כחול',
  'חום',
  'ורוד',
  'זהב מט',
  'זהב מבריק',
  'כסף מבריק',
  'כסף מט',
  'ניקל',
  'אפור',
  'טורקיז',
  'כתום',
  'שחור-לבן',
  'שחור',
  'שקוף',
  'אחר',
] as const;

export type FrameColorOption = typeof FRAME_COLOR_OPTIONS[number];

// IN/OUT direction options
export const IN_OUT_OPTIONS = ['in', 'out'] as const;
export type InOutOption = typeof IN_OUT_OPTIONS[number];

// UP/DOWN direction options
export const UP_DOWN_OPTIONS = ['up', 'down'] as const;
export type UpDownOption = typeof UP_DOWN_OPTIONS[number];

// Prescription type options
export const PRESCRIPTION_TYPE_OPTIONS = [
  'מרחק',
  'קריאה',
  'עדשות מגע',
] as const;

export type PrescriptionTypeOption = typeof PRESCRIPTION_TYPE_OPTIONS[number];

// Field ranges and steps
export const FIELD_RANGES = {
  prism: {
    min: 0.25,
    max: 4.0,
    step: 0.25,
  },
  pd: {
    min: 20.0,
    max: 40.0,
    step: 0.5,
  },
  height: {
    min: 16.0,
    max: 35.0,
    step: 0.5,
  },
  axis: {
    min: 0,
    max: 180,
    step: 1,
  },
} as const;

/**
 * Helper function to generate numeric options based on range
 */
export function generateNumericOptions(
  min: number,
  max: number,
  step: number
): number[] {
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    // Round to avoid floating point issues
    options.push(Math.round(i * 100) / 100);
  }
  return options;
}

/**
 * Get PRISM options (0.25 to 4.00 in steps of 0.25)
 */
export function getPrismOptions(): number[] {
  return generateNumericOptions(
    FIELD_RANGES.prism.min,
    FIELD_RANGES.prism.max,
    FIELD_RANGES.prism.step
  );
}

/**
 * Get PD options (20.00 to 40.00 in steps of 0.5)
 */
export function getPdOptions(): number[] {
  return generateNumericOptions(
    FIELD_RANGES.pd.min,
    FIELD_RANGES.pd.max,
    FIELD_RANGES.pd.step
  );
}

/**
 * Get Height options (16.00 to 35.00 in steps of 0.5)
 */
export function getHeightOptions(): number[] {
  return generateNumericOptions(
    FIELD_RANGES.height.min,
    FIELD_RANGES.height.max,
    FIELD_RANGES.height.step
  );
}

/**
 * Get Axis options (0 to 180 in steps of 1)
 */
export function getAxisOptions(): number[] {
  return generateNumericOptions(
    FIELD_RANGES.axis.min,
    FIELD_RANGES.axis.max,
    FIELD_RANGES.axis.step
  );
}

/**
 * Validation functions
 */
export const validators = {
  prism: (value: number): boolean => {
    return (
      value >= FIELD_RANGES.prism.min &&
      value <= FIELD_RANGES.prism.max &&
      (value * 100) % (FIELD_RANGES.prism.step * 100) === 0
    );
  },
  pd: (value: number): boolean => {
    return (
      value >= FIELD_RANGES.pd.min &&
      value <= FIELD_RANGES.pd.max &&
      (value * 10) % (FIELD_RANGES.pd.step * 10) === 0
    );
  },
  height: (value: number): boolean => {
    return (
      value >= FIELD_RANGES.height.min &&
      value <= FIELD_RANGES.height.max &&
      (value * 10) % (FIELD_RANGES.height.step * 10) === 0
    );
  },
  axis: (value: number): boolean => {
    return (
      value >= FIELD_RANGES.axis.min &&
      value <= FIELD_RANGES.axis.max &&
      Number.isInteger(value)
    );
  },
  va: (value: string): boolean => {
    return VA_OPTIONS.includes(value as VAOption);
  },
  index: (value: string): boolean => {
    return INDEX_OPTIONS.includes(value as IndexOption);
  },
  frameColor: (value: string): boolean => {
    return FRAME_COLOR_OPTIONS.includes(value as FrameColorOption);
  },
  inOut: (value: string): boolean => {
    return IN_OUT_OPTIONS.includes(value as InOutOption);
  },
  upDown: (value: string): boolean => {
    return UP_DOWN_OPTIONS.includes(value as UpDownOption);
  },
  prescriptionType: (value: string): boolean => {
    return PRESCRIPTION_TYPE_OPTIONS.includes(value as PrescriptionTypeOption);
  },
};

/**
 * Default values
 */
export const DEFAULT_VALUES = {
  index: '1.56' as IndexOption,
  price: 0,
  amountToPay: 0,
  paid: 0,
  balance: 0,
  campaign280: false,
} as const;

/**
 * Calculate total PD from right and left PD
 */
export function calculatePdTotal(pdR?: number, pdL?: number): number | null {
  if (pdR !== undefined && pdL !== undefined) {
    return Math.round((pdR + pdL) * 10) / 10;
  }
  return null;
}

/**
 * Calculate balance from amount to pay and paid
 */
export function calculateBalance(amountToPay: number, paid: number): number {
  return Math.round((amountToPay - paid) * 100) / 100;
}

/**
 * Field labels in Hebrew
 */
export const FIELD_LABELS = {
  // Eye prescription data
  r: 'SPH ימין',
  l: 'SPH שמאל',
  cylR: 'CYL ימין',
  cylL: 'CYL שמאל',
  axR: 'Axis ימין',
  axL: 'Axis שמאל',
  
  // PRISM data
  prismR: 'PRISM ימין',
  prismL: 'PRISM שמאל',
  inOutR: 'In/Out ימין',
  inOutL: 'In/Out שמאל',
  upDownR: 'Up/Down ימין',
  upDownL: 'Up/Down שמאל',
  
  // PD data
  pdR: 'PD ימין',
  pdL: 'PD שמאל',
  pdTotal: 'PD סה"כ',
  
  // VA data
  vaR: 'VA ימין',
  vaL: 'VA שמאל',
  
  // Height
  heightR: 'גובה ימין',
  heightL: 'גובה שמאל',
  
  // General lens data
  add: 'תוספת (ADD)',
  index: 'אינדקס',
  color: 'צבע עדשות',
  colorPercentage: 'אחוז צבע',
  
  // Frame data
  frameName: 'שם מסגרת',
  frameModel: 'דגם מסגרת',
  frameColor: 'צבע מסגרת',
  frameBridge: 'גשר',
  frameWidth: 'רוחב',
  frameNotes: 'הערות מסגרת',
  
  // Other
  type: 'סוג מרשם',
  date: 'תאריך',
  healthFund: 'קופת חולים',
  insuranceType: 'סוג ביטוח',
  price: 'מחיר',
  discountSource: 'מקור הנחה',
  amountToPay: 'סכום לתשלום',
  paid: 'שולם',
  balance: 'יתרה',
  receiptNumber: 'מספר קבלה',
  campaign280: 'קמפיין 280',
  source: 'מקור',
  notes: 'הערות',
} as const;
