(() => {
  const canvas = document.getElementById("audioVizCanvas");
  const audio = document.getElementById("bgAudio");
  const toggleBtn = document.getElementById("audioToggleBtn");
  const musicIconBtn = document.getElementById("musicIconBtn");
  if (!canvas || !audio || !toggleBtn) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let audioCtx = null;
  let analyser = null;
  let source = null;
  let dataArray = null;
  let rafId = null;

  function setupAudioGraph() {
    if (audioCtx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    audioCtx = new Ctx();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  function drawBars() {
    if (!analyser || !dataArray) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    analyser.getByteFrequencyData(dataArray);

    const barCount = 12;
    const step = Math.max(1, Math.floor(dataArray.length / barCount));
    const gap = 4;
    const barWidth = (w - (barCount - 1) * gap) / barCount;
    const centerX = barWidth / 2;
    const paddingTop = 20;
    const paddingBottom = 20;
    const rangeY = h - paddingTop - paddingBottom;

    for (let i = 0; i < barCount; i += 1) {
      const value = dataArray[i * step] / 255;
      const basePx = i * (barWidth + gap) + centerX;
      const basePy = h - paddingBottom - value * rangeY;

      const t = performance.now() * 0.001;
      const swayX = Math.sin(t * 1.2 + i * 0.4) * 2.5;
      const breatheY = Math.sin(t * 0.9 + i * 0.25) * 3;
      const tilt = Math.sin(t * 1.1 + i * 0.35) * 0.05;
      const scale = 1 + Math.sin(t * 0.85 + i * 0.2) * 0.04;
      const rx = 8 + value * 10;
      const ry = rx * 0.95;
      const alpha = 0.22 + value * 0.48;
      const oralLen = (11 + value * 9) * (2 / 3);
      const tentacleLen = (14 + value * 12) * (2 / 3);

      ctx.save();
      ctx.translate(basePx + swayX, basePy + breatheY);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);

      const bellGrad = ctx.createRadialGradient(
        -rx * 0.2, -ry * 0.6, 0, 0, -ry * 0.15, rx * 1.4
      );
      bellGrad.addColorStop(0, `rgba(255, 252, 245, ${alpha * 1.5})`);
      bellGrad.addColorStop(0.3, `rgba(255, 238, 190, ${alpha})`);
      bellGrad.addColorStop(0.7, `rgba(255, 220, 140, ${alpha * 0.6})`);
      bellGrad.addColorStop(1, `rgba(188, 133, 51, ${alpha * 0.2})`);

      ctx.beginPath();
      ctx.ellipse(0, -ry, rx, ry, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = bellGrad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 235, 180, ${alpha * 0.6})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 248, 230, ${alpha * 0.35})`;
      ctx.lineWidth = 0.35;
      for (let v = 0; v < 5; v += 1) {
        const ax = (v - 2) * rx * 0.32;
        ctx.beginPath();
        ctx.moveTo(ax, -ry * 0.4);
        ctx.quadraticCurveTo(ax * 1.15 - 0.5, -ry * 0.95, ax * 0.9, -ry * 1.08);
        ctx.stroke();
      }

      const oralCount = 4;
      for (let k = 0; k < oralCount; k += 1) {
        const ox = (k - (oralCount - 1) / 2) * rx * 0.38;
        const ribbonW = rx * 0.28;
        const w1 = Math.sin(t * 1.8 + k * 0.7 + i * 0.2) * 1.2;
        const w2 = Math.sin(t * 1.5 + k * 0.5 + i * 0.15) * 1.5;

        ctx.beginPath();
        ctx.moveTo(ox - ribbonW * 0.5, -ry * 0.55);
        ctx.quadraticCurveTo(ox - ribbonW * 0.6 + w1, oralLen * 0.25, ox - ribbonW * 0.4, oralLen * 0.5);
        ctx.quadraticCurveTo(ox + w2, oralLen * 0.75, ox, oralLen);
        ctx.quadraticCurveTo(ox + ribbonW * 0.4 - w1, oralLen * 0.5, ox + ribbonW * 0.5, -ry * 0.55);
        ctx.closePath();
        const oralGrad = ctx.createLinearGradient(ox - ribbonW, 0, ox + ribbonW, 0);
        oralGrad.addColorStop(0, `rgba(255, 235, 180, ${alpha * 0.5})`);
        oralGrad.addColorStop(0.5, `rgba(255, 248, 220, ${alpha * 0.7})`);
        oralGrad.addColorStop(1, `rgba(255, 220, 140, ${alpha * 0.45})`);
        ctx.fillStyle = oralGrad;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 230, 160, ${alpha * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      const tentacleCount = 12;
      for (let j = 0; j < tentacleCount; j += 1) {
        const u = (j - (tentacleCount - 1) / 2) / (tentacleCount - 1);
        const startX = u * rx * 0.95;
        const lenVar = 0.7 + 0.3 * Math.sin((j + i) * 0.4);
        const len = tentacleLen * lenVar;
        const wave = Math.sin(t * 2.2 + i * 0.25 + j * 0.35) * 2.2;
        const wave2 = Math.sin(t * 1.6 + j * 0.5) * 1.2;

        ctx.beginPath();
        ctx.moveTo(startX, -ry * 0.5);
        ctx.quadraticCurveTo(startX + wave, len * 0.3, startX - wave * 0.5, len * 0.6);
        ctx.quadraticCurveTo(startX + wave2, len * 0.85, startX - wave2 * 0.4, len);
        ctx.strokeStyle = `rgba(255, 225, 150, ${alpha * 0.5})`;
        ctx.lineWidth = 0.55;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      ctx.restore();
    }

    rafId = requestAnimationFrame(drawBars);
  }

  function syncMusicIconState() {
    if (musicIconBtn) {
      if (audio.paused) {
        musicIconBtn.classList.remove("is-playing");
      } else {
        musicIconBtn.classList.add("is-playing");
      }
    }
  }

  async function playAudio() {
    setupAudioGraph();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    await audio.play();
    toggleBtn.textContent = "暂停音乐";
    syncMusicIconState();
    if (!rafId) drawBars();
  }

  function pauseAudio() {
    audio.pause();
    toggleBtn.textContent = "播放音乐";
    syncMusicIconState();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  async function handleToggle() {
    try {
      if (audio.paused) {
        await playAudio();
      } else {
        pauseAudio();
      }
    } catch (error) {
      console.error("Audio visualizer error:", error);
    }
  }

  toggleBtn.addEventListener("click", handleToggle);
  if (musicIconBtn) {
    musicIconBtn.addEventListener("click", handleToggle);
    syncMusicIconState();
  }
})();
