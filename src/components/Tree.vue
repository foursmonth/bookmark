<template>
  <div v-if="true" style="width: 100%;">
    <n-layout v-if="data">
      <n-layout-header>颐和园路</n-layout-header>
      <n-layout has-sider v-if="data.childrens.length">
        <n-layout-sider content-style="width:20px;">
          <n-divider vertical />
        </n-layout-sider>
        <n-layout-content content-style="witdh:100%">
          <div v-for=" children in data.childrens" >
              <tree :data="children" />
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>
<script lang="ts">
import { NSpace, NImage, NLayout, NDivider, NLayoutContent, NLayoutHeader, NLayoutSider } from "naive-ui";
import { TreeNode } from '@/type/TreeNode'
import { PropType } from "vue";
export default {
  name: "tree",
  components: {
    NLayout,
    NSpace,
    NDivider
  },
  props: {
    data: Object as PropType<TreeNode>
  },
  setup() {
    return {
    }
  }
}
</script>