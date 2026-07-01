let counter = 0;

export function generateId(prefix = 'entity'): string {
  return `${prefix}_${counter++}_${Date.now().toString(36)}`;
}
