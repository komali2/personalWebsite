<template>
  <main class="article">
    <header>
      <h1>
        {{$route.params.title}}
      </h1>
      <h3>
        <small>
          Updated: <time :datetime=timestamp>{{human_time}}</time>
        </small>
      </h3>
    </header>
    <div>
      {{text}}
    </div>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import articles from '../articleIndex';

@Component({
    data: () => {
        return {
            timestamp: 'loading...',
            human_time: 'loading...',
            text: 'loading...',
        };
    },
    mounted: function() {
      let article = articles.find((article) => {
        return article.filename = this.$route.params.title;
      });
      if (article) {
        this.text = article.text;
        this.human_time = article.published;
        this.timestamp = article.timestamp;
      } else {
        this.text = `Could not find articld ${this.$route.params.title}`;
      }
    }
})
export default class Article extends Vue {}
</script>
