// Simple Event Emitter adapted for Three.js Experience
export default class EventEmitter {
    callbacks: { [key: string]: { [key: string]: Function[] } }

    constructor() {
        this.callbacks = {}
        this.callbacks.base = {}
    }

    on(_names: string, callback: Function) {
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong names')
            return false
        }

        if (typeof callback === 'undefined') {
            console.warn('wrong callback')
            return false
        }

        const names = _names.split(' ')

        for (const _name of names) {
            const name = this.resolveName(_name)

            if (!(this.callbacks[name.namespace] instanceof Object))
                this.callbacks[name.namespace] = {}

            if (!(this.callbacks[name.namespace][name.value] instanceof Array))
                this.callbacks[name.namespace][name.value] = []

            this.callbacks[name.namespace][name.value].push(callback)
        }

        return this
    }

    off(_names: string) {
        if (typeof _names === 'undefined' || _names === '') {
            console.warn('wrong name')
            return false
        }

        const names = _names.split(' ')

        for (const _name of names) {
            const name = this.resolveName(_name)

            if (name.namespace !== 'base' && name.value === '') {
                delete this.callbacks[name.namespace]
            } else if (name.namespace === 'base') {
                for (const namespace in this.callbacks) {
                    if (this.callbacks[namespace] instanceof Object && this.callbacks[namespace][name.value] instanceof Array) {
                        delete this.callbacks[namespace][name.value]
                        if (Object.keys(this.callbacks[namespace]).length === 0)
                            delete this.callbacks[namespace]
                    }
                }
            } else if (this.callbacks[name.namespace] instanceof Object && this.callbacks[name.namespace][name.value] instanceof Array) {
                delete this.callbacks[name.namespace][name.value]
                if (Object.keys(this.callbacks[name.namespace]).length === 0)
                    delete this.callbacks[name.namespace]
            }
        }

        return this
    }

    trigger(_name: string, _args?: any[]) {
        if (typeof _name === 'undefined' || _name === '') {
            console.warn('wrong name')
            return false
        }

        let finalResult: any = null
        let result = null

        const args = !(_args instanceof Array) ? [] : _args
        const name = this.resolveNames(_name)

        const nameValue = this.resolveName(name[0])

        if (nameValue.namespace === 'base') {
            for (const namespace in this.callbacks) {
                if (this.callbacks[namespace] instanceof Object && this.callbacks[namespace][nameValue.value] instanceof Array) {
                    for (const callback of this.callbacks[namespace][nameValue.value]) {
                        result = callback.apply(this, args)
                        if (typeof finalResult === 'undefined') {
                            finalResult = result
                        }
                    }
                }
            }
        } else if (this.callbacks[nameValue.namespace] instanceof Object) {
            if (nameValue.value === '') {
                console.warn('wrong name')
                return this
            }
            if (this.callbacks[nameValue.namespace][nameValue.value] instanceof Array) {
                for (const callback of this.callbacks[nameValue.namespace][nameValue.value]) {
                    result = callback.apply(this, args)
                    if (typeof finalResult === 'undefined')
                        finalResult = result
                }
            }
        }

        return finalResult
    }

    resolveNames(_names: string) {
        let names = _names
        names = names.replace(/[^a-zA-Z0-9 ,/.]/g, '')
        names = names.replace(/[,/]+/g, ' ')
        return names.split(' ')
    }

    resolveName(name: string) {
        const parts = name.split('.')
        return {
            original: name,
            value: parts[0],
            namespace: parts.length > 1 && parts[1] !== '' ? parts[1] : 'base'
        }
    }
}
