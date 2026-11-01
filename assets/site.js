/* SIMBig 2026 Shared Task — menu and accessibility options.
   Loaded in <head> (not deferred) so saved preferences apply before first paint. */
(function () {
  var KEY = "simbig2026-a11y";
  var DEFAULTS = { text: "0", theme: "auto", contrast: "normal", links: "normal", spacing: "normal", motion: "normal" };
  var root = document.documentElement;

  function load() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { p = {}; }
    var out = {};
    for (var k in DEFAULTS) out[k] = p[k] || DEFAULTS[k];
    return out;
  }
  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* storage unavailable: keep for this page only */ }
  }
  function apply(p) {
    for (var k in DEFAULTS) {
      if (p[k] === DEFAULTS[k]) root.removeAttribute("data-" + k);
      else root.setAttribute("data-" + k, p[k]);
    }
  }

  var prefs = load();
  apply(prefs);

  document.addEventListener("DOMContentLoaded", function () {
    // Mobile menu
    var menuBtn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }

    // Submenus: arrow buttons toggle them; Esc, an outside click or choosing a section closes them
    var subBtns = Array.prototype.slice.call(document.querySelectorAll(".sub-btn"));
    function closeSubs(except) {
      subBtns.forEach(function (b) { if (b !== except) b.setAttribute("aria-expanded", "false"); });
    }
    subBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") !== "true";
        closeSubs(b);
        b.setAttribute("aria-expanded", String(open));
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var openBtn = subBtns.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
      if (openBtn) { closeSubs(); openBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest(".has-sub")) closeSubs();
    });
    Array.prototype.forEach.call(document.querySelectorAll("#site-nav .sub a"), function (a) {
      a.addEventListener("click", function () {
        closeSubs();
        if (nav && nav.classList.contains("open")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      });
    });

    // Logo marquee: a hidden copy of the list makes the loop seamless; without JS the list stays a static row
    var marquee = document.querySelector(".marquee");
    if (marquee) {
      var track = marquee.querySelector(".track"), clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      Array.prototype.forEach.call(clone.querySelectorAll("a"), function (a) { a.tabIndex = -1; });
      marquee.appendChild(clone);
      marquee.classList.add("animated");
      var toggle = document.querySelector(".marquee-toggle");
      if (toggle) {
        toggle.hidden = false;
        toggle.addEventListener("click", function () {
          var paused = marquee.classList.toggle("paused");
          toggle.setAttribute("aria-pressed", String(paused));
          toggle.textContent = paused ? "Play logos" : "Pause logos";
        });
      }
    }

    // Accessibility panel
    var btn = document.getElementById("a11y-btn"), panel = document.getElementById("a11y-panel");
    if (!btn || !panel) return;
    function setOpen(open) {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { setOpen(panel.hidden); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });

    function sync() {
      Array.prototype.forEach.call(panel.querySelectorAll("input"), function (input) {
        var k = input.name.replace("a11y-", "");
        input.checked = input.type === "radio" ? input.value === prefs[k] : prefs[k] === input.value;
      });
    }
    panel.addEventListener("change", function (e) {
      var input = e.target, k = input.name.replace("a11y-", "");
      if (!(k in DEFAULTS)) return;
      prefs[k] = input.type === "checkbox" ? (input.checked ? input.value : DEFAULTS[k]) : input.value;
      apply(prefs); save(prefs);
    });
    document.getElementById("a11y-reset").addEventListener("click", function () {
      for (var k in DEFAULTS) prefs[k] = DEFAULTS[k];
      apply(prefs); save(prefs); sync();
    });
    sync();
  });

  // References: copy APA or BibTeX, and show or hide the BibTeX block
  document.addEventListener("DOMContentLoaded", function () {
    var status = document.createElement("p");
    status.className = "sr-only"; status.setAttribute("aria-live", "polite");
    document.body.appendChild(status);

    function copy(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      return new Promise(function (resolve, reject) {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        if (ok) resolve(); else reject();
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (btn) {
      var label = btn.textContent;
      btn.addEventListener("click", function () {
        var src = document.getElementById(btn.getAttribute("data-copy"));
        if (!src) return;
        copy(src.textContent.replace(/\s+\n/g, "\n").trim()).then(function () {
          btn.textContent = "Copied ✓"; status.textContent = label.replace("Copy ", "") + " citation copied to the clipboard";
        }, function () {
          btn.textContent = "Copy failed"; status.textContent = "Copy failed: select the text and copy it manually";
        }).then(function () {
          setTimeout(function () { btn.textContent = label; }, 2000);
        });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-toggle]"), function (btn) {
      var box = document.getElementById(btn.getAttribute("aria-controls"));
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") !== "true";
        btn.setAttribute("aria-expanded", String(open));
        btn.textContent = open ? "Hide BibTeX" : "Show BibTeX";
        box.hidden = !open;
      });
    });
  });
})();
