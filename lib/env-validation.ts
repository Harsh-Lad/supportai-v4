/**
 * Environment variable validation for SupportAI deployment
 * Validates required and optional environment variables at startup
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that all required environment variables are set
 * and warns about missing optional but recommended variables
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = {
    MONGODB_URI: 'MongoDB connection URI',
    NEXTAUTH_SECRET: 'NextAuth secret key for session signing',
    NEXTAUTH_URL: 'NextAuth callback URL',
    GEMINI_API_KEY: 'Google Gemini API key for embeddings and default AI',
  };

  // Optional but recommended environment variables
  const optionalVars = {
    SMTP_HOST: 'SMTP server for email functionality',
    SMTP_USER: 'SMTP username for email authentication',
    ENCRYPTION_KEY: 'Encryption key for sensitive data',
    RAZORPAY_KEY_ID: 'Razorpay API key for payments',
  };

  // Check required variables
  for (const [key, description] of Object.entries(requiredVars)) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key} (${description})`);
    }
  }

  // Check optional variables and warn if missing
  for (const [key, description] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      warnings.push(`Missing optional environment variable: ${key} (${description})`);
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
  };
}

/**
 * Validates environment variables and logs results
 * Should be called early in application initialization
 */
export function validateEnvAndLog(): boolean {
  const result = validateEnv();

  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    return false;
  }

  console.log('✓ All required environment variables are set');

  if (result.warnings.length > 0) {
    console.warn('⚠️ Warning: Some optional environment variables are not set:');
    result.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });
  }

  return true;
}
