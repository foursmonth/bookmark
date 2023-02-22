<template>
  <BookMarks />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import BookMarks from '@/components/BookMarks.vue'
@Options({
  components: {
    BookMarks
  },
})
export default class App extends Vue { }
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
