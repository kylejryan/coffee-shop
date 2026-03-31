import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import os from "os";

// hi joe
// Define safe diagnostic commands with explicit allowlist
const ALLOWED_COMMANDS = {
  systemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: process.uptime(),
  }),
  memoryUsage: () => process.memoryUsage(),
  uptime: () => process.uptime(),
  nodeVersion: () => process.version,
  cpuCount: () => os.cpus().length,
  totalMemory: () => os.totalmem(),
  freeMemory: () => os.freemem(),
  loadAverage: () => os.loadavg(),
  hostname: () => os.hostname(),
  processStatus: () => ({
    pid: process.pid,
    uptime: process.uptime(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  }),
};

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
    if (!(command in ALLOWED_COMMANDS)) {
      return NextResponse.json(
        {
          error: "Invalid command. Allowed commands are: " +
            Object.keys(ALLOWED_COMMANDS).join(", "),
        },
        { status: 400 }
      );
    }

    // Execute only the allowed command
    const commandFunction =
      ALLOWED_COMMANDS[command as keyof typeof ALLOWED_COMMANDS];
    const result = commandFunction();

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
