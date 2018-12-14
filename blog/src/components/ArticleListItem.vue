<template>
  <li class="article-list-item">
      <router-link :to="`/article/${link}`">{{title}}</router-link>
  </li>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';

@Component({
    props: ['text', 'title', 'link'],
})
export default class ArticleListItem extends Vue {}
</script>
