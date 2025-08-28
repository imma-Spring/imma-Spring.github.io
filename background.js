document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const dotCount = 40;
  const dots = Array.from({ length: dotCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3
  }));

  function getLineColor() {
    return document.body.classList.contains("light")
      ? "rgba(0,0,0,0.05)"
      : "rgba(255,255,255,0.05)";
  }

  function getDotColor() {
    return document.body.classList.contains("light")
      ? "rgba(0,0,0,0.1)"
      : "rgba(255,255,255,0.12)";
  }

  const GRAVITY_FORCE = 0.002;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gravitational attraction
    for (let i = 0; i < dotCount; i++) {
      for (let j = i + 1; j < dotCount; j++) {
        const a = dots[i];
        const b = dots[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        const gravRadiusA = 10 * a.r;
        const gravRadiusB = 10 * b.r;
        const minDistA = 0.5 * a.r;
        const minDistB = 0.5 * b.r;

        const combinedGravRadius = gravRadiusA + gravRadiusB;
        const combinedMinDist = minDistA + minDistB;

        if (dist < combinedGravRadius && dist > combinedMinDist) {
          const fx = (dx / dist) * GRAVITY_FORCE;
          const fy = (dy / dist) * GRAVITY_FORCE;
          a.dx += fx;
          a.dy += fy;
          b.dx -= fx;
          b.dy -= fy;
        }
      }
    }

    // Move dots and wrap around edges
    dots.forEach(d => {
      d.x += d.dx;
      d.y += d.dy;

      if (d.x < 0) d.x = canvas.width;
      if (d.x > canvas.width) d.x = 0;
      if (d.y < 0) d.y = canvas.height;
      if (d.y > canvas.height) d.y = 0;
    });

    // Draw dotted lines between nearby dots
    ctx.strokeStyle = getLineColor();
    ctx.lineWidth = 1.0;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < dotCount; i++) {
      for (let j = i + 1; j < dotCount; j++) {
        const a = dots[i];
        const b = dots[j];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < 200) { // only connect nearby dots
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);

    // Draw dots
    ctx.fillStyle = getDotColor();
    dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  animate();

  // -------------------
  // Theme toggle
  // -------------------
  const toggle = document.getElementById("theme-toggle");
  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light");
      if (toggle) toggle.textContent = "🌙";
    } else {
      document.body.classList.remove("light");
      if (toggle) toggle.textContent = "☀️";
    }
  }

  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const newTheme = document.body.classList.contains("light") ? "dark" : "light";
      applyTheme(newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
});

