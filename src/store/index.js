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
      message: 'disconnected',
      reconnectError: false,
      respond: 0,
      respondSize: 0
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
      if (message.stream != undefined) {
        let x = message.stream
        if(x[0] == 20){
          let size = parseInt(x[1])
          state.socket.respondSize = size
          console.log("This is the size in side store: " + state.socket.respondSize)
          x.splice(0,3)
          console.log("in")
          state.socket.respond = x
        }
        state.socket.message = message.stream
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
  },
  actions: {
    sendWS: function (context, data) {
      Vue.prototype.$socket.sendObj({
        'type': 'rawHID',
        'data': data
      })
    },
  },
  modules: {
  },
  getters: {
    gogoReport: state => state.socket.message,
    boardStatus: state => state.board.status,
    gogoRespond: state => state.socket.respond,
    gogoRespondSize: state => state.socket.respondSize
  }
})
