
export function hasPrismaErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeError = error as { code?: unknown };
  return maybeError.code === code;
}
