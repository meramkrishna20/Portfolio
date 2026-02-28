import * as THREE from 'three'
import Experience from './Experience'
import Resources from './Utils/Resources'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import gsap from 'gsap'

export default class World {
    experience: Experience
    scene: THREE.Scene
    resources: Resources
    portfolioModel: any

    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        // Wait for resources
        this.resources.on('ready', () => {
            // Setup
            this.setPortfolio()
        })

        // Setup lighting
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight('#ffffff', 2)
        directionalLight.position.set(5, 5, 5)
        this.scene.add(directionalLight)
    }

    setPortfolio() {
        this.portfolioModel = this.resources.items.portfolioModel
        if (this.portfolioModel) {
            this.scene.add(this.portfolioModel.scene)

            // Setup Camera Positions
            this.setupCamera()

            // Attach CSS3D Iframe behind ComputerScreen_UI
            this.setupMonitorScreen()
        }
    }

    setupMonitorScreen() {
        // Find the monitor screen mesh in the loaded GLTF
        const screenMesh = this.portfolioModel.scene.getObjectByName('MonitorScreen_UI') as THREE.Mesh

        if (screenMesh) {
            // Read the exact world-space transform of the Blender plane
            const worldPosition = new THREE.Vector3()
            const worldQuaternion = new THREE.Quaternion()
            screenMesh.getWorldPosition(worldPosition)
            screenMesh.getWorldQuaternion(worldQuaternion)

            // Get actual physical dimensions using bounding box (more reliable than worldScale)
            const bbox = new THREE.Box3().setFromObject(screenMesh)
            const screenSize = new THREE.Vector3()
            bbox.getSize(screenSize)
            // screenSize.x = actual width in world units, screenSize.y = actual height in world units

            // Hide the blender placeholder mesh - we'll replace it with the CSS3D
            screenMesh.visible = false

            // Create iframe container
            const iframe = document.createElement('iframe')
            iframe.src = '/desktop.html'
            iframe.style.width = '1920px'
            iframe.style.height = '1080px'
            iframe.style.border = 'none'
            iframe.style.pointerEvents = 'auto'

            // Create CSS3D Object
            const cssObject = new CSS3DObject(iframe)

            // Hardcode perfected calibration values
            cssObject.position.set(1.018719, 2.218866, -0.08105)
            cssObject.rotation.set(-0.10259, -0.26559, -0.02959)
            cssObject.scale.set(0.000522, 0.000590, 0.000522)

            this.scene.add(cssObject)

            // ==========================================
            // THE PROCEDURAL HOLE PUNCH MASK
            // ==========================================
            const maskGeometry = new THREE.PlaneGeometry(1920, 1080)
            const maskMaterial = new THREE.MeshBasicMaterial({
                colorWrite: false,
                depthWrite: true,
                depthTest: true
            })
            const holePunchMesh = new THREE.Mesh(maskGeometry, maskMaterial)
            holePunchMesh.name = 'Monitor_Screen_Hitbox'
            holePunchMesh.position.copy(cssObject.position)
            holePunchMesh.quaternion.copy(cssObject.quaternion)
            holePunchMesh.scale.copy(cssObject.scale)
            holePunchMesh.renderOrder = -1
            this.scene.add(holePunchMesh)

        } else {
            console.warn("Could not find an object named 'MonitorScreen_UI' in the GLB file! Make sure you named the screen mesh exactly 'MonitorScreen_UI' in Blender.")
        }
    }

    setupCamera() {
        // Find the camera positions and targets from Blender
        const camPos = this.portfolioModel.scene.getObjectByName('CameraDefault')
        const camTarget = this.portfolioModel.scene.getObjectByName('CameraTarget')
        const deskPos = this.portfolioModel.scene.getObjectByName('CameraDesktopPosition')
        const deskTarget = this.portfolioModel.scene.getObjectByName('CameraDesktopTarget')

        if (camPos && camTarget) {
            this.experience.camera.instance.position.copy(camPos.position)
            this.experience.camera.controls.target.copy(camTarget.position)
        } else {
            console.warn("Could not find 'CameraDefault' or 'CameraTarget' empty.")
        }

        this.experience.camera.controls.update()
        this.experience.camera.controls.autoRotate = false

        // ─── HOVER ZOOM SYSTEM ─────────────────────────────────────────────────
        // Works from ANY phase (orbit or desktop). Uses world-position empties:
        //   CameraDesktopPosition / CameraDesktopTarget  → zoom-in destination
        // When cursor leaves monitor area → return to CameraDesktopPosition.
        // ───────────────────────────────────────────────────────────────────────

        // Monitor mesh names to detect hover on (body + screen hitbox)
        const MONITOR_HOVER_NAMES = new Set([
            'Monitor_Screen_Hitbox',
            'MonitorScreen_UI',
            'Monitor',
            'MonitorBody',
            'Monitor_Body',
            'Computer',
            'ComputerBody',
        ])

        // Get world-space positions once model is loaded
        const deskPosWP = new THREE.Vector3()
        const deskTargetWP = new THREE.Vector3()
        if (deskPos) deskPos.getWorldPosition(deskPosWP)
        if (deskTarget) deskTarget.getWorldPosition(deskTargetWP)

        let isHoveringMonitor = false
        let isDesktopPhase = false   // true only after first hover/click onto desk view
        let isTransitioning = false   // true during camera tweens (blocks parallax)
        let portfolioStarted = false   // gate: no hover effects until intro is dismissed

        // ─── Orbit state (hoisted so hover handler can pause/resume) ───────────
        let dollyAnim: gsap.core.Tween | null = null
        const dummy = { angle: -Math.PI / 2 }
        let orbitRadius = 0
        let orbitStart = 0  // startAngle

        const hoverRaycaster = new THREE.Raycaster()
        const hoverMouse = new THREE.Vector2()
        let lastHoverTime = 0

        // Helper — current orbital X/Z from frozen dummy.angle
        const orbitXZ = () => ({
            x: camTarget ? camTarget.position.x + Math.sin(orbitStart + dummy.angle) * orbitRadius : 0,
            z: camTarget ? camTarget.position.z + Math.cos(orbitStart + dummy.angle) * orbitRadius : 0,
        })

        // ─── Click-outside → orbit return (hoisted so hover-leave can call it) ─
        let stage3Active = false
        let onSceneClick: () => void   // forward-declared so registerOrbitReturn can ref it
        const registerOrbitReturn = () => {
            if (stage3Active) return   // don't double-register
            stage3Active = true

            const ray3 = new THREE.Raycaster()
            const mse3 = new THREE.Vector2()

            const onClickOut = (ev: MouseEvent) => {
                mse3.x = (ev.clientX / window.innerWidth) * 2 - 1
                mse3.y = -(ev.clientY / window.innerHeight) * 2 + 1
                ray3.setFromCamera(mse3, this.experience.camera.instance)

                const hits = ray3.intersectObjects(this.experience.scene.children, true)
                const hitMonitor = hits.some(h => MONITOR_HOVER_NAMES.has(h.object.name))

                if (!hitMonitor) {
                    window.removeEventListener('click', onClickOut)
                    stage3Active = false
                    isDesktopPhase = false
                    isHoveringMonitor = false
                    isTransitioning = true

                    const dest = orbitXZ()
                    gsap.to(this.experience.camera.instance.position, {
                        x: dest.x, y: camPos!.position.y, z: dest.z,
                        duration: 2.5, ease: 'power2.inOut',
                        onUpdate: () => { void this.experience.camera.controls.update() },
                        onComplete: () => {
                            isTransitioning = false
                            this.experience.camera.controls.enabled = true
                            if (dollyAnim) dollyAnim.play()
                            setTimeout(() => window.addEventListener('click', onSceneClick, { once: true }), 250)
                        }
                    })
                    gsap.to(this.experience.camera.controls.target, {
                        x: camTarget!.position.x, y: camTarget!.position.y, z: camTarget!.position.z,
                        duration: 2.5, ease: 'power2.inOut'
                    })
                }
            }
            setTimeout(() => window.addEventListener('click', onClickOut), 500)
        }

        // ─── GLOBAL HOVER HANDLER ─────────────────────────────────────────────
        const onMouseMove = (e: MouseEvent) => {
            if (!portfolioStarted) return   // ignore hover until intro is dismissed
            const now = performance.now()
            if (now - lastHoverTime < 32) return
            lastHoverTime = now

            const normX = (e.clientX / window.innerWidth) * 2 - 1
            const normY = -(e.clientY / window.innerHeight) * 2 + 1

            hoverMouse.set(normX, normY)
            hoverRaycaster.setFromCamera(hoverMouse, this.experience.camera.instance)

            const hits = hoverRaycaster.intersectObjects(this.experience.scene.children, true)
            const hoveringNow = hits.some(h => MONITOR_HOVER_NAMES.has(h.object.name))

            // ── Enter hover ────────────────────────────────────────────────────
            if (hoveringNow && !isHoveringMonitor) {
                isHoveringMonitor = true

                // During orbit: freeze dummy.angle so we can return to exact spot later
                if (!isDesktopPhase && dollyAnim) dollyAnim.pause()

                if (deskPos && deskTarget) {
                    gsap.to(this.experience.camera.instance.position, {
                        x: deskPosWP.x, y: deskPosWP.y, z: deskPosWP.z,
                        duration: 1.2, ease: 'power2.out', overwrite: 'auto',
                    })
                    gsap.to(this.experience.camera.controls.target, {
                        x: deskTargetWP.x, y: deskTargetWP.y, z: deskTargetWP.z,
                        duration: 1.2, ease: 'power2.out', overwrite: 'auto',
                        onUpdate: () => { void this.experience.camera.controls.update() }
                    })
                }

                // ── Leave hover ────────────────────────────────────────────────────
            } else if (!hoveringNow && isHoveringMonitor) {
                isHoveringMonitor = false
                isDesktopPhase = true   // enables parallax & click-outside-orbit
                registerOrbitReturn()      // register the click-outside handler now

                // Pull back to CameraDesktopPosition
                if (deskPos && deskTarget) {
                    gsap.to(this.experience.camera.instance.position, {
                        x: deskPosWP.x, y: deskPosWP.y, z: deskPosWP.z,
                        duration: 1.4, ease: 'power2.out', overwrite: 'auto',
                        onUpdate: () => { void this.experience.camera.controls.update() }
                    })
                    gsap.to(this.experience.camera.controls.target, {
                        x: deskTargetWP.x, y: deskTargetWP.y, z: deskTargetWP.z,
                        duration: 1.4, ease: 'power2.out', overwrite: 'auto',
                        onUpdate: () => { void this.experience.camera.controls.update() }
                    })
                }
            }

            // ── Desktop parallax (only when NOT hovering & NOT mid-transition) ─
            if (isDesktopPhase && !isHoveringMonitor && !isTransitioning && deskPos && deskTarget) {
                gsap.to(this.experience.camera.instance.position, {
                    x: deskPosWP.x + normX * 0.25,
                    y: deskPosWP.y + normY * 0.15,
                    z: deskPosWP.z,
                    duration: 1.5, ease: 'power1.out', overwrite: 'auto',
                })
                gsap.to(this.experience.camera.controls.target, {
                    x: deskTargetWP.x, y: deskTargetWP.y, z: deskTargetWP.z,
                    duration: 1.5, ease: 'power1.out', overwrite: 'auto',
                    onUpdate: () => { void this.experience.camera.controls.update() }
                })
            }
        }
        window.addEventListener('mousemove', onMouseMove)

        // iframe → hover-in
        window.addEventListener('message', (e: MessageEvent) => {
            if (!portfolioStarted) return
            if (e.data?.type === 'os-mousemove' && !isHoveringMonitor) {
                isHoveringMonitor = true
                if (!isDesktopPhase && dollyAnim) dollyAnim.pause()
                if (deskPos && deskTarget) {
                    gsap.to(this.experience.camera.instance.position, {
                        x: deskPosWP.x, y: deskPosWP.y, z: deskPosWP.z,
                        duration: 1.2, ease: 'power2.out', overwrite: 'auto'
                    })
                    gsap.to(this.experience.camera.controls.target, {
                        x: deskTargetWP.x, y: deskTargetWP.y, z: deskTargetWP.z,
                        duration: 1.2, ease: 'power2.out', overwrite: 'auto',
                        onUpdate: () => { void this.experience.camera.controls.update() }
                    })
                }
            }
        })

        // ─── STAGE 1: orbit dolly ─────────────────────────────────────────────
        window.addEventListener('portfolio-start', () => {
            portfolioStarted = true   // ← unlock hover detection from this point
            if (!camPos || !camTarget) return

            const dx = camPos.position.x - camTarget.position.x
            const dz = camPos.position.z - camTarget.position.z
            orbitRadius = Math.hypot(dx, dz)
            orbitStart = Math.atan2(dx, dz)

            // Reset dummy to midpoint so camera starts at CameraDefault
            dummy.angle = -Math.PI / 2

            dollyAnim = gsap.to(dummy, {
                angle: Math.PI / 2,
                duration: 30,
                ease: 'sine.inOut',   // gentler — no painfully slow ends
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    // Dolly only drives camera while in free orbit (not hovering, not at desktop)
                    if (isHoveringMonitor || isDesktopPhase) return
                    const a = orbitStart + dummy.angle
                    this.experience.camera.instance.position.x = camTarget.position.x + Math.sin(a) * orbitRadius
                    this.experience.camera.instance.position.z = camTarget.position.z + Math.cos(a) * orbitRadius
                    this.experience.camera.instance.position.y = camPos.position.y
                    this.experience.camera.controls.update()
                }
            })
            dollyAnim.progress(0.5)

            // ─── STAGE 2: first click (if user hasn't hovered yet) → desktop zoom
            onSceneClick = () => {
                if (!portfolioStarted || isDesktopPhase) return  // already in desktop from hover
                if (dollyAnim) dollyAnim.pause()
                isDesktopPhase = true
                isTransitioning = true

                if (deskPos && deskTarget) {
                    this.experience.camera.controls.enabled = false
                    gsap.to(this.experience.camera.instance.position, {
                        x: deskPosWP.x, y: deskPosWP.y, z: deskPosWP.z,
                        duration: 3, ease: 'power2.inOut',
                        onUpdate: () => { void this.experience.camera.controls.update() }
                    })
                    gsap.to(this.experience.camera.controls.target, {
                        x: deskTargetWP.x, y: deskTargetWP.y, z: deskTargetWP.z,
                        duration: 3, ease: 'power2.inOut',
                        onComplete: () => {
                            isTransitioning = false
                            registerOrbitReturn()
                        }
                    })
                }
            }
            setTimeout(() => window.addEventListener('click', onSceneClick, { once: true }), 300)
        })
    }

    update() {
        // Update elements here
    }
}
