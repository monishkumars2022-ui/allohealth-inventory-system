import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type InventoryRow = {
  id: string;
  productId: string;
  warehouseId: string;
  totalStock: number;
  reservedStock: number;
};

export async function POST(req: NextRequest) {

  try {

    const body = await req.json();

    const {
      productId,
      warehouseId,
      quantity,
    } = body;

    // Basic validation
    if (!productId || !warehouseId || !quantity) {

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {

        // Lock inventory row
        const inventoryRows =
          await tx.$queryRawUnsafe<InventoryRow[]>(
            `
            SELECT *
            FROM "Inventory"
            WHERE "productId" = $1
            AND "warehouseId" = $2
            FOR UPDATE
            `,
            productId,
            warehouseId
          );

        const inventory = inventoryRows[0];

        // Inventory not found
        if (!inventory) {

          return {
            error: "Inventory not found",
            status: 404,
          };
        }

        // Calculate available stock
        const availableStock =
          inventory.totalStock -
          inventory.reservedStock;

        // Not enough stock
        if (availableStock < quantity) {

          return {
            error: "Not enough stock available",
            status: 409,
          };
        }

        // Increase reserved stock
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedStock: {
              increment: quantity,
            },
          },
        });

        // Create reservation
        const reservation =
          await tx.reservation.create({
            data: {
              productId,
              warehouseId,
              quantity,

              status: "PENDING",

              expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
              ),
            },
          });

        return {
          reservation,
          status: 201,
        };
      }
    );

    // Handle custom errors
    if ("error" in result) {

      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Success
    return NextResponse.json(
      result.reservation,
      { status: 201 }
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Reservation failed" },
      { status: 500 }
    );
  }
}