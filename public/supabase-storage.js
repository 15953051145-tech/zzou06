/**
 * Supabase 存储适配层
 * 当 SUPABASE_URL 和 SUPABASE_ANON_KEY 配置时使用云数据库，否则使用 localStorage
 */
(function () {
  const STORAGE_KEYS = [
    "zl_notes_data_v1",
    "zl_gallery_data_v1",
    "zl_projects_data_v1",
    "zl_messages_data_v1",
    "zl_shortvideo_accounts_v1",
  ];

  window.ZL_DATA_CACHE = {};
  window.ZL_SUPABASE_READY = false;

  window.ZLStorage = {
    async init() {
      const url = window.SUPABASE_URL;
      const key = window.SUPABASE_ANON_KEY;
      if (!url || !key || typeof window.supabase === "undefined") {
        return;
      }
      try {
        const { createClient } = window.supabase;
        window.ZL_SUPABASE = createClient(url, key);
        await this.loadAll();
        window.ZL_SUPABASE_READY = true;
      } catch (err) {
        console.warn("Supabase init failed, using localStorage:", err);
      }
    },

    async loadAll() {
      const client = window.ZL_SUPABASE;
      if (!client) return;
      for (const key of STORAGE_KEYS) {
        try {
          const { data, error } = await client
            .from("zl_data")
            .select("data")
            .eq("key", key)
            .single();
          const items = !error && data && Array.isArray(data.data) ? data.data : [];
          window.ZL_DATA_CACHE[key] = items;
        } catch (_) {
          window.ZL_DATA_CACHE[key] = [];
        }
      }
    },

    read(key) {
      if (window.ZL_SUPABASE_READY && key in window.ZL_DATA_CACHE) {
        return window.ZL_DATA_CACHE[key].slice();
      }
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    },

    async write(key, data) {
      const arr = Array.isArray(data) ? data : [];
      if (window.ZL_SUPABASE_READY && window.ZL_SUPABASE) {
        window.ZL_DATA_CACHE[key] = arr.slice();
        const { error } = await window.ZL_SUPABASE
          .from("zl_data")
          .upsert({ key, data: arr }, { onConflict: "key" });
        if (error) throw error;
      } else {
        localStorage.setItem(key, JSON.stringify(arr));
      }
    },
  };
})();
