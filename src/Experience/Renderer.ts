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
        const isMobile = window.innerWidth <= 1280 && 'ontouchstart' in window

        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !isMobile,             // Expensive on mobile GPUs — skip it
            alpha: true,                      // Needed for CSS3D hole-punch transparency
            logarithmicDepthBuffer: true,     // Prevents z-fighting on monitor edges
            stencil: false,                   // Not needed; disabling avoids framebuffer feedback loop
        })
        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.toneMapping = THREE.CineonToneMapping
        this.instance.toneMappingExposure = 1.75
        // Shadows are baked into textures — no need for real-time shadow maps
        this.instance.shadowMap.enabled = false

        // CLEAR TRANSPARENT: This allows the CSS3D layer behind WebGL to show through
        this.instance.setClearColor(0x000000, 0)

        this.instance.setSize(this.sizes.width, this.sizes.height)
        // Cap pixel ratio: mobile gets max 1.5 (not 3+), desktop gets max 2
        const maxDPR = isMobile ? 1.5 : 2
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR))
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
