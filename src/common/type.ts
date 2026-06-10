import { DEFAULT_SHOW_COLUMNS, DEFAULT_EXPAND_DEEP } from './constants'

export interface TreeNode {
    id: string
    parentId: string
    title: string
    url: string
    index: number
    children: TreeNode[]
    isLeaf: boolean
    isExpand: boolean
    isSearchResult: boolean
    icon: string
    deep: number
}

export interface FlatNode {
    id: string
    parentId: string
    title: string
    url: string
    deep: number
    isLeaf: boolean
    isExpand: boolean
    isSearchResult: boolean
    icon: string
    childCount: number
    flatIndex: number
    raw: TreeNode
    isFirstChild: boolean
    isLastChild: boolean
    ancestorLastFlags: boolean[]
}

export interface ColumnData {
    rootId: string
    flatList: FlatNode[]
    treeNode: TreeNode
}

export type DropPosition = 'above' | 'inside' | 'below'

export type DropTarget =
    | { type: 'node'; id: string; position: DropPosition; colId: string }
    | { type: 'column-end'; colId: string }

export interface DragState {
    active: boolean
    cancelled: boolean
    draggedId: string
    draggedNode: FlatNode | null
    childIds: Set<string>
    dropTarget: DropTarget | null
}

export class BookmarkSetting {
    editMode: boolean
    showColumns: number
    expandDeep: number
    expandIds: Set<string>
    unExpandIds: Set<string>

    constructor(
        showColumns: number | null | undefined,
        expandDeep: number | null | undefined,
        unExpandId: Set<string> | null | undefined,
        expandIds: Set<string> | null | undefined
    ) {
        this.showColumns = showColumns && showColumns > 0 ? showColumns : DEFAULT_SHOW_COLUMNS
        this.expandDeep = expandDeep && expandDeep >= 0 ? expandDeep : DEFAULT_EXPAND_DEEP
        this.expandIds = expandIds || new Set()
        this.unExpandIds = unExpandId || new Set()
        this.editMode = false
    }

    toJSON() {
        return {
            showColumns: this.showColumns,
            expandDeep: this.expandDeep,
            expandIds: Array.from(this.expandIds),
            unExpandId: Array.from(this.unExpandIds)
        }
    }

    static fromJSON(jsonString: string): BookmarkSetting | null {
        try {
            const jsonObject = JSON.parse(jsonString)
            return new BookmarkSetting(
                jsonObject.showColumns,
                jsonObject.expandDeep,
                new Set(jsonObject.unExpandId),   // unExpandId → 第3个参数
                new Set(jsonObject.expandIds)    // expandIds → 第4个参数
            )
        } catch (err) {
            console.error('parse BookmarkSetting error:', err)
            return null
        }
    }

    copy(other: BookmarkSetting) {
        this.editMode = other.editMode
        this.showColumns = other.showColumns
        this.expandDeep = other.expandDeep
        this.expandIds = other.expandIds
        this.unExpandIds = other.unExpandIds
    }
}

export type ChromeTreeNode = chrome.bookmarks.BookmarkTreeNode
