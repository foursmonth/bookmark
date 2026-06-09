export function intersectionToTarget<T>(target: Set<T>, source: Set<T> | T[]): void {
    const sourceSet = source instanceof Set ? source : new Set(source)
    target.forEach(item => {
        if (!sourceSet.has(item)) target.delete(item)
    })
}

export function mergeToTarget<T>(target: Set<T>, source: Set<T> | T[]): void {
    source.forEach(item => target.add(item))
}

export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}
