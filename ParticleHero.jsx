import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

/**
 * PARTICLE SIMULATION BREAKDOWN:
 *
 * 1. GEOMETRY (CPU → GPU Transfer)
 *    - Create BufferGeometry with position + color attributes
 *    - Positions: Random points in 3D space (Float32Array)
 *    - Colors: RGB per vertex (Float32Array)
 *    - Store in GPU buffer (never touch CPU again during animation)
 *
 * 2. MATERIAL (GPU Rendering)
 *    - PointsMaterial: Renders each vertex as a 2D point on screen
 *    - vertexColors: Use per-vertex color (no texture lookup)
 *    - sizeAttenuation: Points get smaller as they move away (perspective)
 *    - transparent + opacity: Fade effect
 *
 * 3. MESH (Scene Object)
 *    - THREE.Points = geometry + material + transformation
 *    - Like THREE.Mesh but optimized for 1000s of points
 *
 * 4. SCROLL BINDING (CPU Animation)
 *    - useScroll({ target }) returns scrollYProgress (0→1)
 *    - useTransform(scrollYProgress, [0,1], [rotation1, rotation2])
 *    - Every scroll = GPU update via requestAnimationFrame
 *
 * 5. RENDER LOOP (GPU Paint)
 *    - requestAnimationFrame: ~60fps
 *    - renderer.render(scene, camera): Paint geometry to canvas
 *    - GPU handles vertex position multiplied by matrices
 */

export const ParticleHero = ({ imageUrl = null }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);
  const cameraRef = useRef(null);

  // Scroll progress: 0 (top) → 1 (bottom of hero)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Transform scroll → rotation angles
  const rotationX = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 2]);
  const rotationY = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 4]);
  const particleScale = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  // GEOMETRY: Create particle data (CPU-side)
  const particleCount = 2000;
  const positionsArray = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position: Random sphere around origin
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 50 + Math.random() * 50;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Color: Gradient (white → cyan → blue)
      const hue = Math.random();
      colors[i3] = Math.sin(hue * Math.PI) * 0.7 + 0.3;      // R
      colors[i3 + 1] = Math.sin((hue + 0.33) * Math.PI) * 0.7 + 0.3; // G
      colors[i3 + 2] = Math.sin((hue + 0.66) * Math.PI) * 0.7 + 0.3; // B
    }

    return { positions, colors };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // RENDERER: Initialize WebGL context
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0.1);
    rendererRef.current = renderer;

    // SCENE: 3D container
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // CAMERA: Perspective view
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 150;
    cameraRef.current = camera;

    // GEOMETRY: Create BufferGeometry (GPU-optimized structure)
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positionsArray.positions, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(positionsArray.colors, 3)
    );

    // MATERIAL: PointsMaterial renders vertices as 2D points
    const material = new THREE.PointsMaterial({
      size: 2.5,
      sizeAttenuation: true,  // Points shrink with distance (perspective)
      vertexColors: true,     // Use per-vertex colors, not single color
      transparent: true,
      opacity: 0.8,
    });

    // MESH: Combine geometry + material + transform
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // ANIMATION LOOP: Run every frame (~60fps)
    const animate = () => {
      // Read scroll progress from Framer Motion
      const scrollProgress = scrollYProgress.get();
      const rotX = rotationX.get();
      const rotY = rotationY.get();
      const scale = particleScale.get();

      // Update particle rotation based on scroll
      particles.rotation.x = rotX;
      particles.rotation.y = rotY;
      particles.scale.set(scale, scale, scale);

      // (Optional) Oscillate particle positions with scroll
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        // Offset from original + sine wave
        const originIdx = i % (particleCount * 3);
        const originalX = positionsArray.positions[i];
        const originalY = positionsArray.positions[i + 1];
        const originalZ = positionsArray.positions[i + 2];

        // Add wave effect: particles move based on scroll progress
        positions[i] = originalX + Math.sin(scrollProgress * Math.PI * 2 + i * 0.001) * 10;
        positions[i + 1] = originalY + Math.cos(scrollProgress * Math.PI * 2 + i * 0.001) * 10;
        positions[i + 2] = originalZ + Math.sin(scrollProgress * Math.PI + i * 0.001) * 5;
      }
      geometry.attributes.position.needsUpdate = true;

      // RENDER: Draw scene to canvas
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // WINDOW RESIZE HANDLER
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [scrollYProgress, rotationX, rotationY, particleScale, positionsArray]);

  return (
    <section
      ref={containerRef}
      style={{
        height: '220vh',
        backgroundColor: '#0a0a0a',
        position: 'relative',
      }}
    >
      {/* STICKY CONTAINER: Hero stays in viewport while scrolling */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      >
        {/* CANVAS: Three.js renders here */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Optional: Overlay content on top of particles */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            Scroll down
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              color: '#aaa',
              marginTop: '1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            Watch the particles react
          </p>
        </div>
      </div>

      {/* Content below hero */}
      <div style={{ padding: '4rem 2rem', backgroundColor: '#fff', color: '#000' }}>
        <h2>Your Content Here</h2>
        <p>The hero section is 220vh tall (2x the viewport height) for a parallax effect.</p>
      </div>
    </section>
  );
};

export default ParticleHero;
