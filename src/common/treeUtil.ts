import { ChromeTreeNode, BookmarkSetting, TreeNode, FlatNode } from '@/common/type'
import { getIconUrl } from '@/common/chromeUtil'

export function getTreeNodeIds(root: TreeNode): string[] {
    const ids: string[] = [root.id]  // 包含根节点本身
    root.children.forEach(son => ids.push(...getTreeNodeIds(son)))
    return ids
}

export function shouldBeExpanded(bookmarkSetting: BookmarkSetting, node: TreeNode): boolean {
    return _shouldBeExpanded(bookmarkSetting, node.id, node.deep)
}

function _shouldBeExpanded(bookmarkSetting: BookmarkSetting, id: string, _deep: number): boolean {
    return !bookmarkSetting.unExpandIds.has(id)
}

export function buildTreeNode(rowData: ChromeTreeNode, bookmarkSetting: BookmarkSetting, deep: number): TreeNode {
    const children: TreeNode[] = []
    rowData.children?.forEach(child => children.push(buildTreeNode(child, bookmarkSetting, deep + 1)))
    
    return {
        id: rowData.id,
        parentId: rowData.parentId ?? '',
        title: rowData.title,
        url: rowData.url ?? '',
        index: rowData.index ?? 0,
        children: children,
        isLeaf: !!rowData.url,
        isExpand: _shouldBeExpanded(bookmarkSetting, rowData.id, deep),
        isSearchResult: false,
        icon: getIconUrl(rowData.url),
        deep: deep
    }
}

/**
 * 标记搜索命中。大小写不敏感、忽略首尾空格。
 * 返回该节点或其子树内是否存在命中项。
 * matchedFolderIds 会收集“子树内含命中项”的文件夹 id，用于搜索时临时展开命中路径。
 */
export function dfsSearch(root: TreeNode, searchString: string, matchedFolderIds?: Set<string>): boolean {
    const keyword = searchString.trim().toLowerCase()
    const selfMatch = keyword !== '' && (
        root.title.toLowerCase().includes(keyword) || root.url.toLowerCase().includes(keyword)
    )
    root.isSearchResult = selfMatch

    let childMatched = false
    root.children.forEach(son => {
        if (dfsSearch(son, searchString, matchedFolderIds)) childMatched = true
    })

    const subtreeMatched = selfMatch || childMatched
    if (subtreeMatched && root.children.length > 0) {
        matchedFolderIds?.add(root.id)
    }
    return subtreeMatched
}

/** 树中是否存在任意命中项（不依赖可能被折叠裁剪的 flatList） */
export function hasSearchMatch(root: TreeNode): boolean {
    if (root.isSearchResult) return true
    return root.children.some(hasSearchMatch)
}

/** 按 id 设置某个节点的展开状态（搜索临时展开/还原用） */
export function setNodeExpand(root: TreeNode, id: string, isExpand: boolean): boolean {
    if (root.id === id) {
        root.isExpand = isExpand
        return true
    }
    return root.children.some(son => setNodeExpand(son, id, isExpand))
}

export function flattenTree(root: TreeNode): FlatNode[] {
    const result: FlatNode[] = []
    let flatIndex = 0

    function walk(node: TreeNode, isFirst = false, isLast = false, ancestorLastFlags: boolean[] = []) {
        result.push({
            id: node.id,
            parentId: node.parentId,
            title: node.title,
            url: node.url,
            deep: node.deep,
            isLeaf: node.isLeaf,
            isExpand: node.isExpand,
            isSearchResult: node.isSearchResult,
            icon: node.icon,
            childCount: node.children.length,
            flatIndex: flatIndex++,
            raw: node,
            isFirstChild: isFirst,
            isLastChild: isLast,
            ancestorLastFlags: [...ancestorLastFlags, isLast]
        })
        if (node.isExpand && node.children.length > 0) {
            const lastIndex = node.children.length - 1
            const newAncestorFlags = [...ancestorLastFlags, isLast]
            node.children.forEach((child, index) => walk(child, index === 0, index === lastIndex, newAncestorFlags))
        }
    }

    walk(root, true, true)
    return result
}

export function isDescendant(flatList: FlatNode[], ancestorId: string, candidateId: string, ancestorFlatIndex?: number): boolean {
    if (ancestorId === candidateId) return true
    const flatIndex = ancestorFlatIndex ?? flatList.find(n => n.id === ancestorId)?.flatIndex
    if (flatIndex === undefined) return false

    const ancestorDeep = flatList[flatIndex].deep
    let idx = flatIndex + 1
    while (idx < flatList.length) {
        const current = flatList[idx]
        if (current.deep <= ancestorDeep) break
        if (current.id === candidateId) return true
        idx++
    }
    return false
}

export function getVisibleChildren(flatList: FlatNode[], folderFlatIndex: number): FlatNode[] {
    const folder = flatList[folderFlatIndex]
    if (!folder || folder.isLeaf) return []

    const children: FlatNode[] = []
    let idx = folderFlatIndex + 1
    while (idx < flatList.length && flatList[idx].deep > folder.deep) {
        children.push(flatList[idx])
        idx++
    }
    return children
}
