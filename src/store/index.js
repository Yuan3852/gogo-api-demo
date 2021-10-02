import Vue from 'vue'
import Vuex from 'vuex'
import {
  SOCKET_ONOPEN,
  SOCKET_ONCLOSE,
  SOCKET_ONERROR,
  SOCKET_ONMESSAGE,
  SOCKET_RECONNECT,
  SOCKET_RECONNECT_ERROR
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
    [SOCKET_ONOPEN](state, event) {
      Vue.prototype.$socket = event.currentTarget
      state.socket.isConnected = true
      state.board.status = false
      console.log(SOCKET_ONOPEN)
    },
    [SOCKET_ONCLOSE](state, event) {
      state.socket.isConnected = false
      state.board.status = false
    },
    [SOCKET_ONERROR](state, event) {
      console.error(state, event)
    },
    // default handler called for all methods
    [SOCKET_ONMESSAGE](state, message) {
      if (message.stream != undefined) {
        if (message.stream[0] == CONST.response_packet_type) {
          state.response.size = message.stream[1]
          state.response.command = message.stream[2]
          state.response.status = message.stream[3]
          state.response.data = message.stream.filter(function (value, index) { return index > 3; })
        }
        else {
          state.socket.message = message.stream
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
    [SOCKET_RECONNECT](state, count) {
      console.info(state, count)
      state.board.status = false
    },
    [SOCKET_RECONNECT_ERROR](state) {
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
    sendWS: function (context, data) {
      Vue.prototype.$socket.sendObj({
        'type': 'rawHID',
        'data': data
      })
    },
    clearResponseWS: function (context) {
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

