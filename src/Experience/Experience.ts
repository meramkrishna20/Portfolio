import * as THREE from 'three'
import Sizes from './Utils/Sizes'
import Time from './Utils/Time'
import Camera from './Camera'
import Renderer from './Renderer'
import World from './World'
import Resources from './Utils/Resources'
import sources from './sources'
import GUI from 'lil-gui'

export default class Experience {
    static instance: Experience
    canvas!: HTMLCanvasElement
    sizes!: Sizes
    time!: Time
    scene!: THREE.Scene
    camera!: Camera
    renderer!: Renderer
    world!: World
    resources!: Resources
    debug!: GUI

    constructor(canvas?: HTMLCanvasElement) {
        if (Experience.instance) {
            return Experience.instance
        }

        Experience.instance = this

        // Global access for debugging
        // @ts-ignore
        window.experience = this

        // Options
        if (canvas) {
            this.canvas = canvas
        }

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.debug = new GUI()
        this.resources = new Resources(sources)
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.world = new World()

        // Sizes resize event
        this.sizes.on('resize', () => {
            this.resize()
        })

        // Time tick event
        this.time.on('tick', () => {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }

    update() {
        this.camera.update()
        this.world.update()
        this.renderer.update()
    }
}
