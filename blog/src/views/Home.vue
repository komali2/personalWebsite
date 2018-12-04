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
    <div>
      <h1>
        Articles:
      </h1>
      <article-list/>
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import ArticleList from '@/components/ArticleList.vue';

@Component({
  components: {
    ArticleList
  },
})
export default class Home extends Vue {}
</script>
