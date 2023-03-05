<template>
  <n-space justify="end">
    <n-input v-model:value="searchString" placeholder="Filter" :on-change="onSearch">
      <template #prefix>
        <n-icon size="20">
          <search />
        </n-icon>
      </template>
    </n-input>
    <n-button @click="settingActive = true">
      <template #icon>
        <n-icon size="20">
          <settings-outline />
        </n-icon>
      </template>
    </n-button>
    <n-drawer v-model:show="settingActive" :width="502">
      <n-drawer-content>
        <template #header>
          设置
        </template>
        <n-space vertical>
          <n-grid cols="4">
            <n-grid-item span="1" style="display: flex;align-items:center;">
              <div>展示列数</div>
            </n-grid-item>
            <n-grid-item span="3">
              <n-input-number v-model:value="setting.showColumns" :min="1" />
            </n-grid-item>
          </n-grid>
          <n-grid cols="4">
            <n-grid-item span="1" style="display: flex;align-items:center;">
              <div>最大展开深度</div>
            </n-grid-item>
            <n-grid-item span="3">
              <n-input-number v-model:value="setting.expandedDeep" :min="0" />
            </n-grid-item>
          </n-grid>
        </n-space>
        <template #footer>
          <n-button @click="deleteSetting">
            清除配置
          </n-button>
          <n-button @click="saveSetting">
            保存
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </n-space>
  <n-grid style="width: 100%;" :cols="setting.showColumns" v-if="dataStatus.bookMarks && dataStatus.setting">
    <n-grid-item v-for="(itemData, index) in data" :key="index" span="1">
      <tree :data="itemData" :setting="setting" />
    </n-grid-item>
  </n-grid>
</template>
  
<script lang="ts" setup>
import Tree from '@/components/Tree.vue'
import { TreeNode, Setting } from '@/common/type';
import { isShouldDefaultExpand } from '@/common/function'
import { NGrid, NGridItem, NSpace, NDrawer, NDrawerContent, NButton, NIcon, NInputNumber, NInput } from 'naive-ui';
import { onMounted, ref, watch, reactive, toRef, toRaw, toRefs } from 'vue';
import { SettingsOutline, Search } from '@vicons/ionicons5';
type ChromeTreeNode = chrome.bookmarks.BookmarkTreeNode;
const data = ref<TreeNode[]>([]);
const urlTemplate = new URL(chrome.runtime.getURL("/_favicon/")).toString();
const setting = reactive<Setting>({
  showColumns: 4,
  expandedDeep: 4,
  defaultExpandId: [],
  defaultUnExpandId: [],
})
const dataStatus = ref({
  bookMarks: false,
  setting: false,
})
const searchString = ref<string>('')
const settingActive = ref<boolean>(false)



function doClearSearch(data: TreeNode) {
  data.isSearchResult = true;
  for (let i = 0; i < data.childrens.length; ++i) {
    doClearSearch(data.childrens[i])
  }
}
function doDfsSearch(data: TreeNode, search: string): boolean {
  data.isSearchResult = data.title.includes(search) || data.url.includes(search)
  if (!data.isLeaf) {
    if (data.isSearchResult) {
      doClearSearch(data)
    } else {
      for (let i = 0; i < data.childrens.length; ++i) {
        data.isSearchResult = doDfsSearch(data.childrens[i], search) || data.isSearchResult
      }
    }
  }
  return data.isSearchResult;
}
function onSearch(search: string) {
  for (let i = 0; data.value && i < data.value.length; ++i) {
    doDfsSearch(data.value[i], search);
  }
}
function loadExpandSetting() {
  for (let i = 0; data.value && i < data.value.length; ++i) {
    expandBySetting(data.value[i]);
  }
}
function expandBySetting(data: TreeNode) {
  if (setting.defaultExpandId.indexOf(data.id) != -1) {
    data.isExpand = true;
  } else if (setting.defaultUnExpandId.indexOf(data.id) != -1) {
    data.isExpand = false;
  } else {
    data.isExpand = isShouldDefaultExpand(data.deep, setting.expandedDeep);
  }
  if (!data.isLeaf) {
    for (let i = 0; i < data.childrens.length; ++i) {
      expandBySetting(data.childrens[i])
    }
  }
}

function getChromeBookMarksData(result: ChromeTreeNode[]) {
  const list = (result![0]!.children![0].children || []).concat(result![0]!.children![1] || []);
  for (let i = 0; list && i < list.length; ++i) {
    data.value.push(buildTreeOption(list[i], 1));
  }
  dataStatus.value.bookMarks = true;
}

function buildTreeOption(rowData: ChromeTreeNode, deep: number): TreeNode {
  let childrens: TreeNode[] = [];
  for (let i = 0; rowData.children && i < rowData.children.length; i++) {
    childrens.push(buildTreeOption(rowData.children[i], deep + 1))
  }
  return {
    id: rowData.id,
    title: rowData.title,
    url: rowData.url || '',
    childrens: childrens,
    isLeaf: childrens.length == 0,
    isExpand: true,
    icon: urlTemplate + '?pageUrl=' + rowData.url + '&size=16',
    deep: deep,
    isSearchResult: true
  };
}
function getChromeLocalStorageData(value: { [key: string]: any; }) {
  let storageSetting: Setting = JSON.parse(value['setting'] || '{}');
  if (storageSetting) {
    setting.showColumns = storageSetting.showColumns || 4;
    setting.expandedDeep = storageSetting.expandedDeep || 4;
    setting.defaultExpandId = storageSetting.defaultExpandId || []
    setting.defaultUnExpandId = storageSetting.defaultUnExpandId || []
    dataStatus.value.setting = true
  }
}
function getChromeData() {
  chrome.bookmarks.getTree(getChromeBookMarksData);
  chrome.storage.local.get("setting").then(getChromeLocalStorageData)
}
function findExistsIds(data: TreeNode, newIds: string[], oldIds: string[]) {
  if (oldIds.indexOf(data.id) != -1) newIds.push(data.id)
  if (!data.isLeaf) {
    for (let i = 0; i < data.childrens.length; ++i) {
      findExistsIds(data.childrens[i], newIds, oldIds)
    }
  }
}
function saveSetting() {
  const newDefaultExpandId: string[] = [];
  const newDefaultUnExpandId: string[] = [];
  for (let i = 0; data.value && i < data.value.length; ++i) {
    findExistsIds(data.value[i], newDefaultExpandId, setting.defaultExpandId)
    findExistsIds(data.value[i], newDefaultUnExpandId, setting.defaultUnExpandId)
  }
  chrome.storage.local.set({ 'setting': JSON.stringify(setting) })
}
function deleteSetting() {
  chrome.storage.local.clear()
}
watch(
  () => dataStatus,
  () => {
    if (dataStatus.value.bookMarks && dataStatus.value.setting) loadExpandSetting();
  },
  { deep: true }
)
onMounted(
  getChromeData,
)
</script>
  
<style></style>
  