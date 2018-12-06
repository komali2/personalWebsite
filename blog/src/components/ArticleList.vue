<template>
  <div class="article-list">
    <h1>This is an article list page</h1>
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

@Component({
  components: {
    ArticleListItem,
  },
  data: () => {
    return {
      articles: [
        {
          title: 'articleone',
          text: 'lotsofMDN articleONE',
        },
        {
          title: 'articletwo',
          text: 'lotsofMDN articletwo',
        },
      ],
    };
  },
})

export default class ArticleList extends Vue {}
</script>
