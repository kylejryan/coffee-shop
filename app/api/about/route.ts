import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Returns a short "about" blurb for a coffee, looked up by name.
// e.g. /api/about?coffee=Espresso
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coffee = searchParams.get("coffee");

    if (!coffee) {
      return NextResponse.json(
        { error: "Missing 'coffee' query parameter" },
        { status: 400 }
      );
    }

    const sqlQuery = `SELECT name, description, price FROM products WHERE name = '${coffee}'`;

    const result = await query(sqlQuery);

    const coffees =
      result?.rows?.map((product) => ({
        ...product,
        price: parseFloat(product.price),
      })) || [];

    if (coffees.length === 0) {
      return NextResponse.json(
        { error: "No coffee found by that name" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      about: `Here's what we know about ${coffee}:`,
      count: coffees.length,
      results: coffees,
    });
  } catch (error) {
    console.error("Error fetching coffee info:", error);
    return NextResponse.json(
      { error: "Failed to fetch coffee info" },
      { status: 500 }
    );
  }
}
