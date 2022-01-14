<template>
  <div id="nav">
    <router-link to="/">DiexieExample</router-link> |
    <router-link to="/about">About</router-link>
  </div>

  <router-view />
</template>
<script lang="ts">
import { defineComponent } from "vue";


export default defineComponent({
  name: "Home",
  components: {},
  setup() {
    //
  },
});
</script>
<style lang="scss">
#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
