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

  // Bidirectional mapping for Supabase truncated columns
  var DB_TO_FRONTEND_MAP = {
    "एकूण क्षेत्रफळ (एकर / हेक": "एकूण क्षेत्रफळ (एकर / हेक्टर)",
    "दोन झाडांमधील अंतर (मीट": "दोन झाडांमधील अंतर (मीटर)",
    "झाडांची लागवड केलेले वर": "झाडांची लागवड केलेले वर्ष",
    "मागील वर्षीचे उत्पादन (": "मागील वर्षीचे उत्पादन (टन मध्ये)",
    "जांभूळ विक्री / जांभूळ थ": "जांभूळ विक्री / जांभूळ थिकण"
  };

  var FRONTEND_TO_DB_MAP = {
    "एकूण क्षेत्रफळ (एकर / हेक्टर)": "एकूण क्षेत्रफळ (एकर / हेक",
    "दोन झाडांमधील अंतर (मीटर)": "दोन झाडांमधील अंतर (मीट",
    "झाडांची लागवड केलेले वर्ष": "झाडांची लागवड केलेले वर",
    "मागील वर्षीचे उत्पादन (टन मध्ये)": "मागील वर्षीचे उत्पादन (",
    "जांभूळ विक्री / जांभूळ थिकण": "जांभूळ विक्री / जांभूळ थ"
  };

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

    var mappedData = data.map(function (row) {
      var newRow = {};
      for (var k in row) {
        var mappedKey = DB_TO_FRONTEND_MAP[k] || k;
        newRow[mappedKey] = row[k];
      }
      return newRow;
    });

    var headers = Object.keys(mappedData[0]);
    var values = [headers].concat(mappedData.map(function (row) {
      return headers.map(function (h) { return row[h] != null ? String(row[h]) : ""; });
    }));

    return {
      mode: 'live',
      headers: headers,
      objects: mappedData,
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

    var dbRowData = {};
    for (var k in rowData) {
      var mappedKey = FRONTEND_TO_DB_MAP[k] || k;
      dbRowData[mappedKey] = rowData[k];
    }

    var response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(dbRowData)
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

    var dbRows = rows.map(function(row) {
      var dbRow = {};
      for (var k in row) {
        var mappedKey = FRONTEND_TO_DB_MAP[k] || k;
        dbRow[mappedKey] = row[k];
      }
      return dbRow;
    });

    var response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(dbRows)
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
