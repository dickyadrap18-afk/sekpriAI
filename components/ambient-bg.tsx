"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Ambient background — soft floating orbs + subtle particle drift.
 * Tema: warm gold/rose, elegan, sensual tapi tidak vulgar.
 * Tidak pakai Three.js agar ringan di dalam app shell.
 */
export function AmbientBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Tiny drifting particles
    const COUNT = 55;
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; color: string;
    };

    const COLORS = [
      "rgba(201,169,110,",   // gold
      "rgba(232,213,176,",   // champagne
      "rgba(180,120,80,",    // warm amber
      "rgba(255,200,160,",   // peach
    ];

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.35 + 0.05,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let frame: number;
    let t = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      t += 0.004;

      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.y * 0.01) * 0.06;
        p.y += p.vy + Math.cos(t + p.x * 0.01) * 0.04;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    }

    draw();

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* Slow-breathing orbs via CSS — no JS needed */}
      {/* Top-left warm rose */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          top: "-10%", left: "-8%",
          width: 520, height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(180,100,80,0.09) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom-right gold */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          bottom: "-12%", right: "-6%",
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Center subtle champagne */}
      <motion.div
        className="fixed pointer-events-none z-0"
        style={{
          top: "35%", left: "40%",
          width: 380, height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,213,176,0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(201,169,110,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          opacity: 0.5,
        }}
      />
    </>
  );
}
