import * as THREE from 'three'
import Experience from './Experience'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
    experience: Experience
    sizes: any
    scene: THREE.Scene
    canvas: HTMLCanvasElement
    instance!: THREE.PerspectiveCamera
    controls!: OrbitControls

    constructor() {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas

        this.setInstance()
        this.setControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(35, this.sizes.width / this.sizes.height, 0.1, 100)
        // Default position
        this.instance.position.set(6, 4, 8)
        this.scene.add(this.instance)
    }

    setControls() {
        // Wait briefly for app container to be ready 
        setTimeout(() => {
            const cssTarget = document.getElementById('app') as HTMLElement
            this.controls = new OrbitControls(this.instance, cssTarget)
            this.controls.enableDamping = true
            this.controls.enablePan = false // Usually don't want panning on portfolios
            this.controls.minDistance = 2
            this.controls.maxDistance = 15
        }, 10)
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        if (this.controls) this.controls.update()
    }
}
