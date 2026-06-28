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
    unExpandIds: Set<string>

    constructor(
        showColumns: number | null | undefined,
        unExpandId: Set<string> | null | undefined
    ) {
        this.showColumns = showColumns && showColumns > 0 ? showColumns : 4
        this.unExpandIds = unExpandId || new Set()
        this.editMode = false
    }

    toJSON() {
        return {
            showColumns: this.showColumns,
            unExpandId: Array.from(this.unExpandIds)
        }
    }

    static fromJSON(jsonString: string): BookmarkSetting | null {
        try {
            const jsonObject = JSON.parse(jsonString)
            return new BookmarkSetting(
                jsonObject.showColumns,
                new Set(jsonObject.unExpandId)
            )
        } catch (err) {
            console.error('parse BookmarkSetting error:', err)
            return null
        }
    }

    copy(other: BookmarkSetting) {
        this.editMode = other.editMode
        this.showColumns = other.showColumns
        this.unExpandIds = other.unExpandIds
    }
}

export type ChromeTreeNode = chrome.bookmarks.BookmarkTreeNode
