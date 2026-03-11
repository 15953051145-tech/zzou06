(() => {
  const AUTH_KEY = "zl_editor_auth_v1";
  const ACCOUNT = "顺利之巅";
  const PASSWORD = "AIziji1314";

  function isAuthorized() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }

  function setAuthorized(value) {
    if (value) {
      sessionStorage.setItem(AUTH_KEY, "1");
    } else {
      sessionStorage.removeItem(AUTH_KEY);
    }
    syncPersonalEntryVisibility();
  }

  function getPersonalLinks() {
    return Array.from(document.querySelectorAll('a[href="./personal.html"], a[href="personal.html"]'));
  }

  function syncPersonalEntryVisibility() {
    const authorized = isAuthorized();
    getPersonalLinks().forEach((link) => {
      link.style.display = authorized ? "" : "none";
    });
  }

  function ensureAuthStyles() {
    if (document.getElementById("authGateStyles")) return;
    const style = document.createElement("style");
    style.id = "authGateStyles";
    style.textContent = `
      .auth-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 220;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.72);
      }
      .auth-modal-overlay.is-open { display: flex; }
      .auth-modal-card {
        width: min(420px, 92vw);
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        background: rgba(10, 10, 10, 0.94);
        color: rgba(255, 255, 255, 0.95);
        padding: 16px;
      }
      .auth-modal-card h3 { margin: 0 0 8px; font-size: 22px; }
      .auth-modal-card p { margin: 0 0 12px; color: rgba(255, 255, 255, 0.7); font-size: 13px; }
      .auth-modal-card label { display: block; margin: 8px 0 6px; font-size: 13px; color: rgba(255, 255, 255, 0.78); }
      .auth-modal-card input {
        width: 100%;
        height: 38px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.26);
        background: rgba(0, 0, 0, 0.4);
        color: rgba(255, 255, 255, 0.94);
        padding: 0 10px;
      }
      .auth-modal-actions { display: flex; gap: 10px; margin-top: 14px; }
      .auth-modal-actions button {
        flex: 1;
        height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.92);
        cursor: pointer;
      }
      .auth-modal-error { min-height: 18px; margin-top: 8px; color: #ff8787; font-size: 12px; }
    `;
    document.head.appendChild(style);
  }

  let modal = null;
  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement("section");
    modal.className = "auth-modal-overlay";
    modal.innerHTML = `
      <article class="auth-modal-card" role="dialog" aria-modal="true" aria-label="身份验证">
        <h3>身份验证</h3>
        <p>请输入账号和密码以进入个人编辑页面</p>
        <label for="authAccountInput">账号</label>
        <input id="authAccountInput" type="text" autocomplete="username" />
        <label for="authPasswordInput">密码</label>
        <input id="authPasswordInput" type="password" autocomplete="current-password" />
        <div class="auth-modal-actions">
          <button id="authSubmitBtn" type="button">验证</button>
          <button id="authCancelBtn" type="button">取消</button>
        </div>
        <div id="authErrorText" class="auth-modal-error"></div>
      </article>
    `;
    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector("#authCancelBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("is-open");
      });
    }

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("is-open");
      }
    });

    return modal;
  }

  function openAuthModal(onSuccess) {
    ensureAuthStyles();
    const node = ensureModal();
    const accountInput = node.querySelector("#authAccountInput");
    const passwordInput = node.querySelector("#authPasswordInput");
    const errorText = node.querySelector("#authErrorText");
    const submitBtn = node.querySelector("#authSubmitBtn");

    if (!accountInput || !passwordInput || !submitBtn || !errorText) return;

    accountInput.value = "";
    passwordInput.value = "";
    errorText.textContent = "";
    node.classList.add("is-open");
    accountInput.focus();

    const submit = () => {
      const account = accountInput.value.trim();
      const password = passwordInput.value;
      if (account === ACCOUNT && password === PASSWORD) {
        setAuthorized(true);
        node.classList.remove("is-open");
        if (typeof onSuccess === "function") onSuccess();
      } else {
        errorText.textContent = "账号或密码错误";
      }
    };

    submitBtn.onclick = submit;
    passwordInput.onkeydown = (event) => {
      if (event.key === "Enter") submit();
    };
  }

  function requireAuth(onSuccess) {
    if (isAuthorized()) {
      if (typeof onSuccess === "function") onSuccess();
      return;
    }
    openAuthModal(onSuccess);
  }

  window.EditorAuth = {
    isAuthorized,
    openAuthModal,
    requireAuth,
    logout: () => setAuthorized(false),
  };

  syncPersonalEntryVisibility();

  if (document.body.getAttribute("data-page") === "personal" && !isAuthorized()) {
    window.location.href = "./index.html";
  }
})();
