export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
 
    // yeehaw
    // Validate JWT_SECRET is properly configured at startup
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is required for application startup. " +
        "Please set JWT_SECRET to a strong, random string of at least 32 characters."
      );
    }
    if (jwtSecret.length < 32) {
      throw new Error(
        "FATAL: JWT_SECRET must be at least 32 characters long for security. " +
        `Current length: ${jwtSecret.length} characters.`
      );
    }
    console.log("[✓] JWT_SECRET validation passed - secure authentication configured");

    const { rpsTracker } = await import("./lib/rps-tracker");
    const http = await import("http");

    // Patch the HTTP server to track incoming requests
    const originalEmit = http.Server.prototype.emit;
    http.Server.prototype.emit = function (event: string, ...args: any[]) {
      if (event === "request") {
        rpsTracker.trackRequest();
      }
      return originalEmit.apply(this, [event, ...args]);
    };

    const handleShutdown = (signal: string) => {
      console.log(`\n\nReceived ${signal}, shutting down gracefully...`);
      console.log(rpsTracker.getReport());
      process.exit(0);
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));

    console.log("RPS tracking initialized. Press Ctrl+C to view report on shutdown.");
  }
}
