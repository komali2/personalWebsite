<template>
  <main class="article">
    <header>
      <h1>
        {{title}}
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

@Component({
  components: {
  },
})
export default class Article extends Vue {}
</script>
