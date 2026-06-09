import { ChromeTreeNode } from '@/common/type'
import { isPord } from '@/common/envUtil'
import mockBookmarkData from '@/common/mockBookmarks.json'

export function getIconUrl(pageUrl: string | undefined): string {
    if (!isPord() || !pageUrl) {
        return ''
    }
    const urlTemplate = chrome.runtime.getURL('/_favicon/')
    return urlTemplate + '?pageUrl=' + encodeURIComponent(pageUrl) + '&size=16'
}

export function openBookmark(url: string): void {
    if (isPord()) {
        chrome.tabs.create({ url })
    } else {
        window.open(url, '_blank')
    }
}

export function updateBookmark(id: string, changes: { title?: string; url?: string }): Promise<ChromeTreeNode> {
    if (isPord()) {
        return chrome.bookmarks.update(id, changes)
    }
    return Promise.resolve({
        id: id,
        title: changes.title || '',
        url: changes.url || '',
        parentId: '',
        index: 0,
        dateAdded: Date.now(),
        dateGroupModified: Date.now()
    })
}

export function removeBookmark(id: string, isFolder: boolean): Promise<void> {
    if (isPord()) {
        if (isFolder) {
            return chrome.bookmarks.removeTree(id)
        } else {
            return chrome.bookmarks.remove(id)
        }
    }
    return Promise.resolve()
}

export function createBookmark(parentId: string, title: string, url?: string, index?: number): Promise<ChromeTreeNode> {
    if (isPord()) {
        return chrome.bookmarks.create({
            parentId: parentId,
            title: title,
            url: url,
            index: index
        })
    }
    return Promise.resolve({
        id: Date.now().toString(),
        title: title,
        url: url,
        parentId: parentId,
        index: index || 0,
        dateAdded: Date.now(),
        dateGroupModified: Date.now()
    })
}

export function moveBookmark(id: string, parentId: string, index?: number): Promise<ChromeTreeNode> {
    if (isPord()) {
        return chrome.bookmarks.move(id, { parentId, index })
    }
    return Promise.resolve({
        id: id,
        title: '',
        url: '',
        parentId: parentId,
        index: index || 0,
        dateAdded: Date.now(),
        dateGroupModified: Date.now()
    })
}

export function getBookmarkTree(): Promise<ChromeTreeNode[]> {
    if (isPord()) {
        return chrome.bookmarks.getTree()
    }
    
    // 使用固定的 mock 数据
    return Promise.resolve(mockBookmarkData as ChromeTreeNode[])
}

export function getLocalStorage(key: string): Promise<string> {
    if (isPord()) {
        return chrome.storage.local.get(key).then((value: Record<string, unknown>) => {
            return (value[key] as string) || '{}'
        })
    }
    return Promise.resolve(localStorage.getItem(key) || '{}')
}

export function setLocalStorage(key: string, value: unknown): void {
    const data = JSON.stringify(value)
    if (isPord()) {
        chrome.storage.local.set({ [key]: data })
    } else {
        localStorage.setItem(key, data)
    }
}

export function clearLocalStorage(): void {
    if (isPord()) {
        chrome.storage.local.clear()
    } else {
        localStorage.clear()
    }
}
