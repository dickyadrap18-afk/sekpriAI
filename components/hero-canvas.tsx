"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Floating particles — gold/amber tones for "premium secretary"
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const palette = [
      new THREE.Color("#c9a96e"), // warm gold
      new THREE.Color("#e8d5b0"), // champagne
      new THREE.Color("#ffffff"), // white
      new THREE.Color("#a07840"), // deep gold
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Thin wireframe torus — elegant ring
    const torusGeo = new THREE.TorusGeometry(2.2, 0.008, 8, 120);
    const torusMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c9a96e"),
      transparent: true,
      opacity: 0.18,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 3;
    scene.add(torus);

    // Second ring
    const torus2Geo = new THREE.TorusGeometry(3.0, 0.005, 8, 120);
    const torus2Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.07,
    });
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
    torus2.rotation.x = Math.PI / 5;
    torus2.rotation.y = Math.PI / 6;
    scene.add(torus2);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouse);

    // Resize
    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    // Animate
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.04 + mouseX * 0.08;
      particles.rotation.x = t * 0.02 + mouseY * 0.05;

      torus.rotation.z = t * 0.12;
      torus.rotation.y = mouseX * 0.15;

      torus2.rotation.z = -t * 0.07;
      torus2.rotation.x = Math.PI / 5 + mouseY * 0.1;

      // Breathe opacity
      torusMat.opacity = 0.12 + Math.sin(t * 0.8) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}
