<template>
  <Content/>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Content from './components/Content.vue'

@Options({
  components: {
    Content,
  },
})
export default class App extends Vue {}
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
