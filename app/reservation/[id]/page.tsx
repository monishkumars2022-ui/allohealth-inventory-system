"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Reservation = {
  id: string;

  status: string;

  quantity: number;

  expiresAt: string;

  product: {
    name: string;
  };

  warehouse: {
    name: string;
    location: string;
  };
};

export default function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [timeLeft, setTimeLeft] =
    useState("");

  const [error, setError] =
    useState("");

  async function fetchReservation() {

    try {

      const { id } = await params;

      const response =
        await fetch(`/api/reservations/${id}`);

      const data = await response.json();

      if (!response.ok) {

        setError(data.error);

        return;
      }

      setReservation(data);

    } catch (error) {

      console.error(error);

      setError("Failed to fetch reservation");

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservation();
  }, []);

  // Countdown timer
useEffect(() => {

  if (!reservation) return;

  // Stop timer for completed states
  if (reservation.status !== "PENDING") {

    setTimeLeft("Completed");

    return;
  }

  const interval = setInterval(() => {

    const now = new Date().getTime();

    const expiry =
      new Date(
        reservation.expiresAt
      ).getTime();

    const difference =
      expiry - now;

    if (difference <= 0) {

      setTimeLeft("Expired");

      clearInterval(interval);

      return;
    }

    const minutes =
      Math.floor(
        difference / 1000 / 60
      );

    const seconds =
      Math.floor(
        (difference / 1000) % 60
      );

    setTimeLeft(
      `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`
    );

  }, 1000);

  return () => clearInterval(interval);

}, [reservation]);

  async function confirmReservation() {

    if (!reservation) return;

    try {

      const response =
        await fetch(
          `/api/reservations/${reservation.id}/confirm`,
          {
            method: "POST",
          }
        );

      const data = await response.json();

      if (!response.ok) {

        setError(data.error);

        return;
      }

      fetchReservation();

    } catch (error) {

      console.error(error);

      setError("Confirmation failed");
    }
  }

  async function releaseReservation() {

    if (!reservation) return;

    try {

      const response =
        await fetch(
          `/api/reservations/${reservation.id}/release`,
          {
            method: "POST",
          }
        );

      const data = await response.json();

      if (!response.ok) {

        setError(data.error);

        return;
      }

      fetchReservation();

    } catch (error) {

      console.error(error);

      setError("Release failed");
    }
  }

  if (loading) {

    return (
      <div className="p-10">
        Loading reservation...
      </div>
    );
  }

  if (error) {

    return (
      <div className="p-10 text-red-500">
        {error}
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <main className="p-10 max-w-2xl mx-auto">

      <div className="border rounded-xl p-8">

        <h1 className="text-3xl font-bold mb-6">
          Checkout Reservation
        </h1>

        <div className="space-y-4">

          <div>
            <span className="font-semibold">
              Product:
            </span>
            {" "}
            {reservation.product.name}
          </div>

          <div>
            <span className="font-semibold">
              Warehouse:
            </span>
            {" "}
            {reservation.warehouse.name}
          </div>

          <div>
            <span className="font-semibold">
              Quantity:
            </span>
            {" "}
            {reservation.quantity}
          </div>

          <div>
            <span className="font-semibold">
              Status:
            </span>
            {" "}
            {reservation.status}
          </div>

          <div className="text-xl font-bold">

            Time Remaining:
            {" "}

            <span className="text-blue-600">
              {timeLeft}
            </span>

          </div>
        </div>

        <div className="flex gap-4 mt-8">

          <Button
            onClick={confirmReservation}
            disabled={
              reservation.status !== "PENDING"
              || timeLeft === "Expired"
            }
          >
            Confirm Purchase
          </Button>

          <Button
            variant="destructive"
            onClick={releaseReservation}
            disabled={
              reservation.status !== "PENDING"
            }
          >
            Cancel Reservation
          </Button>
        </div>
      </div>
    </main>
  );
}