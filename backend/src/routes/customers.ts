import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { validateIsraeliID } from '../utils/idValidation';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const customerCreateSchema = z.object({
  date: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  isPassport: z.boolean().optional(),
  birthDate: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  houseNumber: z.string().nullable().optional(),
  entrance: z.string().nullable().optional(),
  apartment: z.number().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  mobile1: z.string().nullable().optional(),
  mobile2: z.string().nullable().optional(),
  healthFund: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  employeeId: z.number().nullable().optional(),
  computerId: z.number().nullable().optional(),
  branchId: z.number().nullable().optional(),
});

const customerUpdateSchema = customerCreateSchema.partial();

// Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '1000', offset = '0', branchId } = req.query;

    const where: any = {};
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        prescriptions: {
          orderBy: { date: 'desc' },
          take: 1, // Just get the latest prescription for preview
        },
        branch: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

// Search customers
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim();

    if (searchTerm.length < 2) {
      return res.json({ customers: [] });
    }

    // Search by ID number, name, or phone
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { idNumber: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { mobile1: { contains: searchTerm, mode: 'insensitive' } },
          { mobile2: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        prescriptions: {
          orderBy: { date: 'desc' },
          take: 10, // Limit prescriptions in search results
        },
        branch: true, // Include branch information
      },
      take: 20, // Limit search results
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ customers });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Get customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        prescriptions: {
          orderBy: { date: 'desc' },
        },
        branch: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

// Get customer prescriptions
router.get('/:id/prescriptions', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { customerId: id },
      include: {
        optometrist: true,
        branch: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to get prescriptions' });
  }
});

// Create customer
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Create customer request body:', JSON.stringify(req.body, null, 2));
    
    const data = customerCreateSchema.parse(req.body);

    // Validate ID number if provided
    if (data.idNumber && !data.isPassport) {
      if (!validateIsraeliID(data.idNumber)) {
        return res.status(400).json({ error: 'Invalid Israeli ID number' });
      }
    }

    // Parse dates and clean up data - remove undefined, convert null strings to null, convert dates
    const customerData: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      // Skip undefined values
      if (value === undefined) {
        return;
      }
      
      // Handle dates
      if (key === 'date' || key === 'birthDate') {
        if (value !== null && value !== '') {
          customerData[key] = new Date(value as string);
        } else {
          customerData[key] = null;
        }
      } else {
        // For other fields, convert empty strings to null, but keep other values
        if (value === '' || value === null) {
          customerData[key] = null;
        } else {
          customerData[key] = value;
        }
      }
    });

    console.log('Create customer data:', JSON.stringify(customerData, null, 2));

    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        branch: true,
      },
    });

    res.status(201).json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        const target = (error as any).meta?.target;
        if (target && target.includes('id_number')) {
          return res.status(400).json({ error: 'תעודת זהות זו כבר קיימת במערכת' });
        }
        return res.status(400).json({ error: 'הנתונים כבר קיימים במערכת' });
      }
    }
    
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    console.log('Update customer request body:', JSON.stringify(req.body, null, 2));

    const data = customerUpdateSchema.parse(req.body);

    // Validate ID number if provided
    if (data.idNumber && !data.isPassport) {
      if (!validateIsraeliID(data.idNumber)) {
        return res.status(400).json({ error: 'Invalid Israeli ID number' });
      }
    }

    // Parse dates and clean up data - remove undefined, convert null strings to null, convert dates
    const updateData: any = {};
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      // Skip undefined values
      if (value === undefined) {
        return;
      }
      
      // Handle dates
      if (key === 'date' || key === 'birthDate') {
        if (value !== null && value !== '') {
          updateData[key] = new Date(value as string);
        } else {
          updateData[key] = null;
        }
      } else {
        // For other fields, convert empty strings to null, but keep other values
        if (value === '' || value === null) {
          updateData[key] = null;
        } else {
          updateData[key] = value;
        }
      }
    });

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
      },
    });

    res.json({ customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { password } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    // Verify admin delete password
    const adminDeletePassword = process.env.ADMIN_DELETE_PASSWORD || 'admin123';
    if (password !== adminDeletePassword) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;

