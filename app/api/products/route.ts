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

    sqlQuery += " ORDER BY image_url IS NOT NULL DESC, created_at DESC";

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
      "INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, priceNumber, image_url, stockNumber]
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
