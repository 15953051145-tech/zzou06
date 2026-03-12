const STORAGE_KEYS = {
  notes: "zl_notes_data_v1",
  gallery: "zl_gallery_data_v1",
  projects: "zl_projects_data_v1",
  messages: "zl_messages_data_v1",
  shortVideoAccounts: "zl_shortvideo_accounts_v1",
};

const PAGE_SIZE = 6;

const PLATFORM_DOMAINS = {
  "抖音": "www.douyin.com",
  "快手": "www.kuaishou.com",
  "B站": "www.bilibili.com",
  "b站": "www.bilibili.com",
  "哔哩哔哩": "www.bilibili.com",
  "小红书": "www.xiaohongshu.com",
  "视频号": "channels.weixin.qq.com",
  "微信视频号": "channels.weixin.qq.com",
};

function getPlatformIconUrl(item) {
  const platform = (item.platform || "").trim();
  let domain = PLATFORM_DOMAINS[platform];
  if (!domain && item.url) {
    try {
      const url = new URL(item.url);
      domain = url.hostname;
    } catch (_) {}
  }
  if (!domain) return null;
  return `https://${domain}/favicon.ico`;
}

function getPlatformAvatarChar(platform) {
  const p = (platform || "").trim();
  if (!p) return "?";
  if (p === "B站" || p === "b站" || p === "哔哩哔哩") return "B";
  return p.charAt(0);
}

function setupAutoLoad(sentinelId, loadMoreFn) {
  const sentinel = document.getElementById(sentinelId);
  if (!sentinel || !loadMoreFn) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) loadMoreFn();
    },
    { rootMargin: "200px", threshold: 0.1 }
  );
  observer.observe(sentinel);
}

function safeRead(key) {
  if (window.ZLStorage && typeof window.ZLStorage.read === "function") {
    return window.ZLStorage.read(key);
  }
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function safeWrite(key, data) {
  if (window.ZLStorage && typeof window.ZLStorage.write === "function") {
    await window.ZLStorage.write(key, data);
    return;
  }
  localStorage.setItem(key, JSON.stringify(data));
}

function nowLabel() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createEmptyState(text) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = text;
  return div;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function canEditSiteContent() {
  return !!(
    window.EditorAuth &&
    typeof window.EditorAuth.isAuthorized === "function" &&
    window.EditorAuth.isAuthorized()
  );
}

function normalizeGalleryAlbums(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const isAlbumShape = rawItems.every(
    (item) => item && Array.isArray(item.images)
  );
  if (isAlbumShape) return rawItems;

  if (!rawItems.length) return [];

  const legacyImages = rawItems.filter((item) => item && item.image);
  if (!legacyImages.length) return [];

  return [
    {
      id: makeId("album"),
      title: "默认相册",
      createdAt: nowLabel(),
      images: legacyImages.map((img) => ({
        id: makeId("photo"),
        src: img.image,
        caption: img.caption || "",
        createdAt: img.createdAt || nowLabel(),
      })),
    },
  ];
}

function createNoteCard(item) {
  const card = document.createElement("article");
  card.className = "content-card note-like-card";
  const title = document.createElement("h3");
  title.textContent = item.title || "随记";
  const text = document.createElement("p");
  text.textContent = item.content || "";
  const time = document.createElement("small");
  time.textContent = item.createdAt || "";
  card.dataset.noteTitle = item.title || "随记";
  card.dataset.noteContent = item.content || "";
  card.dataset.noteTime = item.createdAt || "";
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(time);
  return card;
}

function renderNotes() {
  const host = document.getElementById("notesList");
  const sentinel = document.getElementById("notesListSentinel");
  if (!host) return;

  const allNotes = safeRead(STORAGE_KEYS.notes).slice().reverse();
  let visibleCount = 0;

  const renderSlice = () => {
    const toShow = allNotes.slice(0, visibleCount);
    host.innerHTML = "";
    if (!allNotes.length) {
      host.appendChild(createEmptyState("暂无随记，请到个人页面发布。"));
      if (sentinel) sentinel.style.display = "none";
      return;
    }
    toShow.forEach((item) => host.appendChild(createNoteCard(item)));
    bindNotePreview(host);
    if (sentinel) {
      sentinel.style.display = visibleCount >= allNotes.length ? "none" : "block";
    }
  };

  const loadMore = () => {
    if (visibleCount >= allNotes.length) return;
    visibleCount = Math.min(visibleCount + PAGE_SIZE, allNotes.length);
    renderSlice();
  };

  visibleCount = Math.min(PAGE_SIZE, allNotes.length);
  renderSlice();
  setupAutoLoad("notesListSentinel", loadMore);
}

function bindNotePreview(host) {
  if (!host || host.dataset.previewBound === "true") return;
  host.dataset.previewBound = "true";

  host.addEventListener("click", (event) => {
    const card = event.target.closest(".note-like-card");
    if (!card) return;

    openNotePreview({
      title: card.dataset.noteTitle || "随记",
      content: card.dataset.noteContent || "",
      time: card.dataset.noteTime || "",
    });
  });
}

function openNotePreview(note) {
  let overlay = document.getElementById("notePreviewOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "notePreviewOverlay";
    overlay.className = "note-preview-overlay";
    overlay.innerHTML = `
      <article class="note-preview-card" role="dialog" aria-modal="true" aria-label="随记预览">
        <h3></h3>
        <p></p>
        <small></small>
      </article>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.classList.remove("is-open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        overlay.classList.remove("is-open");
      }
    });
  }

  const title = overlay.querySelector("h3");
  const content = overlay.querySelector("p");
  const time = overlay.querySelector("small");
  if (title) title.textContent = note.title;
  if (content) content.textContent = note.content;
  if (time) time.textContent = note.time;

  overlay.classList.add("is-open");
}

function renderGallery() {
  const host = document.getElementById("galleryGrid");
  const loadMoreBtn = document.getElementById("loadMoreGalleryBtn");
  const loadMoreWrap = document.getElementById("galleryLoadMoreWrap");
  if (!host) return;

  const items = normalizeGalleryAlbums(safeRead(STORAGE_KEYS.gallery))
    .slice()
    .reverse();
  const pageSize = 4;
  let visibleCount = Math.min(items.length, pageSize);

  if (!items.length) {
    host.innerHTML = "";
    host.appendChild(createEmptyState("暂无图片，请到个人页面上传。"));
    if (loadMoreWrap) loadMoreWrap.style.display = "none";
    return;
  }

  const renderSlice = () => {
    host.innerHTML = "";
    items.slice(0, visibleCount).forEach((item) => {
      const card = document.createElement("article");
      card.className = "gallery-item gallery-album-card";

      const title = document.createElement("h3");
      title.className = "gallery-album-title";
      title.textContent = item.title || "未命名相册";
      card.appendChild(title);

      const meta = document.createElement("small");
      meta.className = "gallery-album-meta";
      meta.textContent = `${(item.images || []).length} 张照片`;
      card.appendChild(meta);

      const photos = document.createElement("div");
      photos.className = "gallery-album-photos";
      (item.images || []).forEach((photo) => {
        const img = document.createElement("img");
        img.src = photo.src;
        img.alt = photo.caption || item.title || "相册照片";
        photos.appendChild(img);
      });
      card.appendChild(photos);

      host.appendChild(card);
    });

    const hasMore = visibleCount < items.length;
    if (loadMoreWrap) loadMoreWrap.style.display = hasMore ? "flex" : "none";
    if (loadMoreBtn) loadMoreBtn.disabled = !hasMore;
  };

  const loadMore = () => {
    if (visibleCount >= items.length) return;
    visibleCount = Math.min(visibleCount + pageSize, items.length);
    renderSlice();
  };

  renderSlice();

  if (loadMoreBtn) loadMoreBtn.onclick = loadMore;

  if (loadMoreWrap && items.length > pageSize) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && visibleCount < items.length) {
          loadMore();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(loadMoreWrap);
  }
}

function createProjectCard(item) {
  const card = document.createElement("article");
  card.className = "content-card";
  const title = document.createElement("h3");
  title.textContent = item.title || "未命名项目";
  const text = document.createElement("p");
  text.textContent = item.description || "";
  const time = document.createElement("small");
  time.textContent = item.createdAt || "";
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(time);
  return card;
}

function renderProjects() {
  const host = document.getElementById("projectsList");
  const sentinel = document.getElementById("projectsListSentinel");
  if (!host) return;

  const allProjects = safeRead(STORAGE_KEYS.projects).slice().reverse();
  let visibleCount = 0;

  const renderSlice = () => {
    const toShow = allProjects.slice(0, visibleCount);
    host.innerHTML = "";
    if (!allProjects.length) {
      host.appendChild(createEmptyState("暂无项目，请到个人页面发布。"));
      if (sentinel) sentinel.style.display = "none";
      return;
    }
    toShow.forEach((item) => host.appendChild(createProjectCard(item)));
    if (sentinel) {
      sentinel.style.display = visibleCount >= allProjects.length ? "none" : "block";
    }
  };

  const loadMore = () => {
    if (visibleCount >= allProjects.length) return;
    visibleCount = Math.min(visibleCount + PAGE_SIZE, allProjects.length);
    renderSlice();
  };

  visibleCount = Math.min(PAGE_SIZE, allProjects.length);
  renderSlice();
  setupAutoLoad("projectsListSentinel", loadMore);
}

function initPersonalManager() {
  if (!canEditSiteContent()) return;

  const noteInput = document.getElementById("noteInput");
  const addNoteBtn = document.getElementById("addNoteBtn");
  const galleryFile = document.getElementById("galleryFile");
  const galleryCaption = document.getElementById("galleryCaption");
  const galleryAlbumTitle = document.getElementById("galleryAlbumTitle");
  const galleryAlbumSelect = document.getElementById("galleryAlbumSelect");
  const addGalleryBtn = document.getElementById("addGalleryBtn");
  const appendGalleryBtn = document.getElementById("appendGalleryBtn");
  const projectTitle = document.getElementById("projectTitle");
  const projectDesc = document.getElementById("projectDesc");
  const addProjectBtn = document.getElementById("addProjectBtn");

  if (addNoteBtn && noteInput) {
    addNoteBtn.addEventListener("click", async () => {
      const content = noteInput.value.trim();
      if (!content) {
        alert("请先输入随记内容");
        return;
      }

      const list = safeRead(STORAGE_KEYS.notes);
      list.push({
        id: makeId("note"),
        title: "随记",
        content,
        createdAt: nowLabel(),
      });
      await safeWrite(STORAGE_KEYS.notes, list);
      noteInput.value = "";
      alert("已发布到随记页面");
    });
  }

  if (galleryFile && (addGalleryBtn || appendGalleryBtn)) {
    const readAsDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("file read error"));
        reader.readAsDataURL(file);
      });

    const refreshAlbumSelect = () => {
      if (!galleryAlbumSelect) return;
      const albums = normalizeGalleryAlbums(safeRead(STORAGE_KEYS.gallery));
      galleryAlbumSelect.innerHTML = '<option value="">请选择已有相册</option>';
      albums.forEach((album) => {
        const option = document.createElement("option");
        option.value = album.id;
        option.textContent = `${album.title || "未命名相册"} (${(album.images || []).length})`;
        galleryAlbumSelect.appendChild(option);
      });
    };

    const publishGalleryFiles = async (appendMode) => {
      const files = Array.from(galleryFile.files || []);
      if (!files.length) {
        alert("请先选择至少一张图片");
        return;
      }

      try {
        const images = await Promise.all(files.map(readAsDataUrl));
        const list = normalizeGalleryAlbums(safeRead(STORAGE_KEYS.gallery));
        const captionBase = (galleryCaption && galleryCaption.value.trim()) || "";
        const photos = images.map((image, idx) => ({
          id: makeId("photo"),
          src: image,
          caption:
            files.length > 1 && captionBase
              ? `${captionBase} ${idx + 1}`
              : captionBase,
          createdAt: nowLabel(),
        }));

        if (appendMode) {
          const targetId = galleryAlbumSelect ? galleryAlbumSelect.value : "";
          if (!targetId) {
            alert("请先选择要追加的相册");
            return;
          }
          const targetAlbum = list.find((album) => album.id === targetId);
          if (!targetAlbum) {
            alert("目标相册不存在，请重新选择");
            refreshAlbumSelect();
            return;
          }
          targetAlbum.images = (targetAlbum.images || []).concat(photos);
        } else {
          const albumTitle = galleryAlbumTitle
            ? galleryAlbumTitle.value.trim()
            : "";
          if (!albumTitle) {
            alert("请先填写相册名称");
            return;
          }
          list.push({
            id: makeId("album"),
            title: albumTitle,
            createdAt: nowLabel(),
            images: photos,
          });
        }

        await safeWrite(STORAGE_KEYS.gallery, list);
        galleryFile.value = "";
        if (galleryCaption) galleryCaption.value = "";
        if (galleryAlbumTitle && !appendMode) galleryAlbumTitle.value = "";
        refreshAlbumSelect();
        alert(
          appendMode
            ? `已向现有图库添加 ${images.length} 张图片`
            : `已创建相册并上传 ${images.length} 张图片`
        );
      } catch (error) {
        alert("图片读取失败，请重新选择后再试");
      }
    };

    if (addGalleryBtn) {
      addGalleryBtn.addEventListener("click", () => {
        publishGalleryFiles(false);
      });
    }

    if (appendGalleryBtn) {
      appendGalleryBtn.addEventListener("click", () => {
        publishGalleryFiles(true);
      });
    }

    refreshAlbumSelect();
  }

  if (addProjectBtn && projectTitle && projectDesc) {
    addProjectBtn.addEventListener("click", async () => {
      const title = projectTitle.value.trim();
      const description = projectDesc.value.trim();
      if (!title || !description) {
        alert("请填写完整的项目标题和介绍");
        return;
      }

      const list = safeRead(STORAGE_KEYS.projects);
      list.push({
        id: makeId("project"),
        title,
        description,
        createdAt: nowLabel(),
      });
      await safeWrite(STORAGE_KEYS.projects, list);
      projectTitle.value = "";
      projectDesc.value = "";
      alert("已发布到项目页面");
    });
  }

  const shortVideoPlatform = document.getElementById("shortVideoPlatform");
  const shortVideoAccount = document.getElementById("shortVideoAccount");
  const shortVideoUrl = document.getElementById("shortVideoUrl");
  const addShortVideoBtn = document.getElementById("addShortVideoBtn");

  if (addShortVideoBtn && shortVideoUrl) {
    addShortVideoBtn.addEventListener("click", async () => {
      const url = shortVideoUrl.value.trim();
      if (!url) {
        alert("请填写主页链接");
        return;
      }
      const list = safeRead(STORAGE_KEYS.shortVideoAccounts);
      if (list.length >= 8) {
        alert("最多添加 8 个账号");
        return;
      }
      list.push({
        id: makeId("sv"),
        platform: (shortVideoPlatform && shortVideoPlatform.value.trim()) || "短视频",
        accountName: (shortVideoAccount && shortVideoAccount.value.trim()) || "未命名",
        url,
        createdAt: nowLabel(),
      });
      await safeWrite(STORAGE_KEYS.shortVideoAccounts, list);
      if (shortVideoPlatform) shortVideoPlatform.value = "";
      if (shortVideoAccount) shortVideoAccount.value = "";
      shortVideoUrl.value = "";
      alert("已添加到首页");
    });
  }
}

function initHomeNoteBinding() {
  const textarea = document.querySelector(".note-card textarea");
  if (!textarea) return;

  if (!canEditSiteContent()) {
    textarea.readOnly = true;
    textarea.placeholder = "仅授权后可编辑（在搜索框输入“白帝”进行验证）";
  }

  function loadLatestNote() {
    const notes = safeRead(STORAGE_KEYS.notes);
    const latest = notes.length ? notes[notes.length - 1] : null;
    if (!latest) return;
    textarea.value = latest.content || "";
    textarea.dataset.lastSaved = latest.content || "";
  }

  async function publishLatestFromHome() {
    const content = textarea.value.trim();
    const lastSaved = textarea.dataset.lastSaved || "";
    if (!content || content === lastSaved) return;

    const notes = safeRead(STORAGE_KEYS.notes);
    notes.push({
      id: makeId("note"),
      title: "随记",
      content,
      createdAt: nowLabel(),
    });
    await safeWrite(STORAGE_KEYS.notes, notes);
    textarea.dataset.lastSaved = content;
  }

  loadLatestNote();

  if (canEditSiteContent()) {
    textarea.addEventListener("blur", publishLatestFromHome);
    textarea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        publishLatestFromHome();
      }
    });
  }
}

function createMessageCard(item) {
  const card = document.createElement("article");
  card.className = "content-card";
  const title = document.createElement("h3");
  title.textContent = item.name || "访客";
  const text = document.createElement("p");
  text.textContent = item.content || "";
  const time = document.createElement("small");
  time.textContent = item.createdAt || "";
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(time);
  return card;
}

function renderMessages() {
  const host = document.getElementById("messageList");
  const sentinel = document.getElementById("messageListSentinel");
  if (!host) return;

  const allMessages = safeRead(STORAGE_KEYS.messages).slice().reverse();
  let visibleCount = 0;

  const renderSlice = () => {
    const toShow = allMessages.slice(0, visibleCount);
    host.innerHTML = "";
    if (!allMessages.length) {
      host.appendChild(createEmptyState("暂无留言，快来写下第一条吧。"));
      if (sentinel) sentinel.style.display = "none";
      return;
    }
    toShow.forEach((item) => host.appendChild(createMessageCard(item)));
    if (sentinel) {
      sentinel.style.display = visibleCount >= allMessages.length ? "none" : "block";
    }
  };

  const loadMore = () => {
    if (visibleCount >= allMessages.length) return;
    visibleCount = Math.min(visibleCount + PAGE_SIZE, allMessages.length);
    renderSlice();
  };

  visibleCount = Math.min(PAGE_SIZE, allMessages.length);
  renderSlice();
  setupAutoLoad("messageListSentinel", loadMore);
}

function renderHomeMessages() {
  const host = document.getElementById("homeMessageList");
  if (!host) return;

  const messages = safeRead(STORAGE_KEYS.messages);
  host.innerHTML = "";

  if (!messages.length) {
    host.appendChild(createEmptyState("暂无留言，快来写下第一条吧。"));
    return;
  }

  messages
    .slice()
    .reverse()
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "message-panel-card";

      const time = document.createElement("small");
      time.textContent = item.createdAt || "";
      const title = document.createElement("h3");
      title.textContent = item.name || "访客";
      const text = document.createElement("p");
      text.textContent = item.content || "";

      card.appendChild(time);
      card.appendChild(title);
      card.appendChild(text);
      host.appendChild(card);
    });
}

function initMessageBoard() {
  const input = document.getElementById("messageInput");
  const nameInput = document.getElementById("messageName");
  const btn = document.getElementById("addMessageBtn");
  if (!input || !btn) return;

  btn.addEventListener("click", async () => {
    const content = input.value.trim();
    const name = nameInput ? nameInput.value.trim() : "";
    if (!content) {
      alert("请先输入留言内容");
      return;
    }

    const list = safeRead(STORAGE_KEYS.messages);
    list.push({
      id: makeId("message"),
      name: name || "访客",
      content,
      createdAt: nowLabel(),
    });
    await safeWrite(STORAGE_KEYS.messages, list);
    input.value = "";
    if (nameInput) nameInput.value = "";
    renderMessages();
  });

  renderMessages();
}

function renderHomeShortVideoBoxes() {
  const host = document.getElementById("homeShortVideoBoxes");
  if (!host) return;

  const list = safeRead(STORAGE_KEYS.shortVideoAccounts);
  host.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const item = list[i];
    const box = document.createElement(item ? "a" : "div");
    box.className = "home-shortvideo-box" + (item ? "" : " is-empty");

    if (item) {
      box.href = item.url;
      box.target = "_blank";
      box.rel = "noopener noreferrer";

      const iconUrl = getPlatformIconUrl(item);
      const avatarWrap = document.createElement("div");
      avatarWrap.className = "box-platform-avatar-wrap";

      if (iconUrl) {
        const img = document.createElement("img");
        img.className = "box-platform-icon";
        img.src = iconUrl;
        img.alt = item.platform || "";
        img.loading = "lazy";
        img.onerror = () => {
          const fallback = document.createElement("span");
          fallback.className = "box-platform-avatar";
          fallback.textContent = getPlatformAvatarChar(item.platform);
          avatarWrap.innerHTML = "";
          avatarWrap.appendChild(fallback);
        };
        avatarWrap.appendChild(img);
      } else {
        const fallback = document.createElement("span");
        fallback.className = "box-platform-avatar";
        fallback.textContent = getPlatformAvatarChar(item.platform);
        avatarWrap.appendChild(fallback);
      }
      box.appendChild(avatarWrap);

      const platform = document.createElement("span");
      platform.className = "box-platform";
      platform.textContent = item.platform || "";

      const name = document.createElement("span");
      name.className = "box-name";
      name.textContent = item.accountName || "未命名";

      box.appendChild(platform);
      box.appendChild(name);
    } else {
      box.textContent = "待添加";
    }

    host.appendChild(box);
  }
}

async function initContentSync() {
  if (window.ZLStorage && typeof window.ZLStorage.init === "function") {
    await window.ZLStorage.init();
  }
  const page = document.body.getAttribute("data-page");
  if (page === "personal") initPersonalManager();
  if (page === "notes") renderNotes();
  if (page === "gallery") renderGallery();
  if (page === "projects") renderProjects();
  if (page === "message") initMessageBoard();
  if (document.body.classList.contains("home-page")) {
    initHomeNoteBinding();
    renderHomeMessages();
    renderHomeShortVideoBoxes();
  }
}

initContentSync().catch(function (err) {
  console.error("Content sync init failed:", err);
});
