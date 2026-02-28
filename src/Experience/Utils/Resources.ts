import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import EventEmitter from './EventEmitter'

export default class Resources extends EventEmitter {
    sources: any[]
    items: { [key: string]: any }
    toLoad: number
    loaded: number
    loaders: any

    constructor(sources: any[]) {
        super()

        this.sources = sources
        this.items = {}
        this.toLoad = this.sources.length
        this.loaded = 0

        this.setLoaders()

        // If there are no sources to load, trigger ready immediately
        if (this.toLoad === 0) {
            setTimeout(() => {
                this.trigger('ready')
            })
        } else {
            this.startLoading()
        }
    }

    setLoaders() {
        this.loaders = {}

        const dracoLoader = new DRACOLoader()
        // Ensure you have copied the draco folder from three/examples/jsm/libs/draco to public/draco
        dracoLoader.setDecoderPath('/draco/')

        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.gltfLoader.setDRACOLoader(dracoLoader)
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.cubeTextureLoader = new THREE.CubeTextureLoader()
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file: any) => {
                        this.sourceLoaded(source, file)
                    }
                )
            }
        }
    }

    sourceLoaded(source: any, file: any) {
        this.items[source.name] = file

        this.loaded++

        // Trigger progress event
        this.trigger('progress', [this.loaded / this.toLoad])

        if (this.loaded === this.toLoad) {
            this.trigger('ready')
        }
    }
}
