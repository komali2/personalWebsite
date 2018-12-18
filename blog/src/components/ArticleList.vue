<template>
  <div class="article-list">
      <article-list-item
        v-for="article in articles"
        v-bind="article"
        v-bind:key="article.title"
      ></article-list-item>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';
import ArticleListItem from '@/components/ArticleListItem.vue';
import articles from '@/articleIndex.ts';

@Component({
  components: {
    ArticleListItem,
  },
  data: () => {
    return {
      articles,
    };
  },
})

export default class ArticleList extends Vue {}
</script>
