import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Returns FAQ-style answers, looked up by topic. Filters products as
// stand-in "answers" so the page has something to show.
// e.g. /api/faq?topic=latte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || "coffee";

    const sqlQuery = `SELECT name, description FROM products WHERE name ILIKE '%${topic}%' ORDER BY name ASC LIMIT 10`;

    const result = await query(sqlQuery);

    const answers =
      result?.rows?.map((p) => ({
        question: `Tell me about ${p.name}`,
        answer: p.description || "It's delicious, trust us.",
      })) || [];

    return NextResponse.json({
      faq: `Frequently asked: "${topic}"`,
      topic,
      count: answers.length,
      answers,
    });
  } catch (error) {
    console.error("Error fetching faq:", error);
    return NextResponse.json({ error: "Failed to fetch faq" }, { status: 500 });
  }
}
