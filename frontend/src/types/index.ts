export interface Customer {
  id: number;
  date?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  idNumber?: string | null;
  isPassport: boolean;
  birthDate?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  entrance?: string | null;
  apartment?: number | null;
  city?: string | null;
  phone?: string | null;
  mobile1?: string | null;
  mobile2?: string | null;
  healthFund?: string | null;
  category?: string | null;
  admissionDate?: string | null;
  employeeId?: number | null;
  computerId?: number | null;
  branchId?: number | null;
  createdAt: string;
  updatedAt: string;
  prescriptions?: Prescription[];
  branch?: Branch;
  relatedTo?: RelatedCustomer[];
}

export interface RelatedCustomer {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  idNumber?: string | null;
  phone?: string | null;
}

export interface Prescription {
  id: number;
  prescriptionNumber?: number | null;
  customerId: number;
  type: 'מרחק' | 'קריאה' | 'עדשות מגע' | 'מולטיפוקל';
  date: string;
  r?: number | null; // Right eye sphere (SPH)
  l?: number | null; // Left eye sphere (SPH)
  cylR?: number | null;
  axR?: number | null;
  cylL?: number | null;
  axL?: number | null;
  vaR?: string | null; // Right eye visual acuity
  vaL?: string | null; // Left eye visual acuity
  
  // PRISM fields
  prismR?: number | null;
  prismL?: number | null;
  inOutR?: string | null; // 'in' | 'out'
  inOutL?: string | null; // 'in' | 'out'
  upDownR?: string | null; // 'up' | 'down'
  upDownL?: string | null; // 'up' | 'down'
  
  // PD fields (replaced old 'pd' field)
  pdR?: number | null;
  pdL?: number | null;
  pdTotal?: number | null;
  
  // Height fields
  heightR?: number | null;
  heightL?: number | null;
  
  add?: number | null;
  index?: string | null;
  color?: string | null;
  colorPercentage?: number | null;
  
  // Frame fields
  frameName?: string | null;
  frameModel?: string | null;
  frameColor?: string | null;
  frameBridge?: string | null; // New field
  frameWidth?: string | null;
  frameNotes?: string | null;
  
  // Financial fields
  healthFund?: string | null;
  insuranceType?: string | null;
  price?: number | null;
  discountSource?: string | null;
  amountToPay?: number | null;
  paid?: number | null;
  balance?: number | null;
  receiptNumber?: string | null;
  campaign280?: boolean | null;
  
  // Meta fields
  optometristId?: number | null;
  branchId?: number | null;
  source?: string | null;
  notes?: string | null;
  updateDate: string;
  createdAt: string;
  
  // Relations
  customer?: Customer;
  optometrist?: Optometrist;
  branch?: Branch;
}

export interface Branch {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Optometrist {
  id: number;
  name: string;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  name: string;
  employeeId?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture?: string | null;
  isActive: boolean;
  isApproved: boolean;
  branchId?: number | null;
  role: 'admin' | 'employee' | 'manager';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  branch?: Branch;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  description?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: User;
}

