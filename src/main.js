import Vue from 'vue'
import App from './App.vue'
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

Vue.config.productionTip = false

Vue.use(VueNativeSock, 'ws://localhost:8317', {
  store: store,
  mutations: mutations,
  reconnection: true,
  reconnectionDelay: 3000,
  format: 'json',
})

new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
