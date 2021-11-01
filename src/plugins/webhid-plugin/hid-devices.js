import Observer from './observer'
import Emitter from './emitter'

export default {
    install(Vue, hid_id, hid_opts = {}) {
        if (!hid_id && !hid_opts.connectManually) { throw new Error('[gogo-hid-device] cannot locate connection') }

        let observer = null

        hid_opts.$setInstance = (hidInstance) => {
            Vue.prototype.$webhid = hidInstance
        }

        if (hid_opts.connectManually) {
            Vue.prototype.$webhidConnect = (device_id = hid_id, device_opts = hid_opts) => {
                device_opts.$setInstance = hid_opts.$setInstance
                observer = new Observer(device_id, device_opts)
                Vue.prototype.$webhid = observer.device
            }

            Vue.prototype.$webhidDisconnect = () => {
                if (observer && observer.reconnection) { observer.reconnection = false }
                if (Vue.prototype.$webhid) {
                    Vue.prototype.$webhid.close()
                    delete Vue.prototype.$webhid
                }
            }
        } else {
            observer = new Observer(hid_id, hid_opts)
            Vue.prototype.$webhid = observer.device
        }
        const hasProxy = typeof Proxy !== 'undefined' && typeof Proxy === 'function' && /native code/.test(Proxy.toString())

        Vue.mixin({
            created() {
                let vm = this
                let hids = this.$options['webhids']

                if (hasProxy) {
                    this.$options.webhids = new Proxy({}, {
                        set(target, key, value) {
                            Emitter.addListener(key, value, vm)
                            target[key] = value
                            return true
                        },
                        deleteProperty(target, key) {
                            Emitter.removeListener(key, vm.$options.webhids[key], vm)
                            delete target.key
                            return true
                        }
                    })
                    if (hids) {
                        Object.keys(hids).forEach((key) => {
                            this.$options.webhids[key] = hids[key]
                        })
                    }
                } else {

                    Object.seal(this.$options.webhids)

                    if (hids) {
                        Object.keys(hids).forEach(key => {
                            Emitter.addListener(key, hids[key], vm)
                        })
                    }
                }
            },
            beforeDestroy() {
                if (hasProxy) {
                    let hids = this.$options['webhids']

                    if (hids) {
                        Object.keys(hids).forEach((key) => {
                            delete this.$options.webhids[key]
                        })
                    }
                }
            }
        })
    }
}