import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    let sqlQuery = `
      SELECT 
        r.id,
        r.product_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        u.email as user_email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
    `;

    const params: unknown[] = [];

    if (productId) {
      sqlQuery += " WHERE r.product_id = $1";
      params.push(productId);
    }

    sqlQuery += " ORDER BY r.created_at DESC";

    const result = await query(
      sqlQuery,
      params.length > 0 ? params : undefined
    );

    return NextResponse.json(result?.rows || []);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { product_id, rating, comment } = await request.json();

    // Validate input
    if (!product_id || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if product exists
    const productCheck = await query("SELECT id FROM products WHERE id = $1", [
      product_id,
    ]);

    if (!productCheck?.rows?.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await query(
      "SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2",
      [user.id, product_id]
    );

    if (existingReview?.rows?.length) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    // Create the review
    const result = await query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [user.id, product_id, rating, comment || null]
    );

    return NextResponse.json(result?.rows?.[0], { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
