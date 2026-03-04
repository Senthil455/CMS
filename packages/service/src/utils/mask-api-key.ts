export function maskApiKey(key: string | null | undefined): string | null {
    if (!key) return null;
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}
