<template>
  <Dropdown
    :options="options"
    :disabled="false"
    v-on:selected="validateSelection"
    v-on:filter="getDropdownValues"
    name="channels"
    :maxItem="10"
    placeholder="Please select an option">
  </Dropdown>
</template>

<script>
import Dropdown from 'vue-simple-search-dropdown'

export default {
  name: "DropVue",
  components:{
    Dropdown
  },
  props: {
    options: {
      type: Array,
      require: true,
      default: [],
    }
  },
  data (){
    return {
      selected: []
    }
  },
  methods: {
    validateSelection(selection) {
    this.selected = selection;
    console.log(selection+' has been selected');
    },
    getDropdownValues(keyword) {
    console.log('You could refresh options by querying the API with '+keyword);
    },
  }

}
</script>
