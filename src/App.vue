<template>
  <n-dialog-provider>
    <n-message-provider>
      <BookMarks />
    </n-message-provider>
  </n-dialog-provider>
</template>

<script lang="ts" setup>
import { NDialogProvider, NMessageProvider } from 'naive-ui'
import BookMarks from '@/components/BookMarks.vue'
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 5px;
}
</style>
