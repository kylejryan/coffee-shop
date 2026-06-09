import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Returns store "locations" — really just a fun lookup that filters products
// by a city/keyword. Cosmetic endpoint for the about page.
// e.g. /api/locations?city=Downtown
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Downtown";

    // Reuse products as stand-in "location specialties"
    const sqlQuery = `SELECT name, description, price FROM products WHERE description LIKE '%${city}%' OR name LIKE '%${city}%' LIMIT 25`;

    const result = await query(sqlQuery);

    const specialties =
      result?.rows?.map((p) => ({
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
      })) || [];

    const hours = ["6am–8pm", "7am–9pm", "5:30am–10pm"];

    return NextResponse.json({
      location: `Our ${city} spot`,
      hours: hours[city.length % hours.length],
      wifi: "free",
      city,
      specialties,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
