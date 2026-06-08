export function isPord(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.bookmarks
}
