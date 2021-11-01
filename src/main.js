import Vue from 'vue'
import App from './App.vue'
import VueResource from 'vue-resource'
import store from './store'
import {
  HID_ONCONNECT,
  HID_ONDISCONNECT,
  HID_ONERROR,
  HID_ONINPUTREPORT,
  HID_RECONNECT,
  HID_RECONNECT_ERROR
} from './store/mutation-types'

const mutations = {
  HID_ONCONNECT,
  HID_ONDISCONNECT,
  HID_ONERROR,
  HID_ONINPUTREPORT,
  HID_RECONNECT,
  HID_RECONNECT_ERROR
}

// import VueNativeSock from 'vue-native-websocket'
import { CONST } from '@/store/const'
import router from '@/router'
import HIDDevice from './plugins/webhid-plugin/hid-devices'

Vue.config.productionTip = false

Vue.use(VueResource)

Vue.use(HIDDevice, {
  hid_vid: CONST.hid_vid,
  hid_pid: CONST.hid_pid,
}, {
  store: store,
  mutations: mutations,
  reconnection: true,
  reconnectionDelay: 2000,
  format: "json",
  connectManually: true
})

// Vue.use(VueNativeSock, CONST.websocket_port, {
//   store: store,
//   mutations: mutations,
//   reconnection: true,
//   reconnectionDelay: 3000,
//   format: 'json',
// })

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')
