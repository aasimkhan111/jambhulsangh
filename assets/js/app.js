(function () {
  var config = window.KF_CONFIG;
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
  var photoSlides = Array.from({ length: 14 }, function (_, index) {
    return {
      src: String(index + 1) + ".jpeg",
      alt: "Community photo " + (index + 1),
      caption: "Photo " + (index + 1) + " of 14",
    };
  });

  var semanticAliases = {
    id: ["id", "uid", "slug", "code"],
    title: ["title", "name", "listing", "item", "project", "farm"],
    category: ["category", "segment", "type", "group"],
    status: ["status", "state"],
    price: ["price", "amount", "value", "cost", "rate"],
    date: ["date", "created", "created_at", "createdat", "updated", "published"],
    summary: ["summary", "description", "details", "notes", "about"],
    image: ["image", "imageurl", "image_url", "thumbnail", "logo", "photo"],
    owner: ["owner", "manager", "agent", "lead", "contact"],
    location: ["location", "city", "market", "region"],
    stage: ["stage", "priority", "label", "tier"],
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
      "Completed": "Completed"
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
      "Completed": "पूर्ण झाले"
    }
  };

  function t(key) {
    var lang = state.language || "en";
    return (i18n[lang] && i18n[lang][key]) || i18n["en"][key] || key;
  }

  function translateSheetContent(str) {
    if (!str) return "";
    var currentLang = state.language || "en";
    var output = String(str);
    
    var terms = [
      { mr: "राजापुरी", en: "Rajapuri" },
      { mr: "जांभूळ काळी", en: "Black Jamun" },
      { mr: "जांभूळकाळी", en: "Black Jamun" },
      { mr: "फुलजांभूळ", en: "Phul Jamun" },
      { mr: "गोमंतकी", en: "Gomantaki" },
      { mr: "पारजांभूळ", en: "Parjambhul" },
      { mr: "लोकल", en: "Local" },
      { mr: "सातारा", en: "Satara" },
      { mr: "कोल्हापूर", en: "Kolhapur" },
      { mr: "सांगली", en: "Sangli" },
      { mr: "रत्नागिरी", en: "Ratnagiri" },
      { mr: "पुणे", en: "Pune" },
      { mr: "सिंधुदुर्ग", en: "Sindhudurg" },
      { mr: "विक्री", en: "Selling" },
      { mr: "स्वतः साठी", en: "Personal Use" },
      { mr: "स्वतःसाठी", en: "Personal Use" },
      { mr: "होलसेल", en: "Wholesale" },
      { mr: "निर्यात", en: "Export" },
      { mr: "प्रक्रिया", en: "Processing" },
      { mr: "ठेका", en: "Contract" },
      { mr: "राजेश पाटील", en: "Rajesh Patil" },
      { mr: "सुनील जाधव", en: "Sunil जाधव" }, // Sunil Jadhav
      { mr: "सुनील जाधव", en: "Sunil Jadhav" },
      { mr: "मंगेश शिंदे", en: "Mangesh Shinde" },
      { mr: "अनिल कदम", en: "Anil Kadam" },
      { mr: "प्रकाश मोरे", en: "Prakash More" },
      { mr: "सचिन गायकवाड", en: "Sachin Gaikwad" },
      { mr: "जांभूळ शेती", en: "Jamun farming" },
      { mr: "झाडे", en: "trees" }
    ];

    var cacheKey = str + "_" + currentLang;
    if (state.translationCache && state.translationCache[cacheKey]) {
      return state.translationCache[cacheKey];
    }

    for (var i = 0; i < terms.length; i++) {
      var item = terms[i];
      if (currentLang === "en") {
        output = output.replace(new RegExp(item.mr, "g"), item.en);
      } else {
        output = output.replace(new RegExp(item.en, "g"), item.mr);
      }
    }
    
    return output;
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
    if (!rows || !rows.length) return;
    
    var rawStrings = collectTranslateableStrings(rows);
    var uncachedStrings = [];
    rawStrings.forEach(function (str) {
      var cacheKey = str + "_" + targetLang;
      if (!state.translationCache[cacheKey]) {
        uncachedStrings.push(str);
      }
    });
    
    if (uncachedStrings.length > 0) {
      var newTranslations = await translateBatch(uncachedStrings, targetLang);
      Object.keys(newTranslations).forEach(function (str) {
        var cacheKey = str + "_" + targetLang;
        state.translationCache[cacheKey] = newTranslations[str];
      });
    }
  }

  async function toggleLanguage() {
    var nextLang = state.language === "en" ? "mr" : "en";
    state.language = nextLang;
    localStorage.setItem("kf_lang", nextLang);
    
    showToast(nextLang === "en" ? "Translating data..." : "भाषांतर करत आहे...");
    
    try {
      await translateDataset(state.rows, nextLang);
    } catch (err) {
      console.error("Translation error: ", err);
    }
    
    translateUI();
    showToast(nextLang === "en" ? "Switched to English" : "मराठी भाषेत बदलले");
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
        return (
          '<figure class="photo-slide">' +
          '<img src="' +
          escapeAttribute(slide.src) +
          '" alt="' +
          escapeAttribute(slide.alt) +
          '" loading="' +
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
  }

  function handleViewportChange() {
    closeFilterSheet();
    closeColumnMenu();
    closeMobileMenu();
    resetListingViewport();
    render();
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
      var result = await window.KFSheetsService.fetchRows({});
      var normalized = normalizeSheetValues(result.values);

      state.rows = normalized.rows;
      state.columns = normalized.columns;
      state.semanticMap = normalized.semanticMap;
      state.filterOptions = buildFilterOptions(state.rows);
      sanitizeActiveFilters();
      hydrateSort(normalized);
      hydrateVisibleColumns();
      
      try {
        await translateDataset(state.rows, state.language);
      } catch (err) {
        console.error("Failed to translate spreadsheet rows on load", err);
      }

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
            ? "Dashboard refreshed from Google Sheets."
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
    var summary =
      pickRaw(raw, semanticMap.summary) ||
      location ||
      "Synced from a Google Sheets powered frontend dashboard.";
    var image = pickRaw(raw, semanticMap.image);
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

  function buildFilterOptions(rows) {
    return {
      categories: uniqueSortedValues(
        rows.map(function (row) {
          return row.category;
        })
      ),
      statuses: uniqueSortedValues(
        rows.map(function (row) {
          return row.status;
        })
      ),
    };
  }

  function sanitizeActiveFilters() {
    if (state.filterOptions.categories.indexOf(state.filters.category) === -1) {
      state.filters.category = "all";
    }

    if (state.filterOptions.statuses.indexOf(state.filters.status) === -1) {
      state.filters.status = "all";
    }
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

        if (state.filters.category !== "all" && row.category !== state.filters.category) {
          return false;
        }

        if (state.filters.status !== "all" && row.status !== state.filters.status) {
          return false;
        }

        if (state.filters.date !== "all" && !matchesDateWindow(row.dateValue, state.filters.date)) {
          return false;
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

    refs.statsGrid.innerHTML = statCardMarkup(
      "Total entries",
      state.rows.length,
      "Full synced inventory available for search and filtering."
    );
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
              escapeHtml(translateSheetContent(item.label)) +
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
    return (
      '<div class="filter-stack">' +
      fieldMarkup(
        t("categoryLabel"),
        '<select class="control" data-filter-key="category">' +
          optionMarkup("all", t("allCategories"), state.filters.category) +
          state.filterOptions.categories
            .map(function (item) {
              return optionMarkup(item, t(item), state.filters.category);
            })
            .join("") +
          "</select>"
      ) +
      fieldMarkup(
        t("statusLabel"),
        '<select class="control" data-filter-key="status">' +
          optionMarkup("all", t("allStatuses"), state.filters.status) +
          state.filterOptions.statuses
            .map(function (item) {
              return optionMarkup(item, t(item), state.filters.status);
            })
            .join("") +
          "</select>"
      ) +
      fieldMarkup(
        t("dateLabel"),
        '<select class="control" data-filter-key="date">' +
          optionMarkup("all", t("anyTime"), state.filters.date) +
          optionMarkup("7", t("last7Days"), state.filters.date) +
          optionMarkup("30", t("last30Days"), state.filters.date) +
          optionMarkup("90", t("last90Days"), state.filters.date) +
          optionMarkup("365", t("lastYear"), state.filters.date) +
          "</select>"
      ) +
      '<div class="field"><span>' + t("priceRangeLabel") + '</span><div class="range-row">' +
      '<input class="control" data-filter-key="minPrice" type="number" inputmode="numeric" placeholder="' + t("Min") + '" value="' +
      escapeAttribute(state.filters.minPrice) +
      '">' +
      '<input class="control" data-filter-key="maxPrice" type="number" inputmode="numeric" placeholder="' + t("Max") + '" value="' +
      escapeAttribute(state.filters.maxPrice) +
      '">' +
      "</div></div>" +
      '<div class="filter-note">' + t("filterNote") + '</div>' +
      "</div>"
    );
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
      refs.detailTitle.textContent = t("Select a record");
      refs.detailBody.innerHTML = "";
      return;
    }

    refs.detailTitle.textContent = translateSheetContent(row.title);
    refs.detailBody.innerHTML =
      '<div class="detail-summary">' +
      renderStatusBadge(row.status) +
      "<p>" +
      escapeHtml(translateSheetContent(row.summary)) +
      "</p>" +
      "</div>" +
      '<div class="detail-meta">' +
      detailFieldMarkup(t("Category"), translateSheetContent(row.category)) +
      detailFieldMarkup(t("Date"), row.dateLabel) +
      detailFieldMarkup(t("Price"), row.priceLabel) +
      "</div>" +
      '<div class="detail-records">' +
      state.columns
        .filter(function (column) {
          return row.raw[column.key];
        })
        .map(function (column) {
          var displayValue = getDisplayText(row, column);
          displayValue = translateSheetContent(displayValue);
          return (
            '<div class="detail-record"><strong>' +
            escapeHtml(t(column.label)) +
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
    var locationText = row.location ? translateSheetContent(row.location) : "-";
    var statusText = String(row.status || "").toLowerCase();
    
    // Choose beautiful gradients for the dynamic left accent bar
    var accentGradient = "linear-gradient(180deg, var(--primary), var(--secondary))"; // Jamun & Gold default
    if (statusText.indexOf("active") !== -1 || statusText.indexOf("new") !== -1 || statusText.indexOf("live") !== -1) {
      accentGradient = "linear-gradient(180deg, #108b64, #34d399)"; // Emerald Green
    } else if (statusText.indexOf("pending") !== -1 || statusText.indexOf("review") !== -1) {
      accentGradient = "linear-gradient(180deg, #f97316, #fbbf24)"; // Warm Sunset Amber
    }

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
      // Floating interactive chevron arrow
      '<div class="card-chevron" style="position: absolute; right: 1.4rem; top: 1.35rem; color: var(--text-soft); font-size: 1.5rem; line-height: 1; transition: transform 320ms cubic-bezier(0.25, 1, 0.5, 1), color 320ms ease;">&rsaquo;</div>' +
      
      '<div class="card-body" style="display: flex; flex-direction: column; gap: 0.5rem; padding-bottom: 0.2rem; padding-right: 1.5rem;">' +
      '<h3 style="margin: 0; font-family: \'Poppins\', sans-serif; font-size: 1.15rem; letter-spacing: -0.02em; color: var(--text); line-height: 1.35; font-weight: 600;">' +
      (row.raw && row.raw['sr_no'] ? '<span style="color: var(--primary); font-weight: 700; margin-right: 0.35rem;">#' + escapeHtml(row.raw['sr_no']) + '</span> ' : '') +
      escapeHtml(translateSheetContent(row.title)) +
      '</h3>' +
      '<div class="card-location" style="display: flex; align-items: center; gap: 0.45rem; color: var(--text-muted); font-size: 0.92rem;">' +
      '<span class="location-pin" style="display: inline-block; font-size: 1.05rem; transition: transform 0.2s ease;">📍</span>' +
      '<span style="font-weight: 500;">' + escapeHtml(locationText) + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="card-actions" style="margin-top: 1.1rem; display: flex;">' +
      '<button class="button button-primary" style="width: 100%; text-align: center; pointer-events: none;" type="button">' + 
      escapeHtml(t("Details")) + 
      '</button>' +
      "</div></article>"
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
              escapeHtml(translateSheetContent(row.title)) +
              "</strong><span>" +
              escapeHtml(truncate(translateSheetContent(row.summary), 110)) +
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

    return escapeHtml(translateSheetContent(displayText));
  }

  function getDisplayText(row, column) {
    if (column.semantic === "price") {
      return row.priceLabel;
    }

    if (column.semantic === "date") {
      return row.dateLabel;
    }

    return row.raw[column.key] || "";
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
      category: "all",
      status: "all",
      date: "all",
      minPrice: "",
      maxPrice: "",
    };
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

    if (state.filters.category !== "all") {
      count += 1;
    }

    if (state.filters.status !== "all") {
      count += 1;
    }

    if (state.filters.date !== "all") {
      count += 1;
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
        .replace(/[^\p{L}\p{N}]+/gu, "_")
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
