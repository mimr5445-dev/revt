'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { useStore } from '@/lib/store'
import { buildScene } from '@/lib/build3d'
import { downloadText } from '@/lib/revt-file'

export default function Viewport3D() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rafRef = useRef<number>(0)

  const project = useStore((s) => s.project)
  const select = useStore((s) => s.select)

  // تهيئة المشهد مرة واحدة
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0e1a')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000)
    camera.position.set(14, 12, 16)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 1.5, 0)
    controlsRef.current = controls

    // إضاءة
    const hemi = new THREE.HemisphereLight('#cfe3ff', '#0a0e1a', 0.9)
    scene.add(hemi)
    const sun = new THREE.DirectionalLight('#ffffff', 1.6)
    sun.position.set(18, 30, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 120
    const sc = sun.shadow.camera as THREE.OrthographicCamera
    sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40
    scene.add(sun)

    // أرضية + شبكة
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: '#0e1424', roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    ground.receiveShadow = true
    scene.add(ground)
    const grid = new THREE.GridHelper(200, 200, 0x274064, 0x16223a)
    ;(grid.material as THREE.Material).opacity = 0.5
    ;(grid.material as THREE.Material).transparent = true
    scene.add(grid)

    // raycaster للاختيار
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onClick = (ev: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = modelRef.current ? raycaster.intersectObjects(modelRef.current.children, true) : []
      if (hits.length) {
        let obj: THREE.Object3D | null = hits[0].object
        while (obj && !obj.userData.elementId) obj = obj.parent
        if (obj?.userData.elementId) select(obj.userData.elementId as string)
      }
    }
    renderer.domElement.addEventListener('click', onClick)

    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    // تصدير GLB
    const exportHandler = () => {
      if (!modelRef.current) return
      const exporter = new GLTFExporter()
      exporter.parse(
        modelRef.current,
        (result) => {
          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'revt-model.glb'
            a.click()
            URL.revokeObjectURL(url)
          } else {
            downloadText('revt-model.gltf', JSON.stringify(result), 'model/gltf+json')
          }
        },
        () => {},
        { binary: true },
      )
    }
    window.addEventListener('revt-export-glb', exportHandler)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('revt-export-glb', exportHandler)
      renderer.domElement.removeEventListener('click', onClick)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [select])

  // إعادة بناء النموذج عند تغيّر المشروع
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (modelRef.current) {
      scene.remove(modelRef.current)
      modelRef.current.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
      })
    }
    const model = buildScene(project)
    modelRef.current = model
    scene.add(model)
  }, [project])

  return <div ref={mountRef} className="absolute inset-0" />
}
