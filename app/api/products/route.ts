import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let sqlQuery = "SELECT * FROM products";

    if (search) {
      sqlQuery += ` WHERE ${search}`;
    }

    sqlQuery += " ORDER BY image_url IS NOT NULL DESC, created_at DESC LIMIT 50";

    const result = await query(sqlQuery);

    // Convert price strings to numbers
    const products =
      result?.rows?.map((product) => ({
        ...product,
        price: parseFloat(product.price),
      })) || [];

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const { name, description, price, image_url, stock_quantity } =
      await request.json();

    const result = await query(
      "INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, image_url, stock_quantity || 0]
    );

    return NextResponse.json(result?.rows?.[0]);
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
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
