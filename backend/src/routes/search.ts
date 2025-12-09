import express, { Request, Response } from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get search index - lightweight data for client-side search
router.get('/index', async (req: Request, res: Response) => {
  try {
    const { type = 'all' } = req.query;

    const result: any = {};

    // Get customers search index
    if (type === 'all' || type === 'customers') {
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          idNumber: true,
          phone: true,
          mobile1: true,
          mobile2: true,
          city: true,
          street: true,
        },
        orderBy: { id: 'desc' },
        take: 10000, // Last 10K customers
      });

      result.customers = customers.map((c) => ({
        id: c.id,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        fullName: `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase(),
        idNumber: c.idNumber || '',
        phone: c.phone || '',
        mobile1: c.mobile1 || '',
        mobile2: c.mobile2 || '',
        city: c.city || '',
        street: c.street || '',
      }));
    }

    // Get prescriptions search index
    if (type === 'all' || type === 'prescriptions') {
      const prescriptions = await prisma.prescription.findMany({
        select: {
          id: true,
          prescriptionNumber: true,
          date: true,
          type: true,
          healthFund: true,
          price: true,
          balance: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              idNumber: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 40000, // Last 40K prescriptions
      });

      result.prescriptions = prescriptions.map((p) => ({
        id: p.id,
        prescriptionNumber: p.prescriptionNumber,
        date: p.date,
        type: p.type,
        healthFund: p.healthFund || '',
        price: p.price,
        balance: p.balance,
        customerId: p.customer?.id,
        customerName: p.customer
          ? `${p.customer.firstName || ''} ${p.customer.lastName || ''}`.trim().toLowerCase()
          : '',
        customerFirstName: p.customer?.firstName?.toLowerCase() || '',
        customerLastName: p.customer?.lastName?.toLowerCase() || '',
        idNumber: p.customer?.idNumber || '',
      }));
    }

    // Add timestamp for cache validation
    result.timestamp = Date.now();

    res.json(result);
  } catch (error) {
    console.error('Get search index error:', error);
    res.status(500).json({ error: 'Failed to get search index' });
  }
});

export default router;
