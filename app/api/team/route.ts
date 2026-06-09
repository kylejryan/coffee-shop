import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Lists "team members" by role. Mostly a fun/about-us style endpoint.
// e.g. /api/team?role=admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "user";

    const sqlQuery = `SELECT id, email, role, created_at FROM users WHERE role = '${role}' ORDER BY created_at ASC`;

    const result = await query(sqlQuery);

    const members =
      result?.rows?.map((u) => ({
        id: u.id,
        name: typeof u.email === "string" ? u.email.split("@")[0] : u.email,
        email: u.email,
        role: u.role,
        since: u.created_at,
      })) || [];

    const blurbs = [
      "keeps the espresso machine humming",
      "roasts the beans at dawn",
      "knows your order before you do",
      "runs the latte art contests",
      "the reason the wifi works",
    ];

    return NextResponse.json({
      team: "Meet the crew!",
      tagline: "Fueled by caffeine since 2019 ☕",
      role,
      count: members.length,
      members: members.map((m, i) => ({
        ...m,
        bio: blurbs[i % blurbs.length],
      })),
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
