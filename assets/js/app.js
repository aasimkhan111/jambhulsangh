(function () {
  var config = window.KF_CONFIG;
  var PAYMENT_MODE = "upi"; // Toggle between "upi" and "razorpay"
  var compressedScreenshotBase64 = "";

  function handleScreenshotSelect(e) {
    var file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      showToast("कृपया फक्त इमेज फाईल (JPG, PNG) अपलोड करा.", "error");
      e.target.value = "";
      return;
    }

    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        var maxWidth = 600;
        var width = img.width;
        var height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress screenshot to high-efficiency base64 JPEG
        compressedScreenshotBase64 = canvas.toDataURL("image/jpeg", 0.65);

        var previewImg = document.getElementById("uploadPreviewImage");
        var previewContainer = document.getElementById("uploadPreviewContainer");
        var placeholder = document.getElementById("uploadPlaceholder");
        var fileNameEl = document.getElementById("uploadFileName");

        if (previewImg && previewContainer && placeholder && fileNameEl) {
          previewImg.src = compressedScreenshotBase64;
          fileNameEl.textContent = file.name;
          placeholder.classList.add("hidden");
          previewContainer.classList.remove("hidden");
        }

        var uploadWrapper = document.querySelector(".screenshot-upload-wrapper");
        if (uploadWrapper) {
          uploadWrapper.style.borderColor = "";
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  var desktopMedia = window.matchMedia("(min-width: 1024px)");
  var currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  var dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  var timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  var photoSlides = [
    {
      src: "committee.png?v=5",
      alt: "जांभूळ बागाईतदार संघ महाराष्ट्र राज्य - राज्य कार्यकारिणी",
      caption: "State Executive Committee / राज्य कार्यकारिणी",
    }
  ];

  var semanticAliases = {
    id: ["id", "uid", "slug", "code"],
    title: ["title", "name", "listing", "item", "project", "farm", "पूर्ण नाव", "पूर्ण_नाव"],
    category: ["category", "segment", "type", "group", "जांभूळ जात / वाण", "जांभूळ_जात_वाण"],
    status: ["status", "state"],
    price: ["price", "amount", "value", "cost", "rate"],
    date: ["date", "created", "created_at", "createdat", "updated", "published", "नोंदणी तारीख", "नोंदणी_तारीख", "timestamp"],
    summary: ["summary", "description", "details", "notes", "about", "पत्ता"],
    image: ["image", "imageurl", "image_url", "thumbnail", "logo", "photo"],
    owner: ["owner", "manager", "agent", "lead", "contact"],
    location: ["location", "city", "market", "region", "गावाचे नाव", "गावाचे_नाव"],
    phone: ["phone", "mobile", "tel", "contact_no", "मोबाईल क्रमांक (१)", "मोबाईल_क्रमांक_१"],
    stage: ["stage", "priority", "label", "tier", "जांभूळ विक्री / जांभूळ थिकण", "जांभूळ_विक्री_जांभूळ_थिकण"],
  };

  var state = {
    rows: [],
    columns: [],
    semanticMap: {},
    filterOptions: {
      categories: [],
      statuses: [],
    },
    filters: {
      category: "all",
      status: "all",
      date: "all",
      minPrice: "",
      maxPrice: "",
    },
    sort: {
      key: "",
      direction: "desc",
    },
    visibleColumns: {},
    currentPage: 1,
    mobileVisibleCount: config.ui.mobileBatchSize,
    loading: true,
    isFetching: false,
    isColumnMenuOpen: false,
    selectedRowId: null,
    theme: "light",
    searchTerm: "",
    sync: {
      mode: "connecting",
      message: "Connecting to Google Sheets.",
      lastUpdated: null,
    },
    autoRefreshTimer: null,
    toastTimer: null,
    revealObserver: null,
    infiniteObserver: null,
    slider: {
      index: 0,
      timer: null,
      touchStartX: null,
    },
    language: localStorage.getItem("kf_lang") || "en",
    translationCache: {},
  };

  var refs = {};

  var i18n = {
    en: {
      brandName: "Jambhulsangh",
      brandSub: "Jambhul growers network",
      refresh: "Refresh",
      darkMode: "Dark mode",
      lightMode: "Light mode",
      overview: "Overview",
      listings: "Listings",
      totalEntries: "Total entries",
      totalEntriesDesc: "Full synced inventory available for search and filtering.",
      live: "Live",
      sync: "Sync",
      searchPlaceholder: "Search listings...",
      filters: "Filters",
      categoryLabel: "Category",
      statusLabel: "Status",
      dateLabel: "Date",
      priceRangeLabel: "Price range",
      anyTime: "Any time",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      last90Days: "Last 90 days",
      lastYear: "Last year",
      allCategories: "All categories",
      allStatuses: "All statuses",
      resetAll: "Reset all",
      done: "Done",
      close: "Close",
      noCategoryData: "No category data available yet.",
      connecting: "Connecting to Google Sheets.",
      updating: "Updating...",
      saved: "Saved record",
      save: "Save record",
      filterNote: "Live data refreshes every 15 seconds and whenever the tab becomes active again, so the dashboard stays current without a redeploy.",
      results: "results",
      of: "of",
      lastSync: "Last sync ",
      lastUpdate: "Last update ",
      waitingFirstSync: "Waiting for first sync",
      searchLabel: "Search",
      noResultsTitle: "No matching results",
      noResultsDesc: "Try adjusting your search term or filtering criteria to find what you are looking for.",
      "No category data available yet.": "No category data available yet.",
      // Column translations
      "Title": "Title",
      "Category": "Category",
      "Price": "Price",
      "Date": "Date",
      "Status": "Status",
      "Actions": "Actions",
      "stage": "Stage",
      "location": "Location",
      "owner": "Owner",
      "summary": "Summary",
      // UI element labels
      "Details": "Details",
      "Save": "Save",
      "Saved": "Saved",
      "Page": "Page",
      "Prev": "Prev",
      "Next": "Next",
      "Min": "Min",
      "Max": "Max",
      "Reset filters": "Reset filters",
      "No listings match this view.": "No listings match this view.",
      "Try widening the search, relaxing filters, or reconnecting your sheet configuration to bring more results into view.": "Try widening the search, relaxing filters, or reconnecting your sheet configuration to bring more results into view.",
      // Common Categories / Status translations to Marathi
      "Fruit": "Fruit",
      "Grains": "Grains",
      "Vegetables": "Vegetables",
      "Active": "Active",
      "Pending": "Pending",
      "Completed": "Completed",
      // Supabase column name translations
      "timestamp": "Date",
      "name": "Name",
      "village": "Village",
      "address": "Address",
      "phone1": "Phone 1",
      "phone2": "Phone 2",
      "taluka": "Taluka",
      "district": "District",
      "state": "State",
      "pincode": "Pincode",
      "area": "Area",
      "treecount": "Tree Count",
      "distance": "Tree Spacing",
      "plantyear": "Planting Year",
      "yield": "Yield",
      "saletype": "Sale Type",
      "variety": "Variety",
      "created_at": "Registration Date",
      "id": "ID",
      "All": "All",
      "Showing": "Showing",
      "listings loaded.": "listings loaded."
    },
    mr: {
      brandName: "जांभूळसंघ",
      brandSub: "जांभूळ उत्पादक नेटवर्क",
      refresh: "रिफ्रेश करा",
      darkMode: "डार्क मोड",
      lightMode: "लाईट मोड",
      overview: "आढावा",
      listings: "याद्या",
      totalEntries: "एकूण नोंदी",
      totalEntriesDesc: "शोध आणि फिल्टरसाठी पूर्ण सिंक केलेली यादी उपलब्ध आहे.",
      live: "थेट डेटा",
      sync: "सिंक",
      searchPlaceholder: "शोधा...",
      filters: "फिल्टर्स",
      categoryLabel: "श्रेणी",
      statusLabel: "स्थिती",
      dateLabel: "तारीख",
      priceRangeLabel: "किंमत श्रेणी",
      anyTime: "कधीही",
      last7Days: "गेल्या ७ दिवसांत",
      last30Days: "गेल्या ३० दिवसांत",
      last90Days: "गेल्या ९० दिवसांत",
      lastYear: "गेल्या वर्षी",
      allCategories: "सर्व श्रेणी",
      allStatuses: "सर्व स्थिती",
      resetAll: "सर्व रीसेट करा",
      done: "झाले",
      close: "बंद करा",
      noCategoryData: "अद्याप कोणतीही श्रेणी उपलब्ध नाही.",
      connecting: "गुगल शीटशी कनेक्ट करत आहे...",
      updating: "अपडेट करत आहे...",
      saved: "नोंद जतन केली",
      save: "नोंद जतन करा",
      filterNote: "थेट डेटा दर १५ सेकंदांनी आणि टॅब पुन्हा सक्रिय झाल्यावर रिफ्रेश होतो, जेणेकरून डॅशबोर्ड नवीन राहतो.",
      results: "परिणाम",
      of: "पैकी",
      lastSync: "शेवटचे सिंक ",
      lastUpdate: "शेवटचे अपडेट ",
      waitingFirstSync: "पहिल्या सिंकची वाट पाहत आहे",
      searchLabel: "शोधा",
      noResultsTitle: "काहीही सापडले नाही",
      noResultsDesc: "कृपया तुमचा शोध शब्द किंवा फिल्टर बदलून पहा.",
      "All": "सर्व",
      "Showing": "दर्शवत आहे",
      "listings loaded.": "याद्या लोड केल्या.",
      "No category data available yet.": "अद्याप कोणतीही श्रेणीची आकडेवारी उपलब्ध नाही.",
      // Column translations
      "Title": "शीर्षक",
      "Category": "श्रेणी",
      "Price": "किंमत",
      "Date": "तारीख",
      "Status": "स्थिती",
      "Actions": "कृती",
      "stage": "टप्पा",
      "location": "स्थान",
      "owner": "मालक",
      "summary": "थोडक्यात माहिती",
      // UI element labels
      "Details": "तपशील",
      "Save": "जतन करा",
      "Saved": "जतन केले",
      "Page": "पान",
      "Prev": "मागे",
      "Next": "पुढे",
      "Min": "किमान",
      "Max": "कमाल",
      "Reset filters": "फिल्टर रीसेट करा",
      "No listings match this view.": "या दृश्याशी जुळणारे कोणतेही रेकॉर्ड सापडले नाही.",
      "Try widening the search, relaxing filters, or reconnecting your sheet configuration to bring more results into view.": "शोध शब्द बदलण्याचा प्रयत्न करा, फिल्टर काढा किंवा अधिक परिणाम पाहण्यासाठी तुमचे शीट कनेक्शन तपासा.",
      // Common Categories / Status translations to Marathi
      "Fruit": "फळे",
      "Grains": "धान्य",
      "Vegetables": "भाज्या",
      "Active": "सक्रिय",
      "Pending": "प्रलंबित",
      "Completed": "पूर्ण झाले",
      // Supabase column name translations
      "timestamp": "तारीख",
      "name": "पूर्ण नाव",
      "village": "गाव",
      "address": "पत्ता",
      "phone1": "मोबाईल १",
      "phone2": "मोबाईल २",
      "taluka": "तालुका",
      "district": "जिल्हा",
      "state": "राज्य",
      "pincode": "पिनकोड",
      "area": "क्षेत्रफळ (एकर)",
      "treecount": "झाडांची संख्या",
      "distance": "झाडांमधील अंतर",
      "plantyear": "लागवड वर्ष",
      "yield": "मागील उत्पादन",
      "saletype": "विक्री प्रकार",
      "variety": "जांभूळ प्रकार",
      "created_at": "नोंदणी तारीख",
      "id": "ओळख क्रमांक"
    }
  };

  function t(key) {
    var lang = state.language || "en";
    return (i18n[lang] && i18n[lang][key]) || i18n["en"][key] || key;
  }

  function translateSheetContent(str) {
    return str || "";
  }

  function collectTranslateableStrings(rows) {
    var strings = [];
    rows.forEach(function (row) {
      if (row.title) strings.push(row.title);
      if (row.category) strings.push(row.category);
      if (row.summary) strings.push(row.summary);
      if (row.owner) strings.push(row.owner);
      if (row.location) strings.push(row.location);
      if (row.stage) strings.push(row.stage);
      
      if (row.extraFields) {
        row.extraFields.forEach(function (f) {
          if (f.value) strings.push(f.value);
        });
      }
    });
    return strings;
  }

  async function translateSingle(str, targetLang) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + targetLang + "&dt=t&q=" + encodeURIComponent(str);
    try {
      var response = await fetch(url);
      var json = await response.json();
      var translated = "";
      if (json && json[0]) {
        for (var j = 0; j < json[0].length; j++) {
          if (json[0][j] && json[0][j][0]) {
            translated += json[0][j][0];
          }
        }
      }
      return translated || str;
    } catch (err) {
      console.error("Single translation failed for: " + str, err);
      return str;
    }
  }

  async function translateBatch(strings, targetLang) {
    if (!strings.length) return {};
    
    var uniqueStrings = Array.from(new Set(strings)).filter(Boolean);
    var toTranslate = uniqueStrings.filter(function (str) {
      if (targetLang === "en") {
        return /[\u0900-\u097F]/.test(str);
      } else {
        return /[a-zA-Z]/.test(str);
      }
    });

    var results = {};
    uniqueStrings.forEach(function (str) {
      results[str] = str;
    });

    if (!toTranslate.length) {
      return results;
    }

    try {
      var promises = toTranslate.map(function (str) {
        return translateSingle(str, targetLang).then(function (res) {
          results[str] = res;
        });
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("Batch translation promises failed", err);
    }

    return results;
  }

  async function translateDataset(rows, targetLang) {
    return;
  }

  async function toggleLanguage() {
    var nextLang = state.language === "en" ? "mr" : "en";
    state.language = nextLang;
    localStorage.setItem("kf_lang", nextLang);
    
    translateUI();
    render();
    showToast(nextLang === "en" ? "Switched to English" : "मराठी भाषेत बदलले", "info");
  }

  function translateUI() {
    var lang = state.language;
    
    // Update brand elements
    var brandName = document.querySelector(".brand-copy strong");
    var brandSub = document.querySelector(".brand-copy small");
    if (brandName) brandName.textContent = t("brandName");
    if (brandSub) brandSub.textContent = t("brandSub");

    // Update nav links
    var overviewLink = document.querySelector('.nav-links a[href="#overview"]');
    var listingsLink = document.querySelector('.nav-links a[href="#listings"]');
    if (overviewLink) overviewLink.textContent = t("overview");
    if (listingsLink) listingsLink.textContent = t("listings");

    // Update buttons
    if (refs.refreshButton) refs.refreshButton.textContent = t("refresh");
    if (refs.themeToggle) {
      refs.themeToggle.textContent = state.theme === "dark" ? t("lightMode") : t("darkMode");
    }
    if (refs.langToggle) {
      refs.langToggle.textContent = lang === "en" ? "मराठी" : "English";
    }

    // Update mobile actions menu elements
    var menuRefreshText = document.getElementById("menuRefreshText");
    var menuThemeText = document.getElementById("menuThemeText");
    var menuLangText = document.getElementById("menuLangText");
    var menuCloseBtn = document.getElementById("closeMobileMenuButton");
    var menuOverviewText = document.getElementById("menuOverviewText");
    var menuListingsText = document.getElementById("menuListingsText");
    var mobileMenuTitle = document.getElementById("mobileMenuTitle");
    var mobileMenuSubtitle = document.getElementById("mobileMenuSubtitle");

    if (mobileMenuTitle) mobileMenuTitle.textContent = lang === "en" ? "Quick Actions" : "जलद कृती";
    if (mobileMenuSubtitle) mobileMenuSubtitle.textContent = lang === "en" ? "Menu" : "मेनू";
    if (menuCloseBtn) menuCloseBtn.textContent = lang === "en" ? "Close" : "बंद करा";
    if (menuRefreshText) menuRefreshText.textContent = t("refresh");
    if (menuThemeText) {
      menuThemeText.textContent = state.theme === "dark" ? t("lightMode") : t("darkMode");
    }
    if (menuLangText) {
      menuLangText.textContent = lang === "en" ? "मराठी" : "English";
    }
    if (menuOverviewText) menuOverviewText.textContent = t("overview");
    if (menuListingsText) menuListingsText.textContent = t("listings");

    // Update search placeholder
    if (refs.searchInput) {
      refs.searchInput.placeholder = t("searchPlaceholder");
    }
    var searchIcon = document.querySelector(".search-icon");
    if (searchIcon) {
      searchIcon.textContent = t("searchLabel");
    }

    // Refresh dynamic components
    render();
  }

  function init() {
    if (!window.KF_CONFIG) {
      console.error("Kute Farmers: KF_CONFIG is not defined. config.js may have failed to load.");
      return;
    }

    if (!window.KFSheetsService) {
      console.error("Kute Farmers: KFSheetsService is not defined. sheets.js may have failed to load.");
      return;
    }

    cacheDom();
    state.theme = getStoredTheme();
    applyTheme(state.theme);
    bindEvents();
    initPhotoSlider();
    initRevealObserver();
    initInfiniteScroll();
    renderSkeletonState();
    loadData({ reason: "initial" });
    // startAutoRefresh();
    translateUI();
  }

  function cacheDom() {
    refs.syncIndicator = document.getElementById("syncIndicator");
    refs.themeToggle = document.getElementById("themeToggle");
    refs.refreshButton = document.getElementById("refreshButton");
    refs.heroMetrics = document.getElementById("heroMetrics");
    refs.chartBars = document.getElementById("chartBars");
    refs.photoSliderTrack = document.getElementById("photoSliderTrack");
    refs.statsGrid = document.getElementById("statsGrid");
    refs.searchInput = document.getElementById("searchInput");
    refs.clearSearchButton = document.getElementById("clearSearchButton");
    refs.openFilterSheetButton = document.getElementById("openFilterSheetButton");
    refs.closeFilterSheetButton = document.getElementById("closeFilterSheetButton");
    refs.resetFiltersMobile = document.getElementById("resetFiltersMobile");
    refs.doneFilterSheetButton = document.getElementById("doneFilterSheetButton");
    refs.mobileFilters = document.getElementById("mobileFilters");
    refs.mobileCards = document.getElementById("mobileCards");
    refs.tableHead = document.getElementById("tableHead");
    refs.tableBody = document.getElementById("tableBody");
    refs.pagination = document.getElementById("pagination");
    refs.columnToggleButton = document.getElementById("columnToggleButton");
    refs.columnMenu = document.getElementById("columnMenu");
    refs.emptyState = document.getElementById("emptyState");
    refs.loadMoreHint = document.getElementById("loadMoreHint");
    refs.infiniteSentinel = document.getElementById("infiniteSentinel");
    refs.filterSheetBackdrop = document.getElementById("filterSheetBackdrop");
    refs.detailModalBackdrop = document.getElementById("detailModalBackdrop");
    refs.closeDetailModalButton = document.getElementById("closeDetailModalButton");
    refs.shareRecordButton = document.getElementById("shareRecordButton");
    refs.detailBody = document.getElementById("detailBody");
    refs.detailTitle = document.getElementById("detailTitle");
    refs.langToggle = document.getElementById("langToggle");
    refs.toast = document.getElementById("toast");
    
    // Mobile action menu refs
    refs.mobileMenuButton = document.getElementById("mobileMenuButton");
    refs.closeMobileMenuButton = document.getElementById("closeMobileMenuButton");
    refs.mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
    refs.menuRefreshButton = document.getElementById("menuRefreshButton");
    refs.menuThemeToggle = document.getElementById("menuThemeToggle");
    refs.menuLangToggle = document.getElementById("menuLangToggle");
    refs.menuOverviewLink = document.getElementById("menuOverviewLink");
    refs.menuListingsLink = document.getElementById("menuListingsLink");
    refs.menuMigrateButton = document.getElementById("menuMigrateButton");

    // Registration refs
    refs.openRegistrationButton = document.getElementById("openRegistrationButton");
    refs.closeRegistrationButton = document.getElementById("closeRegistrationButton");
    refs.registrationModalBackdrop = document.getElementById("registrationModalBackdrop");
    refs.regStep1 = document.getElementById("regStep1");
    refs.regStep2 = document.getElementById("regStep2");
    refs.regPrevBtn = document.getElementById("regPrevBtn");
    refs.regNextBtn = document.getElementById("regNextBtn");
    refs.regSubmitBtn = document.getElementById("regSubmitBtn");
    refs.regStepTitle = document.getElementById("regStepTitle");
    refs.regFormInputs = document.querySelectorAll("#regStep1 input, #regStep1 textarea, #regStep1 select");
  }

  function bindEvents() {
    var debouncedSearch = debounce(function (value) {
      state.searchTerm = value.trim();
      resetListingViewport();
      render();
    }, 260);

    refs.themeToggle.addEventListener("click", toggleTheme);
    if (refs.langToggle) {
      refs.langToggle.addEventListener("click", toggleLanguage);
    }
    if (refs.refreshButton) {
      refs.refreshButton.addEventListener("click", function () {
        loadData({ reason: "manual", announce: true });
      });
    }
    refs.searchInput.addEventListener("input", function (event) {
      debouncedSearch(event.target.value);
    });
    refs.clearSearchButton.addEventListener("click", function () {
      refs.searchInput.value = "";
      state.searchTerm = "";
      resetListingViewport();
      render();
    });
    refs.openFilterSheetButton.addEventListener("click", openFilterSheet);
    refs.closeFilterSheetButton.addEventListener("click", closeFilterSheet);
    refs.doneFilterSheetButton.addEventListener("click", closeFilterSheet);
    refs.resetFiltersMobile.addEventListener("click", resetFilters);
    refs.columnToggleButton.addEventListener("click", toggleColumnMenu);
    refs.tableHead.addEventListener("click", handleSortClick);
    refs.pagination.addEventListener("click", handlePaginationClick);
    refs.mobileCards.addEventListener("click", handleRecordAction);
    refs.tableBody.addEventListener("click", handleRecordAction);
    refs.detailBody.addEventListener("click", handleRecordAction);
    refs.emptyState.addEventListener("click", handleRecordAction);
    refs.shareRecordButton.addEventListener("click", shareSelectedRecord);
    refs.closeDetailModalButton.addEventListener("click", closeDetailModal);
    
    // Bind mobile actions menu events
    if (refs.mobileMenuButton) {
      refs.mobileMenuButton.addEventListener("click", openMobileMenu);
    }
    if (refs.closeMobileMenuButton) {
      refs.closeMobileMenuButton.addEventListener("click", closeMobileMenu);
    }
    if (refs.menuRefreshButton) {
      refs.menuRefreshButton.addEventListener("click", function () {
        loadData({ reason: "manual", announce: true });
        closeMobileMenu();
      });
    }
    if (refs.menuThemeToggle) {
      refs.menuThemeToggle.addEventListener("click", function () {
        toggleTheme();
      });
    }
    if (refs.menuLangToggle) {
      refs.menuLangToggle.addEventListener("click", function () {
        toggleLanguage();
      });
    }
    if (refs.menuOverviewLink) {
      refs.menuOverviewLink.addEventListener("click", closeMobileMenu);
    }
    if (refs.menuListingsLink) {
      refs.menuListingsLink.addEventListener("click", closeMobileMenu);
    }
    if (refs.menuMigrateButton) {
      refs.menuMigrateButton.addEventListener("click", handleMigration);
    }

    // Registration events
    if (refs.openRegistrationButton) {
      refs.openRegistrationButton.addEventListener("click", openRegistrationModal);
    }
    if (refs.closeRegistrationButton) {
      refs.closeRegistrationButton.addEventListener("click", closeRegistrationModal);
    }
    if (refs.regNextBtn) {
      refs.regNextBtn.addEventListener("click", function() {
        setRegistrationStep(2);
      });
    }
    if (refs.regPrevBtn) {
      refs.regPrevBtn.addEventListener("click", function() {
        setRegistrationStep(1);
      });
    }
    if (refs.regSubmitBtn) {
      refs.regSubmitBtn.addEventListener("click", handleRegistrationSubmit);
    }

    // UPI Screenshot Upload and Copy Listeners
    var regScreenshot = document.getElementById("regScreenshot");
    if (regScreenshot) {
      regScreenshot.addEventListener("change", handleScreenshotSelect);
    }

    var copyBtn = document.getElementById("copyUpiIdBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", function() {
        var upiId = document.getElementById("upiIdValue").textContent;
        navigator.clipboard.writeText(upiId).then(function() {
          showToast("UPI ID Copied! / UPI ID कॉपी झाला!", "info");
          var originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "<span>Copied!</span>";
          setTimeout(function() {
            copyBtn.innerHTML = originalText;
          }, 1500);
        }).catch(function(err) {
          console.error("Could not copy text: ", err);
        });
      });
    }

    // Gallery CTA events
    var viewAllBtn = document.getElementById("viewAllMembersBtn");
    if (viewAllBtn) {
      viewAllBtn.addEventListener("click", function () {
        var listingsSec = document.getElementById("listings");
        if (listingsSec) {
          listingsSec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    var joinEJambhulsanghBtn = document.getElementById("joinEJambhulsanghBtn");
    if (joinEJambhulsanghBtn) {
      joinEJambhulsanghBtn.addEventListener("click", function () {
        if (typeof openRegistrationModal === "function") {
          openRegistrationModal();
        } else if (refs.openRegistrationButton) {
          refs.openRegistrationButton.click();
        }
      });
    }

    document.addEventListener("input", handleFilterInput);
    document.addEventListener("change", handleFilterInput);
    document.addEventListener("keydown", handleKeyboardShortcuts);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);
    document.addEventListener("click", handleGlobalClick);
    desktopMedia.addEventListener("change", handleViewportChange);
  }

  function initPhotoSlider() {
    if (!refs.photoSliderTrack) {
      return;
    }

    refs.photoSliderTrack.innerHTML = photoSlides
      .map(function (slide, index) {
        var isCommittee = slide.src.indexOf("committee.png") !== -1;
        var figureStyle = isCommittee ? 'style="background-color: #ffffff;"' : "";
        var imgStyle = isCommittee ? 'style="object-fit: contain;"' : "";
        return (
          '<figure class="photo-slide" ' + figureStyle + '>' +
          '<img src="' +
          escapeAttribute(slide.src) +
          '" alt="' +
          escapeAttribute(slide.alt) +
          '" ' + imgStyle +
          ' loading="' +
          (index === 0 ? "eager" : "lazy") +
          '">' +
          "</figure>"
        );
      })
      .join("");

    state.slider = {
      index: 0,
      timer: null
    };

    startPhotoSlider();
  }

  function startPhotoSlider() {
    if (!refs.photoSliderTrack) {
      return;
    }

    if (state.slider.timer) {
      window.clearInterval(state.slider.timer);
    }

    if (photoSlides.length <= 1) {
      return;
    }

    state.slider.timer = window.setInterval(function () {
      state.slider.index = (state.slider.index + 1) % photoSlides.length;
      refs.photoSliderTrack.style.transform = "translateX(-" + state.slider.index * 100 + "%)";
    }, 3600);
  }

  function handleFilterInput(event) {
    var target = event.target;
    var filterKey = target.getAttribute("data-filter-key");
    var columnKey = target.getAttribute("data-column-key");

    if (filterKey) {
      state.filters[filterKey] = target.value;
      resetListingViewport();
      render();
      return;
    }

    if (columnKey) {
      state.visibleColumns[columnKey] = target.checked;
      if (state.semanticMap.title && columnKey === state.semanticMap.title) {
        state.visibleColumns[columnKey] = true;
      }
      persistVisibleColumns();
      renderTable(getProcessedRows());
      renderColumnMenu();
    }
  }

  function handleSortClick(event) {
    var trigger = event.target.closest("[data-sort-key]");

    if (!trigger) {
      return;
    }

    var nextKey = trigger.getAttribute("data-sort-key");

    if (state.sort.key === nextKey) {
      state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
    } else {
      state.sort.key = nextKey;
      state.sort.direction = inferDefaultSortDirection(nextKey);
    }

    resetListingViewport();
    render();
  }

  function handlePaginationClick(event) {
    var trigger = event.target.closest("[data-page]");

    if (!trigger) {
      return;
    }

    var nextPage = Number(trigger.getAttribute("data-page"));

    if (!Number.isFinite(nextPage) || nextPage < 1) {
      return;
    }

    state.currentPage = nextPage;
    var processed = getProcessedRows();
    renderTable(processed);
    renderPagination(processed);
    window.scrollTo({
      top: refs.pagination.getBoundingClientRect().top + window.scrollY - 180,
      behavior: "smooth",
    });
  }

  function handleRecordAction(event) {
    var trigger = event.target.closest("[data-action]");

    if (!trigger) {
      return;
    }

    var action = trigger.getAttribute("data-action");
    var recordId = trigger.getAttribute("data-record-id");

    if (action === "details") {
      openDetailModal(recordId);
      return;
    }

    if (action === "reset-all") {
      resetFilters();
    }
  }

  function handleKeyboardShortcuts(event) {
    if (event.key === "Escape") {
      closeFilterSheet();
      closeDetailModal();
      closeColumnMenu();
      closeMobileMenu();
      closeRegistrationModal();
    }
  }

  function handleVisibilityRefresh() {
    if (document.hidden) {
      if (state.slider && state.slider.timer) {
        window.clearInterval(state.slider.timer);
        state.slider.timer = null;
      }
      return;
    }

    startPhotoSlider();
  }

  function handleGlobalClick(event) {
    if (
      state.isColumnMenuOpen &&
      !refs.columnMenu.contains(event.target) &&
      !refs.columnToggleButton.contains(event.target)
    ) {
      closeColumnMenu();
    }

    if (event.target === refs.filterSheetBackdrop) {
      closeFilterSheet();
    }

    if (event.target === refs.mobileMenuBackdrop) {
      closeMobileMenu();
    }

    if (event.target === refs.detailModalBackdrop) {
      closeDetailModal();
    }

    if (event.target === refs.registrationModalBackdrop) {
      closeRegistrationModal();
    }

    // Interactive card console event delegation
    var viewAllCard = event.target.closest("#viewAllMembersCard");
    if (viewAllCard) {
      var listingsSec = document.getElementById("listings");
      if (listingsSec) {
        listingsSec.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    var joinCard = event.target.closest("#joinEJambhulsanghCard");
    if (joinCard) {
      openRegistrationModal();
    }
  }

  function handleViewportChange() {
    closeFilterSheet();
    closeColumnMenu();
    closeMobileMenu();
    closeRegistrationModal();
    resetListingViewport();
    render();
  }

  function openRegistrationModal() {
    console.log("Opening registration modal...");
    refs.registrationModalBackdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setRegistrationStep(1);
  }

  function closeRegistrationModal() {
    refs.registrationModalBackdrop.classList.remove("is-open");
    document.body.style.overflow = "";
    resetRegistrationForm();
  }

  function resetRegistrationForm() {
    refs.regFormInputs.forEach(function(input) {
      if (input.id === "regState") {
        input.value = "Maharashtra";
      } else {
        input.value = "";
      }
      var fieldEl = input.closest(".field");
      if (fieldEl) fieldEl.style.borderColor = "";
    });

    var regScreenshot = document.getElementById("regScreenshot");
    if (regScreenshot) regScreenshot.value = "";
    compressedScreenshotBase64 = "";

    var previewImg = document.getElementById("uploadPreviewImage");
    var previewContainer = document.getElementById("uploadPreviewContainer");
    var placeholder = document.getElementById("uploadPlaceholder");
    if (previewImg && previewContainer && placeholder) {
      previewImg.src = "";
      placeholder.classList.remove("hidden");
      previewContainer.classList.add("hidden");
    }
    
    var uploadWrapper = document.querySelector(".screenshot-upload-wrapper");
    if (uploadWrapper) uploadWrapper.style.borderColor = "";
  }

  function setRegistrationStep(step) {
    if (step === 2) {
      // Validate Step 1
      var isValid = true;
      refs.regFormInputs.forEach(function(input) {
        if (input.hasAttribute("required") && !input.value.trim()) {
          isValid = false;
          input.closest(".field").style.borderColor = "#ef4444";
        } else {
          input.closest(".field").style.borderColor = "";
        }
      });
      
      if (!isValid) {
        showToast("कृपया सर्व आवश्यक माहिती भरा.", "error");
        return;
      }
    }

    if (step === 1) {
      refs.regStep1.classList.remove("hidden");
      refs.regStep2.classList.add("hidden");
      refs.regNextBtn.classList.remove("hidden");
      refs.regPrevBtn.classList.add("hidden");
      refs.regSubmitBtn.classList.add("hidden");
      refs.regStepTitle.textContent = "Step 1 of 2";
    } else {
      refs.regStep1.classList.add("hidden");
      refs.regStep2.classList.remove("hidden");
      refs.regNextBtn.classList.add("hidden");
      refs.regPrevBtn.classList.remove("hidden");
      refs.regSubmitBtn.classList.remove("hidden");
      refs.regStepTitle.textContent = "Step 2 of 2";

      // Toggle container visibility based on PAYMENT_MODE
      var upiContainer = document.getElementById("upiPaymentContainer");
      var razorpayContainer = document.getElementById("razorpayPaymentContainer");
      if (PAYMENT_MODE === "upi") {
        if (upiContainer) upiContainer.classList.remove("hidden");
        if (razorpayContainer) razorpayContainer.classList.add("hidden");
        refs.regSubmitBtn.textContent = "नोंदणी सबमिट करा / Submit Registration";
        refs.regSubmitBtn.style.background = "linear-gradient(135deg, #5c1d7e, #8b3ab3)";
      } else {
        if (upiContainer) upiContainer.classList.add("hidden");
        if (razorpayContainer) razorpayContainer.classList.remove("hidden");
        refs.regSubmitBtn.textContent = "Pay & Submit Registration";
        refs.regSubmitBtn.style.background = "linear-gradient(135deg, #004d2c, #108b64)";
      }
    }
  }

  async function handleRegistrationSubmit() {
    var formData = {};
    formData["पूर्ण नाव"] = document.getElementById("regName").value.trim();
    formData["गावाचे नाव"] = document.getElementById("regVillage").value.trim();
    formData["पत्ता"] = document.getElementById("regAddress").value.trim();
    formData["मोबाईल क्रमांक (१)"] = document.getElementById("regPhone1").value.trim();
    formData["मोबाईल क्रमांक (२)"] = document.getElementById("regPhone2").value.trim();
    formData["तालुका"] = document.getElementById("regTaluka").value.trim();
    formData["जिल्हा"] = document.getElementById("regDistrict").value.trim();
    formData["राज्य"] = document.getElementById("regState").value.trim();
    formData["पिनकोड"] = document.getElementById("regPincode").value.trim();
    formData["एकूण क्षेत्रफळ (एकर / हेक्टर)"] = document.getElementById("regArea").value.trim();
    formData["झाडांची संख्या"] = parseInt(document.getElementById("regTreeCount").value.trim()) || 0;
    formData["दोन झाडांमधील अंतर (मीटर)"] = document.getElementById("regDistance").value.trim();
    formData["झाडांची लागवड केलेले वर्ष"] = parseInt(document.getElementById("regPlantYear").value.trim()) || 0;
    formData["मागील वर्षीचे उत्पादन (टन मध्ये)"] = document.getElementById("regYield").value.trim();
    formData["जांभूळ विक्री / जांभूळ थिकण"] = document.getElementById("regSaleType").value.trim();
    formData["जांभूळ जात / वाण"] = document.getElementById("regVariety").value.trim();

    if (PAYMENT_MODE === "upi") {
      if (!compressedScreenshotBase64) {
        showToast("कृपया पेमेंट स्क्रीनशॉट अपलोड करा.", "error");
        var uploadWrapper = document.querySelector(".screenshot-upload-wrapper");
        if (uploadWrapper) uploadWrapper.style.borderColor = "#ef4444";
        return;
      } else {
        var uploadWrapper = document.querySelector(".screenshot-upload-wrapper");
        if (uploadWrapper) uploadWrapper.style.borderColor = "";
      }

      // Serialize screenshot inside Address (पत्ता) column
      formData["पत्ता"] = formData["पत्ता"] + " | Screenshot: " + compressedScreenshotBase64;
      formData.timestamp = new Date().toISOString();

      showToast("नोंदणी जतन केली जात आहे...", "info");
      await submitToSupabase(formData);
      return;
    }

    if (typeof Razorpay === "undefined") {
      showToast("Razorpay script could not be loaded. Please check your internet connection or disable ad-blockers and try again.", "error");
      return;
    }

    showToast("Initializing payment...", "info");

    try {
      // 1. Fetch Razorpay config to get keyId
      var configResponse = await fetch("/api/config");
      if (!configResponse.ok) {
        throw new Error("Failed to load payment configuration.");
      }
      var configData = await configResponse.json();
      var keyId = configData.keyId;

      if (!keyId) {
        throw new Error("Razorpay Key ID is not configured on the server.");
      }

      // 2. Create Order on backend (10000 paise = 100 INR)
      var orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10000 })
      });

      if (!orderResponse.ok) {
        var errData = await orderResponse.json();
        throw new Error(errData.error || "Failed to create order on the server.");
      }

      var orderData = await orderResponse.json();
      var orderId = orderData.order_id;

      // 3. Configure Razorpay Standard Checkout Options
      var options = {
        "key": keyId,
        "amount": orderData.amount,
        "currency": orderData.currency,
        "name": "Jambhulsangh",
        "description": "Farmer Registration Fee",
        "image": window.location.origin + "/logo2.png",
        "order_id": orderId,
        "handler": async function (response) {
          showToast("Verifying payment...", "info");

          try {
            // 4. Send payment parameters to verify endpoint
            var verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              var verifyErr = await verifyResponse.json();
              throw new Error(verifyErr.error || "Payment signature verification failed.");
            }

            var verifyData = await verifyResponse.json();

            if (verifyData.success) {
              formData.timestamp = new Date().toISOString();
              showToast("Payment Verified! Saving your details...", "info");
              await submitToSupabase(formData);
            } else {
              throw new Error("Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            showToast("Payment Verification Error: " + verifyErr.message, "error");
          }
        },
        "modal": {
          "ondismiss": function () {
            showToast("Payment cancelled by user.", "warning");
          }
        },
        "prefill": {
          "name": formData["पूर्ण नाव"] || "",
          "contact": formData["मोबाईल क्रमांक (१)"] || ""
        },
        "theme": {
          "color": "#004d2c"
        }
      };

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
        showToast("Payment Failed: " + response.error.description, "error");
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      showToast("Payment Initialization Failed: " + err.message, "error");
    }
  }

  async function submitToSupabase(data) {
    try {
      await window.KFDatabaseService.insertRow(data);
      showToast("नोंदणी यशस्वी झाली! आम्ही लवकरच संपर्क करू.", "success");
      closeRegistrationModal();
      loadData({ reason: "auto", announce: false }); // Refresh data
    } catch (err) {
      console.error(err);
      showToast("नोंदणी जतन करताना एरर आली. कृपया संपर्क करा.", "error");
    }
  }

  async function handleMigration() {
    if (!confirm("Are you sure you want to migrate all data from Google Sheets to Supabase? This should only be done once.")) return;
    
    showToast("Migration started...", "info");
    
    try {
      // 1. Fetch from Sheets
      var result = await window.KFSheetsService.fetchRows({});
      var sheetData = result.objects; // Array of objects with translated keys
      
      if (!sheetData || sheetData.length === 0) {
        showToast("No data found in Google Sheets to migrate.", "error");
        return;
      }
      
      // 2. Map to Supabase format
      var supabaseData = sheetData.map(function(row) {
        // Convert DD/MM/YYYY HH:MM:SS to ISO format
        var rawDate = row["Date"] || "";
        var isoDate = new Date().toISOString();
        if (rawDate) {
          var parts = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{2})?:?(\d{2})?/);
          if (parts) {
            isoDate = parts[3] + "-" + parts[2].padStart(2, "0") + "-" + parts[1].padStart(2, "0") +
              "T" + (parts[4] || "00").padStart(2, "0") + ":" + (parts[5] || "00") + ":" + (parts[6] || "00");
          }
        }
        return {
          "timestamp": isoDate,
          "पूर्ण नाव": row["Title"] || row["Name"] || "",
          "गावाचे नाव": row["Location"] || row["Village"] || "",
          "पत्ता": row["Summary"] || row["Address"] || "",
          "मोबाईल क्रमांक (१)": row["Primary Phone"] || row["Phone 1"] || "",
          "मोबाईल क्रमांक (२)": row["Secondary Phone"] || row["Phone 2"] || "",
          "तालुका": row["Taluka"] || "",
          "जिल्हा": row["Region"] || row["District"] || "",
          "राज्य": row["State"] || "Maharashtra",
          "पिनकोड": row["Pincode"] || "",
          "एकूण क्षेत्रफळ (एकर / हेक्टर)": row["Land Area"] || row["Area"] || "",
          "झाडांची संख्या": parseInt(row["Tree Count"] || row["Treecount"]) || 0,
          "दोन झाडांमधील अंतर (मीटर)": row["Tree Spacing"] || row["Distance"] || "",
          "झाडांची लागवड केलेले वर्ष": parseInt(row["Planting Year"] || row["Plantyear"]) || 0,
          "मागील वर्षीचे उत्पादन (टन मध्ये)": row["Last Year Production"] || row["Yield"] || "",
          "जांभूळ विक्री / जांभूळ थिकण": row["Stage"] || row["Saletype"] || "",
          "जांभूळ जात / वाण": row["Category"] || row["Variety"] || ""
        };
      });
      
      // 3. Batch Insert into Supabase via REST API
      await window.KFDatabaseService.insertMany(supabaseData);
      
      showToast("Migration successful! " + supabaseData.length + " records moved.", "success");
      closeMobileMenu();
      loadData({ reason: "auto", announce: true }); // Refresh dashboard from Supabase
      
    } catch (err) {
      console.error("Migration error:", err);
      showToast("Migration failed: " + err.message, "error");
    }
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(state.theme);
    localStorage.setItem(config.storageKeys.theme, state.theme);
    translateUI();
  }

  function getStoredTheme() {
    var storedTheme = localStorage.getItem(config.storageKeys.theme);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    refs.themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }

  function openFilterSheet() {
    refs.filterSheetBackdrop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      refs.filterSheetBackdrop.classList.add("is-open");
    });
  }

  function closeFilterSheet() {
    refs.filterSheetBackdrop.classList.remove("is-open");
    window.setTimeout(function () {
      if (!refs.filterSheetBackdrop.classList.contains("is-open")) {
        refs.filterSheetBackdrop.classList.add("hidden");
        if (!refs.detailModalBackdrop.classList.contains("is-open") && !refs.mobileMenuBackdrop.classList.contains("is-open")) {
          document.body.classList.remove("no-scroll");
        }
      }
    }, 220);
  }

  function openMobileMenu() {
    refs.mobileMenuBackdrop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      refs.mobileMenuBackdrop.classList.add("is-open");
    });
  }

  function closeMobileMenu() {
    refs.mobileMenuBackdrop.classList.remove("is-open");
    window.setTimeout(function () {
      if (!refs.mobileMenuBackdrop.classList.contains("is-open")) {
        refs.mobileMenuBackdrop.classList.add("hidden");
        if (!refs.detailModalBackdrop.classList.contains("is-open") && !refs.filterSheetBackdrop.classList.contains("is-open")) {
          document.body.classList.remove("no-scroll");
        }
      }
    }, 220);
  }

  function openDetailModal(recordId) {
    if (!recordId || !state.rows.some(function (row) { return row.id === recordId; })) {
      return;
    }

    state.selectedRowId = recordId;
    renderDetailModal();
    refs.detailModalBackdrop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      refs.detailModalBackdrop.classList.add("is-open");
    });
  }

  function closeDetailModal() {
    refs.detailModalBackdrop.classList.remove("is-open");
    window.setTimeout(function () {
      if (!refs.detailModalBackdrop.classList.contains("is-open")) {
        refs.detailModalBackdrop.classList.add("hidden");
        state.selectedRowId = null;
        if (!refs.filterSheetBackdrop.classList.contains("is-open")) {
          document.body.classList.remove("no-scroll");
        }
      }
    }, 220);
  }

  function toggleColumnMenu() {
    state.isColumnMenuOpen = !state.isColumnMenuOpen;
    renderColumnMenu();
  }

  function closeColumnMenu() {
    if (!state.isColumnMenuOpen) {
      return;
    }

    state.isColumnMenuOpen = false;
    renderColumnMenu();
  }

  function startAutoRefresh() {
    if (state.autoRefreshTimer) {
      window.clearInterval(state.autoRefreshTimer);
    }

    state.autoRefreshTimer = window.setInterval(function () {
      loadData({ reason: "polling" });
    }, config.googleSheets.refreshIntervalMs);
  }

  async function loadData(options) {
    if (state.isFetching) {
      return;
    }

    state.isFetching = true;
    renderSyncStatus();

    if (!state.rows.length) {
      state.loading = true;
      render();
    }

    try {
      if (!window.KFDatabaseService) {
        throw new Error("Database service not loaded.");
      }
      var result = await window.KFDatabaseService.fetchRows();
      var normalized = normalizeSheetValues(result.values);

      state.rows = normalized.rows;
      state.columns = normalized.columns;
      state.semanticMap = normalized.semanticMap;
      state.filterOptions = buildFilterOptions(state.rows);
      sanitizeActiveFilters();
      hydrateSort(normalized);
      hydrateVisibleColumns();
      
      // Disables all data row translation - exact data from Supabase/Google Sheets is kept.

      state.loading = false;
      state.sync.mode = result.mode;
      state.sync.message = result.message;
      state.sync.lastUpdated = new Date();

      if (state.selectedRowId && !getSelectedRow()) {
        closeDetailModal();
      }

      render();

      if (options && options.announce) {
        showToast(
          result.mode === "live"
            ? "Dashboard refreshed from Supabase."
            : result.message,
          result.mode === "live" ? "info" : "error"
        );
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      state.loading = false;
      state.sync.mode = "error";
      state.sync.message = "Refresh failed. Keeping the most recent dataset.";
      render();
      showToast("Refresh failed. Keeping the most recent dataset.", "error");
    } finally {
      state.isFetching = false;
      renderSyncStatus();
    }
  }

  function hydrateSort(normalized) {
    if (!state.sort.key || !findColumn(state.sort.key)) {
      state.sort.key = normalized.defaultSortKey;
      state.sort.direction = normalized.defaultSortDirection;
    }
  }

  function hydrateVisibleColumns() {
    var storedVisibility = readJson(config.storageKeys.visibleColumns) || {};
    var nextVisibility = {};

    state.columns.forEach(function (column, index) {
      var defaultVisible =
        column.semantic === "title" ||
        column.semantic === "category" ||
        column.semantic === "status" ||
        column.semantic === "price" ||
        column.semantic === "date" ||
        index < 5;

      nextVisibility[column.key] =
        column.semantic === "title"
          ? true
          : Object.prototype.hasOwnProperty.call(storedVisibility, column.key)
            ? storedVisibility[column.key]
            : defaultVisible;
    });

    state.visibleColumns = nextVisibility;
    persistVisibleColumns();
  }

  function persistVisibleColumns() {
    localStorage.setItem(
      config.storageKeys.visibleColumns,
      JSON.stringify(state.visibleColumns)
    );
  }

  function normalizeSheetValues(values) {
    if (!Array.isArray(values) || !values.length || !Array.isArray(values[0])) {
      return {
        rows: [],
        columns: [],
        semanticMap: {},
        defaultSortKey: "",
        defaultSortDirection: "asc",
      };
    }

    values[0].unshift("Sr. No.");
    for (var i = 1; i < values.length; i++) {
      values[i].unshift(String(i));
    }

    var headerRow = values[0].map(function (cell, index) {
      var label = cleanText(cell);
      return label || "Column " + (index + 1);
    });

    var columns = buildColumns(headerRow);
    var semanticMap = buildSemanticMap(columns);
    var dataRows = values.slice(1).filter(function (row) {
      return Array.isArray(row) && row.some(function (cell) {
        return cleanText(cell) !== "";
      });
    });

    var normalizedRows = dataRows.map(function (sourceRow, rowIndex) {
      return normalizeRow(sourceRow, rowIndex, columns, semanticMap);
    });

    columns = columns.map(function (column, index) {
      return {
        key: column.key,
        label: column.label,
        semantic: getSemanticName(column.key, semanticMap),
        type: inferColumnType(column, normalizedRows, semanticMap),
        index: index,
      };
    });

    return {
      rows: normalizedRows,
      columns: columns,
      semanticMap: semanticMap,
      defaultSortKey: "sr_no",
      defaultSortDirection: "asc",
    };
  }

  function buildColumns(headerRow) {
    var seen = {};

    return headerRow.map(function (label, index) {
      var baseKey = slugify(label) || "column_" + (index + 1);

      if (!seen[baseKey]) {
        seen[baseKey] = 0;
      }

      seen[baseKey] += 1;

      return {
        key: seen[baseKey] === 1 ? baseKey : baseKey + "_" + seen[baseKey],
        label: label,
      };
    });
  }

  function buildSemanticMap(columns) {
    var map = {};

    Object.keys(semanticAliases).forEach(function (semanticName) {
      var aliases = semanticAliases[semanticName];
      var column = columns.find(function (item) {
        return aliases.some(function (alias) {
          return item.key === alias || item.key.indexOf(alias) !== -1;
        });
      });

      map[semanticName] = column ? column.key : null;
    });

    if (!map.title && columns[0]) {
      map.title = columns[0].key;
    }

    return map;
  }

  function getSemanticName(columnKey, semanticMap) {
    var match = Object.keys(semanticMap).find(function (name) {
      return semanticMap[name] === columnKey;
    });

    return match || null;
  }

  function normalizeRow(sourceRow, rowIndex, columns, semanticMap) {
    var raw = {};

    columns.forEach(function (column, columnIndex) {
      raw[column.key] = cleanText(sourceRow[columnIndex]);
    });

    var title = pickRaw(raw, semanticMap.title) || firstMeaningfulValue(raw) || "Entry " + (rowIndex + 1);
    var category = pickRaw(raw, semanticMap.category) || "General";
    var status = pickRaw(raw, semanticMap.status) || "Pending";
    var priceRaw = pickRaw(raw, semanticMap.price);
    var dateRaw = pickRaw(raw, semanticMap.date);
    var owner = pickRaw(raw, semanticMap.owner);
    var location = pickRaw(raw, semanticMap.location);
    var stage = pickRaw(raw, semanticMap.stage);
    var summary = pickRaw(raw, semanticMap.summary) || "";
    var image = pickRaw(raw, semanticMap.image);
    var phone = pickRaw(raw, semanticMap.phone);
    var priceValue = parseNumericValue(priceRaw);
    var dateValue = parseDateValue(dateRaw);
    var excludedKeys = {};

    Object.keys(semanticMap).forEach(function (name) {
      if (semanticMap[name]) {
        excludedKeys[semanticMap[name]] = true;
      }
    });

    var extraFields = columns
      .filter(function (column) {
        return !excludedKeys[column.key] && raw[column.key];
      })
      .slice(0, 4)
      .map(function (column) {
        return {
          label: column.label,
          value: raw[column.key],
        };
      });

    return {
      id: (pickRaw(raw, semanticMap.id) || slugify(title) || "entry") + "-" + (rowIndex + 1),
      title: title,
      category: category,
      status: status,
      summary: summary,
      image: image,
      owner: owner,
      location: location,
      phone: phone,
      stage: stage,
      priceRaw: priceRaw,
      priceValue: priceValue,
      dateRaw: dateRaw,
      dateValue: dateValue,
      dateLabel: dateValue ? dateFormatter.format(dateValue) : dateRaw || "No date",
      priceLabel:
        priceValue !== null
          ? currencyFormatter.format(priceValue)
          : priceRaw || "Custom",
      searchIndex: Object.values(raw).join(" ").toLowerCase(),
      raw: raw,
      extraFields: extraFields,
      isNew: isRecentDate(dateValue, config.ui.newEntryWindowDays),
    };
  }

  function inferColumnType(column, rows, semanticMap) {
    var semantic = getSemanticName(column.key, semanticMap);

    if (semantic === "price") {
      return "number";
    }

    if (semantic === "date") {
      return "date";
    }

    if (semantic === "status") {
      return "status";
    }

    var samples = rows
      .map(function (row) {
        return row.raw[column.key];
      })
      .filter(Boolean)
      .slice(0, 18);

    if (!samples.length) {
      return "text";
    }

    var numberMatches = samples.filter(function (value) {
      return parseNumericValue(value) !== null;
    }).length;
    var dateMatches = samples.filter(function (value) {
      return parseDateValue(value) !== null;
    }).length;

    if (numberMatches >= Math.ceil(samples.length * 0.7)) {
      return "number";
    }

    if (dateMatches >= Math.ceil(samples.length * 0.7)) {
      return "date";
    }

    return "text";
  }

  function isExcludedFilterColumn(column) {
    if (!column) return true;
    var key = column.key;
    var label = column.label ? column.label.trim() : "";
    var semantic = column.semantic;
    
    // ID filter
    if (key === "id" || key === "sr_no" || semantic === "id" || label.toLowerCase() === "id" || label === "Sr. No." || label === "अनुक्रम क्रमांक" || label === "अ.क्र.") {
      return true;
    }
    // Date filter
    if (key === "date" || semantic === "date" || key === "created_at" || key === "timestamp" || column.type === "date" || label.indexOf("तारीख") !== -1 || label.toLowerCase().indexOf("date") !== -1) {
      return true;
    }
    // Name / पूर्ण नाव
    if (semantic === "title" || key === "name" || label === "पूर्ण नाव" || label === "नाव" || key === "पूर्ण_नाव" || key === "पूर्ण नाव") {
      return true;
    }
    // Phone numbers (Phone 1 and Phone 2)
    if (semantic === "phone" || key === "phone1" || key === "phone2" || key.indexOf("phone") !== -1 || key.indexOf("mobile") !== -1 ||
        label === "मोबाईल क्रमांक (१)" || label === "मोबाईल क्रमांक (२)" || label.indexOf("मोबाईल") !== -1 || label.indexOf("क्रमांक") !== -1 ||
        key === "मोबाईल_क्रमांक_१" || key === "मोबाईल_क्रमांक_२" || key.indexOf("मोबाईल") !== -1) {
      return true;
    }
    // Image and Summary / Address
    if (semantic === "image" || semantic === "summary" || key === "image" || key === "summary" || label === "पत्ता" || label === "Address") {
      return true;
    }
    return false;
  }

  function buildFilterOptions(rows) {
    var options = {};
    if (state.columns) {
      state.columns.forEach(function (column) {
        if (isExcludedFilterColumn(column) || column.semantic === "price") {
          return;
        }
        var values = rows.map(function (row) {
          if (column.semantic === "category") {
            return row.category;
          }
          if (column.semantic === "status") {
            return row.status;
          }
          return row.raw[column.key];
        });
        options[column.key] = uniqueSortedValues(values);
      });
    }
    return options;
  }

  function sanitizeActiveFilters() {
    if (!state.columns) {
      return;
    }
    state.columns.forEach(function (column) {
      if (isExcludedFilterColumn(column) || column.semantic === "price") {
        return;
      }
      
      // Initialize if not present
      if (!(column.key in state.filters)) {
        state.filters[column.key] = "all";
      }

      // Sanitize selection
      var opts = state.filterOptions[column.key] || [];
      if (state.filters[column.key] !== "all" && opts.indexOf(state.filters[column.key]) === -1) {
        state.filters[column.key] = "all";
      }
    });
  }

  function getProcessedRows() {
    var term = state.searchTerm.toLowerCase();
    var minPrice = parseNumericValue(state.filters.minPrice);
    var maxPrice = parseNumericValue(state.filters.maxPrice);

    return state.rows
      .filter(function (row) {
        if (term && row.searchIndex.indexOf(term) === -1) {
          return false;
        }

        if (state.columns) {
          for (var i = 0; i < state.columns.length; i++) {
            var col = state.columns[i];
            if (isExcludedFilterColumn(col) || col.semantic === "price") {
              continue;
            }
            var filterVal = state.filters[col.key];
            if (filterVal && filterVal !== "all") {
              var rowVal = "";
              if (col.semantic === "category") {
                rowVal = row.category;
              } else if (col.semantic === "status") {
                rowVal = row.status;
              } else {
                rowVal = row.raw[col.key] || "";
              }
              if (rowVal !== filterVal) {
                return false;
              }
            }
          }
        }

        if (minPrice !== null && (row.priceValue === null || row.priceValue < minPrice)) {
          return false;
        }

        if (maxPrice !== null && (row.priceValue === null || row.priceValue > maxPrice)) {
          return false;
        }

        return true;
      })
      .slice()
      .sort(compareRows);
  }

  function compareRows(left, right) {
    var sortKey = state.sort.key;
    var column = findColumn(sortKey);

    if (!column) {
      return left.title.localeCompare(right.title, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    var leftValue = getComparableValue(left, column);
    var rightValue = getComparableValue(right, column);
    var comparison = 0;

    if (leftValue === null && rightValue !== null) {
      comparison = 1;
    } else if (leftValue !== null && rightValue === null) {
      comparison = -1;
    } else if (leftValue === null && rightValue === null) {
      comparison = 0;
    } else if (column.type === "number" || column.type === "date") {
      comparison = leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0;
    } else {
      comparison = String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return state.sort.direction === "asc" ? comparison : comparison * -1;
  }

  function getComparableValue(row, column) {
    if (column.semantic === "title") {
      return row.title.toLowerCase();
    }

    if (column.semantic === "price") {
      return row.priceValue;
    }

    if (column.semantic === "date") {
      return row.dateValue ? row.dateValue.getTime() : null;
    }

    if (column.type === "number") {
      return parseNumericValue(row.raw[column.key]);
    }

    if (column.type === "date") {
      var parsedDate = parseDateValue(row.raw[column.key]);
      return parsedDate ? parsedDate.getTime() : null;
    }

    return row.raw[column.key] || "";
  }

  function render() {
    var processedRows = getProcessedRows();

    renderSyncStatus();
    renderHeroMetrics(processedRows);
    renderStats(processedRows);
    renderChart();
    renderFilters();
    renderToolbarState();
    renderCards(processedRows);
    renderTable(processedRows);
    renderPagination(processedRows);
    renderEmptyState(processedRows);
    renderColumnMenu();
    renderDetailModal();
  }

  function renderSyncStatus() {
    refs.syncIndicator.className = "status-pill";

    if (state.isFetching && state.rows.length) {
      refs.syncIndicator.classList.add("is-syncing");
      refs.syncIndicator.textContent = "Refreshing";
      return;
    }

    if (state.sync.mode === "live") {
      refs.syncIndicator.classList.add("is-live");
      refs.syncIndicator.textContent = "Live data";
      return;
    }

    if (state.sync.mode === "error") {
      refs.syncIndicator.classList.add("is-error");
      refs.syncIndicator.textContent = "Sync issue";
      return;
    }

    refs.syncIndicator.classList.add("is-preview");
    refs.syncIndicator.textContent = "Connecting";
  }

  function renderHeroMetrics(processedRows) {
    if (!refs.heroMetrics) {
      return;
    }

    if (state.loading && !state.rows.length) {
      refs.heroMetrics.innerHTML = Array.from({ length: 2 })
        .map(function () {
          return '<div class="metric-pill skeleton-stat"></div>';
        })
        .join("");
      return;
    }

    var activeFilterCount = countActiveFilters();
    var liveLabel =
      state.sync.mode === "live"
        ? t("Live Google Sheets sync")
        : state.sync.mode === "error"
          ? t("Sync unavailable")
          : t("Connecting to Google Sheets");

    refs.heroMetrics.innerHTML = [
      metricPillMarkup(t("Dataset"), liveLabel),
      metricPillMarkup(
        t("Visible records"),
        processedRows.length + " " + t("of") + " " + state.rows.length + " " + t("entries") + (activeFilterCount ? " • " + activeFilterCount + " " + t("filters") : "")
      ),
    ].join("");
  }

  function renderStats(processedRows) {
    if (state.loading && !state.rows.length) {
      refs.statsGrid.innerHTML = '<div class="skeleton-stat"></div>';
      return;
    }

    refs.statsGrid.innerHTML =
      '<div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0.5rem 0;">' +

      // Pill 1: Join e-Jambhulsangh Portal (Interactive Pill Bar) - FIRST
      '  <article class="console-pill-bar join-pill" id="joinEJambhulsanghCard">' +
      '    <span class="leaf-particle lp1">🍃</span>' +
      '    <span class="leaf-particle lp2">🌱</span>' +
      '    <span class="leaf-particle lp3">🍃</span>' +
      '    <span class="comet-track-cw"></span>' +
      '    <span class="comet-track-ccw"></span>' +
      '    <div class="pill-icon-wrapper" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0; transition: transform 0.3s ease;">' +
      '      🌱' +
      '    </div>' +
      '    <div class="pill-text-wrapper" style="display: flex; flex-direction: column; text-align: left; margin-left: 1rem; flex-grow: 1; color: white;">' +
      '      <span style="font-size: 1.05rem; font-weight: 700; line-height: 1.2;">ई-जांभूळसंघ मध्ये सामील व्हा / Join Community</span>' +
      '      <span style="font-size: 0.82rem; color: rgba(255, 255, 255, 0.85); font-weight: 500; margin-top: 0.15rem;">Become a member today / आजच नोंदणी करा</span>' +
      '    </div>' +
      '    <div class="pill-arrow-wrapper" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); display: flex; align-items: center; justify-content: center; font-size: 1.15rem; color: white; margin-left: auto; transition: transform 0.3s ease;">' +
      '      →' +
      '    </div>' +
      '  </article>' +

      // Pill 2: View Members Directory (Interactive Pill Bar) - SECOND
      '  <article class="console-pill-bar directory-pill" id="viewAllMembersCard">' +
      '    <div class="pill-icon-wrapper" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(124, 58, 237, 0.08); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0; transition: transform 0.3s ease;">' +
      '      👥' +
      '    </div>' +
      '    <div class="pill-text-wrapper" style="display: flex; flex-direction: column; text-align: left; margin-left: 1rem; flex-grow: 1;">' +
      '      <span style="font-size: 1.05rem; font-weight: 700; color: var(--text); line-height: 1.2;">सर्व सदस्य पहा / View All Members</span>' +
      '    </div>' +
      '    <div class="pill-arrow-wrapper" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(124, 58, 237, 0.06); display: flex; align-items: center; justify-content: center; font-size: 1.15rem; color: var(--primary); margin-left: auto; transition: transform 0.3s ease;">' +
      '      →' +
      '    </div>' +
      '  </article>' +

      // Pill 3: Live Total Entries Counter (Stats Pill Bar) - THIRD
      '  <article class="console-pill-bar stats-pill">' +
      '    <div class="pill-icon-wrapper" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.08); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; flex-shrink: 0;">' +
      '      📊' +
      '    </div>' +
      '    <div class="pill-text-wrapper" style="display: flex; flex-direction: column; text-align: left; margin-left: 1rem; flex-grow: 1;">' +
      '      <span style="font-size: 1.05rem; font-weight: 700; color: var(--text); line-height: 1.2;">एकूण सदस्य / Total Members</span>' +
      '    </div>' +
      '    <div class="pill-badge-wrapper" style="padding: 0.35rem 1rem; border-radius: 999px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; font-weight: 800; font-size: 1.15rem; font-family: \'Poppins\', sans-serif; margin-left: auto; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);">' +
      '      ' + escapeHtml(String(state.rows.length)) +
      '    </div>' +
      '  </article>' +

      '</div>';
  }

  function renderChart() {
    if (!refs.chartBars) {
      return;
    }

    if (state.loading && !state.rows.length) {
      refs.chartBars.innerHTML = Array.from({ length: 4 })
        .map(function () {
          return '<div class="skeleton-row" style="border-radius: 16px;"></div>';
        })
        .join("");
      return;
    }

    var counts = {};
    var chartRows = state.rows.slice();

    chartRows.forEach(function (row) {
      counts[row.category] = (counts[row.category] || 0) + 1;
    });

    var categories = Object.keys(counts)
      .map(function (key) {
        return {
          label: key,
          count: counts[key],
        };
      })
      .sort(function (left, right) {
        return right.count - left.count;
      })
      .slice(0, config.ui.chartCategoryLimit);

    var largest = categories.length ? categories[0].count : 1;

    refs.chartBars.innerHTML = categories.length
      ? categories
          .map(function (item) {
            var width = Math.max(16, Math.round((item.count / largest) * 100));

            return (
              '<div class="bar-row">' +
              '<div class="bar-meta"><span>' +
              escapeHtml(item.label) +
              "</span><strong>" +
              escapeHtml(String(item.count)) +
              "</strong></div>" +
              '<div class="bar-track"><div class="bar-fill" style="width:' +
              width +
              '%"></div></div>' +
              "</div>"
            );
          })
          .join("")
      : '<p class="table-value-muted">' + escapeHtml(t("No category data available yet.")) + '</p>';
  }

  function renderFilters() {
    refs.mobileFilters.innerHTML = filterMarkup();
  }

  function filterMarkup() {
    if (!state.columns || state.columns.length === 0) {
      return '<div class="filter-stack" style="padding: 2rem; text-align: center; color: var(--text-muted);">' +
             '<div class="skeleton-stat" style="height: 48px; border-radius: 16px; margin-bottom: 1rem;"></div>' +
             '<div class="skeleton-stat" style="height: 48px; border-radius: 16px; margin-bottom: 1rem;"></div>' +
             '<div class="skeleton-stat" style="height: 48px; border-radius: 16px;"></div>' +
             '</div>';
    }

    var markup = '<div class="filter-stack">';

    state.columns.forEach(function (column) {
      if (isExcludedFilterColumn(column)) {
        return;
      }

      if (column.semantic === "price") {
        markup +=
          '<div class="field"><span>' + escapeHtml(t(column.label)) + '</span><div class="range-row">' +
          '<input class="control" data-filter-key="minPrice" type="number" inputmode="numeric" placeholder="' + t("Min") + '" value="' +
          escapeAttribute(state.filters.minPrice) +
          '">' +
          '<input class="control" data-filter-key="maxPrice" type="number" inputmode="numeric" placeholder="' + t("Max") + '" value="' +
          escapeAttribute(state.filters.maxPrice) +
          '">' +
          "</div></div>";
      } else {
        var currentVal = state.filters[column.key] || "all";
        var opts = state.filterOptions[column.key] || [];

        var labelText = escapeHtml(t(column.label));
        var allLabelText = t("All") + " " + labelText;

        var optionsHtml = optionMarkup("all", allLabelText, currentVal) +
          opts
            .map(function (item) {
              return optionMarkup(item, t(item), currentVal);
            })
            .join("");

        markup += fieldMarkup(
          labelText,
          '<select class="control" data-filter-key="' + escapeAttribute(column.key) + '">' +
            optionsHtml +
            "</select>"
        );
      }
    });

    markup += '<div class="filter-note">' + t("filterNote") + '</div>' + '</div>';
    return markup;
  }

  function renderToolbarState() {
    refs.openFilterSheetButton.textContent = countActiveFilters()
      ? t("filters") + " (" + countActiveFilters() + ")"
      : t("filters");

    refs.clearSearchButton.classList.toggle("hidden", !state.searchTerm);
  }

  function renderCards(processedRows) {
    if (state.loading && !state.rows.length) {
      refs.mobileCards.innerHTML = Array.from({ length: 5 })
        .map(function () {
          return '<div class="skeleton-card"></div>';
        })
        .join("");
      refs.loadMoreHint.textContent = "";
      return;
    }

    var visibleRows = processedRows.slice(0, state.mobileVisibleCount);

    refs.mobileCards.innerHTML = visibleRows
      .map(function (row, index) {
        return cardMarkup(row, index);
      })
      .join("");

    if (!processedRows.length) {
      refs.loadMoreHint.textContent = "";
      return;
    }

    refs.loadMoreHint.textContent =
      visibleRows.length < processedRows.length
        ? t("Showing") + " " +
          visibleRows.length +
          " " + t("of") + " " +
          processedRows.length +
          " " + t("listings. Scroll for more.")
        : t("All") + " " + processedRows.length + " " + t("listings loaded.");
  }

  function renderTable(processedRows) {
    if (state.loading && !state.rows.length) {
      refs.tableHead.innerHTML = "";
      refs.tableBody.innerHTML = Array.from({ length: 6 })
        .map(function () {
          return (
            '<tr><td colspan="6"><div class="skeleton-row" style="border-radius: 16px;"></div></td></tr>'
          );
        })
        .join("");
      return;
    }

    var visibleColumns = getVisibleColumns();
    var totalPages = Math.max(1, Math.ceil(processedRows.length / config.ui.desktopPageSize));

    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    var start = (state.currentPage - 1) * config.ui.desktopPageSize;
    var pageRows = processedRows.slice(start, start + config.ui.desktopPageSize);

    refs.tableHead.innerHTML =
      "<tr>" +
      visibleColumns
        .map(function (column) {
          return (
            '<th><button class="sort-button" type="button" data-sort-key="' +
            escapeAttribute(column.key) +
            '">' +
            escapeHtml(t(column.label)) +
            renderSortState(column.key) +
            "</button></th>"
          );
        })
        .join("") +
      "<th>" + escapeHtml(t("Actions")) + "</th></tr>";

    refs.tableBody.innerHTML = pageRows.length
      ? pageRows
          .map(function (row) {
            return tableRowMarkup(row, visibleColumns);
          })
          .join("")
      : "";
  }

  function renderPagination(processedRows) {
    var totalPages = Math.ceil(processedRows.length / config.ui.desktopPageSize);

    if (state.loading || totalPages <= 1) {
      refs.pagination.innerHTML = "";
      return;
    }

    refs.pagination.innerHTML =
      '<div class="table-value-muted">' + escapeHtml(t("Page")) + ' ' +
      state.currentPage +
      " " + escapeHtml(t("of")) + " " +
      totalPages +
      "</div>" +
      '<div class="page-numbers">' +
      paginationButtonMarkup(t("Prev"), Math.max(1, state.currentPage - 1), state.currentPage === 1) +
      getPageNumbers(totalPages)
        .map(function (page) {
          return paginationButtonMarkup(page, page, false, page === state.currentPage);
        })
        .join("") +
      paginationButtonMarkup(t("Next"), Math.min(totalPages, state.currentPage + 1), state.currentPage === totalPages) +
      "</div>";
  }

  function renderEmptyState(processedRows) {
    if (state.loading) {
      refs.emptyState.classList.add("hidden");
      return;
    }

    if (processedRows.length) {
      refs.emptyState.classList.add("hidden");
      refs.emptyState.innerHTML = "";
      return;
    }

    refs.emptyState.classList.remove("hidden");
    refs.emptyState.innerHTML =
      "<h3>" + escapeHtml(t("No listings match this view.")) + "</h3>" +
      "<p>" + escapeHtml(t("Try widening the search, relaxing filters, or reconnecting your sheet configuration to bring more results into view.")) + "</p>" +
      '<div class="card-actions" style="justify-content:center; margin-top:1.1rem;">' +
      '<button class="button button-primary" type="button" data-action="reset-all">' + escapeHtml(t("Reset filters")) + "</button>" +
      "</div>";
  }

  function renderColumnMenu() {
    refs.columnToggleButton.setAttribute("aria-expanded", String(state.isColumnMenuOpen));
    refs.columnMenu.classList.toggle("hidden", !state.isColumnMenuOpen);

    if (!state.isColumnMenuOpen) {
      return;
    }

    refs.columnMenu.innerHTML =
      '<div class="column-menu-grid">' +
      state.columns
        .map(function (column) {
          var checked = state.visibleColumns[column.key] ? " checked" : "";
          var disabled = column.semantic === "title" ? " disabled" : "";

          return (
            '<label class="toggle-row"><span>' +
            escapeHtml(column.label) +
            '</span><input type="checkbox" data-column-key="' +
            escapeAttribute(column.key) +
            '"' +
            checked +
            disabled +
            "></label>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderDetailModal() {
    var row = getSelectedRow();

    if (!row) {
      refs.detailTitle.textContent = "Select a record";
      refs.detailBody.innerHTML = "";
      return;
    }

    refs.detailTitle.textContent = row.title;
    refs.detailBody.innerHTML =
      '<div class="detail-summary" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-soft); font-size: 1.05rem; font-weight: 500;">' +
      '<span>📍</span> ' + escapeHtml(row.location || "-") +
      '</div>' +
      '<div class="detail-records">' +
      state.columns
        .filter(function (column) {
          var lbl = String(column.label || "").trim();
          var key = String(column.key || "").trim();
          return row.raw[column.key] && 
                 lbl !== "Sr. No." && 
                 lbl !== "timestamp" && 
                 lbl !== "created_at" && 
                 lbl !== "id" &&
                 key !== "sr_no" &&
                 key !== "timestamp" &&
                 key !== "created_at" &&
                 key !== "id";
        })
        .map(function (column) {
          var displayValue = getDisplayText(row, column);
          return (
            '<div class="detail-record"><strong>' +
            escapeHtml(column.label) +
            "</strong><span>" +
            escapeHtml(displayValue) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderSkeletonState() {
    if (refs.heroMetrics) {
      refs.heroMetrics.innerHTML = Array.from({ length: 2 })
        .map(function () {
          return '<div class="metric-pill skeleton-stat"></div>';
        })
        .join("");
    }

    refs.statsGrid.innerHTML = '<div class="skeleton-stat"></div>';

    if (refs.chartBars) {
      refs.chartBars.innerHTML = Array.from({ length: 4 })
        .map(function () {
          return '<div class="skeleton-row" style="border-radius:16px;"></div>';
        })
        .join("");
    }

    refs.mobileCards.innerHTML = Array.from({ length: 5 })
      .map(function () {
        return '<div class="skeleton-card"></div>';
      })
      .join("");

    refs.tableBody.innerHTML = Array.from({ length: 6 })
      .map(function () {
        return '<tr><td colspan="6"><div class="skeleton-row" style="border-radius:16px;"></div></td></tr>';
      })
      .join("");
  }

  function initRevealObserver() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    state.revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            state.revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.16,
      }
    );

    document.querySelectorAll(".reveal").forEach(function (element) {
      state.revealObserver.observe(element);
    });
  }

  function initInfiniteScroll() {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    state.infiniteObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || desktopMedia.matches) {
            return;
          }

          var processed = getProcessedRows();
          var totalRows = processed.length;

          if (state.mobileVisibleCount >= totalRows) {
            return;
          }

          state.mobileVisibleCount += config.ui.mobileBatchSize;
          renderCards(processed);
        });
      },
      {
        rootMargin: "180px 0px",
      }
    );

    state.infiniteObserver.observe(refs.infiniteSentinel);
  }

  function getVisibleColumns() {
    return state.columns.filter(function (column) {
      return state.visibleColumns[column.key];
    });
  }

  function findColumn(columnKey) {
    return state.columns.find(function (column) {
      return column.key === columnKey;
    });
  }

  function inferDefaultSortDirection(columnKey) {
    var column = findColumn(columnKey);

    if (!column) {
      return "asc";
    }

    return column.type === "number" || column.type === "date" ? "desc" : "asc";
  }

  function cardMarkup(row, index) {
    var locationText = row.location || "-";
    var statusText = String(row.status || "").toLowerCase();
    
    // Choose beautiful gradients for the dynamic left accent bar
    var accentGradient = "linear-gradient(180deg, var(--primary), var(--secondary))"; // Jamun & Gold default
    if (statusText.indexOf("active") !== -1 || statusText.indexOf("new") !== -1 || statusText.indexOf("live") !== -1) {
      accentGradient = "linear-gradient(180deg, #108b64, #34d399)"; // Emerald Green
    } else if (statusText.indexOf("pending") !== -1 || statusText.indexOf("review") !== -1) {
      accentGradient = "linear-gradient(180deg, #f97316, #fbbf24)"; // Warm Sunset Amber
    }

    var phoneNumber = row.phone || "";
    var cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    return (
      '<article class="listing-card" style="animation-delay:' +
      Math.min(index * 50, 240) +
      'ms; padding-left: 1.6rem;" data-action="details" data-record-id="' +
      escapeAttribute(row.id) +
      '">' +
      // Dynamic left side colored bar
      '<div class="card-accent-strip" style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: ' +
      accentGradient +
      ';"></div>' +
      // Floating interactive Details badge button
      '<span class="more-details-btn" style="position: absolute; right: 1rem; top: 1.35rem; font-family: \'Poppins\', sans-serif; font-weight: 700; font-size: 0.74rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 0.32rem 0.68rem; border-radius: 999px; border: 2px solid #000000; box-shadow: 0 3px 0 #000000; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; white-space: nowrap;" onmouseover="this.style.transform=\'translateY(-1px)\'; this.style.boxShadow=\'0 4px 0 #000000\';" onmouseout="this.style.transform=\'none\'; this.style.boxShadow=\'0 3px 0 #000000\';">' +
      (state.language === "en" ? "More Details" : "तपशील / Details") +
      '</span>' +
      
      '<div class="card-body" style="display: flex; flex-direction: column; gap: 0.4rem; padding-bottom: 0.2rem; padding-right: 7.5rem;">' +
      '<h3 style="margin: 0; font-family: \'Poppins\', sans-serif; font-size: 1.15rem; letter-spacing: -0.02em; color: var(--text); line-height: 1.35; font-weight: 600;">' +
      (row.raw && row.raw['sr_no'] ? '<span style="color: var(--primary); font-weight: 700; margin-right: 0.35rem;">#' + escapeHtml(row.raw['sr_no']) + '</span> ' : '') +
      escapeHtml(row.title) +
      '</h3>' +
      '<div class="card-location" style="display: flex; align-items: center; gap: 0.45rem; color: var(--text-muted); font-size: 0.92rem;">' +
      '<span class="location-pin" style="display: inline-block; font-size: 1.05rem; transition: transform 0.2s ease;">📍</span>' +
      '<span style="font-weight: 500;">' + escapeHtml(locationText) + '</span>' +
      '</div>' +
      (row.category ? 
        '<div class="card-category" style="display: flex; align-items: center; gap: 0.45rem; color: var(--accent); font-size: 0.88rem; font-weight: 600; margin-top: 0.1rem;">' +
        '<span class="category-icon" style="display: inline-block; font-size: 1.05rem;">🍇</span>' +
        '<span>' + (state.language === "en" ? "Variety: " : "जात/वाण: ") + escapeHtml(row.category) + '</span>' +
        '</div>' : '') +
      '</div>' +
      
      '<div class="card-actions" style="margin-top: 1.1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">' +
      '<a href="tel:' + cleanPhone + '" class="button" style="padding: 0.65rem 0.5rem; font-size: 0.92rem; background: #004d2c; color: white; border-radius: 999px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;" onclick="event.stopPropagation()">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ' + 
      (state.language === "en" ? "Contact" : "संपर्क") +
      '</a>' +
      '<a href="https://wa.me/' + cleanPhone + '" target="_blank" class="button" style="padding: 0.65rem 0.5rem; font-size: 0.92rem; background: #e8fcf0; color: #004d2c; border: 1px solid #c3f2d7; border-radius: 999px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;" onclick="event.stopPropagation()">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> WhatsApp' +
      '</a>' +
      '</div>' +
      "</article>"
    );
  }

  function tableRowMarkup(row, visibleColumns) {
    return (
      "<tr>" +
      visibleColumns
        .map(function (column) {
          if (column.semantic === "title") {
            return (
              '<td><div class="title-stack"><strong>' +
              escapeHtml(row.title) +
              "</strong><span>" +
              escapeHtml(truncate(row.summary, 110)) +
              "</span></div></td>"
            );
          }

          if (column.semantic === "status") {
            return "<td>" + renderStatusBadge(row.status) + "</td>";
          }

          return "<td>" + renderTableValue(row, column) + "</td>";
        })
        .join("") +
      '<td><div class="row-actions">' +
      '<button class="button button-primary compact-button" type="button" data-action="details" data-record-id="' +
      escapeAttribute(row.id) +
      '">' + escapeHtml(t("Details")) + '</button>' +
      "</div></td></tr>"
    );
  }

  function renderTableValue(row, column) {
    var displayText = getDisplayText(row, column);

    if (!displayText) {
      return '<span class="table-value-muted">-</span>';
    }

    return escapeHtml(displayText);
  }

  function getDisplayText(row, column) {
    if (column.semantic === "price") {
      return row.priceLabel;
    }

    if (column.semantic === "date") {
      return row.dateLabel;
    }

    var val = row.raw[column.key] || "";
    var key = String(column.key || "").trim();
    var lbl = String(column.label || "").trim();
    if (key === "पत्ता" || key === "address" || lbl === "पत्ता" || lbl === "Address") {
      var valStr = String(val || "");
      if (valStr.indexOf(" | Screenshot: ") !== -1) {
        var parts = valStr.split(" | Screenshot: ");
        var remaining = parts[0];
        if (remaining.indexOf(" | UTR: ") !== -1) {
          return remaining.split(" | UTR: ")[0];
        }
        return remaining;
      }
    }

    return val;
  }

  function buildCardMeta(row) {
    var items = [
      { label: "Category", value: row.category },
      { label: "Date", value: row.dateLabel },
    ];

    if (row.owner) {
      items.push({ label: "Owner", value: row.owner });
    } else if (row.location) {
      items.push({ label: "Location", value: row.location });
    }

    if (row.stage) {
      items.push({ label: "Stage", value: row.stage });
    } else if (row.extraFields.length) {
      items.push(row.extraFields[0]);
    }

    return items.slice(0, 4);
  }

  function renderSortState(columnKey) {
    if (state.sort.key !== columnKey) {
      return "";
    }

    return (
      '<span class="sort-state">' +
      (state.sort.direction === "asc" ? "ASC" : "DESC") +
      "</span>"
    );
  }

  function renderStatusBadge(status) {
    return (
      '<span class="status-badge ' +
      getStatusTone(status) +
      '">' +
      escapeHtml(status) +
      "</span>"
    );
  }

  function getStatusTone(status) {
    var normalized = status.toLowerCase();

    if (
      normalized.indexOf("active") !== -1 ||
      normalized.indexOf("open") !== -1 ||
      normalized.indexOf("live") !== -1
    ) {
      return "status-success";
    }

    if (
      normalized.indexOf("review") !== -1 ||
      normalized.indexOf("paused") !== -1 ||
      normalized.indexOf("pending") !== -1
    ) {
      return "status-warning";
    }

    return "status-neutral";
  }

  function isActiveStatus(status) {
    var normalized = status.toLowerCase();
    return (
      normalized.indexOf("active") !== -1 ||
      normalized.indexOf("open") !== -1 ||
      normalized.indexOf("live") !== -1 ||
      normalized.indexOf("new") !== -1
    );
  }



  function getSelectedRow() {
    return state.rows.find(function (row) {
      return row.id === state.selectedRowId;
    });
  }

  async function shareSelectedRecord() {
    var row = getSelectedRow();

    if (!row) {
      return;
    }

    var text =
      row.title +
      "\n" +
      row.category +
      " • " +
      row.status +
      "\n" +
      row.priceLabel +
      " • " +
      row.dateLabel +
      "\n" +
      row.summary;

    try {
      if (navigator.share) {
        await navigator.share({
          title: row.title,
          text: text,
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard unavailable");
      }

      showToast("Record details are ready to share.", "info");
    } catch (error) {
      showToast("Sharing is not available in this browser.", "error");
    }
  }

  function resetFilters() {
    state.filters = {
      minPrice: "",
      maxPrice: "",
    };
    if (state.columns) {
      state.columns.forEach(function (column) {
        if (isExcludedFilterColumn(column) || column.semantic === "price") {
          return;
        }
        state.filters[column.key] = "all";
      });
    }
    state.searchTerm = "";
    refs.searchInput.value = "";
    resetListingViewport();
    render();
  }

  function resetListingViewport() {
    state.currentPage = 1;
    state.mobileVisibleCount = config.ui.mobileBatchSize;
  }

  function countActiveFilters() {
    var count = 0;

    if (state.columns) {
      state.columns.forEach(function (column) {
        if (isExcludedFilterColumn(column) || column.semantic === "price") {
          return;
        }
        if (state.filters[column.key] && state.filters[column.key] !== "all") {
          count += 1;
        }
      });
    }

    if (state.filters.minPrice) {
      count += 1;
    }

    if (state.filters.maxPrice) {
      count += 1;
    }

    return count;
  }

  function showToast(message, tone) {
    refs.toast.textContent = message;
    refs.toast.className = tone === "error" ? "toast is-error" : "toast";
    refs.toast.classList.remove("hidden");

    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }

    state.toastTimer = window.setTimeout(function () {
      refs.toast.classList.add("hidden");
    }, 2800);
  }

  function matchesDateWindow(dateValue, windowDays) {
    if (!dateValue) {
      return false;
    }

    var now = Date.now();
    return now - dateValue.getTime() <= Number(windowDays) * 24 * 60 * 60 * 1000;
  }

  function isRecentDate(dateValue, days) {
    return dateValue ? matchesDateWindow(dateValue, String(days)) : false;
  }

  function parseNumericValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    var numericValue = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function parseDateValue(value) {
    if (!value) {
      return null;
    }

    var clean = String(value).trim();
    // Match DD/MM/YYYY or DD-MM-YYYY optionally followed by HH:MM:SS
    var match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      var day = parseInt(match[1], 10);
      var month = parseInt(match[2], 10) - 1; // 0-indexed
      var year = parseInt(match[3], 10);
      var hour = match[4] ? parseInt(match[4], 10) : 0;
      var minute = match[5] ? parseInt(match[5], 10) : 0;
      var second = match[6] ? parseInt(match[6], 10) : 0;
      var parsedDate = new Date(year, month, day, hour, minute, second);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    var parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  function pickRaw(raw, key) {
    return key ? raw[key] : "";
  }

  function firstMeaningfulValue(raw) {
    var values = Object.keys(raw)
      .map(function (key) {
        return raw[key];
      })
      .filter(Boolean);
    return values.length ? values[0] : "";
  }

  function fieldMarkup(label, controlMarkup) {
    return '<label class="field"><span>' + label + "</span>" + controlMarkup + "</label>";
  }

  function optionMarkup(value, label, current) {
    return (
      '<option value="' +
      escapeAttribute(value) +
      '"' +
      (current === value ? " selected" : "") +
      ">" +
      escapeHtml(label) +
      "</option>"
    );
  }

  function metricPillMarkup(label, value) {
    return (
      '<div class="metric-pill"><span>' +
      escapeHtml(label) +
      "</span><strong>" +
      escapeHtml(value) +
      "</strong></div>"
    );
  }

  function statCardMarkup(label, value, copy) {
    return (
      '<article class="stat-card">' +
      '<div class="stat-card-header"><span>' +
      escapeHtml(t(label)) +
      "</span><div class=\"pill-label\">" +
      escapeHtml(state.sync.mode === "live" ? t("live") : t("sync")) +
      "</div></div>" +
      '<div class="stat-card-value">' +
      escapeHtml(String(value)) +
      "</div><p>" +
      escapeHtml(t(copy)) +
      "</p></article>"
    );
  }

  function detailFieldMarkup(label, value) {
    return (
      '<div class="detail-field"><small>' +
      escapeHtml(label) +
      "</small><strong>" +
      escapeHtml(value) +
      "</strong></div>"
    );
  }

  function paginationButtonMarkup(label, page, disabled, active) {
    return (
      '<button class="page-button' +
      (active ? " is-active" : "") +
      '" type="button" data-page="' +
      page +
      '"' +
      (disabled ? " disabled" : "") +
      ">" +
      escapeHtml(String(label)) +
      "</button>"
    );
  }

  function getPageNumbers(totalPages) {
    var start = Math.max(1, state.currentPage - 1);
    var end = Math.min(totalPages, start + 2);
    var adjustedStart = Math.max(1, end - 2);
    var pages = [];

    for (var page = adjustedStart; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }

  function uniqueSortedValues(values) {
    return Array.from(
      new Set(
        values.filter(function (value) {
          return value;
        })
      )
    ).sort(function (left, right) {
      return left.localeCompare(right, undefined, {
        sensitivity: "base",
      });
    });
  }

  function getInitials(title) {
    return title
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function truncate(value, limit) {
    if (value.length <= limit) {
      return value;
    }

    return value.slice(0, limit - 3).trim() + "...";
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  function slugify(value) {
    try {
      return cleanText(value)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\p{M}]+/gu, "_")
        .replace(/^_+|_+$/g, "");
    } catch (e) {
      return cleanText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function readJson(key) {
    try {
      var rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
      return null;
    }
  }

  function debounce(callback, delay) {
    var timeoutId = null;

    return function () {
      var args = arguments;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        callback.apply(null, args);
      }, delay);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
