import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'סניף מרכז',
      address: 'רחוב הרצל 15, תל אביב',
      phone: '03-1234567',
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'סניף צפון',
      address: 'רחוב בן גוריון 20, חיפה',
      phone: '04-7654321',
    },
  });

  console.log('✅ Created branches');

  // Create optometrists
  const optometrist1 = await prisma.optometrist.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'ד"ר יוסי כהן',
      licenseNumber: '12345',
      phone: '050-1234567',
      email: 'yossi@example.com',
    },
  });

  const optometrist2 = await prisma.optometrist.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'ד"ר שרה לוי',
      licenseNumber: '67890',
      phone: '050-7654321',
      email: 'sara@example.com',
    },
  });

  console.log('✅ Created optometrists');

  // Create employees
  const employee1 = await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'מיכל דוד',
      employeeId: 'EMP001',
      phone: '052-1111111',
      email: 'michal@example.com',
    },
  });

  console.log('✅ Created employees');

  // Create campaigns
  const campaign1 = await prisma.campaign.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'מבצע 280',
      description: 'מבצע מיוחד על משקפיים',
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  });

  console.log('✅ Created campaigns');

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { idNumber: '123456789' },
    update: {},
    create: {
      date: new Date(),
      firstName: 'יוסי',
      lastName: 'כהן',
      idNumber: '123456789',
      isPassport: false,
      birthDate: new Date('1980-05-15'),
      street: 'רחוב הרצל',
      houseNumber: '15',
      entrance: 'א',
      apartment: 3,
      city: 'תל אביב',
      phone: '03-1234567',
      mobile1: '050-1234567',
      mobile2: '052-1234567',
      healthFund: 'מכבי',
      category: 'לקוח קבוע',
      employeeId: 1,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { idNumber: '987654321' },
    update: {},
    create: {
      date: new Date(),
      firstName: 'שרה',
      lastName: 'לוי',
      idNumber: '987654321',
      isPassport: false,
      birthDate: new Date('1990-08-20'),
      street: 'רחוב בן גוריון',
      houseNumber: '20',
      entrance: 'ב',
      apartment: 5,
      city: 'חיפה',
      phone: '04-7654321',
      mobile1: '050-7654321',
      healthFund: 'כללית',
      category: 'לקוח חדש',
      employeeId: 1,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { idNumber: '456789123' },
    update: {},
    create: {
      date: new Date(),
      firstName: 'דוד',
      lastName: 'ישראל',
      idNumber: '456789123',
      isPassport: false,
      birthDate: new Date('1975-12-10'),
      street: 'רחוב ויצמן',
      houseNumber: '30',
      city: 'ירושלים',
      phone: '02-1111111',
      mobile1: '054-1111111',
      healthFund: 'מאוחדת',
      category: 'לקוח VIP',
      employeeId: 1,
    },
  });

  const customer4 = await prisma.customer.upsert({
    where: { idNumber: '789123456' },
    update: {},
    create: {
      date: new Date(),
      firstName: 'רחל',
      lastName: 'אברהם',
      idNumber: '789123456',
      isPassport: false,
      birthDate: new Date('1985-03-25'),
      street: 'רחוב רוטשילד',
      houseNumber: '10',
      apartment: 2,
      city: 'תל אביב',
      phone: '03-2222222',
      mobile1: '050-2222222',
      healthFund: 'לאומית',
      category: 'לקוח קבוע',
      employeeId: 1,
    },
  });

  const customer5 = await prisma.customer.upsert({
    where: { idNumber: '321654987' },
    update: {},
    create: {
      date: new Date(),
      firstName: 'אבי',
      lastName: 'משה',
      idNumber: '321654987',
      isPassport: false,
      birthDate: new Date('1995-07-08'),
      street: 'רחוב דיזנגוף',
      houseNumber: '50',
      city: 'תל אביב',
      phone: '03-3333333',
      mobile1: '050-3333333',
      healthFund: 'מכבי',
      category: 'לקוח חדש',
      employeeId: 1,
    },
  });

  console.log('✅ Created customers');

  // Create prescriptions for customer1
  const prescription1 = await prisma.prescription.create({
    data: {
      customerId: customer1.id,
      type: 'מרחק',
      date: new Date('2024-01-15'),
      r: -2.5,
      l: -2.25,
      pd: 64,
      cylR: -0.5,
      axR: 180,
      cylL: -0.25,
      axL: 90,
      index: '1.6',
      color: 'שקוף',
      price: 350,
      discountSource: 'מאוחדת שיא',
      amountToPay: 315,
      paid: 315,
      balance: 0,
      receiptNumber: 'REC001',
      campaign280: false,
      optometristId: optometrist1.id,
      branchId: branch1.id,
      source: 'בדיקה שגרתית',
      notes: 'מרשם תקין',
    },
  });

  const prescription2 = await prisma.prescription.create({
    data: {
      customerId: customer1.id,
      type: 'קריאה',
      date: new Date('2024-02-20'),
      r: 0.5,
      l: 0.5,
      pd: 61,
      add: 2.0,
      index: '1.5',
      color: 'שקוף',
      price: 200,
      discountSource: 'מאוחדת שיא',
      amountToPay: 180,
      paid: 100,
      balance: 80,
      receiptNumber: 'REC002',
      campaign280: false,
      optometristId: optometrist1.id,
      branchId: branch1.id,
      source: 'בדיקה שגרתית',
      notes: 'מרשם לקריאה',
    },
  });

  // Create prescriptions for customer2
  const prescription3 = await prisma.prescription.create({
    data: {
      customerId: customer2.id,
      type: 'מרחק',
      date: new Date('2024-03-10'),
      r: -3.0,
      l: -3.5,
      pd: 62,
      cylR: -1.0,
      axR: 90,
      cylL: -1.25,
      axL: 180,
      index: '1.56',
      color: 'כחול',
      colorPercentage: 15,
      price: 280,
      discountSource: 'ללא',
      amountToPay: 280,
      paid: 0,
      balance: 280,
      campaign280: true,
      optometristId: optometrist2.id,
      branchId: branch2.id,
      source: 'בדיקה ראשונה',
      notes: 'צריך מעקב',
    },
  });

  // Create prescriptions for customer3
  const prescription4 = await prisma.prescription.create({
    data: {
      customerId: customer3.id,
      type: 'עדשות מגע',
      date: new Date('2024-04-05'),
      r: -1.75,
      l: -2.0,
      pd: 63,
      cylR: -0.5,
      axR: 45,
      cylL: -0.75,
      axL: 135,
      index: '1.5',
      price: 450,
      discountSource: 'ללא',
      amountToPay: 450,
      paid: 450,
      balance: 0,
      receiptNumber: 'REC003',
      campaign280: false,
      optometristId: optometrist1.id,
      branchId: branch1.id,
      source: 'בדיקה שגרתית',
      notes: 'עדשות מגע חודשיות',
    },
  });

  // Create prescriptions for customer4
  const prescription5 = await prisma.prescription.create({
    data: {
      customerId: customer4.id,
      type: 'מרחק',
      date: new Date('2024-05-12'),
      r: -1.5,
      l: -1.25,
      pd: 65,
      index: '1.6',
      color: 'חום',
      colorPercentage: 20,
      price: 320,
      discountSource: 'מאוחדת שיא',
      amountToPay: 288,
      paid: 150,
      balance: 138,
      receiptNumber: 'REC004',
      campaign280: false,
      optometristId: optometrist2.id,
      branchId: branch1.id,
      source: 'בדיקה שגרתית',
    },
  });

  // Create prescriptions for customer5
  const prescription6 = await prisma.prescription.create({
    data: {
      customerId: customer5.id,
      type: 'קריאה',
      date: new Date('2024-06-18'),
      r: 1.0,
      l: 1.25,
      pd: 60,
      add: 2.5,
      index: '1.5',
      color: 'שקוף',
      price: 200,
      discountSource: 'ללא',
      amountToPay: 200,
      paid: 0,
      balance: 200,
      campaign280: true,
      optometristId: optometrist1.id,
      branchId: branch1.id,
      source: 'בדיקה ראשונה',
      notes: 'מרשם לקריאה',
    },
  });

  console.log('✅ Created prescriptions');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

