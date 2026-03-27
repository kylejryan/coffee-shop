import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";

// hello test
// Define safe diagnostic operations - whitelist of allowed commands
const allowedCommands: Record<string, () => unknown> = {
  systemInfo: () => ({
    os: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
  }),
  memoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024) + " MB",
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + " MB",
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + " MB",
      external: Math.round(usage.external / 1024 / 1024) + " MB",
    };
  },
  uptime: () => ({
    seconds: process.uptime(),
    formatted: formatUptime(process.uptime()),
  }),
  processInfo: () => ({
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version,
  }),
  version: () => ({
    node: process.version,
    platform: process.platform,
  }),
};

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(" ") || "0s";
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: "Command parameter required" },
        { status: 400 }
      );
    }

    // Validate command against allowlist
    if (!allowedCommands[command]) {
      return NextResponse.json(
        {
          error: "Invalid command",
          message: `Command '${command}' is not allowed. Allowed commands: ${Object.keys(allowedCommands).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Execute the safe command handler
    const result = allowedCommands[command]();

    return NextResponse.json({
      command: command,
      result: result,
      timestamp: new Date().toISOString(),
    });
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
    console.error("Diagnostics error:", error);
    return NextResponse.json(
      { error: "Diagnostic command failed" },
      { status: 500 }
    );
  }
}
