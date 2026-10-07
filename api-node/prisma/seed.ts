import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      slug: 'admin',
      description: 'Full system access',
      permissions: ['*'],
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { slug: 'manager' },
    update: {},
    create: {
      name: 'Manager',
      slug: 'manager',
      description: 'Manage operations',
      permissions: ['sales:read', 'sales:write', 'purchases:read', 'purchases:write', 'inventory:read', 'inventory:write', 'reports:read'],
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { slug: 'user' },
    update: {},
    create: {
      name: 'User',
      slug: 'user',
      description: 'Basic user access',
      permissions: ['sales:read', 'purchases:read', 'inventory:read'],
      isSystem: true,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      code: 'ADM001',
      name: 'Admin User',
      email: 'admin@erp.com',
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Create default warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      code: 'MAIN',
      name: 'Main Warehouse',
      address: '123 Main St',
      city: 'New York',
      country: 'USA',
      isDefault: true,
      isActive: true,
    },
  });

  // Create default units
  const unitPcs = await prisma.unit.upsert({
    where: { abbreviation: 'PCS' },
    update: {},
    create: { name: 'Pieces', abbreviation: 'PCS', description: 'Individual pieces', isActive: true },
  });

  const unitBox = await prisma.unit.upsert({
    where: { abbreviation: 'BOX' },
    update: {},
    create: { name: 'Box', abbreviation: 'BOX', description: 'Box packaging', isActive: true },
  });

  // Create default categories
  const categoryElectronics = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: { code: 'ELEC', name: 'Electronics', description: 'Electronic products', isActive: true },
  });

  const categoryOffice = await prisma.category.upsert({
    where: { code: 'OFF' },
    update: {},
    create: { code: 'OFF', name: 'Office Supplies', description: 'Office supplies', isActive: true },
  });

  // Create sample products
  await prisma.product.upsert({
    where: { code: 'LAPTOP-001' },
    update: {},
    create: {
      code: 'LAPTOP-001',
      sku: 'LAP-001',
      name: 'Laptop Pro 15"',
      description: 'High-performance laptop',
      categoryId: categoryElectronics.id,
      unitId: unitPcs.id,
      costPrice: 800,
      salePrice: 1200,
      taxRate: 10,
      trackInventory: true,
      reorderLevel: 5,
      reorderQuantity: 10,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'MOUSE-001' },
    update: {},
    create: {
      code: 'MOUSE-001',
      sku: 'MOU-001',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      categoryId: categoryElectronics.id,
      unitId: unitPcs.id,
      costPrice: 15,
      salePrice: 35,
      taxRate: 10,
      trackInventory: true,
      reorderLevel: 20,
      reorderQuantity: 50,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { code: 'PAPER-A4' },
    update: {},
    create: {
      code: 'PAPER-A4',
      sku: 'PAP-A4',
      name: 'A4 Paper (500 sheets)',
      description: 'Standard A4 printer paper',
      categoryId: categoryOffice.id,
      unitId: unitBox.id,
      costPrice: 5,
      salePrice: 12,
      taxRate: 5,
      trackInventory: true,
      reorderLevel: 10,
      reorderQuantity: 50,
      isActive: true,
    },
  });

  // Create sample customers
  await prisma.customer.upsert({
    where: { code: 'CUST-001' },
    update: {},
    create: {
      code: 'CUST-001',
      name: 'Acme Corporation',
      company: 'Acme Corp',
      email: 'orders@acme.com',
      phone: '+1-555-0100',
      address: '456 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      creditLimit: 50000,
      paymentTermsDays: 30,
      isActive: true,
    },
  });

  await prisma.customer.upsert({
    where: { code: 'CUST-002' },
    update: {},
    create: {
      code: 'CUST-002',
      name: 'TechStart Inc',
      company: 'TechStart',
      email: 'procurement@techstart.io',
      phone: '+1-555-0200',
      address: '789 Innovation Blvd',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      creditLimit: 25000,
      paymentTermsDays: 15,
      isActive: true,
    },
  });

  // Create sample suppliers
  await prisma.supplier.upsert({
    where: { code: 'SUP-001' },
    update: {},
    create: {
      code: 'SUP-001',
      name: 'Global Electronics Ltd',
      company: 'Global Electronics',
      email: 'sales@globalelec.com',
      phone: '+1-555-1000',
      address: '100 Supplier Rd',
      city: 'Shenzhen',
      country: 'China',
      paymentTermsDays: 30,
      bankName: 'Bank of China',
      bankAccount: '1234567890',
      isActive: true,
    },
  });

  await prisma.supplier.upsert({
    where: { code: 'SUP-002' },
    update: {},
    create: {
      code: 'SUP-002',
      name: 'Office Supplies Co',
      company: 'Office Supplies Co',
      email: 'orders@officesupplies.com',
      phone: '+1-555-2000',
      address: '200 Wholesale Dr',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      paymentTermsDays: 30,
      bankName: 'Chase Bank',
      bankAccount: '0987654321',
      isActive: true,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });