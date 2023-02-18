<template>
  <div>
    <n-space justify="end">
      <n-input v-model:value="search" placeholder="Filter">
        <template #prefix>
          <n-icon size="20">
            <search />
          </n-icon>
        </template>
      </n-input>
      <!-- <template #prefix>
            <n-switch v-model:value="searchMode">
              <template #checked>
                展示搜索无关的节点
              </template>
              <template #unchecked>
                隐藏搜索无关的节点
              </template>
            </n-switch>
          </template> -->
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
                <n-input-number v-model:value="settings.showColumns" :min="1" />
              </n-grid-item>
            </n-grid>
            <n-grid cols="4">
              <n-grid-item span="1" style="display: flex;align-items:center;">
                <div>最大展开深度</div>
              </n-grid-item>
              <n-grid-item span="3">
                <n-input-number v-model:value="settings.maxExpandedDeep" :min="0" />
              </n-grid-item>
            </n-grid>
          </n-space>
          <template #footer>
            <n-button @click="saveSettings">
              保存
            </n-button>
          </template>
        </n-drawer-content>
      </n-drawer>
    </n-space>
    <n-grid style="width: 100%;" :cols="settings.showColumns">
      <n-grid-item v-for="(itemData,index) in data" :key="index" span="1">
        <n-tree :data="[itemData]" :block-line=true :block-node=true :default-expanded-keys="settings.defaultExpandedKeys"
          :node-props="handleAction" class="grid-item"
          :show-irrelevant-nodes="searchMode" :pattern="search" :filter="treeNodeFilter" />
      </n-grid-item>
    </n-grid>
  </div>
</template>
<script lang="ts">
import { defineComponent, h, ref, watch,reactive } from "vue";
import { TreeOption, NTree, NGrid, NGridItem, NInputGroup, NInput, NInputNumber, NSwitch, NIcon, NButton, NDrawer, NDrawerContent, NSpace, NText, NImage } from "naive-ui";
import { Search, SettingsOutline, Close } from '@vicons/ionicons5'
import mockBookMarks from '../../mock/MockData'
const SETTINGS = "SETTINGS"
type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
const data = ref<MyTreeOption[]>();
const rowDataList = ref<BookmarkTreeNode[]>()

const bookMarsDataOk = ref(false)
const localStorageDataOk = ref(false)

const urlTemplate = ref('')

const search = ref<string>('')
const searchMode = ref(false)

interface MyTreeOption extends TreeOption {
  deep: number,
  url?: string,
}

const defaultSettings = {
  defaultExpandedKeys: <string[]>[],
  showColumns: 8,
  maxExpandedDeep: 4,
  backgroundColorGroupNumber:2,
  backgroundColorDeep:4,
  backgroundColorGroups:[
    ['#FFF0F5','#FFE4E1','#FFB6C1','#FF69B4'],
    ['#FFFFF0','#FFF5EE','#FFEFD5','#FFDAB9']
  ],
}
let settings = reactive(defaultSettings)


// -------------------- mock data----------------------------------------------

const mockBookMarksData: BookmarkTreeNode[] = mockBookMarks;
const mockLocalStorageData = null
const MODE = ref("DEV")
// -------------------- mock data------------------------------------------------

// ------------------ handle bookmark data----------------------------
function getRowDataList(rowData: BookmarkTreeNode[]): BookmarkTreeNode[] {
  let data1: BookmarkTreeNode = rowData![0]!.children![0];
  let data2: BookmarkTreeNode = rowData![0]!.children![1];
  return data1.children?.concat(data2 || []) || [];
}

function buildTreeOption(rowData: BookmarkTreeNode, deep: number): MyTreeOption {
  let children: MyTreeOption[] = [];
  for (let i = 0; rowData.children && i < rowData.children.length; i++) {
    children.push(buildTreeOption(rowData.children[i], deep + 1))
  }
  return {
    key: rowData.id,
    label: rowData.title,
    children: children,
    isLeaf: (children.length == 0),
    deep: deep,
    url: rowData.url,
    prefix: (children.length == 0) ? () =>
      h(
        NImage,
        { src: urlTemplate.value + '?pageUrl=' + rowData.url + '&size=16' }
      )
      : undefined
  };
}
// ------------------ handle bookmark data----------------------------

// ------------------- handle local storage --------------------------
function initDefaultExpandedKeys() {
  console.log('#1',settings.defaultExpandedKeys.toString())
  if (settings.defaultExpandedKeys.length != 0) {
    return
  }
  for (let i = 0; rowDataList.value && i < rowDataList.value.length; ++i) {
    buildDefaultExpandedKeys(rowDataList.value[i], 0);
  }
}
function buildDefaultExpandedKeys(rowData: BookmarkTreeNode, deep: number) {
  if (deep < settings.maxExpandedDeep) {
    settings.defaultExpandedKeys.push(rowData.id)
  }
  for (let i = 0; rowData.children && i < rowData.children.length; i++) {
    buildDefaultExpandedKeys(rowData.children[i], deep + 1)
  }
}
// ------------------- handle local storage --------------------------

// ------------------------ get chrome data-----------------------------------------
function getChromeBookMarksData(result: BookmarkTreeNode[]) {
  const rowData: BookmarkTreeNode[] = result;
  rowDataList.value = getRowDataList(rowData);
  data.value = [];
  for (let i = 0; i < rowDataList.value.length; ++i) {
    data.value.push(buildTreeOption(rowDataList.value[i], 0));
  }
  console.log("#data", data)
  bookMarsDataOk.value = true
}
function getChromeLocalStorageData(result: { [key: string]: any }) {
  console.log("#local stroage", result[SETTINGS])
  if (result[SETTINGS]){
      settings=result[SETTINGS]
  }
  localStorageDataOk.value = true
}
function getChromeData() {
  if (MODE.value == "DEV") {
    urlTemplate.value = 'chrome://favicon/'
    getChromeBookMarksData(mockBookMarksData)
    getChromeLocalStorageData({ SETTINGS: mockLocalStorageData })
    return
  }
  urlTemplate.value = new URL(chrome.runtime.getURL("/_favicon/")).toString()
  chrome.bookmarks.getTree(getChromeBookMarksData);
  chrome.storage.local.get(SETTINGS).then(getChromeLocalStorageData)
}
// ------------------------ get chrome data-----------------------------------------



// ----------------------------- action function --------------------------------------
function handleAction({ option }: { option: MyTreeOption }) {
  return {
    onClick() {
      if (option.isLeaf && option.url) {
        window.location.href = option.url
        return
      }
      let index = settings.defaultExpandedKeys.indexOf(option.key!.toString())
      if (index != -1) {
        settings.defaultExpandedKeys.splice(index, 1)
      }
      else {
        settings.defaultExpandedKeys.push(option.key!.toString())
      }
    },
    // style:getGridItemStyle(option,0)
  }
}
function getGridItemStyle(item: MyTreeOption, index:number) {
  return {
    backgroundColor: settings.backgroundColorGroups
    [index%settings.backgroundColorGroupNumber]
    [item.deep<=settings.backgroundColorDeep?item.deep:settings.backgroundColorDeep-1],
  }
}

watch(() => bookMarsDataOk && localStorageDataOk, (newval, oldval) => {
  if (bookMarsDataOk && localStorageDataOk) {
    initDefaultExpandedKeys()
  }
}, { deep: true })

function treeNodeFilter(pattern: string, node: MyTreeOption) {
  return node.label!.includes(pattern) || ((node.url) || '').includes(pattern)
}
function saveSettings(){
  chrome.storage.local.set({SETTINGS:settings})
}
function reSetSettings(){
  chrome.storage.local.remove(SETTINGS)
  settings=defaultSettings
}

export default defineComponent({
  components: {
    NTree,
    NGrid,
    NGridItem,
    NInputGroup,
    NInput,
    NInputNumber,
    NSwitch,
    NIcon,
    NButton,
    Search,
    SettingsOutline,
    NDrawerContent,
    NDrawer,
    Close,
    NSpace,
    NText,
    NImage
  },
  setup() {
    getChromeData();
    initDefaultExpandedKeys();
    return {
      data,
      handleAction,
      getGridItemStyle,
      search,
      searchMode,
      settingActive: ref(false),
      treeNodeFilter,
      settings,
      saveSettings,
      reSetSettings
    };
  },
});
</script>
<style>
.grid-item {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
  padding: 3px;
}
.n-tree .n-tree-node-wrapper{
  padding: 0 0 !important;
}
</style>