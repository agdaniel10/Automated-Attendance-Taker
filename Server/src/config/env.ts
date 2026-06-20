type Env = {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  adminPassword?: string;
  adminPasswordHash?: string;
  scannerSharedSecret?: string;
  templateEncryptionKey: Buffer;
  qrTokenTtlHours: number;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 5000;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return parsed;
}

function parseEncryptionKey(value: string): Buffer {
  let keyBuffer: Buffer;

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    keyBuffer = Buffer.from(value, "hex");
  } else {
    keyBuffer = Buffer.from(value, "base64");
  }

  if (keyBuffer.length !== 32) {
    throw new Error(
      "TEMPLATE_ENCRYPTION_KEY must decode to exactly 32 bytes (hex or base64).",
    );
  }

  return keyBuffer;
}

export const env: Env = {
  port: parsePort(process.env.PORT),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  adminPassword: process.env.ADMIN_PASSWORD?.trim(),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH?.trim(),
  scannerSharedSecret: process.env.SCANNER_SHARED_SECRET?.trim(),
  templateEncryptionKey: parseEncryptionKey(
    getRequiredEnv("TEMPLATE_ENCRYPTION_KEY"),
  ),
  qrTokenTtlHours: parsePositiveInt(process.env.QR_TOKEN_TTL_HOURS, 12),
};

if (!env.adminPassword && !env.adminPasswordHash) {
  throw new Error("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.");
}
