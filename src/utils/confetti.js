/**
 * Lightweight, zero-dependency celebratory canvas confetti burst.
 * Respects prefers-reduced-motion and cleans up canvas automatically.
 */

export function fireConfetti(options = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Respect reduced-motion accessibility preference
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const particleCount = options.particleCount || 80;
  const colors = options.colors || [
    "#6D4E56", // Plum primary
    "#8C656F", // Soft plum
    "#D97706", // Amber action
    "#F59E0B", // Bright amber
    "#059669", // Emerald success
    "#10B981", // Mint
    "#E11D48", // Rose accent
    "#4338CA", // Deep indigo
  ];

  const origin = options.origin || { x: 0.5, y: 0.6 };

  // Create overlay canvas
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  let width = (canvas.width = window.innerWidth * (window.devicePixelRatio || 1));
  let height = (canvas.height = window.innerHeight * (window.devicePixelRatio || 1));

  const startX = origin.x * width;
  const startY = origin.y * height;

  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.PI * (origin.y < 0.5 ? 0.2 + Math.random() * 0.6 : 1.15 + Math.random() * 0.7);
    const speed = 8 + Math.random() * 16;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * speed - (Math.random() * 5),
      size: 5 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      decay: 0.012 + Math.random() * 0.012,
      gravity: 0.35 + Math.random() * 0.15,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
    });
  }

  let animationFrameId;

  function render() {
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0.01) continue;

      activeParticles++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.985;
      p.opacity = Math.max(0, p.opacity - p.decay);
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      const wobbleX = p.x + Math.sin(p.wobble) * 4;

      ctx.save();
      ctx.translate(wobbleX, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(p.wobble), 1);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
