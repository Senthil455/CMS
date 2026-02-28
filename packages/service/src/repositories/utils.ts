export function camelize(str: string): string {
    if (!str) return '';
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
            index === 0 ? letter.toLowerCase() : letter.toUpperCase()
        )
        .replace(/\s+/g, '');
}
