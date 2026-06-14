export function isProd(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.bookmarks
}
