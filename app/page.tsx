"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Warehouse = {
  warehouseId: string;
  warehouseName: string;
  location: string;

  totalStock: number;
  reservedStock: number;
  availableStock: number;
};

type Product = {
  id: string;
  name: string;
  description?: string;

  warehouses: Warehouse[];
};

export default function HomePage() {

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function fetchProducts() {

    try {

      const response =
        await fetch("/api/products");

      const data = await response.json();

      // Handle API errors
      if (!response.ok) {

        setError(data.error || "Failed to load products");

        return;
      }

      // Ensure array
      if (!Array.isArray(data)) {

        setError("Invalid products response");

        return;
      }

      setProducts(data);

    } catch (error) {

      console.error(error);

      setError("Failed to fetch products");

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function reserveProduct(
    productId: string,
    warehouseId: string
  ) {

    try {

      const response =
        await fetch("/api/reservations", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            productId,
            warehouseId,
            quantity: 1,
          }),
        });

      const data = await response.json();

      // Handle errors
      if (!response.ok) {

        alert(data.error);

        return;
      }

      // Navigate to reservation page
      window.location.href =
        `/reservation/${data.id}`;

    } catch (error) {

      console.error(error);

      alert("Reservation failed");
    }
  }

  if (loading) {

    return (
      <div className="p-10">
        Loading products...
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

  return (
    <main className="p-10">

      <h1 className="text-3xl font-bold mb-8">
        Inventory Reservation System
      </h1>

      <div className="grid gap-6">

        {products.map((product) => (

          <div
            key={product.id}
            className="border rounded-xl p-6"
          >

            <h2 className="text-2xl font-semibold">
              {product.name}
            </h2>

            <p className="text-gray-500 mb-4">
              {product.description}
            </p>

            <div className="grid gap-4">

              {product.warehouses.map(
                (warehouse) => (

                  <div
                    key={warehouse.warehouseId}
                    className="
                      border
                      rounded-lg
                      p-4
                      flex
                      justify-between
                      items-center
                    "
                  >

                    <div>

                      <p className="font-medium">
                        {warehouse.warehouseName}
                      </p>

                      <p className="text-sm text-gray-500">
                        {warehouse.location}
                      </p>

                      <p className="mt-2">
                        Available Stock:
                        {" "}
                        <span className="font-bold">
                          {warehouse.availableStock}
                        </span>
                      </p>
                    </div>

                    <Button
                      disabled={
                        warehouse.availableStock <= 0
                      }
                      onClick={() =>
                        reserveProduct(
                          product.id,
                          warehouse.warehouseId
                        )
                      }
                    >
                      Reserve
                    </Button>

                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}