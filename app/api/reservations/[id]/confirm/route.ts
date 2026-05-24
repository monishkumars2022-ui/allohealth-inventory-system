import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  try {

    const { id: reservationId } = await params;

    const result = await prisma.$transaction(
      async (tx) => {

        // Find reservation
        const reservation =
          await tx.reservation.findUnique({
            where: {
              id: reservationId,
            },
          });

        // Reservation not found
        if (!reservation) {

          return {
            error: "Reservation not found",
            status: 404,
          };
        }

        // Already processed
        if (reservation.status !== "PENDING") {

          return {
            error: "Reservation already processed",
            status: 400,
          };
        }

        // Expired
        if (
          new Date() > reservation.expiresAt
        ) {

          // Release reserved stock automatically
          const inventory =
            await tx.inventory.findFirst({
              where: {
                productId: reservation.productId,
                warehouseId: reservation.warehouseId,
              },
            });

          if (inventory) {

            await tx.inventory.update({
              where: {
                id: inventory.id,
              },
              data: {
                reservedStock: {
                  decrement: reservation.quantity,
                },
              },
            });
          }

          // Mark released
          await tx.reservation.update({
            where: {
              id: reservation.id,
            },
            data: {
              status: "RELEASED",
            },
          });

          return {
            error: "Reservation expired",
            status: 410,
          };
        }

        // Find inventory
        const inventory =
          await tx.inventory.findFirst({
            where: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          });

        if (!inventory) {

          return {
            error: "Inventory not found",
            status: 404,
          };
        }

        // Permanently deduct stock
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {

            totalStock: {
              decrement: reservation.quantity,
            },

            reservedStock: {
              decrement: reservation.quantity,
            },
          },
        });

        // Mark confirmed
        const updatedReservation =
          await tx.reservation.update({
            where: {
              id: reservation.id,
            },
            data: {
              status: "CONFIRMED",
            },
          });

        return {
          reservation: updatedReservation,
          status: 200,
        };
      }
    );

    if ("error" in result) {

      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      result.reservation
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Confirmation failed" },
      { status: 500 }
    );
  }
}