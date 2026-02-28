import * as THREE from 'three'
import Experience from './Experience'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

export default class Renderer {
    experience: Experience
    canvas: HTMLCanvasElement
    sizes: any
    scene: THREE.Scene
    camera: any
    instance!: THREE.WebGLRenderer
    cssInstance!: CSS3DRenderer

    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        this.setInstance()
        this.setCSSInstance()
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,                      // Needed for CSS3D hole-punch transparency
            logarithmicDepthBuffer: true      // Fixes z-fighting / model glitter
        })
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.CineonToneMapping
        this.instance.toneMappingExposure = 1.75
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap

        // CLEAR TRANSPARENT: This allows the CSS3D layer behind WebGL to show through
        this.instance.setClearColor(0x000000, 0)

        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    setCSSInstance() {
        this.cssInstance = new CSS3DRenderer()
        this.cssInstance.setSize(this.sizes.width, this.sizes.height)

        // The #app element is styling z-index: 1 in style.css, so CSS3D is naturally rendered behind WebGL
        const appElement = document.querySelector('#app') as HTMLElement
        if (appElement) {
            appElement.appendChild(this.cssInstance.domElement)
        }
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)

        this.cssInstance.setSize(this.sizes.width, this.sizes.height)
    }

    update() {
        this.instance.render(this.scene, this.camera.instance)
        this.cssInstance.render(this.scene, this.camera.instance)
    }
}
