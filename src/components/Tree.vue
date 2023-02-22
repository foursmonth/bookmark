<template>
  <div v-if="true" style="width: 100%;">
    <n-layout v-if="data" :style="{ 'display': data.isSearchResult ? '' : 'none' }">
      <n-button size="small" quaternary style="width: 100%; justify-content:left ; padding: 0%;"
        @click="clickAction(data)">
        <template #default>
          {{ data.title }}
        </template>
        <template #icon>
          <n-image v-if="data.isLeaf" :src="data.icon" lazy :width="16" :height="16" preview-disabled />
          <n-icon v-else :size="16" :class="data.isExpand ? '' : 'rotate'">
            <chevron-down />
          </n-icon>
        </template>
      </n-button>
      <transition name="sub-tree">
        <n-layout has-sider v-if="!data.isLeaf" :style="{ 'display': data.isExpand ? '' : 'none' }">
          <n-layout-sider :width="17" style="padding: 0;">
            <n-divider vertical style="height: 100%;" />
          </n-layout-sider>
          <n-layout-content content-style="witdh:100%">
            <div v-for=" children in data.childrens">
              <tree :data="children" :setting="props.setting" />
            </div>
          </n-layout-content>
        </n-layout>
      </transition>
    </n-layout>
  </div>
</template>
<script lang="ts" setup>
import { NImage, NLayout, NDivider, NLayoutContent, NLayoutSider, NButton, NIcon } from "naive-ui";
import { ChevronDown } from "@vicons/ionicons5"
import { TreeNode, Setting } from '@/common/type'
import { isShouldDefaultExpand,deleteElement } from '@/common/function'
import { PropType, ref } from "vue";
const props = defineProps({
  data: {
    type: Object as PropType<TreeNode>,
    required: true
  },
  setting: {
    type: Object as PropType<Setting>,
    required: true
  },
})
function clickAction(node: TreeNode) {
  if (node.isLeaf) {
    window.location.href = node.url
  } else {
    if (node.isExpand) {
      node.isExpand = false;
      if (isShouldDefaultExpand(node.deep, props.setting.expandedDeep)) {
        // if (!props.setting.defaultUnExpandId) props.setting.defaultUnExpandId = new Set();
        props.setting.defaultUnExpandId.push(node.id)
        console.log(JSON.stringify(props.setting.defaultUnExpandId))
      } else {
        deleteElement(props.setting.defaultExpandId,node.id)
      }
    } else {
      node.isExpand = true;
      if (isShouldDefaultExpand(node.deep, props.setting.expandedDeep)) {
        deleteElement(props.setting.defaultUnExpandId,node.id)
      } else {
        // if (!props.setting.defaultExpandId) props.setting.defaultExpandId = new Set();
        props.setting.defaultExpandId.push(node.id)
        console.log(JSON.stringify(props.setting.defaultExpandId))
      }
    }
  }
}
const data = ref<TreeNode>(props.data);
</script>
<style scoped>
.rotate {
  transform: rotate(-90deg);
  -webkit-transform: rotate(-90deg);
  -moz-transform: rotate(-90deg);
  -o-transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
}
</style>