(function () {
  const header = document.getElementById("header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const tabButtons = document.querySelectorAll(".sector-tabs [data-sector]");
  const panels = document.querySelectorAll("[data-panel]");
  const sectorTriggers = document.querySelectorAll("[data-sector]");
  const navOffset = () => {
    const h = header ? header.offsetHeight : 72;
    return h + 12;
  };

  function onScroll() {
    if (!header) return;
    if (!document.querySelector(".hero")) {
      header.classList.add("is-scrolled");
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  function setSector(sector, { updateHash = true } = {}) {
    if (!sector || !panels.length) return false;

    tabButtons.forEach((btn) => {
      const active = btn.dataset.sector === sector;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      const active = panel.dataset.panel === sector;
      panel.classList.toggle("is-active", active);
      if (active) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });

    document.querySelectorAll(".sector-nav a[data-sector]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.sector === sector);
    });

    if (updateHash && window.location.hash.replace("#", "") !== sector) {
      history.replaceState(null, "", "#" + sector);
    }

    return true;
  }

  function scrollToSectors() {
    const target = document.getElementById("sectors");
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - navOffset();
    window.scrollTo({ top, behavior: "smooth" });
  }

  function closeMobileNav() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMobileNav());
    });
  }

  sectorTriggers.forEach((el) => {
    el.addEventListener("click", (event) => {
      const sector = el.dataset.sector;
      if (!sector || !panels.length) return;

      event.preventDefault();
      setSector(sector);
      scrollToSectors();
      closeMobileNav();
    });
  });

  // Keyboard support for sector tabs
  const tabList = document.querySelector(".sector-tabs");
  if (tabList) {
    tabList.addEventListener("keydown", (event) => {
      const tabs = [...tabButtons];
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;

      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === index) return;

      event.preventDefault();
      tabs[next].focus();
      setSector(tabs[next].dataset.sector);
    });
  }

  function applyHash() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    if (document.querySelector(`[data-panel="${hash}"]`)) {
      setSector(hash, { updateHash: false });
      // Wait a tick so layout is ready, then offset for fixed header
      requestAnimationFrame(() => scrollToSectors());
      return;
    }

    const section = document.getElementById(hash);
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - navOffset();
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  window.addEventListener("hashchange", applyHash);

  const form = document.getElementById("signup-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const email = "joseph@kingsley.co.kr";
      const data = new FormData(form);
      const sectors = data.getAll("sectors").join(", ") || "Not specified";
      const subject = encodeURIComponent("CORELINK GLOBAL account request");
      const body = encodeURIComponent(
        [
          `Name: ${data.get("firstName")} ${data.get("lastName")}`,
          `Email: ${data.get("email")}`,
          `Company: ${data.get("company")}`,
          `Title: ${data.get("title")}`,
          `Sectors: ${sectors}`,
        ].join("\n")
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  applyHash();
})();
