import crypto from "crypto";

export type EncryptedTemplate = {
  encryptedTemplate: Buffer;
  iv: Buffer;
  authTag: Buffer;
};

export function encryptBiometricTemplate(
  templateBase64: string,
  key: Buffer,
): EncryptedTemplate {
  const templateBytes = Buffer.from(templateBase64, "base64");
  if (templateBytes.length === 0) {
    throw new Error("Biometric template is empty or invalid base64.");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encryptedTemplate = Buffer.concat([
    cipher.update(templateBytes),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedTemplate,
    iv,
    authTag,
  };
}
