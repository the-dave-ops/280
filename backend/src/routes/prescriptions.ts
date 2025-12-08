import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { calculatePrice, updatePriceBasedOnIndex } from '../utils/priceCalculation';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Validation schemas
const prescriptionCreateSchema = z.object({
  customerId: z.number(),
  type: z.enum(['מרחק', 'קריאה', 'עדשות מגע', 'מולטיפוקל']),
  date: z.string().optional(),
  r: z.number().nullable().optional(),
  l: z.number().nullable().optional(),
  cylR: z.number().nullable().optional(),
  cylL: z.number().nullable().optional(),
  axR: z.number().nullable().optional(),
  axL: z.number().nullable().optional(),
  vaR: z.string().nullable().optional(),
  vaL: z.string().nullable().optional(),
  
  // PRISM fields
  prismR: z.number().nullable().optional(),
  prismL: z.number().nullable().optional(),
  inOutR: z.string().nullable().optional(),
  inOutL: z.string().nullable().optional(),
  upDownR: z.string().nullable().optional(),
  upDownL: z.string().nullable().optional(),
  
  // PD fields (replaced old 'pd' field)
  pdR: z.number().nullable().optional(),
  pdL: z.number().nullable().optional(),
  pdTotal: z.number().nullable().optional(),
  
  // Height fields
  heightR: z.number().nullable().optional(),
  heightL: z.number().nullable().optional(),
  
  add: z.number().nullable().optional(),
  index: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  colorPercentage: z.number().nullable().optional(),
  
  // Frame fields
  frameName: z.string().nullable().optional(),
  frameModel: z.string().nullable().optional(),
  frameColor: z.string().nullable().optional(),
  frameBridge: z.string().nullable().optional(), // New field (replaced frameC)
  frameWidth: z.string().nullable().optional(),
  frameNotes: z.string().nullable().optional(),
  
  // Financial and other fields
  healthFund: z.string().nullable().optional(),
  insuranceType: z.string().nullable().optional(),
  discountSource: z.string().nullable().optional(),
  campaign280: z.boolean().nullable().optional(),
  optometristId: z.number().nullable().optional(),
  branchId: z.number().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  amountToPay: z.number().nullable().optional(),
  paid: z.number().nullable().optional(),
  balance: z.number().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
});

const prescriptionUpdateSchema = prescriptionCreateSchema.partial().extend({
  customerId: z.number().optional(),
  type: z.enum(['מרחק', 'קריאה', 'עדשות מגע', 'מולטיפוקל']).optional(),
});

// Helper function to calculate balance
function calculateBalance(amountToPay: number | null, paid: number | null): number {
  const amount = amountToPay || 0;
  const paidAmount = paid || 0;
  return Math.max(0, amount - paidAmount);
}

// Helper function to generate unique prescription number
async function generatePrescriptionNumber(): Promise<number> {
  // Find the highest prescription number (excluding null values)
  const lastPrescription = await prisma.prescription.findFirst({
    where: {
      prescriptionNumber: {
        not: null,
      },
    },
    orderBy: { prescriptionNumber: 'desc' },
    select: { prescriptionNumber: true },
  });

  // Start from 1 if no prescriptions with numbers exist, otherwise increment
  return lastPrescription?.prescriptionNumber ? lastPrescription.prescriptionNumber + 1 : 1;
}

// Get all prescriptions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { customerId, type, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (customerId) where.customerId = parseInt(customerId as string);
    if (type) where.type = type;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            idNumber: true,
          },
        },
        optometrist: true,
        branch: true,
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to get prescriptions' });
  }
});

// Get prescription by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to get prescription' });
  }
});

// Create prescription
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = prescriptionCreateSchema.parse(req.body);

    // Calculate price if index is provided
    let price = data.price || 0;
    if (data.index && (data.r || data.l)) {
      price = updatePriceBasedOnIndex(data.index, data.r || null, data.l || null, price);
    }

    // Apply discount source and campaign
    if (data.discountSource || data.campaign280) {
      price = calculatePrice({
        index: data.index || null,
        discountSource: data.discountSource || null,
        campaign280: data.campaign280 || false,
        basePrice: price,
      });
    }

    const amountToPay = price;
    const balance = calculateBalance(amountToPay, 0);

    // Generate unique prescription number
    const prescriptionNumber = await generatePrescriptionNumber();

    const prescription = await prisma.prescription.create({
      data: {
        ...data,
        prescriptionNumber,
        date: data.date ? new Date(data.date) : new Date(),
        price,
        amountToPay,
        balance,
        paid: 0,
      },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    res.status(201).json({ prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Update prescription
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const data = prescriptionUpdateSchema.parse(req.body);

    // Get current prescription
    const current = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Recalculate price if relevant fields changed
    let price = data.price !== undefined ? data.price : current.price || 0;
    const r = data.r !== undefined ? data.r : current.r;
    const l = data.l !== undefined ? data.l : current.l;
    const index = data.index !== undefined ? data.index : current.index;
    const discountSource = data.discountSource !== undefined ? data.discountSource : current.discountSource;
    const campaign280 = data.campaign280 !== undefined ? data.campaign280 : current.campaign280;

    if (index && (r || l)) {
      price = updatePriceBasedOnIndex(index, r, l, price);
    }

    if (discountSource || campaign280) {
      price = calculatePrice({
        index: index || null,
        discountSource: discountSource || null,
        campaign280: campaign280 || false,
        basePrice: price,
      });
    }

    // Calculate balance - use provided values or keep current values
    const finalAmountToPay = data.amountToPay !== undefined ? data.amountToPay : (current.amountToPay !== null ? current.amountToPay : price);
    const finalPaid = data.paid !== undefined ? data.paid : (current.paid !== null ? current.paid : 0);
    const balance = calculateBalance(finalAmountToPay, finalPaid);

    // Remove prescriptionNumber from data (it cannot be updated)
    const { prescriptionNumber: _, ...updateData } = data;

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        ...updateData,
        date: data.date ? new Date(data.date) : undefined,
        price,
        amountToPay: finalAmountToPay,
        paid: finalPaid,
        balance,
      },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    res.json({ prescription });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update prescription error:', error);
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

// Delete prescription - only admins can delete
// Verify admin password for deletion
router.post('/:id/verify-delete', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_DELETE_PASSWORD || 'admin123';

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ verified: true });
  } catch (error) {
    console.error('Verify delete password error:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    await prisma.prescription.delete({
      where: { id },
    });

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    console.error('Delete prescription error:', error);
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// Duplicate prescription
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const original = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!original) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const { id: _, createdAt: __, updateDate: ___, prescriptionNumber: ____, ...prescriptionData } = original;

    // Generate new prescription number for duplicate
    const prescriptionNumber = await generatePrescriptionNumber();

    const duplicated = await prisma.prescription.create({
      data: {
        ...prescriptionData,
        prescriptionNumber,
        date: new Date(),
        price: 0,
        amountToPay: 0,
        paid: 0,
        balance: 0,
      },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    res.status(201).json({ prescription: duplicated });
  } catch (error) {
    console.error('Duplicate prescription error:', error);
    res.status(500).json({ error: 'Failed to duplicate prescription' });
  }
});

// Convert distance prescription to reading prescription
router.post('/:id/convert-to-reading', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const original = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!original) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (original.type === 'קריאה') {
      return res.status(400).json({ error: 'Cannot convert reading prescription to reading' });
    }

    if (!original.add || original.add === 0) {
      return res.status(400).json({ error: 'ADD value is required to convert to reading prescription' });
    }

    // Generate new prescription number for converted prescription
    const prescriptionNumber = await generatePrescriptionNumber();

    // Create reading prescription: R+ADD, L+ADD, PD-3
    const readingPrescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        customerId: original.customerId,
        type: 'קריאה',
        date: new Date(),
        r: (original.r || 0) + original.add,
        l: (original.l || 0) + original.add,
        pdTotal: (original.pdTotal || 0) - 3,
        pdR: original.pdR,
        pdL: original.pdL,
        cylR: original.cylR,
        axR: original.axR,
        cylL: original.cylL,
        axL: original.axL,
        vaR: original.vaR,
        vaL: original.vaL,
        prismR: original.prismR,
        prismL: original.prismL,
        inOutR: original.inOutR,
        inOutL: original.inOutL,
        upDownR: original.upDownR,
        upDownL: original.upDownL,
        heightR: original.heightR,
        heightL: original.heightL,
        add: original.add,
        index: original.index,
        color: original.color,
        colorPercentage: original.colorPercentage,
        frameName: original.frameName,
        frameModel: original.frameModel,
        frameColor: original.frameColor,
        frameBridge: original.frameBridge,
        frameWidth: original.frameWidth,
        frameNotes: original.frameNotes,
        discountSource: original.discountSource,
        campaign280: original.campaign280,
        optometristId: original.optometristId,
        branchId: original.branchId,
        source: original.source,
        notes: original.notes,
        price: 0,
        amountToPay: 0,
        paid: 0,
        balance: 0,
      },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    res.status(201).json({ prescription: readingPrescription });
  } catch (error) {
    console.error('Convert prescription error:', error);
    res.status(500).json({ error: 'Failed to convert prescription' });
  }
});

// Calculate price for prescription
router.post('/:id/calculate-price', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    let price = prescription.price || 0;

    if (prescription.index && (prescription.r || prescription.l)) {
      price = updatePriceBasedOnIndex(
        prescription.index,
        prescription.r,
        prescription.l,
        price
      );
    }

    if (prescription.discountSource || prescription.campaign280) {
      price = calculatePrice({
        index: prescription.index,
        discountSource: prescription.discountSource,
        campaign280: prescription.campaign280 || false,
        basePrice: price,
      });
    }

    // Update prescription with new price
    const amountToPay = price;
    const balance = calculateBalance(amountToPay, prescription.paid || 0);

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        price,
        amountToPay,
        balance,
      },
      include: {
        customer: true,
        optometrist: true,
        branch: true,
      },
    });

    res.json({ prescription: updated });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
});

// Get total balance for a branch
router.get('/branch/:branchId/balance', async (req: Request, res: Response) => {
  try {
    const branchId = parseInt(req.params.branchId);

    if (isNaN(branchId)) {
      return res.status(400).json({ error: 'Invalid branch ID' });
    }

    // Get all prescriptions for customers in this branch
    // We need to filter by customer's branchId, not prescription's branchId
    const result = await prisma.prescription.aggregate({
      where: {
        customer: {
          branchId: branchId,
        },
        balance: {
          gt: 0, // Only count prescriptions with positive balance (unpaid)
        },
      },
      _sum: {
        balance: true,
      },
    });

    const totalBalance = result._sum.balance || 0;

    res.json({ totalBalance });
  } catch (error) {
    console.error('Get branch balance error:', error);
    res.status(500).json({ error: 'Failed to get branch balance' });
  }
});

// Generate PDF for prescription
router.get('/:id/generate-pdf', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prescription ID' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!prescription || !prescription.customer) {
      return res.status(404).json({ error: 'Prescription or customer not found' });
    }

    const customer = prescription.customer;
    const idNumber = customer.idNumber || '';
    const isPassport = customer.isPassport;
    const reportDate = prescription.updateDate || prescription.date;

    // Create PDF with RTL support
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      info: {
        Title: `מרשם משקפיים - ${customer.firstName} ${customer.lastName}`,
        Author: 'רשת משקפיים 280'
      }
    });
    // Create filename with proper encoding for Hebrew characters
    const prescriptionNum = prescription.prescriptionNumber || prescription.id;
    const safeLastName = customer.lastName ? customer.lastName.replace(/[^a-zA-Z0-9]/g, '_') : 'prescription';
    const filename = `prescription_${prescriptionNum}_${safeLastName}.pdf`;
    const encodedFilename = encodeURIComponent(`מרשם_${prescriptionNum}_${customer.lastName || ''}.pdf`);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

    // Pipe PDF to response
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 40;
    let y = margin;

    // Header with logo placeholder and title
    doc.fontSize(24)
       .fillColor('#1e40af')
       .text('רשת משקפיים 280', margin, y, { align: 'center' });
    y += 35;
    
    doc.fontSize(18)
       .fillColor('#334155')
       .text('מרשם משקפיים', margin, y, { align: 'center' });
    y += 30;

    // Horizontal line
    doc.strokeColor('#cbd5e1')
       .lineWidth(2)
       .moveTo(margin, y)
       .lineTo(pageWidth - margin, y)
       .stroke();
    y += 25;

    // Customer Information Section
    doc.fontSize(14)
       .fillColor('#1e40af')
       .text('פרטי לקוח', margin, y);
    y += 20;

    doc.fontSize(11)
       .fillColor('#334155');
    
    const customerInfo = [
      `שם: ${customer.firstName} ${customer.lastName}`,
      `ת.ז: ${idNumber}`,
      `טלפון: ${customer.mobile1 || customer.phone || 'לא צוין'}`,
      `תאריך מרשם: ${new Date(prescription.date).toLocaleDateString('he-IL')}`
    ];

    customerInfo.forEach(info => {
      doc.text(info, margin, y);
      y += 18;
    });
    y += 10;

    // Prescription Data Section
    doc.fontSize(14)
       .fillColor('#1e40af')
       .text('נתוני מרשם', margin, y);
    y += 25;

    // Eye prescription table
    doc.fontSize(10)
       .fillColor('#334155');
    
    // Table headers
    const colWidth = 60;
    const startX = margin + 20;
    doc.font('Helvetica-Bold');
    doc.text('עין', startX, y);
    doc.text('SPH', startX + colWidth, y);
    doc.text('CYL', startX + colWidth * 2, y);
    doc.text('Axis', startX + colWidth * 3, y);
    doc.text('PD', startX + colWidth * 4, y);
    doc.text('VA', startX + colWidth * 5, y);
    y += 18;

    // Right eye
    doc.font('Helvetica');
    doc.text('R', startX, y);
    doc.text(prescription.r?.toFixed(2) || '-', startX + colWidth, y);
    doc.text(prescription.cylR?.toFixed(2) || '-', startX + colWidth * 2, y);
    doc.text(prescription.axR?.toString() || '-', startX + colWidth * 3, y);
    doc.text(prescription.pdR?.toFixed(2) || '-', startX + colWidth * 4, y);
    doc.text(prescription.vaR || '-', startX + colWidth * 5, y);
    y += 18;

    // Left eye
    doc.text('L', startX, y);
    doc.text(prescription.l?.toFixed(2) || '-', startX + colWidth, y);
    doc.text(prescription.cylL?.toFixed(2) || '-', startX + colWidth * 2, y);
    doc.text(prescription.axL?.toString() || '-', startX + colWidth * 3, y);
    doc.text(prescription.pdL?.toFixed(2) || '-', startX + colWidth * 4, y);
    doc.text(prescription.vaL || '-', startX + colWidth * 5, y);
    y += 30;

    // Additional fields
    if (prescription.add || prescription.pdTotal || prescription.prismR || prescription.prismL) {
      doc.font('Helvetica-Bold').text('נתונים נוספים:', margin, y);
      y += 18;
      doc.font('Helvetica');
      
      if (prescription.add) {
        doc.text(`ADD: ${prescription.add.toFixed(2)}`, margin + 20, y);
        y += 15;
      }
      if (prescription.pdTotal) {
        doc.text(`PD Total: ${prescription.pdTotal.toFixed(2)}`, margin + 20, y);
        y += 15;
      }
      if (prescription.prismR) {
        doc.text(`PRISM R: ${prescription.prismR.toFixed(2)} ${prescription.inOutR || ''} ${prescription.upDownR || ''}`, margin + 20, y);
        y += 15;
      }
      if (prescription.prismL) {
        doc.text(`PRISM L: ${prescription.prismL.toFixed(2)} ${prescription.inOutL || ''} ${prescription.upDownL || ''}`, margin + 20, y);
        y += 15;
      }
      y += 10;
    }

    // Frame information
    if (prescription.frameName || prescription.frameModel || prescription.frameColor) {
      doc.font('Helvetica-Bold').text('פרטי מסגרת:', margin, y);
      y += 18;
      doc.font('Helvetica');
      
      if (prescription.frameName) {
        doc.text(`שם: ${prescription.frameName}`, margin + 20, y);
        y += 15;
      }
      if (prescription.frameModel) {
        doc.text(`דגם: ${prescription.frameModel}`, margin + 20, y);
        y += 15;
      }
      if (prescription.frameColor) {
        doc.text(`צבע: ${prescription.frameColor}`, margin + 20, y);
        y += 15;
      }
      y += 10;
    }

    // Notes
    if (prescription.notes || prescription.frameNotes) {
      doc.font('Helvetica-Bold').text('הערות:', margin, y);
      y += 18;
      doc.font('Helvetica');
      
      if (prescription.notes) {
        doc.text(`הערות עדשות: ${prescription.notes}`, margin + 20, y, { width: pageWidth - margin * 2 - 20 });
        y += 25;
      }
      if (prescription.frameNotes) {
        doc.text(`הערות מסגרת: ${prescription.frameNotes}`, margin + 20, y, { width: pageWidth - margin * 2 - 20 });
        y += 25;
      }
    }

    // Footer
    const footerY = doc.page.height - 60;
    doc.fontSize(9)
       .fillColor('#64748b')
       .text(`מספר מרשם: ${prescription.prescriptionNumber || prescription.id}`, margin, footerY, { align: 'center' });
    doc.text(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`, margin, footerY + 15, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;

