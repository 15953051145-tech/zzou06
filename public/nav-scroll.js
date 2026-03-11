(() => {
  const nav = document.querySelector(".top-nav");
  if (!nav) return;

  let lastY = window.scrollY || 0;
  let threshold = window.innerHeight * 0.8;
  let hidden = false;

  function setHidden(nextHidden) {
    if (nextHidden === hidden) return;
    hidden = nextHidden;
    nav.classList.toggle("is-hidden", hidden);
  }

  function onScroll() {
    const y = window.scrollY || 0;
    const delta = y - lastY;
    lastY = y;

    if (y < 40) {
      setHidden(false);
      return;
    }

    if (delta > 4 && y > threshold) {
      setHidden(true);
      return;
    }

    if (delta < -4) {
      setHidden(false);
    }
  }

  function onResize() {
    threshold = window.innerHeight * 0.8;
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
})();
