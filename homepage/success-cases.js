(function initSuccessCasesPage() {
  const rootEl = document.querySelector("[data-success-cases-root]");
  const queryRoot = rootEl || document;
  const caseList = queryRoot.querySelector("#case-list");
  const caseDetail = queryRoot.querySelector("#case-detail");
  const searchInput = queryRoot.querySelector("#case-search");
  const prevButton = queryRoot.querySelector("#cases-prev");
  const nextButton = queryRoot.querySelector("#cases-next");
  const caseCarouselWindow = queryRoot.querySelector(".case-carousel-window");
  const cases = Array.isArray(window.DBCOOKER_SUCCESS_CASES)
    ? window.DBCOOKER_SUCCESS_CASES.slice()
    : [];

  if (!caseList || !caseDetail || !cases.length) {
    return;
  }

  const syncHashEnabled = !rootEl || rootEl.dataset.syncHash !== "false";
  const layout = rootEl?.dataset.casesLayout || (prevButton && nextButton ? "carousel-fixed" : "list");
  const isCarousel = layout === "carousel-fixed";
  const autoplayDelay = Math.max(2600, Number(rootEl?.dataset.autoplayMs || "5400"));

  let filteredCases = cases.slice();
  let selectedId = getInitialCaseId();
  let touchStartX = 0;
  let touchDeltaX = 0;
  let autoplayTimer = 0;
  let autoplayPaused = false;

  bindGlobalEvents();
  render();

  function bindGlobalEvents() {
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        render();
      });
    }

    if (syncHashEnabled) {
      window.addEventListener("hashchange", () => {
        const nextId = getInitialCaseId();
        if (!nextId) {
          return;
        }
        selectedId = nextId;
        render();
      });
    }

    if (!isCarousel) {
      return;
    }

    prevButton?.addEventListener("click", () => {
      stepSelection(-1, { wrap: true });
      restartAutoplay();
    });

    nextButton?.addEventListener("click", () => {
      stepSelection(1, { wrap: true });
      restartAutoplay();
    });

    caseList.addEventListener(
      "touchstart",
      (event) => {
        pauseAutoplay();
        touchStartX = event.changedTouches[0]?.clientX || 0;
        touchDeltaX = 0;
      },
      { passive: true }
    );

    caseList.addEventListener(
      "touchmove",
      (event) => {
        const currentX = event.changedTouches[0]?.clientX || touchStartX;
        touchDeltaX = currentX - touchStartX;
      },
      { passive: true }
    );

    caseList.addEventListener(
      "touchend",
      () => {
        if (Math.abs(touchDeltaX) >= 48) {
          stepSelection(touchDeltaX < 0 ? 1 : -1, { wrap: true });
        }
        touchDeltaX = 0;
        resumeAutoplay();
      },
      { passive: true }
    );

    rootEl?.addEventListener("mouseenter", pauseAutoplay);
    rootEl?.addEventListener("mouseleave", resumeAutoplay);
    rootEl?.addEventListener("focusin", pauseAutoplay);
    rootEl?.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!rootEl?.contains(document.activeElement)) {
          resumeAutoplay();
        }
      }, 0);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseAutoplay();
      } else {
        resumeAutoplay();
      }
    });
  }

  function getInitialCaseId() {
    if (!syncHashEnabled) {
      return cases[0] ? cases[0].id : "";
    }

    const hashValue = window.location.hash.replace(/^#/, "");
    const match = cases.find((item) => item.id === hashValue);
    return match ? match.id : (cases[0] ? cases[0].id : "");
  }

  function render() {
    filteredCases = getFilteredCases();

    if (!filteredCases.length) {
      renderEmptyState();
      return;
    }

    if (!filteredCases.some((item) => item.id === selectedId)) {
      selectedId = filteredCases[0].id;
      syncHash(selectedId, true);
    }

    renderCaseCards(filteredCases);
    updateSelectedCaseUI(false);
    syncAutoplay();
  }

  function getFilteredCases() {
    const query = (searchInput?.value || "").trim().toLowerCase();
    if (!query) {
      return cases.slice();
    }

    return cases.filter((item) => {
      const haystack = [
        item.name,
        item.displayName,
        item.description,
        item.files.join(" "),
        basename(item.source.texPath),
        `${item.source.sectionLine}`,
        `${item.source.diffEndLine}`,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  function renderEmptyState() {
    caseList.innerHTML = `
      <div class="empty-state">
        <h3>No cases found</h3>
        <p>Try a different keyword.</p>
      </div>
    `;
    caseDetail.innerHTML = "";

    if (isCarousel) {
      caseList.style.transform = "translate3d(0, 0, 0)";
      updateNavigationState();
      stopAutoplay();
    }
  }

  function renderCaseCards(items) {
    caseList.innerHTML = items
      .map((item, index) => renderCardMarkup(item, item.id === selectedId, index))
      .join("");

    caseList.querySelectorAll("[data-case-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextId = button.getAttribute("data-case-id") || "";
        const nextIndex = Number(button.getAttribute("data-case-index") || "0");

        if (!nextId) {
          return;
        }

        selectedId = nextId;
        syncHash(selectedId, false);
        updateSelectedCaseUI(true, Number.isNaN(nextIndex) ? undefined : nextIndex);
        restartAutoplay();
      });
    });
  }

  function renderCardMarkup(item, isActive, index) {
    const activeClass = isActive ? " is-active" : "";
    const caseLabel = getCaseLabel(item);
    const registrationSignature = getRegistrationSignature(item);

    if (isCarousel) {
      return `
        <button class="case-card${activeClass}" type="button" data-case-id="${escapeHtml(item.id)}" data-case-index="${index}">
          <div class="case-card-copy">
            <p class="case-kicker">Source Function</p>
            <div class="case-card-head">
              <p class="case-title">${escapeHtml(caseLabel)}</p>
            </div>
            <p class="case-description">${escapeHtml(item.description)}</p>
            ${registrationSignature ? `
              <div class="case-signature">
                <p class="case-signature-label">Function Declaration</p>
                <pre class="case-signature-code">${escapeHtml(registrationSignature)}</pre>
              </div>
            ` : ""}
          </div>
        </button>
      `;
    }

    const sourceLabel = `${basename(item.source.texPath)}:${item.source.sectionLine}-${item.source.diffEndLine}`;
    return `
      <button class="case-card${activeClass}" type="button" data-case-id="${escapeHtml(item.id)}" data-case-index="${index}">
        <p class="case-kicker">Source Context</p>
        <div class="case-card-head">
          <p class="case-title">${escapeHtml(caseLabel)}</p>
        </div>
        <p class="case-description">${escapeHtml(item.description)}</p>
        <div class="case-source-block">
          <span class="source-chip">${escapeHtml(sourceLabel)}</span>
        </div>
        <div class="case-files">
          ${item.files.map((file) => `<span class="file-chip">${escapeHtml(file)}</span>`).join("")}
        </div>
      </button>
    `;
  }

  function stepSelection(direction, options = {}) {
    if (!filteredCases.length) {
      return;
    }

    const currentIndex = getSelectedIndex();
    let nextIndex = currentIndex + direction;

    if (options.wrap) {
      nextIndex = (nextIndex + filteredCases.length) % filteredCases.length;
    } else {
      nextIndex = clampIndex(nextIndex);
    }

    if (nextIndex === currentIndex) {
      return;
    }

    selectedId = filteredCases[nextIndex].id;
    syncHash(selectedId, false);
    updateSelectedCaseUI(true, nextIndex);
  }

  function updateSelectedCaseUI(animate, forcedIndex) {
    const selectedIndex = typeof forcedIndex === "number" ? forcedIndex : getSelectedIndex();
    const selectedCase = filteredCases[selectedIndex] || filteredCases[0];

    if (!selectedCase) {
      return;
    }

    selectedId = selectedCase.id;

    caseList.querySelectorAll("[data-case-id]").forEach((button, buttonIndex) => {
      const isActive = button.getAttribute("data-case-id") === selectedId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
      if (isCarousel) {
        button.setAttribute("aria-hidden", buttonIndex === selectedIndex ? "false" : "true");
        button.tabIndex = buttonIndex === selectedIndex ? 0 : -1;
      }
    });

    if (isCarousel) {
      updateCarouselPosition(selectedIndex, animate);
      updateNavigationState();
    }

    renderDetail(selectedCase);
  }

  function updateCarouselPosition(selectedIndex, animate) {
    caseList.style.transition = animate ? "transform 520ms cubic-bezier(.22,.61,.36,1)" : "none";
    caseList.style.transform = `translate3d(${-selectedIndex * 100}%, 0, 0)`;
  }

  function updateNavigationState() {
    const disableControls = filteredCases.length <= 1;
    setButtonState(prevButton, disableControls);
    setButtonState(nextButton, disableControls);

    if (caseCarouselWindow) {
      caseCarouselWindow.classList.toggle("is-static", disableControls);
    }
  }

  function renderDetail(item) {
    if (isCarousel) {
      caseDetail.innerHTML = `
        <article class="diff-card diff-card--solo">
          <div class="diff-toolbar">
            <p class="diff-title">Patch Diff</p>
            <button class="copy-button" type="button" id="copy-diff">Copy Diff</button>
          </div>
          <div class="diff-shell">
            <pre class="diff-code">${renderDiff(item.diffText)}</pre>
          </div>
        </article>
      `;
    } else {
      const sourceLabel = `${basename(item.source.texPath)}:${item.source.sectionLine}-${item.source.diffEndLine}`;
      const caseLabel = getCaseLabel(item);

      caseDetail.innerHTML = `
        <article class="detail-hero">
          <p class="detail-kicker">Concrete Modification</p>
          <div class="detail-title-wrap">
            <h2>${escapeHtml(caseLabel)}</h2>
            <p class="detail-description">${escapeHtml(item.description)}</p>
          </div>
          <div class="detail-files">
            ${item.files.map((file) => `<span class="file-chip">${escapeHtml(file)}</span>`).join("")}
          </div>
          <p class="detail-note">Source anchor: ${escapeHtml(sourceLabel)}</p>
        </article>

        <article class="diff-card">
          <div class="diff-toolbar">
            <div>
              <p class="diff-title">Exact Diff</p>
              <p class="meta-text">Exact implementation diff for the selected case.</p>
            </div>
            <button class="copy-button" type="button" id="copy-diff">Copy Diff</button>
          </div>
          <div class="diff-shell">
            <pre class="diff-code">${renderDiff(item.diffText)}</pre>
          </div>
        </article>
      `;
    }

    const copyButton = caseDetail.querySelector("#copy-diff");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        const originalText = copyButton.textContent;
        try {
          await navigator.clipboard.writeText(item.diffText);
          copyButton.textContent = "Copied";
        } catch (error) {
          copyButton.textContent = "Copy failed";
        }
        window.setTimeout(() => {
          copyButton.textContent = originalText;
        }, 1400);
      });
    }
  }

  function syncAutoplay() {
    if (!isCarousel) {
      return;
    }

    if (autoplayPaused || filteredCases.length <= 1) {
      stopAutoplay();
      return;
    }

    scheduleAutoplay();
  }

  function scheduleAutoplay() {
    stopAutoplay();

    if (autoplayPaused || filteredCases.length <= 1) {
      return;
    }

    autoplayTimer = window.setTimeout(() => {
      stepSelection(1, { wrap: true });
      scheduleAutoplay();
    }, autoplayDelay);
  }

  function stopAutoplay() {
    if (!autoplayTimer) {
      return;
    }

    window.clearTimeout(autoplayTimer);
    autoplayTimer = 0;
  }

  function pauseAutoplay() {
    autoplayPaused = true;
    stopAutoplay();
  }

  function resumeAutoplay() {
    autoplayPaused = false;
    syncAutoplay();
  }

  function restartAutoplay() {
    autoplayPaused = false;
    scheduleAutoplay();
  }

  function renderDiff(diffText) {
    return diffText
      .split("\n")
      .map((line) => {
        const className = classifyDiffLine(line);
        return `<span class="diff-line ${className}">${escapeHtml(line) || "&nbsp;"}</span>`;
      })
      .join("");
  }

  function classifyDiffLine(line) {
    if (line.startsWith("diff --git") || line.startsWith("index ")) {
      return "diff-line--meta";
    }
    if (line.startsWith("---")) {
      return "diff-line--file-old";
    }
    if (line.startsWith("+++")) {
      return "diff-line--file-new";
    }
    if (line.startsWith("@@")) {
      return "diff-line--hunk";
    }
    if (line.startsWith("+")) {
      return "diff-line--add";
    }
    if (line.startsWith("-")) {
      return "diff-line--del";
    }
    return "";
  }

  function getCaseLabel(item) {
    return stripFunctionSuffix(item.displayName || item.name || "");
  }

  function stripFunctionSuffix(value) {
    return String(value).replace(/\(\)\s*$/, "");
  }

  function getRegistrationSignature(item) {
    const lines = String(item.diffText || "").split("\n");

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index];
      if (!rawLine.startsWith("+")) {
        continue;
      }

      const lineBody = rawLine.slice(1);
      const trimmed = lineBody.trim();
      const macroMatch = trimmed.match(/^([A-Z][A-Z0-9_]*)\(\s*([A-Za-z_][A-Za-z0-9_]*)\b/);
      if (!macroMatch || macroMatch[2] !== item.name) {
        continue;
      }

      const declarationLines = [lineBody];
      while (!/\)\s*,?\s*$/.test(declarationLines[declarationLines.length - 1].trim())) {
        const nextLine = lines[index + 1];
        if (!nextLine || !nextLine.startsWith("+")) {
          break;
        }

        const nextBody = nextLine.slice(1);
        const nextTrimmed = nextBody.trim();
        if (!nextTrimmed) {
          break;
        }
        if (/^[A-Z][A-Z0-9_]*\(/.test(nextTrimmed)) {
          break;
        }

        declarationLines.push(nextBody);
        index += 1;
      }

      return normalizeDeclarationIndent(declarationLines);
    }

    return "";
  }

  function normalizeDeclarationIndent(lines) {
    const normalizedLines = lines.map((line) => line.replace(/\s+$/g, ""));
    const visibleLines = normalizedLines.filter((line) => line.trim());
    if (!visibleLines.length) {
      return "";
    }

    const minIndent = Math.min(
      ...visibleLines.map((line) => {
        const indentMatch = line.match(/^\s*/);
        return indentMatch ? indentMatch[0].length : 0;
      })
    );

    const dedentedLines = normalizedLines
      .map((line) => line.slice(Math.min(minIndent, line.length)))
      .map((line) => formatDeclarationLine(line));

    return dedentedLines
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/\)\s*,\s*$/, ")")
      .trim();
  }

  function formatDeclarationLine(line) {
    return line
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+,/g, ",");
  }

  function basename(path) {
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || path;
  }

  function getSelectedIndex() {
    const selectedIndex = filteredCases.findIndex((item) => item.id === selectedId);
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  function clampIndex(index) {
    return Math.min(Math.max(index, 0), filteredCases.length - 1);
  }

  function setButtonState(button, disabled) {
    if (!button) {
      return;
    }
    button.disabled = disabled;
    button.setAttribute("aria-disabled", disabled ? "true" : "false");
  }

  function syncHash(id, replace) {
    if (!syncHashEnabled) {
      return;
    }

    const hash = `#${id}`;
    if (replace) {
      history.replaceState(null, "", hash);
      return;
    }
    window.location.hash = id;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
