<template>
  <div
    class="flat-node-row"
    :style="{ paddingLeft: flatNode.deep * TREE_INDENT_WIDTH + 'px' }"
    @contextmenu="handleContextMenu"
  >
    <div class="indent-area">
      <div
        v-for="n in flatNode.deep"
        :key="n"
        class="tree-line"
        :class="{
          'is-current-level': n === flatNode.deep,
          'is-first': flatNode.isFirstChild,
          'is-last': flatNode.isLastChild,
          'ancestor-is-last': flatNode.ancestorLastFlags[n - 1],
          'is-top-level': n === 1
        }"
        :style="{ left: (n - 1) * TREE_INDENT_WIDTH + 'px' }"
      ></div>
    </div>
    <div class="icon-area">
      <n-icon
        v-if="!flatNode.isLeaf"
        class="expand-icon"
        size="16"
        @click="toggleExpand"
      >
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path v-if="flatNode.isExpand" d="M3 4l5 8 5-8z" />
          <path v-else d="M4 3l8 5-8 5z" />
        </svg>
      </n-icon>
      <n-image
        v-else
        :src="flatNode.icon"
        lazy
        :width="16"
        :height="16"
        preview-disabled
        draggable="false"
        class="node-icon"
      />
    </div>
    <div class="content-area">
      <n-button
        size="small"
        quaternary
        :style="{
          'justify-content': 'left',
          'padding': '0 4px',
          'overflow': 'hidden',
          'background-color': flatNode.isSearchResult ? '#ecc646' : 'inherit'
        }"
        @click="handleClick"
      >
        <n-ellipsis :tooltip="{ delay: 500 }">
          {{ flatNode.title }}
        </n-ellipsis>
      </n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NImage, NButton, NIcon, NEllipsis } from 'naive-ui'
import { FlatNode, BookmarkSetting } from '@/common/type'
import { TREE_INDENT_WIDTH } from '@/common/constants'
import { openBookmark } from '@/common/chromeUtil'
import { PropType } from 'vue'

const props = defineProps({
  flatNode: {
    type: Object as PropType<FlatNode>,
    required: true
  },
  bookmarkSetting: {
    type: Object as PropType<BookmarkSetting>,
    required: true
  }
})

const emit = defineEmits<{
  (event: 'contextmenu', e: MouseEvent, node: FlatNode): void
  (event: 'toggle', node: FlatNode): void
}>()

function handleClick() {
  if (props.flatNode.isLeaf) {
    if (!props.bookmarkSetting.editMode) {
      openBookmark(props.flatNode.url)
    }
    return
  }
  toggleExpand()
}

function toggleExpand() {
  if (props.flatNode.isLeaf) return
  emit('toggle', props.flatNode)
}

function handleContextMenu(e: MouseEvent) {
  if (props.bookmarkSetting.editMode) {
    e.preventDefault()
    emit('contextmenu', e, props.flatNode)
  }
}
</script>

<style scoped>
.flat-node-row {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 4px;
  transition: background-color 0.2s ease, outline 0.15s ease;
  cursor: default;
  position: relative;
  overflow: hidden;
}

.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
  border-radius: 4px;
}

.content-area:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.content-area :deep(.n-button) {
  width: 100%;
  max-width: 100%;
}

.content-area :deep(.n-button:hover) {
  background-color: transparent !important;
}

.indent-area {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  pointer-events: none;
}

.icon-area {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}

.expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #666;
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}

.node-icon {
  user-select: none;
  -webkit-user-drag: none;
}

.tree-line {
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 100%;
  pointer-events: none;
}

.tree-line::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  width: 0;
  height: 100%;
  border-left: 1px solid #ccc;
}

/* 第一列根节点下的线条始终画 */
.tree-line:first-child::before {
  height: 100%;
}

/* 中间层级且父节点是最后一个：不画向下的垂直线 */
.tree-line.ancestor-is-last:not(.is-current-level):not(:first-child)::before {
  height: 0;
}

/* 顶层辅助线（n === 1）：不显示 */
.tree-line.is-top-level::before,
.tree-line.is-top-level::after {
  display: none;
}

/* 最后一个子节点：竖线只画上半截（└ 形） */
.tree-line.is-current-level.is-last::before {
  height: 50%;
}

/* 当前层级的水平线 */
.tree-line.is-current-level::after {
  content: '';
  position: absolute;
  left: 10px;
  top: 50%;
  width: 10px;
  height: 0;
  border-top: 1px solid #ccc;
}
</style>
