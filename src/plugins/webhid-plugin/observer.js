import Emitter from './emitter'

export default class {
    constructor(device_id = {}, device_opts = {}) {
        this.format = device_opts.format && device_opts.format.toLowerCase()

        this.device = null
        this.deviceId = device_id
        this.deviceOpts = device_opts

        this.reconnection = this.deviceOpts.reconnection || false
        this.reconnectionAttempts = this.deviceOpts.reconnectionAttempts || Infinity
        this.reconnectionDelay = this.deviceOpts.reconnectionDelay || 1000
        this.reconnectTimeoutId = 0
        this.reconnectionCount = 0

        this.passToStoreHandler = this.deviceOpts.passToStoreHandler || false

        this.connect(device_id, device_opts)

        //? pass user store and muations to used in class plugin
        if (device_opts.store) { this.store = device_opts.store }
        if (device_opts.mutations) { this.mutations = device_opts.mutations }
    }

    async connect(device_id) {
        const vendorId = device_id.hid_vid;
        const productId = device_id.hid_pid;

        let devices = await navigator.hid.getDevices();
        if (!devices.length) {
            console.log('request device');
            devices = await navigator.hid.requestDevice({
                filters: [{ vendorId, productId }],
            });
        }
        console.log("devices:", devices);
        if (devices.length > 1) {
            devices.forEach(device => {
                if (device.collections.length) {
                    this.device = device
                }
            });
        }
        else {
            this.device = devices[0];
        }
        if (!this.device) return;

        if (!this.device.opened) {
            await this.device.open();
        }
        console.log("device opened:", this.device);

        //? starting event handler but its register after connected so `onconnect` is not firing
        this.onEvent()
        this.deviceOpts.$setInstance(this.device)
        this.reconnectionCount = 0

        return this.device;
    }

    reconnect() {
        if (this.reconnectionCount <= this.reconnectionAttempts) {
            this.reconnectionCount++
            clearTimeout(this.reconnectTimeoutId)

            this.reconnectTimeoutId = setTimeout(async () => {
                if (this.store) { this.passToStore('HID_RECONNECT', this.reconnectionCount) }

                await this.connect(this.deviceId, this.deviceOpts)
                this.onEvent()
            }, this.reconnectionDelay)
        } else {
            if (this.store) { this.passToStore('HID_RECONNECT_ERROR', true) }
        }
    }

    onEvent() {
        ['oninputreport', 'ondisconnect', 'onconnect'].forEach((eventType) => {
            this.device[eventType] = (event) => {
                Emitter.emit(eventType, event)

                if (this.store) { this.passToStore('HID_' + eventType, event) }

                if (this.reconnection && eventType === 'onconnect') {
                    this.deviceOpts.$setInstance(event.currentTarget)
                    this.reconnectionCount = 0
                }

                if (this.reconnection && eventType === 'ondisconnect') { this.reconnect() }
            }
        })
    }

    passToStore(eventName, event) {
        if (this.passToStoreHandler) {
            this.passToStoreHandler(eventName, event, this.defaultPassToStore.bind(this))
        } else {
            this.defaultPassToStore(eventName, event)
        }
    }

    defaultPassToStore(eventName, event) {
        if (!eventName.startsWith('HID_')) { return }
        let method = 'commit'
        let target = eventName.toUpperCase()
        let msg = event
        if (this.format === 'json' && event.data) {
            msg = JSON.parse(JSON.stringify(Array.from(new Uint8Array(event.data.buffer))))
            if (msg.mutation) {
                target = [msg.namespace || '', msg.mutation].filter((e) => !!e).join('/')
            } else if (msg.action) {
                method = 'dispatch'
                target = [msg.namespace || '', msg.action].filter((e) => !!e).join('/')
            }
        }
        if (this.mutations) {
            target = this.mutations[target] || target
        }
        this.store[method](target, msg)
    }
}