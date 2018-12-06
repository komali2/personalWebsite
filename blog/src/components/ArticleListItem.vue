<template>
  <li class="article-list-item">
      <a :href=title>{{title}}</a>
  </li>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';

@Component({
    props: ['text', 'title'],
})
export default class ArticleListItem extends Vue {}
</script>
