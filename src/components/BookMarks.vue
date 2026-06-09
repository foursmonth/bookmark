<template>
  <n-space justify="end" :wrap="false" style="width: 100%; align-items: center;">
    <n-input v-model:value="searchQuery" placeholder="Filter" :on-change="onSearch" clearable @clear="performSearch" @keydown.escape="searchQuery = ''; performSearch()" style="width: 200px;">
      <template #prefix>
        <n-icon size="20">
          <search />
        </n-icon>
      </template>
    </n-input>
    <n-switch v-model:value="bookmarkSetting.editMode" style="height: 100%">
      <template #checked>
        编辑模式
      </template>
      <template #unchecked>
        使用模式
      </template>
    </n-switch>
    <n-button @click="uiState.settingDrawer = true">
      <template #icon>
        <n-icon size="20">
          <settings-outline />
        </n-icon>
      </template>
    </n-button>
  </n-space>
  
  <n-collapse-transition :show="bookmarkSetting.editMode">
    <n-alert type="info" style="margin-top: 8px;">
      右键点击 → 编辑 / 新增 / 删除　｜　拖拽 → 调整位置　｜　按 ESC → 取消拖拽
    </n-alert>
  </n-collapse-transition>
  
  <n-spin v-if="!loadingState.bookmarks || !loadingState.settings" style="display: flex; justify-content: center; margin-top: 80px;" />

  <template v-else-if="columns.length === 0">
    <n-empty description="暂无书签" style="margin-top: 80px;" />
  </template>

  <template v-else-if="searchQuery && !hasSearchResult">
    <n-empty description="未找到匹配的书签" style="margin-top: 80px;" />
  </template>

  <div v-else class="bookmark-grid-container">
    <n-grid :cols="bookmarkSetting.showColumns" :x-gap="16" :y-gap="16">
      <n-grid-item v-for="col in columns" :key="col.rootId" span="1">
        <div 
          class="bookmark-column"
          :data-col-id="col.rootId"
          :class="{
            'dragging-in-progress': dragState.active,
            'drop-column-end': dragState.active && dragState.dropTarget?.type === 'column-end' && dragState.dropTarget.colId === col.rootId
          }"
          @dragover.prevent="onColumnDragOver($event, col.rootId)"
          
          @drop.prevent="onColumnDrop($event, col.rootId)"
        >
          <VueDraggable
            v-model="col.flatList"
            :group="dragGroup"
            ghost-class="drag-ghost"
            chosen-class="drag-chosen"
            drag-class="drag-dragging"
            :disabled="!bookmarkSetting.editMode"
            :animation="150"
            :force-fallback="true"
            :fallback-on-body="true"
            :fallback-tolerance="3"
            :scroll-sensitivity="60"
            :scroll-speed="15"
            :on-move="onDragMove"
            @start="onDragStart"
            @end="onDragEnd"
          >
            <div
              v-for="item in col.flatList"
              :key="item.id"
              :data-id="item.id"
              :class="{
                'drag-child-item': dragState.active && dragState.childIds.has(item.id),
                'drop-target-inside': dragState.active && dragState.dropTarget?.type === 'node' && dragState.dropTarget?.id === item.id && dragState.dropTarget.position === 'inside',
                'drop-target-below': dragState.active && dragState.dropTarget?.type === 'node' && dragState.dropTarget?.id === item.id && dragState.dropTarget.position === 'below',
              }"
            >
              <FlatNodeRow
                :flat-node="item"
                :bookmark-setting="bookmarkSetting"
                @contextmenu="handleContextMenu"
                @toggle="handleToggle"
              />
              <div
                v-if="dragState.active && dragState.dropTarget?.type === 'node' && dragState.dropTarget?.id === item.id && dragState.dropTarget.position === 'below'"
                class="drop-indicator-line"
                :style="{
                  marginLeft: item.deep * TREE_INDENT_WIDTH + 'px',
                  width: `calc((100% - ${item.deep * TREE_INDENT_WIDTH}px) * ${DROP_ZONE_COLUMN_RATIO})`
                }"
              ></div>
            </div>
          </VueDraggable>
          
          <!-- Column end drop zone (right edge) -->
          <div 
            v-if="dragState.active"
            class="column-drop-zone column-drop-end"
            :class="{ 'active': dragState.dropTarget?.type === 'column-end' && dragState.dropTarget.colId === col.rootId }"
          >
            <span v-if="dragState.dropTarget?.type === 'column-end' && dragState.dropTarget.colId === col.rootId">放到此处</span>
          </div>
        </div>
      </n-grid-item>
    </n-grid>
  </div>

  <n-drawer v-model:show="uiState.settingDrawer" :width="500" @update:show="onSettingDrawerChange">
    <n-drawer-content>
      <template #header>
        设置
      </template>
      <n-space vertical>
        <n-grid cols="4">
          <n-grid-item span="1" style="display: flex; align-items: center;">
            <div>展示列数</div>
          </n-grid-item>
          <n-grid-item span="3">
            <n-input-number v-model:value="bookmarkSetting.showColumns" :min="1" />
          </n-grid-item>
        </n-grid>
        <n-grid cols="4">
          <n-grid-item span="1" style="display: flex; align-items: center;">
            <div>最大展开深度</div>
          </n-grid-item>
          <n-grid-item span="3">
            <n-input-number v-model:value="bookmarkSetting.expandDeep" :min="0" />
          </n-grid-item>
        </n-grid>
      </n-space>
    </n-drawer-content>
  </n-drawer>

  <n-modal v-model:show="uiState.editModal" title="编辑" preset="card" style="width: fit-content;">
    <template v-if="editData">
      <n-grid cols="8" :x-gap="10" :y-gap="10">
        <n-grid-item span="1" style="align-content: center;">
          Title
        </n-grid-item>
        <n-grid-item span="7">
          <n-input ref="editTitleInputRef" v-model:value="editData.title" />
        </n-grid-item>
        <template v-if="editData.isLeaf">
          <n-grid-item span="1" style="align-content: center;">
            Url
          </n-grid-item>
          <n-grid-item span="7">
            <n-input v-model:value="editData.url" />
          </n-grid-item>
        </template>
        <n-grid-item span="2" offset="6">
          <n-button @click="saveEdit">
            保存
          </n-button>
        </n-grid-item>
      </n-grid>
    </template>
  </n-modal>

  <n-modal v-model:show="uiState.addModal" title="新增" preset="card" style="width: fit-content;">
    <n-grid cols="8" :x-gap="10" :y-gap="10">
      <n-grid-item span="1" style="align-content: center;">
        Title
      </n-grid-item>
      <n-grid-item span="7">
        <n-input v-model:value="addData.title" />
      </n-grid-item>
      <template v-if="!addData.isFolder">
        <n-grid-item span="1" style="align-content: center;">
          Url
        </n-grid-item>
        <n-grid-item span="7">
          <n-input v-model:value="addData.url" placeholder="留空则为文件夹" />
        </n-grid-item>
      </template>
      <n-grid-item span="2" offset="6">
        <n-button @click="saveAdd">
          保存
        </n-button>
      </n-grid-item>
    </n-grid>
  </n-modal>

  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="contextMenuData.x"
    :y="contextMenuData.y"
    :options="contextMenuOptions"
    :show="contextMenuData.show"
    :on-clickoutside="hideContextMenu"
    @select="handleContextMenuSelect"
  />
</template>

<script lang="ts" setup>
import FlatNodeRow from '@/components/FlatNodeRow.vue'
import { BookmarkSetting, TreeNode, ChromeTreeNode, FlatNode, ColumnData, DropPosition, DropType, DropTarget, DragState } from '@/common/type'
import { TREE_INDENT_WIDTH, DROP_ZONE_COLUMN_RATIO, DROP_POSITION_Y_RATIO, MAX_DRAG_PREVIEW_CHILDREN, DRAG_PREVIEW_INDENT_WIDTH } from '@/common/constants'
import { getTreeNodeIds, buildTreeNode, dfsSearch, flattenTree, isDescendant, getVisibleChildren } from '@/common/treeUtil'
import { getBookmarkTree, getLocalStorage, setLocalStorage, updateBookmark, removeBookmark, createBookmark, moveBookmark } from '@/common/chromeUtil'
import { intersectionToTarget, debounce } from '@/common/util'
import { NGrid, NGridItem, NSpace, NDrawer, NDrawerContent, NButton, NIcon, NInputNumber, NInput, NSwitch, NModal, NDropdown, NCollapseTransition, NAlert, NSpin, NEmpty } from 'naive-ui'
import type { InputInst } from 'naive-ui'
import { useDialog, useMessage } from 'naive-ui'
import { onMounted, onBeforeUnmount, ref, reactive, computed, watch, nextTick } from 'vue'
import { SettingsOutline, Search } from '@vicons/ionicons5'
import { VueDraggable } from 'vue-draggable-plus'
import type { SortableEvent } from 'sortablejs'

const data = ref<TreeNode[]>([])
const bookmarkSetting = reactive(new BookmarkSetting(null, null, null, null))
const dialog = useDialog()
const message = useMessage()

const dragGroup = { name: 'bookmarks', pull: true, put: true }

const loadingState = reactive({
  bookmarks: false,
  settings: false
})

const uiState = reactive({
  settingDrawer: false,
  editModal: false,
  addModal: false
})

const editingDialogOpen = ref(false)

watch(bookmarkSetting.editMode, (newVal, oldVal) => {
  if (newVal && !oldVal && !editingDialogOpen.value) {
    editingDialogOpen.value = true
    dialog.warning({
      title: '进入编辑模式',
      content: '编辑模式下可右键编辑、拖拽排序书签。确认进入？',
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => {
        editingDialogOpen.value = false
      },
      onNegativeClick: () => {
        bookmarkSetting.editMode = false
        editingDialogOpen.value = false
      }
    })
  }
})

const searchQuery = ref('')

const editData = ref<FlatNode | null>(null)
const editTitleInputRef = ref<InputInst | null>(null)
const addData = reactive({
  parentId: '',
  title: '',
  url: '',
  index: undefined as number | undefined,
  isFolder: false
})
const contextMenuData = reactive({
  show: false,
  x: 0,
  y: 0,
  node: null as FlatNode | null
})

const columns = ref<ColumnData[]>([])
const flatNodeIndex = ref<Map<string, { node: FlatNode; col: ColumnData }>>(new Map())

const hasSearchResult = computed(() => {
  if (!searchQuery.value) return true
  return columns.value.some(col => col.flatList.some(n => n.isSearchResult))
})

function rebuildColumns() {
  columns.value = data.value.map(treeNode => ({
    rootId: treeNode.id,
    flatList: flattenTree(treeNode),
    treeNode
  }))
  
  // Build index for O(1) lookup
  const index = new Map<string, { node: FlatNode; col: ColumnData }>()
  for (const col of columns.value) {
    for (const node of col.flatList) {
      index.set(node.id, { node, col })
    }
  }
  flatNodeIndex.value = index
}

watch(bookmarkSetting.editMode, (newVal, oldVal) => {
  if (newVal && !oldVal && dialog) {
    dialog.warning({
      title: '进入编辑模式',
      content: '编辑模式下可右键编辑、拖拽排序书签。确认进入？',
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: () => {
        // proceed
      },
      onNegativeClick: () => {
        bookmarkSetting.editMode = false
      }
    })
  }
})

watch(data, rebuildColumns, { deep: true })

const contextMenuOptions = computed(() => {
  const node = contextMenuData.node
  if (!node) return []

  const isTopLevel = node.deep === 1
  const above = isTopLevel ? '左侧' : '上方'
  const below = isTopLevel ? '右侧' : '下方'
  const options: Array<{ label: string; key: string } | { type: string; key: string }> = [
    {
      label: `在${above}新增文件夹`,
      key: 'addFolderAbove'
    },
    {
      label: `在${above}新增书签`,
      key: 'addBookmarkAbove'
    },
    {
      label: `在${below}新增文件夹`,
      key: 'addFolderBelow'
    },
    {
      label: `在${below}新增书签`,
      key: 'addBookmarkBelow'
    }
  ]

  if (!node.isLeaf) {
    options.push(
      { type: 'divider', key: 'd2' },
      { label: '在内部新增文件夹', key: 'addFolderInside' },
      { label: '在内部新增书签', key: 'addBookmarkInside' }
    )
  }

  options.push(
    { type: 'divider', key: 'd1' },
    { label: '修改', key: 'edit' },
    { label: '删除', key: 'delete' }
  )

  return options
})

function handleContextMenu(e: MouseEvent, node: FlatNode) {
  contextMenuData.show = true
  contextMenuData.x = e.clientX
  contextMenuData.y = e.clientY
  contextMenuData.node = node
}

function hideContextMenu() {
  contextMenuData.show = false
  contextMenuData.node = null
}

function handleContextMenuSelect(key: string) {
  if (!contextMenuData.node) return

  const node = contextMenuData.node
  hideContextMenu()

  const addParentId = node.deep === 1 ? node.raw.parentId : node.parentId

  switch (key) {
    case 'addFolderAbove':
      openAddDialog(addParentId, undefined, node.raw.index)
      break
    case 'addBookmarkAbove':
      openAddDialog(addParentId, '', node.raw.index)
      break
    case 'addFolderBelow':
      openAddDialog(addParentId, undefined, node.raw.index + 1)
      break
    case 'addBookmarkBelow':
      openAddDialog(addParentId, '', node.raw.index + 1)
      break
    case 'addFolderInside':
      openAddDialog(node.id, undefined, node.raw.children.length)
      break
    case 'addBookmarkInside':
      openAddDialog(node.id, '', node.raw.children.length)
      break
    case 'edit':
      handleEdit(node)
      break
    case 'delete':
      handleDelete(node)
      break
  }
}

function openAddDialog(parentId: string, defaultUrl: string | undefined, index: number) {
  addData.parentId = parentId
  addData.title = ''
  addData.url = defaultUrl || ''
  addData.index = index
  addData.isFolder = defaultUrl === undefined
  uiState.addModal = true
}

function handleEdit(node: FlatNode) {
  uiState.editModal = true
  editData.value = JSON.parse(JSON.stringify(node))
  nextTick(() => {
    editTitleInputRef.value?.focus()
  })
}

function handleToggle() {
  rebuildColumns()
  persistSetting()
}

function refreshData() {
  getBookmarkTree().then(treeNodes => handleBookMarksData(treeNodes, bookmarkSetting))
}

async function saveEdit() {
  if (!editData.value) return

  const updates: { title?: string; url?: string } = {
    title: editData.value.title
  }

  if (editData.value.isLeaf) {
    updates.url = editData.value.url
  }

  try {
    await updateBookmark(editData.value.id, updates)
    refreshData()
    uiState.editModal = false
    message.success('修改成功')
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    message.error(`修改失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

function handleDelete(node: FlatNode) {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除「${node.title}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await removeBookmark(node.id, !node.isLeaf)
        refreshData()
        message.success('删除成功')
      } catch (error) {
        console.error('Failed to remove bookmark:', error)
        message.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  })
}

async function saveAdd() {
  if (!addData.title) return

  try {
    await createBookmark(addData.parentId, addData.title, addData.url || undefined, addData.index)

    uiState.addModal = false
    refreshData()
    message.success('新增成功')
  } catch (error) {
    console.error('Failed to create bookmark:', error)
    message.error(`新增失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

function handleBookMarksData(result: ChromeTreeNode[], setting: BookmarkSetting) {
  const bookmarkBarChildren = result[0].children?.[0]?.children || []
  const otherBookmarksChildren = result[0].children?.[1]?.children || []
  const chromeDatas = bookmarkBarChildren.concat(otherBookmarksChildren)
  const newData = chromeDatas.map(item => buildTreeNode(item, setting, 1))
  data.value = newData
  loadingState.bookmarks = true
}

function handleBookMarksSetting(settingData: string) {
  const localStorageSetting = BookmarkSetting.fromJSON(settingData)
  if (localStorageSetting) {
    bookmarkSetting.copy(localStorageSetting)
  }
  loadingState.settings = true
}

function performSearch() {
  data.value.forEach(son => dfsSearch(son, searchQuery.value))
}

const onSearch = debounce(performSearch, 300)

function getChromeData() {
  getLocalStorage('bookmarkSetting')
    .then(setting => handleBookMarksSetting(setting))
    .then(() => getBookmarkTree())
    .then(treeNodes => handleBookMarksData(treeNodes, bookmarkSetting))
}

function persistSetting() {
  data.value.forEach(node => {
    const existsIds = getTreeNodeIds(node)
    intersectionToTarget(bookmarkSetting.expandIds, existsIds)
    intersectionToTarget(bookmarkSetting.unExpandIds, existsIds)
  })
  setLocalStorage('bookmarkSetting', bookmarkSetting)
}

function onSettingDrawerChange(show: boolean) {
  if (!show) {
    persistSetting()
  }
}

const dragState = reactive<DragState>({
  active: false,
  cancelled: false,
  draggedId: '',
  draggedNode: null,
  childIds: new Set(),
  dropTarget: null
})

function onDragStart(evt: SortableEvent) {
  // Clear any existing text/element selection
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
  }

  const draggedEl = evt.item as HTMLElement
  const draggedId = draggedEl.getAttribute('data-id')
  if (!draggedId) return

  const entry = flatNodeIndex.value.get(draggedId)
  if (!entry) return
  const draggedNode = entry.node
  const sourceCol = entry.col

  dragState.active = true
  dragState.draggedId = draggedId
  dragState.draggedNode = draggedNode
  dragState.dropTarget = null

  // Collect visible child IDs in the flat list
  const childIds = new Set<string>()
  if (!draggedNode.isLeaf) {
    const flatIndex = sourceCol.flatList.findIndex(n => n.id === draggedId)
    const children = getVisibleChildren(sourceCol.flatList, flatIndex)
    children.forEach(c => childIds.add(c.id))
  }
  dragState.childIds = childIds

  // Modify the fallback element to show complete subtree preview
  requestAnimationFrame(() => {
    setTimeout(() => {
      const fallback = document.querySelector('.sortable-fallback') as HTMLElement
      if (!fallback || !draggedNode || !sourceCol) return

      // 清空 fallback 原有内容，重新构建完整的子树预览
      fallback.innerHTML = ''
      fallback.className = 'sortable-fallback drag-subtree-container'

      // 创建父节点行
      const parentRow = document.createElement('div')
      parentRow.className = 'drag-preview-parent'
      const parentIcon = draggedNode.isLeaf ? '🔗' : (draggedNode.isExpand ? '📂' : '📁')
      parentRow.innerHTML = `
        <span class="drag-preview-icon">${parentIcon}</span>
        <span class="drag-preview-title">${draggedNode.title}</span>
      `
      fallback.appendChild(parentRow)

      // 如果有子节点，添加子树预览
      if (!draggedNode.isLeaf && childIds.size > 0) {
        const flatIndex = sourceCol.flatList.findIndex(n => n.id === draggedId)
        const children = getVisibleChildren(sourceCol.flatList, flatIndex)
        
        const subtreeContainer = document.createElement('div')
        subtreeContainer.className = 'drag-preview-children'
        
        const maxPreview = MAX_DRAG_PREVIEW_CHILDREN
        children.slice(0, maxPreview).forEach(child => {
          const childRow = document.createElement('div')
          childRow.className = 'drag-preview-child'
          // 计算缩进：每个层级 16px
          const indentLevel = child.deep - draggedNode.deep
          const childIcon = child.isLeaf ? '🔗' : (child.isExpand ? '📂' : '📁')
          childRow.innerHTML = `
            <span class="drag-preview-indent" style="width: ${indentLevel * DRAG_PREVIEW_INDENT_WIDTH}px;"></span>
            <span class="drag-preview-icon">${childIcon}</span>
            <span class="drag-preview-title">${child.title}</span>
          `
          subtreeContainer.appendChild(childRow)
        })
        
        if (children.length > maxPreview) {
          const moreRow = document.createElement('div')
          moreRow.className = 'drag-preview-more'
          moreRow.innerHTML = `<span class="drag-preview-more-text">... 还有 ${children.length - maxPreview} 项</span>`
          subtreeContainer.appendChild(moreRow)
        }
        
        fallback.appendChild(subtreeContainer)
      }
      
      // 修复 SortableJS 设置的固定高度限制
      fallback.style.height = 'auto'
      fallback.style.minHeight = 'auto'
      fallback.style.maxHeight = '400px'
    }, 0)
  })
}

function detectDropZone(
  element: HTMLElement,
  clientX: number
): { zone: 'node' | 'column-end'; colId: string } | null {
  const column = element.closest('.bookmark-column') as HTMLElement | null
  if (!column) return null

  const colId = column.getAttribute('data-col-id')
  if (!colId) return null

  const columnRect = column.getBoundingClientRect()
  const relativeX = clientX - columnRect.left

  // Find a FlatNodeRow to determine the tree-line padding width
  const row = column.querySelector('.flat-node-row') as HTMLElement | null
  if (!row) return null

  const paddingLeft = parseFloat(row.style.paddingLeft) || 0

  const contentWidth = columnRect.width - paddingLeft
  if (contentWidth <= 0) return null

  const contentRelativeX = relativeX - paddingLeft
  const ratio = contentRelativeX / contentWidth

  if (ratio > DROP_ZONE_COLUMN_RATIO) {
    return { zone: 'column-end', colId }
  }

  return { zone: 'node', colId }
}

function moveToColumnEdge(draggedId: string, dropTarget: DropTarget) {
  const targetCol = columns.value.find(c => c.rootId === dropTarget.colId)
  if (!targetCol) return false

  const parentId = targetCol.treeNode.parentId
  const colIndex = targetCol.treeNode.index
  // column-end means insert after this column
  const newIndex = colIndex + 1

  moveBookmark(draggedId, parentId, newIndex)
    .then(() => {
      refreshData()
      persistSetting()
    })
    .catch((error) => {
      console.error('Failed to move bookmark:', error)
      message.error(`移动失败: ${error instanceof Error ? error.message : '未知错误'}`)
      refreshData()
    })

  return true
}

function computeDropPosition(
  relatedEl: HTMLElement,
  mouseY: number,
  relatedNode: FlatNode
): DropPosition {
  const rect = relatedEl.getBoundingClientRect()
  const relativeY = (mouseY - rect.top) / rect.height

  // Insert inside folder in upper half, otherwise insert below
  if (relativeY < DROP_POSITION_Y_RATIO && !relatedNode.isLeaf) return 'inside'
  return 'below'
}

function onDragMove(evt: {
  dragged: HTMLElement
  related: HTMLElement
  to: HTMLElement
  from: HTMLElement
  originalEvent?: Event
}): boolean | -1 {
  const draggedId = evt.dragged.getAttribute('data-id')
  const relatedId = evt.related.getAttribute('data-id')

  if (!draggedId || !relatedId || draggedId === relatedId) {
    dragState.dropTarget = null
    return true
  }

  // Check if mouse is near column right edge (X-direction)
  const originalEvt = evt.originalEvent as MouseEvent | undefined
  if (originalEvt) {
    const result = detectDropZone(evt.to, originalEvt.clientX)
    if (result?.zone === 'column-end') {
      if (dragState.dropTarget?.type !== 'column-end' || dragState.dropTarget.colId !== result.colId) {
        dragState.dropTarget = { type: 'column-end', colId: result.colId }
      }
      return true
    }
    
  }

  // Fast O(1) lookup via flatNodeIndex
  const relatedEntry = flatNodeIndex.value.get(relatedId)
  if (!relatedEntry) {
    dragState.dropTarget = null
    return true
  }
  const relatedNode = relatedEntry.node
  const targetFlatList = relatedEntry.col.flatList

  // Prevent dropping into own subtree (cycle)
  const draggedEntry = flatNodeIndex.value.get(draggedId)
  const draggedInSameCol = draggedEntry?.col === relatedEntry.col
  const draggedFlatIndex = draggedInSameCol && draggedEntry ? draggedEntry.node.flatIndex : undefined
  if (isDescendant(targetFlatList, draggedId, relatedId, draggedFlatIndex)) {
    dragState.dropTarget = null
    return false
  }

  // Can't drop inside a leaf
  if (dragState.draggedId === relatedId) {
    dragState.dropTarget = null
    return true
  }

  // Compute drop position from mouse Y
  const mouseY = (evt.originalEvent as MouseEvent)?.clientY ?? 0
  const position = computeDropPosition(evt.related, mouseY, relatedNode)

  dragState.dropTarget = { type: 'node', id: relatedId, position }

  // Always return true to allow SortableJS to reorder DOM visually
  // We handle the actual move in onDragEnd based on dropTarget state
  return true
}

function onDragEnd(evt: SortableEvent) {
  const draggedId = (evt.item as HTMLElement).getAttribute('data-id')

  // Clean up fallback subtree preview
  const fallback = document.querySelector('.sortable-fallback')
  if (fallback) fallback.remove()

  // Check if drag was cancelled by ESC key
  if (dragState.cancelled) {
    resetDragState()
    refreshData()
    return
  }

  if (!draggedId || !dragState.draggedNode) {
    resetDragState()
    return
  }

  const dropTarget = dragState.dropTarget
  const draggedNode = dragState.draggedNode

  // Handle column drop zone (column-end) - insert as sibling column after
  if (dropTarget?.type === 'column-end') {
    moveToColumnEdge(draggedId, dropTarget)
    resetDragState()
    return
  }

  // Determine target column from the drop container
  const toContainer = evt.to as HTMLElement
  const colId = toContainer.closest?.('[data-col-id]')?.getAttribute('data-col-id')
  let targetCol: ColumnData | null = null
  if (colId) {
    targetCol = columns.value.find(c => c.rootId === colId) || null
  }
  if (!targetCol) {
    // Fallback: try from drop target id
    if (dropTarget?.id) {
      for (const col of columns.value) {
        if (col.flatList.some(n => n.id === dropTarget.id)) {
          targetCol = col
          break
        }
      }
    }
  }
  if (!targetCol) {
    resetDragState()
    refreshData()
    return
  }

  // No valid drop target → append to end
  if (!dropTarget || dropTarget.type !== 'node') {
    moveBookmark(draggedId, targetCol.treeNode.id, targetCol.treeNode.children.length)
      .then(() => { refreshData(); persistSetting() })
      .catch((error) => {
        console.error('Failed to move bookmark:', error)
        message.error(`移动失败: ${error instanceof Error ? error.message : '未知错误'}`)
        refreshData()
      })
    resetDragState()
    return
  }

  // Find the drop target node
  const targetNode = targetCol.flatList.find(n => n.id === dropTarget.id)
  if (!targetNode) {
    resetDragState()
    refreshData()
    return
  }

  let newParentId: string
  let newIndex: number

  if (dropTarget.position === 'inside') {
    newParentId = targetNode.id
    newIndex = targetNode.raw.children.length
  } else { // below
    newParentId = targetNode.deep === 1 ? targetCol.treeNode.id : targetNode.parentId
    newIndex = targetNode.raw.index + 1
  }

  resetDragState()

  // Skip if position hasn't actually changed
  if (newParentId === draggedNode.parentId && newIndex === draggedNode.raw.index) return

  moveBookmark(draggedId, newParentId, newIndex)
    .then(() => {
      refreshData()
      persistSetting()
    })
    .catch((error) => {
      console.error('Failed to move bookmark:', error)
      message.error(`移动失败: ${error instanceof Error ? error.message : '未知错误'}`)
      refreshData()
    })
}

// Column drag handlers for drop zones at column edges
function onColumnDragOver(evt: DragEvent, colId: string) {
  if (!dragState.active) return

  const result = detectDropZone(evt.target as HTMLElement, evt.clientX)
  if (!result) return

  if (result.zone === 'column-end') {
    if (dragState.dropTarget?.type !== 'column-end' || dragState.dropTarget.colId !== colId) {
      dragState.dropTarget = { type: 'column-end', colId }
    }
    return
  }

  // If over a bookmark item, let SortableJS handle node-level positioning
  const itemEl = (evt.target as HTMLElement).closest('[data-id]')
  if (itemEl) return
}



function onColumnDrop(evt: DragEvent, colId: string) {
  const dropTarget = dragState.dropTarget
  
  if (!dropTarget || !dragState.draggedNode) {
    resetDragState()
    return
  }
  
  if (dropTarget.type === 'column-end') {
    if (dropTarget.colId === colId) {
      moveToColumnEdge(dragState.draggedId, dropTarget)
    }
  }
  
  resetDragState()
}

function resetDragState() {
  dragState.active = false
  dragState.cancelled = false
  dragState.draggedId = ''
  dragState.draggedNode = null
  dragState.childIds = new Set()
  dragState.dropTarget = null
}

function handleEscKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dragState.active) {
    dragState.cancelled = true
    message.info('拖拽已取消')
    // Force end the drag by dispatching a mouseup event
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
  getChromeData()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<style scoped>
.bookmark-grid-container {
  margin-top: 4px;
  overflow: hidden;
}

.bookmark-grid-container :deep(.n-grid) {
  align-items: start !important;
}

.bookmark-grid-container :deep(.n-grid-item) {
  height: auto !important;
  align-self: start !important;
  min-width: 0;
}

.bookmark-column {
  padding: 16px 0;
  border: none;
  border-radius: 8px;
  position: relative;
  min-width: 0;
  overflow: hidden;
}
</style>

<style>
/* SortableJS ghost (placeholder in the list) */
.drag-ghost {
  opacity: 0;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  overflow: hidden;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}

/* Original element while being dragged */
.drag-chosen {
  opacity: 0.15;
}

/* Element following cursor (forceFallback) */
.drag-dragging {
  opacity: 0.95;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  background: #fff;
  max-height: 300px;
  overflow: hidden;
}

/* SortableJS fallback element (drag preview) */
.sortable-fallback {
  opacity: 0.7 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.45) !important;
  max-height: 400px !important;
  overflow: hidden !important;
  min-width: 200px !important;
  max-width: 320px !important;
  display: block !important;
  padding: 8px 0 !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* 拖拽预览容器 */
.drag-subtree-container {
  display: flex !important;
  flex-direction: column !important;
}

/* 拖拽预览 - 父节点 */
.drag-preview-parent {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 4px 12px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #333 !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: rgba(250, 250, 250, 0.4) !important;
}

/* 拖拽预览 - 子节点容器 */
.drag-preview-children {
  display: flex !important;
  flex-direction: column !important;
  padding: 2px 0 !important;
}

/* 拖拽预览 - 子节点行 */
.drag-preview-child {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 3px 12px !important;
  font-size: 13px !important;
  color: #555 !important;
  white-space: nowrap !important;
}

/* 拖拽预览 - 缩进 */
.drag-preview-indent {
  display: inline-block !important;
  flex-shrink: 0 !important;
}

/* 拖拽预览 - 图标 */
.drag-preview-icon {
  font-size: 13px !important;
  flex-shrink: 0 !important;
}

/* 拖拽预览 - 标题 */
.drag-preview-title {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* 拖拽预览 - 更多提示 */
.drag-preview-more {
  padding: 4px 12px !important;
  font-size: 12px !important;
  color: #999 !important;
  font-style: italic !important;
}

.drag-preview-more-text {
  padding-left: 8px !important;
}

/* Child items of the dragged folder — hidden during drag */
.drag-child-item {
  display: none;
}

/* Drop target — "inside" position: folder highlight */
.drop-target-inside .flat-node-row {
  background-color: rgba(24, 144, 255, 0.12) !important;
  border-radius: 4px;
  outline: 2px dashed #1890ff;
  outline-offset: -2px;
}

/* Drop indicator line — "above" / "below" positions */
.drop-indicator-line {
  height: 2px;
  background: #1890ff;
  border-radius: 1px;
  margin: 0 4px 0;
}

/* Column drop zones - positioned at left/right edges */
.column-drop-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  overflow: hidden;
}

.column-drop-zone.active {
  width: 50px;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed #1890ff;
  border-radius: 4px;
}

.column-drop-zone.active span {
  writing-mode: vertical-rl;
  color: #1890ff;
  font-size: 13px;
}

.column-drop-end {
  right: 0;
}

/* Column highlight for drop target */
.bookmark-column.drop-column-end {
  border-right: 3px solid #1890ff !important;
}
</style>
