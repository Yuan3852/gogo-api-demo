import Vue from 'vue'
import App from './App.vue'
import VueResource from 'vue-resource'
import store from './store'
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
} from './store/mutation-types'

const mutations = {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
}

import VueNativeSock from 'vue-native-websocket'
import { CONST } from './store/const'
import router from './router'

Vue.config.productionTip = false

Vue.use(VueResource)

Vue.use(VueNativeSock, CONST.websocket_port, {
  store: store,
  mutations: mutations,
  reconnection: true,
  reconnectionDelay: 3000,
  format: 'json',
})

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
