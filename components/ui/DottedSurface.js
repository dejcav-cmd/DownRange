'use client'
import { useEffect, useRef } from 'react'
import { useTheme } from './ThemeProvider'

export default function DottedSurface({ className = '' }) {
  const containerRef = useRef(null)
  const sceneRef     = useRef(null)
  const { theme }    = useTheme()

  useEffect(() => {
    if (!containerRef.current) return
    if (typeof window === 'undefined') return

    let THREE
    try { THREE = require('three') } catch (e) { console.warn('Three.js unavailable:', e.message); return }

    const el = containerRef.current
    const SEPARATION = 150
    const AMOUNTX    = 40
    const AMOUNTY    = 60

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 1, 10000)
    camera.position.set(0, 355, 1220)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const positions = []
    const colors    = []
    const dotColor  = theme === 'light' ? [80, 60, 20] : [200, 146, 42]

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions.push(ix * SEPARATION - (AMOUNTX * SEPARATION) / 2, 0, iy * SEPARATION - (AMOUNTY * SEPARATION) / 2)
        colors.push(...dotColor)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3))

    const material = new THREE.PointsMaterial({
      size: 7, vertexColors: true, transparent: true, opacity: 0.55, sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    let count = 0
    let animId

    function animate() {
      animId = requestAnimationFrame(animate)
      const pos = geometry.attributes.position.array
      let i = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          pos[i * 3 + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50
          i++
        }
      }
      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
      count += 0.07
    }

    function onResize() {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }

    window.addEventListener('resize', onResize)
    animate()

    sceneRef.current = { scene, renderer, animId }

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animId)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}
