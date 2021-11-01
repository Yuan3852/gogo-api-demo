import Vue from 'vue'
import Vuex from 'vuex'
import {
  HID_ONCONNECT,
  HID_ONDISCONNECT,
  HID_ONERROR,
  HID_ONINPUTREPORT,
  HID_RECONNECT,
  HID_RECONNECT_ERROR
} from './mutation-types.js'
import { CONST } from './const'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    socket: {
      isConnected: false,
      message: 'disconnected',
      reconnectError: false
    },
    board: {
      status: false
    },
    response: {
      command: 0,
      data: 0,
      size: 0,
      status: 0
    }
  },
  mutations: {
    [HID_ONCONNECT](state, event) {
      Vue.prototype.$webhid = event.currentTarget
      state.socket.isConnected = true
      state.board.status = false
      console.log(HID_ONCONNECT)
    },
    [HID_ONDISCONNECT](state, event) {
      state.socket.isConnected = false
      state.board.status = false
      console.log(HID_ONDISCONNECT);
    },
    [HID_ONERROR](state, event) {
      console.error(state, event)
    },
    [HID_ONINPUTREPORT](state, message) {
      if (message != undefined) {
        if (message[0] == CONST.response_packet_type) {
          state.response.size = message[1]
          state.response.command = message[2]
          state.response.status = message[3]
          state.response.data = message.filter(function (value, index) { return index > 3; })
        }
        else {
          state.socket.message = message
        }
        if (!state.board.status)
          state.board.status = true
      }
      else {
        if (state.board.status) {
          state.board.status = false
          state.socket.message = "disconnected"
        }
      }
    },
    // mutations for reconnect methods
    [HID_RECONNECT](state, count) {
      console.info(state, count)
      state.board.status = false
    },
    [HID_RECONNECT_ERROR](state) {
      state.socket.reconnectError = true;
    },
    clear_response_socket(state) {
      state.response.size = 0
      state.response.status = 0
      state.response.data = 0
      state.response.command = 0
    }
  },
  actions: {
    connectDevice: function (context) {
      Vue.prototype.$webhidConnect()
    },
    sendHID: async function (context, data) {
      let sendData = data.slice(1)
      console.log(sendData);
      let arraybuf = new ArrayBuffer(sendData.length)
      arraybuf.buffer = sendData
      await Vue.prototype.$webhid.sendReport(0, arraybuf)
    },
    clearResponseHID: function (context) {
      context.commit('clear_response_socket')
    }
  },
  modules: {
  },
  getters: {
    gogoReport: state => state.socket.message,
    gogoResponse: state => state.response,
    boardStatus: state => state.board.status,
  }
})

