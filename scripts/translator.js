class Translator {
  constructor() {
    this.select = document.getElementById("language-select");
    this.container = document.getElementById("translator");
    this.customLanguagesKey = "custom-languages";
    this.selectedLangKey = "selected-language";
    this.originalTitle = "";
    this.originalContent = "";

    this.init();
  }

  init() {
    this.loadCustomLanguages();
    this.loadSelectedLanguage();
    this.updateVisibility();

    window.addEventListener("online", () => this.updateVisibility());
    window.addEventListener("offline", () => this.updateVisibility());

    this.select.addEventListener("change", () => this.handleLanguageChange());
  }

  loadCustomLanguages() {
    const custom = JSON.parse(
      localStorage.getItem(this.customLanguagesKey) || "[]",
    );
    custom.forEach((lang) =>
      this.addLanguageOption(lang.name, lang.code, false),
    );
  }

  loadSelectedLanguage() {
    const saved = localStorage.getItem(this.selectedLangKey);
    if (saved) {
      this.select.value = saved;
    }
  }

  updateVisibility() {
    if (navigator.onLine) {
      this.container.classList.remove("hidden");
    } else {
      this.container.classList.add("hidden");
    }
  }

  addLanguageOption(name, code, save = true) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    option.className = "bg-zinc-900";
    const otherOption = this.select.querySelector('option[value="other"]');
    this.select.insertBefore(option, otherOption);

    if (save) {
      const custom = JSON.parse(
        localStorage.getItem(this.customLanguagesKey) || "[]",
      );
      custom.push({ name, code });
      localStorage.setItem(this.customLanguagesKey, JSON.stringify(custom));
    }
  }

  async handleLanguageChange() {
    const val = this.select.value;

    if (val === "other") {
      const name = prompt("Enter language name:");
      const code = prompt("Enter language code (e.g. tr, fr):");

      if (name && code) {
        this.addLanguageOption(name, code);
        this.select.value = code;
        localStorage.setItem(this.selectedLangKey, code);
      } else {
        this.select.value = "default";
      }
    } else {
      localStorage.setItem(this.selectedLangKey, val);
    }

    await this.applyTranslation();
  }

  setOriginals(title, content) {
    this.originalTitle = title;
    this.originalContent = content;
    this.applyTranslation();
  }

  async applyTranslation() {
    const lang = this.select.value;
    const titleEl = document.getElementById("modal-title");
    const articleEl = document.getElementById("modal-article");

    if (lang === "default") {
      titleEl.textContent = this.originalTitle;
      articleEl.innerHTML = this.originalContent;
      return;
    }

    titleEl.textContent = "Translating...";

    const translatedTitle = await this.translateText(this.originalTitle, lang);
    titleEl.textContent = translatedTitle;
    titleEl.setAttribute(
      "title",
      translatedTitle.length >= 70 ? translatedTitle : "",
    );

    // For the body, we clone to avoid flickering and translate text nodes
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = this.originalContent;

    await this.translateElement(tempDiv, lang);
    articleEl.innerHTML = tempDiv.innerHTML;
  }

  async translateText(text, targetLang) {
    if (!text || !text.trim()) return text;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data[0].map((x) => x[0]).join("");
    } catch (e) {
      return text;
    }
  }

  async translateElement(el, targetLang) {
    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) nodes.push(node);
    }

    // Group translations to stay under URL limit
    let currentBatch = [];
    let currentLen = 0;

    for (const node of nodes) {
      const text = node.nodeValue;
      if (currentLen + text.length > 800) {
        await this.processBatch(currentBatch, targetLang);
        currentBatch = [];
        currentLen = 0;
      }
      currentBatch.push(node);
      currentLen += text.length;
    }
    if (currentBatch.length) await this.processBatch(currentBatch, targetLang);
  }

  async processBatch(nodes, targetLang) {
    const separator = "|||";
    const joinedText = nodes.map((n) => n.nodeValue).join(` ${separator} `);
    const translatedJoined = await this.translateText(joinedText, targetLang);

    // Normalize separator just in case Google Translate adds spaces
    const translatedParts = translatedJoined.split(separator);

    nodes.forEach((node, i) => {
      if (translatedParts[i]) {
        node.nodeValue = translatedParts[i].trim();
      }
    });
  }
}

window.translator = new Translator();
