<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <img alt="gogo-logo" src="./assets/gogo-logo.png">
    <GoGoAPI msg="Welcome to GoGo API demo ..." />
  </div>
</template>

<script>
import GoGoAPI from "./components/GoGoAPI.vue";

export default {
  name: "App",
  components: {
    GoGoAPI,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
