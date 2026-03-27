let g_offlineReadingEnabled = false;
let g_news = [];

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  document.getElementById("clock").textContent = time;
  document.getElementById("date").textContent = date;
}

async function loadContent() {
  const { news, lastImage, offlineReadingEnabled } =
    await chrome.storage.local.get([
      "news",
      "lastImage",
      "offlineReadingEnabled",
    ]);
  g_offlineReadingEnabled = offlineReadingEnabled || false;
  g_news = news || [];

  // Update Background
  if (lastImage) {
    document.getElementById("bg-image").style.backgroundImage =
      `url('${lastImage}')`;
  }

  // Update News
  const container = document.getElementById("news-container");
  if (!g_news || g_news.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center glass p-8 rounded-2xl">Fetching latest news...</div>`;
    return;
  }

  container.innerHTML = g_news
    .map(
      (item, index) => `
    <article class="glass p-6 rounded-2xl flex flex-col h-full hover:bg-white/20 transition-all duration-300 group">
      <h2 class="text-xl font-medium mb-3 line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors">${item.title}</h2>
      <p class="text-white/70 text-sm mb-4 line-clamp-3 leading-relaxed">${item.description}</p>
      <div class="mt-auto flex justify-between items-center text-xs opacity-60">
        <span>${item?.pubDate ? new Date(item.pubDate).toLocaleDateString() : item?.link ? new URL(item.link)?.hostname : ""}</span>
        <a href="${item.link}" data-index="${index}" class="read-more-btn hover:underline flex items-center">Read More &rarr;</a>
      </div>
    </article>
  `,
    )
    .join("");

  // Attach event listeners for article modal
  document.querySelectorAll(".read-more-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (g_offlineReadingEnabled) {
        e.preventDefault();
        openModal(g_news[e.currentTarget.dataset.index]);
      }
    });
  });

  if (g_offlineReadingEnabled) {
    cacheFullArticles(g_news);
  }
}

async function fetchArticle(url) {
  const res = await fetch(url);
  return await res.text();
}

function extractWithReadability(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  // ensure textContent works, or return full html content for nice reading mode formatting.
  const reader = new Readability(doc);
  const article = reader.parse();
  return article?.content || "";
}

async function cacheFullArticles(newsItems) {
  const { articleCache = {} } = await chrome.storage.local.get("articleCache");
  let cacheUpdated = false;

  // Fetch only top 5 articles like the user snippet suggested to save ops & network.
  for (const item of newsItems.slice(0, 5)) {
    if (!articleCache[item.link]) {
      try {
        const html = await fetchArticle(item.link);
        const articleHtml = extractWithReadability(html, item.link);
        if (articleHtml) {
          articleCache[item.link] = articleHtml;
          cacheUpdated = true;
        }
      } catch (err) {
        console.error("Failed to fetch/extract article:", item.link, err);
      }
    }
  }

  if (cacheUpdated) {
    chrome.storage.local.set({ articleCache });
  }
}

async function openModal(newsItem) {
  const modal = document.getElementById("article-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalArticle = document.getElementById("modal-article");
  const modalOriginalLink = document.getElementById("modal-original-link");

  modalTitle.textContent = newsItem.title;
  modalTitle.setAttribute(
    "title",
    newsItem.title?.length >= 70 ? newsItem.title : "",
  );
  modalOriginalLink.href = newsItem.link;
  modalArticle.innerHTML = `${newsItem?.description && `<div class="w-full flex flex-col items-center justify-center p-12">${newsItem.description}</div>`}<div class="w-full flex flex-col items-center justify-center p-12"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-200"></div></div>`;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  const { articleCache = {} } = await chrome.storage.local.get("articleCache");
  let content = articleCache[newsItem.link];

  if (!content) {
    try {
      const html = await fetchArticle(newsItem.link);
      content = extractWithReadability(html, newsItem.link);
      if (content) {
        articleCache[newsItem.link] = content;
        chrome.storage.local.set({ articleCache });
      }
    } catch (e) {
      content = `<p class="text-red-500 font-sans text-base">Failed to load content. Please read the original article.</p>`;
    }
  }

  modalArticle.innerHTML =
    content ||
    `<p class="text-red-500 font-sans text-base">No content could be extracted.</p>`;

  if (window.translator) {
    window.translator.setOriginals(newsItem.title, modalArticle.innerHTML);
  }
}

document.getElementById("close-modal")?.addEventListener("click", () => {
  const modal = document.getElementById("article-modal");
  modal.style.display = "none";
  document.body.style.overflow = "";
});

// Close modal when clicking outside
document.getElementById("article-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "article-modal") {
    document.getElementById("close-modal").click();
  }
});

// Initial calls
setInterval(updateClock, 1000);
updateClock();
loadContent();

// Listen for updates from storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.news || changes.lastImage || changes.offlineReadingEnabled) {
    loadContent();
  }
});
