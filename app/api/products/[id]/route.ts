import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);

    const { id } = await params;
    const productId = parseInt(id);

    await query("DELETE FROM products WHERE id = $1", [productId]);

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);

    const { id } = await params;
    const productId = parseInt(id);
    const { name, description, price, image_url, stock_quantity } =
      await request.json();

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Validate and convert price
    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: "Price is required" },
        { status: 400 }
      );
    }

    const priceNumber = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number greater than 0" },
        { status: 400 }
      );
    }

    // Validate and convert stock_quantity
    let stockNumber = stock_quantity !== undefined ? stock_quantity : 0;
    if (typeof stockNumber === "string") {
      stockNumber = parseInt(stockNumber, 10);
    }
    if (isNaN(stockNumber) || stockNumber < 0) {
      return NextResponse.json(
        { error: "Stock quantity must be a non-negative number" },
        { status: 400 }
      );
    }

    const result = await query(
      "UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, stock_quantity = $5 WHERE id = $6 RETURNING *",
      [name, description, priceNumber, image_url, stockNumber, productId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
