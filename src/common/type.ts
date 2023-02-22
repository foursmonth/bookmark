export interface Setting {
    showColumns: number,
    expandedDeep: number,
    defaultExpandId: string[],
    defaultUnExpandId: string[]
}

export interface TreeNode {
    id: string,
    title: string,
    url: string,
    childrens: TreeNode[],
    isLeaf: boolean,
    isExpand: boolean,
    icon: string,
    deep: number,
    isSearchResult: boolean,
}