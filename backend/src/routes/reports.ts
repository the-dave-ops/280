import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { requireAuth } from '../middleware/auth';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Get revenue by branch
router.get('/revenue/by-branch', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    const where: any = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        branch: true,
        customer: true,
      },
    });

    // Group by branch
    const revenueByBranch: Record<string, { branchName: string; revenue: number; count: number }> = {};
    
    prescriptions.forEach((prescription) => {
      const branchName = prescription.branch?.name || 'ללא סניף';
      if (!revenueByBranch[branchName]) {
        revenueByBranch[branchName] = { branchName, revenue: 0, count: 0 };
      }
      revenueByBranch[branchName].revenue += prescription.price || 0;
      revenueByBranch[branchName].count += 1;
    });

    const result = Object.values(revenueByBranch);
    res.json({ data: result });
  } catch (error) {
    console.error('Get revenue by branch error:', error);
    res.status(500).json({ error: 'Failed to get revenue by branch' });
  }
});

// Get prescriptions by branch
router.get('/prescriptions/by-branch', requireAuth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId } = req.query;

    const where: any = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    const prescriptions = await prisma.prescription.groupBy({
      by: ['branchId'],
      where,
      _count: {
        id: true,
      },
    });

    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: prescriptions.map((p) => p.branchId || 0).filter((id) => id > 0),
        },
      },
    });

    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const result = prescriptions.map((p) => ({
      branchName: p.branchId ? branchMap.get(p.branchId) || 'ללא סניף' : 'ללא סניף',
      count: p._count.id,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Get prescriptions by branch error:', error);
    res.status(500).json({ error: 'Failed to get prescriptions by branch' });
  }
});

// Get customers by branch
router.get('/customers/by-branch', requireAuth, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    const where: any = {};
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    const customers = await prisma.customer.groupBy({
      by: ['branchId'],
      where,
      _count: {
        id: true,
      },
    });

    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: customers.map((c) => c.branchId || 0).filter((id) => id > 0),
        },
      },
    });

    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const result = customers.map((c) => ({
      branchName: c.branchId ? branchMap.get(c.branchId) || 'ללא סניף' : 'ללא סניף',
      count: c._count.id,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Get customers by branch error:', error);
    res.status(500).json({ error: 'Failed to get customers by branch' });
  }
});

// Get employees by branch
router.get('/employees/by-branch', requireAuth, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    const where: any = {};
    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    const employees = await prisma.user.groupBy({
      by: ['branchId'],
      where: {
        ...where,
        role: {
          in: ['employee', 'manager'],
        },
      },
      _count: {
        id: true,
      },
    });

    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: employees.map((e) => e.branchId || 0).filter((id) => id > 0),
        },
      },
    });

    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    const result = employees.map((e) => ({
      branchName: e.branchId ? branchMap.get(e.branchId) || 'ללא סניף' : 'ללא סניף',
      count: e._count.id,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Get employees by branch error:', error);
    res.status(500).json({ error: 'Failed to get employees by branch' });
  }
});

// Generate PDF report
router.post('/generate-pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate, branchId, optometristId } = req.body;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('דוח מפורט', { align: 'right' });
    doc.moveDown();

    // Report parameters
    doc.fontSize(12);
    if (startDate || endDate) {
      doc.text(`תקופה: ${startDate || 'מתחילת התקופה'} - ${endDate || 'עד היום'}`, { align: 'right' });
    }
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch) {
        doc.text(`סניף: ${branch.name}`, { align: 'right' });
      }
    }
    doc.moveDown();

    // Build where clause
    const where: any = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (branchId) where.branchId = branchId;
    if (optometristId) where.optometristId = optometristId;

    // Generate report based on type
    switch (reportType) {
      case 'revenue':
        const revenuePrescriptions = await prisma.prescription.findMany({
          where,
          include: { branch: true, customer: true },
        });
        
        doc.fontSize(16).text('דוח הכנסות', { align: 'right' });
        doc.moveDown();
        
        let totalRevenue = 0;
        revenuePrescriptions.forEach((p, index) => {
          const revenue = p.price || 0;
          totalRevenue += revenue;
          doc.fontSize(10).text(
            `${index + 1}. ${p.customer?.firstName || ''} ${p.customer?.lastName || ''} - ${p.branch?.name || 'ללא סניף'} - ${revenue} ₪`,
            { align: 'right' }
          );
        });
        doc.moveDown();
        doc.fontSize(14).text(`סה"כ הכנסות: ${totalRevenue} ₪`, { align: 'right' });
        break;

      case 'prescriptions':
        const prescriptions = await prisma.prescription.findMany({
          where,
          include: { branch: true, customer: true, optometrist: true },
        });
        
        doc.fontSize(16).text('דוח מרשמים', { align: 'right' });
        doc.moveDown();
        
        prescriptions.forEach((p, index) => {
          doc.fontSize(10).text(
            `${index + 1}. ${p.customer?.firstName || ''} ${p.customer?.lastName || ''} - ${p.type} - ${p.branch?.name || 'ללא סניף'} - ${new Date(p.date).toLocaleDateString('he-IL')}`,
            { align: 'right' }
          );
        });
        doc.moveDown();
        doc.fontSize(14).text(`סה"כ מרשמים: ${prescriptions.length}`, { align: 'right' });
        break;

      case 'customers':
        const customers = await prisma.customer.findMany({
          where: branchId ? { branchId } : {},
          include: { branch: true },
        });
        
        doc.fontSize(16).text('דוח לקוחות', { align: 'right' });
        doc.moveDown();
        
        customers.forEach((c, index) => {
          doc.fontSize(10).text(
            `${index + 1}. ${c.firstName} ${c.lastName} - ${c.branch?.name || 'ללא סניף'} - ${c.idNumber || '-'}`,
            { align: 'right' }
          );
        });
        doc.moveDown();
        doc.fontSize(14).text(`סה"כ לקוחות: ${customers.length}`, { align: 'right' });
        break;
    }

    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;

