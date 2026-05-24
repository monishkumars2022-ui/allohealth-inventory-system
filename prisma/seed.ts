import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  // Clear old data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create warehouses
  const chennaiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Chennai Warehouse",
      location: "Chennai",
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      location: "Bangalore",
    },
  });

  // Create products
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
      description: "Apple flagship smartphone",
    },
  });

  const samsung = await prisma.product.create({
    data: {
      name: "Samsung S24",
      description: "Samsung premium smartphone",
    },
  });

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: chennaiWarehouse.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: iphone.id,
        warehouseId: bangaloreWarehouse.id,
        totalStock: 5,
        reservedStock: 0,
      },
      {
        productId: samsung.id,
        warehouseId: chennaiWarehouse.id,
        totalStock: 8,
        reservedStock: 0,
      },
      {
        productId: samsung.id,
        warehouseId: bangaloreWarehouse.id,
        totalStock: 12,
        reservedStock: 0,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });