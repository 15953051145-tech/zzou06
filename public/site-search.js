(() => {
  const SEARCH_PAGES = [
    { url: "./index.html", label: "首页" },
    { url: "./notes.html", label: "随记" },
    { url: "./gallery.html", label: "图库" },
    { url: "./projects.html", label: "项目" },
    { url: "./message.html", label: "留言" },
  ];

  const STORAGE_KEYS = {
    notes: "zl_notes_data_v1",
    gallery: "zl_gallery_data_v1",
    projects: "zl_projects_data_v1",
    messages: "zl_messages_data_v1",
  };

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isAuthTrigger(rawQuery) {
    const compact = String(rawQuery || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[，。、“”"'`~!@#$%^&*()_+\-=[\]{};:,.<>/?\\|]/g, "");
    return compact.includes("白帝") || compact.includes("baidi");
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readArray(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function normalizeGalleryAlbums(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    if (!rawItems.length) return [];
    if (rawItems.every((item) => item && Array.isArray(item.images))) {
      return rawItems;
    }

    const legacy = rawItems.filter((item) => item && item.image);
    if (!legacy.length) return [];
    return [
      {
        title: "默认相册",
        images: legacy.map((item) => ({
          src: item.image,
          caption: item.caption || "",
        })),
      },
    ];
  }

  let pageIndexPromise = null;
  function buildPageIndex() {
    if (pageIndexPromise) return pageIndexPromise;
    pageIndexPromise = Promise.all(
      SEARCH_PAGES.map(async (page) => {
        try {
          const response = await fetch(page.url, { cache: "no-store" });
          if (!response.ok) return null;
          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          doc.querySelectorAll("script,style,noscript").forEach((node) => node.remove());
          const content = normalizeText(doc.body ? doc.body.textContent : "");
          return {
            type: "page",
            title: page.label,
            url: page.url,
            content,
          };
        } catch (error) {
          return null;
        }
      })
    ).then((items) => items.filter(Boolean));
    return pageIndexPromise;
  }

  function buildDynamicIndex() {
    const notes = readArray(STORAGE_KEYS.notes).map((item) => ({
      type: "note",
      title: "随记",
      url: "./notes.html",
      content: normalizeText(`${item.title || ""} ${item.content || ""} ${item.createdAt || ""}`),
      snippet: item.content || "",
    }));

    const projects = readArray(STORAGE_KEYS.projects).map((item) => ({
      type: "project",
      title: item.title || "项目",
      url: "./projects.html",
      content: normalizeText(`${item.title || ""} ${item.description || ""} ${item.createdAt || ""}`),
      snippet: item.description || "",
    }));

    const messages = readArray(STORAGE_KEYS.messages).map((item) => ({
      type: "message",
      title: item.name || "访客留言",
      url: "./message.html",
      content: normalizeText(`${item.name || ""} ${item.content || ""} ${item.createdAt || ""}`),
      snippet: item.content || "",
    }));

    const galleryAlbums = normalizeGalleryAlbums(readArray(STORAGE_KEYS.gallery)).map((album) => {
      const photoCaptions = (album.images || []).map((img) => img.caption || "").join(" ");
      return {
        type: "gallery",
        title: album.title || "相册",
        url: "./gallery.html",
        content: normalizeText(`${album.title || ""} ${photoCaptions}`),
        snippet: `${(album.images || []).length} 张照片`,
      };
    });

    return [...notes, ...projects, ...messages, ...galleryAlbums];
  }

  function rankAndSlice(results) {
    return results
      .sort((a, b) => {
        if (a.type === "page" && b.type !== "page") return 1;
        if (a.type !== "page" && b.type === "page") return -1;
        return 0;
      })
      .slice(0, 24);
  }

  function ensureAuthModule() {
    if (window.EditorAuth && typeof window.EditorAuth.requireAuth === "function") {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const existed = document.querySelector('script[data-auth-gate="1"]');
      if (existed) {
        setTimeout(() => {
          resolve(
            !!(
              window.EditorAuth &&
              typeof window.EditorAuth.requireAuth === "function"
            )
          );
        }, 120);
        return;
      }

      const script = document.createElement("script");
      script.src = "./auth-gate.js?v=20260311c";
      script.dataset.authGate = "1";
      script.onload = () => {
        resolve(
          !!(
            window.EditorAuth &&
            typeof window.EditorAuth.requireAuth === "function"
          )
        );
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const widget = document.createElement("section");
  widget.className = "site-search-widget";
  widget.innerHTML = `
    <div class="site-search-box">
      <input id="siteSearchInput" type="search" placeholder="搜索全站内容..." />
    </div>
    <div id="siteSearchPanel" class="site-search-panel"></div>
  `;
  document.body.appendChild(widget);

  const input = widget.querySelector("#siteSearchInput");
  const panel = widget.querySelector("#siteSearchPanel");

  function showNoResultsToast() {
    const toast = document.createElement("div");
    toast.className = "site-search-no-results-toast";
    toast.textContent = "没有匹配内容";
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  function renderResults(items) {
    if (!panel) return;
    if (!items.length) {
      panel.innerHTML = "";
      showNoResultsToast();
      return;
    }

    panel.innerHTML = items
      .map((item) => {
        const snippet = escapeHtml(item.snippet || item.title || "");
        return `
          <a class="site-search-item" href="${item.url}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${snippet}</span>
          </a>
        `;
      })
      .join("");
  }

  async function performSearch(rawQuery) {
    if (isAuthTrigger(rawQuery)) {
      panel.innerHTML = `<div class="site-search-hint">触发验证中...</div>`;
      const ok = await ensureAuthModule();
      if (ok && window.EditorAuth && typeof window.EditorAuth.requireAuth === "function") {
        window.EditorAuth.requireAuth(() => {
          panel.innerHTML = `
            <a class="site-search-item" href="./personal.html">
              <strong>验证成功</strong>
              <span>点击进入个人页面进行编辑</span>
            </a>
          `;
        });
      } else {
        panel.innerHTML = `<div class="site-search-hint">验证组件加载失败，请刷新页面后重试</div>`;
      }
      return;
    }

    const query = normalizeText(rawQuery);
    if (!query) {
      panel.innerHTML = "";
      return;
    }

    panel.innerHTML = `<div class="site-search-hint">搜索中...</div>`;
    const [pageIndex, dynamicIndex] = await Promise.all([
      buildPageIndex(),
      Promise.resolve(buildDynamicIndex()),
    ]);
    const all = [...dynamicIndex, ...pageIndex];
    const matched = all.filter((item) => item.content.includes(query));
    renderResults(rankAndSlice(matched));
  }

  if (input) {
    input.addEventListener("focus", () => widget.classList.add("is-open"));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        performSearch(input.value);
      }
      if (event.key === "Escape") {
        widget.classList.remove("is-open");
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      widget.classList.remove("is-open");
    }
  });
})();
