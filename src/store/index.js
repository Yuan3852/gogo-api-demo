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

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false,
    },
    board: {
      status: false
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
      state.socket.message = message
      if (message != undefined && message.ping != null)
        state.board.status = true
    },
    // mutations for reconnect methods
    [SOCKET_RECONNECT](state, count) {
      console.info(state, count)
      state.board.status = false
    },
    [SOCKET_RECONNECT_ERROR](state) {
      state.socket.reconnectError = true;
    },
  },
  actions: {
    sendMessageWS: function (context, message) {
      Vue.prototype.$socket.send(message)
    }
  },
  modules: {
  },
  getters: {
    gogoReport: state => state.socket.message,
    boardStatus: state => state.board.status
  }
})
