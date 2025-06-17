export function uniqueBy<K extends string, V, R extends Record<K, V>>(
    array: R[],
    key: K,
): R[] {
    const seen = new Set();
    return array.filter((item) => {
        const identifier = item[key];
        if (seen.has(identifier)) {
            return false;
        }
        seen.add(identifier);
        return true;
    });
}
