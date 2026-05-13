(function () {
  var headerAliases = {
    timestamp: "Date",
    "पूर्ण नाव": "Title",
    "गावाचे नाव": "Location",
    "पत्ता": "Summary",
    "मोबाईल क्रमांक (१)": "Primary Phone",
    "मोबाईल क्रमांक (२)": "Secondary Phone",
    "तालुका": "Taluka",
    "जिल्हा": "Region",
    "राज्य": "State",
    "पिनकोड": "Pincode",
    "एकूण क्षेत्रफळ (एकर / हेक्टर)": "Land Area",
    "झाडांची संख्या": "Tree Count",
    "दोन झाडांमधील अंतर (मीटर)": "Tree Spacing",
    "झाडांची लागवड केलेले वर्ष": "Planting Year",
    "मागील वर्षीचे उत्पादन (टन मध्ये)": "Last Year Production",
    "जांभूळ विक्री / जांभूळ थिकण": "Stage",
    payment: "Payment Link",
    "जांभूळ जात / वाण": "Category",
    "पेमेंट पडताळणी": "Status",
  };

  function buildSheetsUrl(settings) {
    return (
      "https://sheets.googleapis.com/v4/spreadsheets/" +
      encodeURIComponent(settings.sheetId) +
      "/values/" +
      encodeURIComponent(settings.range) +
      "?majorDimension=ROWS&key=" +
      encodeURIComponent(settings.apiKey)
    );
  }

  function cleanCellValue(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function translateHeaderLabel(header, index) {
    var cleanHeader = cleanCellValue(header);
    return headerAliases[cleanHeader] || headerAliases[cleanHeader.toLowerCase()] || cleanHeader || "Column " + (index + 1);
  }

  function makeUniqueHeaders(headers) {
    var counts = {};

    return headers.map(function (header) {
      counts[header] = (counts[header] || 0) + 1;
      return counts[header] === 1 ? header : header + " " + counts[header];
    });
  }

  function parseSheetValues(values) {
    var safeValues = Array.isArray(values) ? values : [];
    var rawHeaders = Array.isArray(safeValues[0]) ? safeValues[0] : [];
    var headers = makeUniqueHeaders(
      rawHeaders.map(function (header, index) {
        return translateHeaderLabel(header, index);
      })
    );
    var rowValues = safeValues.slice(1).map(function (row) {
      return headers.map(function (_, index) {
        return cleanCellValue(Array.isArray(row) ? row[index] : "");
      });
    });
    var records = rowValues.map(function (row) {
      return headers.reduce(function (record, header, index) {
        record[header] = row[index];
        return record;
      }, {});
    });

    return {
      headers: headers,
      records: records,
      values: headers.length ? [headers].concat(rowValues) : [[]],
    };
  }

  async function fetchRows(options) {
    var config = window.KF_CONFIG.googleSheets;
    var response;
    var payload;
    var parsed;

    try {
      response = await fetch(buildSheetsUrl(config), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: options && options.signal ? options.signal : undefined,
      });

      if (!response.ok) {
        throw new Error("Google Sheets request failed with status " + response.status + ".");
      }

      payload = await response.json();
      parsed = parseSheetValues(payload.values || []);

      return {
        mode: "live",
        headers: parsed.headers,
        objects: parsed.records,
        values: parsed.values.length ? parsed.values : [[]],
        message: "Connected to live Google Sheets data.",
      };
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw error;
      }

      if (window.KF_PREVIEW_SHEET && window.KF_PREVIEW_SHEET.values) {
        parsed = parseSheetValues(window.KF_PREVIEW_SHEET.values);

        return {
          mode: "preview",
          headers: parsed.headers,
          objects: parsed.records,
          values: parsed.values.length ? parsed.values : [[]],
          message: "Using preview data. Connect Google Sheets for live sync.",
        };
      }

      throw error;
    }
  }

  window.KFSheetsService = {
    fetchRows: fetchRows,
  };
})();
