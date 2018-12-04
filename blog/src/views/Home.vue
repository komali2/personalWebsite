<template>
  <main class="home">
    <header>
      <h1>
        <small>This is</small>
        Caleb's Blog
      </h1>
      <h3>
        <small>
          Updated: <time datetime="2018-12-3">Dec, 2018</time>
        </small>
      </h3>
    </header>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {
  },
})
export default class Home extends Vue {}
</script>
