(function () {
  "use strict";

  var adminState = {
    isLoggedIn: false,
    pinBuffer: "",
    editingMemberId: null,
    allMembers: [],
    galleryPhotos: []
  };

  var adminRefs = {};

  // ── Helpers ──
  function escHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function showToast(msg, tone) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = tone === "error" ? "toast is-error" : "toast";
    el.classList.remove("hidden");
    setTimeout(function () { el.classList.add("hidden"); }, 3000);
  }

  function supabaseUrl(table) {
    var cfg = window.KF_CONFIG.supabase;
    return cfg.url + "/rest/v1/" + table;
  }

  function supabaseHeaders() {
    var key = window.KF_CONFIG.supabase.anonKey;
    return {
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  // ── Init ──
  function initAdmin() {
    cacheDom();
    bindEvents();
  }

  function cacheDom() {
    adminRefs.menuAdminBtn = document.getElementById("menuAdminButton");
    adminRefs.loginBackdrop = document.getElementById("adminLoginBackdrop");
    adminRefs.loginClose = document.getElementById("adminLoginClose");
    adminRefs.pinDots = document.getElementById("adminPinDots");
    adminRefs.pinPad = document.getElementById("adminPinPad");
    adminRefs.pinError = document.getElementById("adminPinError");
    adminRefs.panelBackdrop = document.getElementById("adminPanelBackdrop");
    adminRefs.panelClose = document.getElementById("adminPanelClose");
    adminRefs.galleryGrid = document.getElementById("adminGalleryGrid");
    adminRefs.membersList = document.getElementById("adminMembersList");
    adminRefs.memberSearch = document.getElementById("adminMemberSearch");
    adminRefs.addPhotoBtn = document.getElementById("adminAddPhoto");
    adminRefs.addPhotoForm = document.getElementById("adminAddPhotoForm");
    adminRefs.photoUrl = document.getElementById("adminPhotoUrl");
    adminRefs.photoCaption = document.getElementById("adminPhotoCaption");
    adminRefs.savePhotoBtn = document.getElementById("adminSavePhoto");
    adminRefs.cancelPhotoBtn = document.getElementById("adminCancelPhoto");
    adminRefs.saveMemberBtn = document.getElementById("adminSaveMember");
    adminRefs.editPanel = document.getElementById("adminEditMemberPanel");
    adminRefs.editForm = document.getElementById("adminEditForm");
    adminRefs.editBack = document.getElementById("adminEditBack");
    adminRefs.updateMemberBtn = document.getElementById("adminUpdateMember");
  }

  function bindEvents() {
    if (adminRefs.menuAdminBtn) {
      adminRefs.menuAdminBtn.addEventListener("click", function () {
        closeMobileMenu();
        if (adminState.isLoggedIn) {
          openAdminPanel();
        } else {
          openLoginModal();
        }
      });
    }

    if (adminRefs.loginClose) {
      adminRefs.loginClose.addEventListener("click", closeLoginModal);
    }
    if (adminRefs.loginBackdrop) {
      adminRefs.loginBackdrop.addEventListener("click", function (e) {
        if (e.target === adminRefs.loginBackdrop) closeLoginModal();
      });
    }

    if (adminRefs.pinPad) {
      adminRefs.pinPad.addEventListener("click", handlePinInput);
    }

    if (adminRefs.panelClose) {
      adminRefs.panelClose.addEventListener("click", closeAdminPanel);
    }
    if (adminRefs.panelBackdrop) {
      adminRefs.panelBackdrop.addEventListener("click", function (e) {
        if (e.target === adminRefs.panelBackdrop) closeAdminPanel();
      });
    }

    // Tabs
    document.querySelectorAll(".admin-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchTab(tab.getAttribute("data-tab"));
      });
    });

    // Gallery
    if (adminRefs.addPhotoBtn) {
      adminRefs.addPhotoBtn.addEventListener("click", function () {
        adminRefs.addPhotoForm.style.display = "block";
      });
    }
    if (adminRefs.cancelPhotoBtn) {
      adminRefs.cancelPhotoBtn.addEventListener("click", function () {
        adminRefs.addPhotoForm.style.display = "none";
        adminRefs.photoUrl.value = "";
        adminRefs.photoCaption.value = "";
      });
    }
    if (adminRefs.savePhotoBtn) {
      adminRefs.savePhotoBtn.addEventListener("click", saveNewPhoto);
    }

    // Members
    if (adminRefs.saveMemberBtn) {
      adminRefs.saveMemberBtn.addEventListener("click", saveNewMember);
    }
    if (adminRefs.memberSearch) {
      adminRefs.memberSearch.addEventListener("input", renderMembersList);
    }
    if (adminRefs.editBack) {
      adminRefs.editBack.addEventListener("click", function () {
        adminRefs.editPanel.style.display = "none";
        document.getElementById("adminTabMembers").style.display = "block";
      });
    }
    if (adminRefs.updateMemberBtn) {
      adminRefs.updateMemberBtn.addEventListener("click", updateMember);
    }
  }

  function closeMobileMenu() {
    var backdrop = document.getElementById("mobileMenuBackdrop");
    if (backdrop) {
      backdrop.classList.remove("is-open");
      setTimeout(function () {
        backdrop.classList.add("hidden");
        document.body.classList.remove("no-scroll");
      }, 220);
    }
  }

  // ── PIN Login ──
  function openLoginModal() {
    adminState.pinBuffer = "";
    updatePinDots();
    adminRefs.pinError.style.display = "none";
    adminRefs.loginBackdrop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      adminRefs.loginBackdrop.classList.add("is-open");
    });
  }

  function closeLoginModal() {
    adminRefs.loginBackdrop.classList.remove("is-open");
    setTimeout(function () {
      adminRefs.loginBackdrop.classList.add("hidden");
      document.body.classList.remove("no-scroll");
    }, 220);
  }

  function handlePinInput(e) {
    var btn = e.target.closest("[data-pin]");
    if (!btn) return;

    var val = btn.getAttribute("data-pin");

    if (val === "clear") {
      adminState.pinBuffer = "";
      adminRefs.pinError.style.display = "none";
    } else if (val === "submit") {
      verifyPin();
      return;
    } else if (adminState.pinBuffer.length < 4) {
      adminState.pinBuffer += val;
    }

    updatePinDots();

    if (adminState.pinBuffer.length === 4) {
      setTimeout(verifyPin, 200);
    }
  }

  function updatePinDots() {
    var dots = adminRefs.pinDots.querySelectorAll(".pin-dot");
    dots.forEach(function (dot, i) {
      dot.classList.toggle("filled", i < adminState.pinBuffer.length);
    });
  }

  function verifyPin() {
    if (adminState.pinBuffer === window.KF_CONFIG.admin.pin) {
      adminState.isLoggedIn = true;
      closeLoginModal();
      setTimeout(openAdminPanel, 300);
      showToast("Admin access granted ✓", "info");
    } else {
      adminRefs.pinError.style.display = "block";
      adminState.pinBuffer = "";
      updatePinDots();
      // Shake animation
      adminRefs.pinDots.style.animation = "none";
      requestAnimationFrame(function () {
        adminRefs.pinDots.style.animation = "shake 0.4s ease";
      });
    }
  }

  // ── Admin Panel ──
  function openAdminPanel() {
    adminRefs.panelBackdrop.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      adminRefs.panelBackdrop.classList.add("is-open");
    });
    loadGallery();
    loadMembers();
  }

  function closeAdminPanel() {
    adminRefs.panelBackdrop.classList.remove("is-open");
    setTimeout(function () {
      adminRefs.panelBackdrop.classList.add("hidden");
      document.body.classList.remove("no-scroll");
    }, 220);
  }

  function switchTab(tabName) {
    // Hide edit panel if showing
    adminRefs.editPanel.style.display = "none";

    document.querySelectorAll(".admin-tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === tabName);
    });
    document.querySelectorAll(".admin-tab-content").forEach(function (c) {
      c.style.display = "none";
    });
    var target = document.getElementById("adminTab" + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (target) target.style.display = "block";
  }

  // ── Gallery Management ──
  async function loadGallery() {
    try {
      var url = supabaseUrl(window.KF_CONFIG.admin.galleryTable) + "?select=*&order=sort_order.asc";
      var res = await fetch(url, { headers: supabaseHeaders() });

      if (res.status === 404 || res.status === 406) {
        // Table doesn't exist yet, show local files
        renderLocalGallery();
        return;
      }

      if (!res.ok) {
        renderLocalGallery();
        return;
      }

      var data = await res.json();
      if (data.length === 0) {
        renderLocalGallery();
        return;
      }

      adminState.galleryPhotos = data;
      renderGalleryGrid(data);
    } catch (err) {
      console.error("Gallery load error:", err);
      renderLocalGallery();
    }
  }

  function renderLocalGallery() {
    // Show the 14 local jpeg files as gallery
    var localPhotos = [];
    for (var i = 1; i <= 14; i++) {
      localPhotos.push({ id: "local-" + i, image_url: i + ".jpeg", caption: "Photo " + i, sort_order: i });
    }
    adminState.galleryPhotos = localPhotos;
    renderGalleryGrid(localPhotos);
  }

  function renderGalleryGrid(photos) {
    adminRefs.galleryGrid.innerHTML = photos.map(function (photo) {
      var isLocal = String(photo.id).indexOf("local-") === 0;
      return (
        '<div style="position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); aspect-ratio: 1;">' +
        '<img src="' + escHtml(photo.image_url) + '" alt="' + escHtml(photo.caption || "") + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=\'logo.jpeg\'" />' +
        '<div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); padding: 0.4rem 0.5rem; color: white; font-size: 0.75rem;">' +
        escHtml(photo.caption || photo.image_url) +
        '</div>' +
        (isLocal ? '' :
          '<button onclick="window.KFAdmin.deletePhoto(\'' + photo.id + '\')" style="position: absolute; top: 0.3rem; right: 0.3rem; background: #ef4444; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>'
        ) +
        '</div>'
      );
    }).join("");
  }

  async function saveNewPhoto() {
    var url = adminRefs.photoUrl.value.trim();
    var caption = adminRefs.photoCaption.value.trim();

    if (!url) {
      showToast("Please enter an image URL or filename.", "error");
      return;
    }

    try {
      var order = adminState.galleryPhotos.length + 1;
      var res = await fetch(supabaseUrl(window.KF_CONFIG.admin.galleryTable), {
        method: "POST",
        headers: supabaseHeaders(),
        body: JSON.stringify({ image_url: url, caption: caption || url, sort_order: order })
      });

      if (!res.ok) {
        var errText = await res.text();
        throw new Error(errText);
      }

      adminRefs.addPhotoForm.style.display = "none";
      adminRefs.photoUrl.value = "";
      adminRefs.photoCaption.value = "";
      showToast("Photo added ✓", "info");
      loadGallery();
    } catch (err) {
      showToast("Failed to add photo: " + err.message, "error");
    }
  }

  async function deletePhoto(id) {
    if (!confirm("Delete this photo?")) return;

    try {
      var res = await fetch(supabaseUrl(window.KF_CONFIG.admin.galleryTable) + "?id=eq." + id, {
        method: "DELETE",
        headers: supabaseHeaders()
      });

      if (!res.ok) throw new Error("Delete failed");

      showToast("Photo deleted ✓", "info");
      loadGallery();
    } catch (err) {
      showToast("Failed to delete: " + err.message, "error");
    }
  }

  // ── Member Management ──
  async function loadMembers() {
    try {
      var tbl = window.KF_CONFIG.supabase.tableName;
      var res = await fetch(supabaseUrl(tbl) + "?select=*", { headers: supabaseHeaders() });

      if (!res.ok) throw new Error("Failed to load members");

      adminState.allMembers = await res.json();
      renderMembersList();
    } catch (err) {
      adminRefs.membersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Failed to load members</p>';
    }
  }

  function renderMembersList() {
    var search = (adminRefs.memberSearch.value || "").toLowerCase();
    var filtered = adminState.allMembers.filter(function (m) {
      if (!search) return true;
      var name = String(m["पूर्ण नाव"] || m.name || "").toLowerCase();
      var village = String(m["गावाचे नाव"] || m.village || "").toLowerCase();
      var phone = String(m["मोबाईल क्रमांक (१)"] || m.phone1 || "");
      return name.indexOf(search) !== -1 ||
        village.indexOf(search) !== -1 ||
        phone.indexOf(search) !== -1;
    });

    if (filtered.length === 0) {
      adminRefs.membersList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No members found</p>';
      return;
    }

    adminRefs.membersList.innerHTML = filtered.map(function (m) {
      var name = m["पूर्ण नाव"] || m.name || "Unknown";
      var village = m["गावाचे नाव"] || m.village || "-";
      var phone = m["मोबाईल क्रमांक (१)"] || m.phone1 || "-";
      return (
        '<div style="padding: 0.8rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; display: flex; justify-content: space-between; align-items: center;">' +
        '<div style="flex: 1; min-width: 0;">' +
        '<div style="font-weight: 600; color: var(--text); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escHtml(name) + '</div>' +
        '<div style="font-size: 0.82rem; color: var(--text-muted);">📍 ' + escHtml(village) + ' • 📞 ' + escHtml(phone) + '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem;">' +
        '<button onclick="window.KFAdmin.editMember(\'' + m.id + '\')" style="background: #7c3aed; color: white; border: none; border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Edit</button>' +
        '<button onclick="window.KFAdmin.deleteMember(\'' + m.id + '\')" style="background: #ef4444; color: white; border: none; border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Del</button>' +
        '</div>' +
        '</div>'
      );
    }).join("");
  }

  async function saveNewMember() {
    var data = {
      timestamp: new Date().toISOString(),
      "पूर्ण नाव": document.getElementById("adminMemName").value.trim(),
      "गावाचे नाव": document.getElementById("adminMemVillage").value.trim(),
      "पत्ता": document.getElementById("adminMemAddress").value.trim(),
      "मोबाईल क्रमांक (१)": document.getElementById("adminMemPhone1").value.trim(),
      "मोबाईल क्रमांक (२)": document.getElementById("adminMemPhone2").value.trim(),
      "तालुका": document.getElementById("adminMemTaluka").value.trim(),
      "जिल्हा": document.getElementById("adminMemDistrict").value.trim(),
      "राज्य": document.getElementById("adminMemState").value.trim() || "Maharashtra",
      "पिनकोड": document.getElementById("adminMemPincode").value.trim(),
      "एकूण क्षेत्रफळ (एकर / हेक्टर)": document.getElementById("adminMemArea").value.trim(),
      "झाडांची संख्या": parseInt(document.getElementById("adminMemTreecount").value) || 0,
      "दोन झाडांमधील अंतर (मीटर)": document.getElementById("adminMemDistance").value.trim(),
      "झाडांची लागवड केलेले वर्ष": parseInt(document.getElementById("adminMemPlantyear").value) || 0,
      "मागील वर्षीचे उत्पादन (टन मध्ये)": document.getElementById("adminMemYield").value.trim(),
      "जांभूळ विक्री / जांभूळ थिकण": document.getElementById("adminMemSaletype").value.trim(),
      "जांभूळ जात / वाण": document.getElementById("adminMemVariety").value.trim()
    };

    if (!data["पूर्ण नाव"]) {
      showToast("नाव प्रविष्ट करणे आवश्यक आहे!", "error");
      return;
    }

    try {
      await window.KFDatabaseService.insertRow(data);
      showToast("Member added ✓", "info");

      // Clear form
      document.querySelectorAll("#adminMemberForm .admin-input").forEach(function (input) {
        if (input.id !== "adminMemState") input.value = "";
      });

      loadMembers();
    } catch (err) {
      showToast("Failed: " + err.message, "error");
    }
  }

  function getOldKeyFallback(newKey) {
    var mappings = {
      "पूर्ण नाव": "name",
      "गावाचे नाव": "village",
      "पत्ता": "address",
      "मोबाईल क्रमांक (१)": "phone1",
      "मोबाईल क्रमांक (२)": "phone2",
      "तालुका": "taluka",
      "जिल्हा": "district",
      "राज्य": "state",
      "पिनकोड": "pincode",
      "एकूण क्षेत्रफळ (एकर / हेक्टर)": "area",
      "झाडांची संख्या": "treecount",
      "दोन झाडांमधील अंतर (मीटर)": "distance",
      "झाडांची लागवड केलेले वर्ष": "plantyear",
      "मागील वर्षीचे उत्पादन (टन मध्ये)": "yield",
      "जांभूळ विक्री / जांभूळ थिकण": "saletype",
      "जांभूळ जात / वाण": "variety"
    };
    return mappings[newKey] || newKey;
  }

  function editMember(id) {
    var member = adminState.allMembers.find(function (m) { return m.id === id; });
    if (!member) return;

    adminState.editingMemberId = id;

    // Hide members list, show edit form
    document.getElementById("adminTabMembers").style.display = "none";
    adminRefs.editPanel.style.display = "block";

    var fields = [
      { key: "पूर्ण नाव", label: "पूर्ण नाव" },
      { key: "गावाचे नाव", label: "गावाचे नाव" },
      { key: "पत्ता", label: "पत्ता" },
      { key: "मोबाईल क्रमांक (१)", label: "मोबाईल क्रमांक (१)" },
      { key: "मोबाईल क्रमांक (२)", label: "मोबाईल क्रमांक (२)" },
      { key: "तालुका", label: "तालुका" },
      { key: "जिल्हा", label: "जिल्हा" },
      { key: "राज्य", label: "राज्य" },
      { key: "पिनकोड", label: "पिनकोड" },
      { key: "एकूण क्षेत्रफळ (एकर / हेक्टर)", label: "एकूण क्षेत्रफळ (एकर / हेक्टर)" },
      { key: "झाडांची संख्या", label: "झाडांची संख्या" },
      { key: "दोन झाडांमधील अंतर (मीटर)", label: "दोन झाडांमधील अंतर (मीटर)" },
      { key: "झाडांची लागवड केलेले वर्ष", label: "झाडांची लागवड केलेले वर्ष" },
      { key: "मागील वर्षीचे उत्पादन (टन मध्ये)", label: "मागील वर्षीचे उत्पादन (टन मध्ये)" },
      { key: "जांभूळ विक्री / जांभूळ थिकण", label: "जांभूळ विक्री / जांभूळ थिकण" },
      { key: "जांभूळ जात / वाण", label: "जांभूळ जात / वाण" }
    ];

    adminRefs.editForm.innerHTML = fields.map(function (f) {
      var val = member[f.key] !== undefined ? member[f.key] : member[getOldKeyFallback(f.key)];
      return '<div style="margin-bottom: 0.8rem;">' +
             '<label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 0.2rem; color: var(--text-muted);">' + escHtml(f.label) + '</label>' +
             '<input id="adminEdit_' + f.key + '" type="text" placeholder="' + escHtml(f.label) + '" value="' + escHtml(val || "") + '" class="admin-input" />' +
             '</div>';
    }).join("");
  }

  async function updateMember() {
    if (!adminState.editingMemberId) return;

    var fields = [
      "पूर्ण नाव", "गावाचे नाव", "पत्ता", "मोबाईल क्रमांक (१)", "मोबाईल क्रमांक (२)", "तालुका", "जिल्हा", "राज्य", "पिनकोड", "एकूण क्षेत्रफळ (एकर / हेक्टर)", "झाडांची संख्या", "दोन झाडांमधील अंतर (मीटर)", "झाडांची लागवड केलेले वर्ष", "मागील वर्षीचे उत्पादन (टन मध्ये)", "जांभूळ विक्री / जांभूळ थिकण", "जांभूळ जात / वाण"
    ];
    var data = {};
    fields.forEach(function (key) {
      var el = document.getElementById("adminEdit_" + key);
      if (el) data[key] = el.value.trim();
    });

    if (data["झाडांची संख्या"]) data["झाडांची संख्या"] = parseInt(data["झाडांची संख्या"]) || 0;
    if (data["झाडांची लागवड केलेले वर्ष"]) data["झाडांची लागवड केलेले वर्ष"] = parseInt(data["झाडांची लागवड केलेले वर्ष"]) || 0;

    try {
      var tbl = window.KF_CONFIG.supabase.tableName;
      var res = await fetch(supabaseUrl(tbl) + "?id=eq." + adminState.editingMemberId, {
        method: "PATCH",
        headers: supabaseHeaders(),
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        var errText = await res.text();
        throw new Error(errText);
      }

      showToast("Member updated ✓", "info");
      adminRefs.editPanel.style.display = "none";
      document.getElementById("adminTabMembers").style.display = "block";
      loadMembers();
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    }
  }

  async function deleteMember(id) {
    if (!confirm("Delete this member permanently?")) return;

    try {
      var tbl = window.KF_CONFIG.supabase.tableName;
      var res = await fetch(supabaseUrl(tbl) + "?id=eq." + id, {
        method: "DELETE",
        headers: supabaseHeaders()
      });

      if (!res.ok) throw new Error("Delete failed");

      showToast("Member deleted ✓", "info");
      loadMembers();
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  }

  // ── Public API ──
  window.KFAdmin = {
    deletePhoto: deletePhoto,
    editMember: editMember,
    deleteMember: deleteMember
  };

  // ── Boot ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmin);
  } else {
    initAdmin();
  }
})();
