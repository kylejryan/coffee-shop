diff --git a/lib/jwt-secret.ts b/lib/jwt-secret.ts
new file mode 100644
index 0000000..a92f1ce
 * JWT Secret Validation Module
 * 
 * This module enforces that JWT_SECRET is properly configured at application startup.
 * It prevents the critical vulnerability of falling back to a hardcoded secret.
 * 
 * Requirements:
 * - JWT_SECRET environment variable MUST be set
 * - JWT_SECRET must be at least 32 characters long
 * 
 * Throws an error immediately if requirements are not met, preventing the application
 * from starting with an insecure configuration.
 */

let cachedSecret: string | null = null;

export function getJwtSecret(): string {
  // Return cached secret if already validated
  if (cachedSecret !== null) {
    return cachedSecret;
  }

  const secret = process.env.JWT_SECRET;

  // Validate that JWT_SECRET is set
  if (!secret) {
    throw new Error(
      "CRITICAL: JWT_SECRET environment variable is required for application startup. " +
      "Please set JWT_SECRET to a secure random string of at least 32 characters. " +
      "This is a security requirement to prevent authentication bypass vulnerabilities."
    );
  }

  // Validate minimum length for security
  if (secret.length < 32) {
    throw new Error(
      "CRITICAL: JWT_SECRET must be at least 32 characters long for security. " +
      `Current length: ${secret.length} characters. ` +
      "Please set JWT_SECRET to a longer, more secure random string."
    );
  }

  // Cache the validated secret
  cachedSecret = secret;
  return cachedSecret;
}

/**
 * Initialize and validate JWT secret at startup
 * This should be called early in the application lifecycle
 */
export function validateJwtSecretAtStartup(): void {
  try {
    getJwtSecret();
    console.log("[JWT] ✓ JWT_SECRET is properly configured and secure");
  } catch (error) {
    console.error("[JWT] ✗ FATAL: JWT_SECRET validation failed");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}