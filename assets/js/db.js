(function () {
  // Direct REST API approach - no external library needed!

  function getConfig() {
    return window.KF_CONFIG && window.KF_CONFIG.supabase ? window.KF_CONFIG.supabase : null;
  }

  function getHeaders() {
    var cfg = getConfig();
    if (!cfg) return null;
    return {
      "apikey": cfg.anonKey,
      "Authorization": "Bearer " + cfg.anonKey,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    };
  }

  async function fetchRows() {
    var cfg = getConfig();
    if (!cfg) throw new Error("Supabase config not found.");

    // Don't order by a specific column - just fetch all
    var url = cfg.url + "/rest/v1/" + cfg.tableName + "?select=*";

    var response = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error("Supabase fetch error:", response.status, errText);
      // Fall back to Google Sheets
      return fallbackToSheets();
    }

    var data = await response.json();

    if (!data || data.length === 0) {
      // No data in Supabase yet, fall back to Google Sheets
      console.log("No data in Supabase, falling back to Google Sheets.");
      return fallbackToSheets();
    }

    var headers = Object.keys(data[0]);
    var values = [headers].concat(data.map(function (row) {
      return headers.map(function (h) { return row[h] != null ? String(row[h]) : ""; });
    }));

    return {
      mode: 'live',
      headers: headers,
      objects: data,
      values: values,
      message: "Connected to Supabase database."
    };
  }

  async function fallbackToSheets() {
    if (window.KFSheetsService) {
      console.log("Falling back to Google Sheets...");
      return window.KFSheetsService.fetchRows({});
    }
    throw new Error("No data source available.");
  }

  async function insertRow(rowData) {
    var cfg = getConfig();
    if (!cfg) throw new Error("Supabase config not found.");

    var url = cfg.url + "/rest/v1/" + cfg.tableName;

    var response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(rowData)
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error("Supabase insert failed (" + response.status + "): " + errText);
    }

    return true;
  }

  async function insertMany(rows) {
    var cfg = getConfig();
    if (!cfg) throw new Error("Supabase config not found.");

    var url = cfg.url + "/rest/v1/" + cfg.tableName;

    var response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(rows)
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error("Supabase batch insert failed (" + response.status + "): " + errText);
    }

    return true;
  }

  window.KFDatabaseService = {
    fetchRows: fetchRows,
    insertRow: insertRow,
    insertMany: insertMany
  };
})();
