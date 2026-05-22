(function () {
  window.KF_CONFIG = Object.freeze({
    googleSheets: {
      sheetId: "16_1x286_gnMDfowln9GuTx5E2mVQk-tXRznGMVw-YMc",
      apiKey: "AIzaSyCfD5ileMOiuqe_-wbKfegR8vjJ2V-9eaU",
      range: "'Form responses 1'!A:Z",
      refreshIntervalMs: 15000,
    },
    supabase: {
      url: "https://nctgxnqmwhcjvswrqtaj.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdGd4bnFtd2hjanZzd3JxdGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDU2NzAsImV4cCI6MjA5NDUyMTY3MH0.4Thjr_pd6UAZaGVHk9r0W2e6Lj7whVNYKFeac55_ktk",
      tableName: "farmers"
    },
    admin: {
      pin: "1502",
      galleryTable: "gallery"
    },
    ui: {
      mobileBatchSize: 8,
      desktopPageSize: 10,
      newEntryWindowDays: 7,
      chartCategoryLimit: 4,
    },
    storageKeys: {
      theme: "kf-theme",
      bookmarks: "kf-bookmarks",
      visibleColumns: "kf-visible-columns",
    },
  });
})();
