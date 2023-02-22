export function isShouldDefaultExpand(nodeDeep: number, expandDeep: number): boolean {
    return expandDeep < 0 ? true : nodeDeep < expandDeep
};
export function deleteElement(list: string[], item: string) {
    let index = list.indexOf(item)
    if (index >= 0 && list.length > 0) {
        list.splice(index,1)
    }
}