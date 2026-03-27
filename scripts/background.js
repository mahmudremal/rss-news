const DEFAULT_RSS = [
  "https://www.presstv.ir/rss.xml",
  "https://www.telesurenglish.net/feed/",
  "https://www.middleeastmonitor.com/feed/",
  "https://www.aljazeera.com/xml/rss/all.xml",
];
const IMAGE_FETCH_INTERVAL = 60; // 60 minutes
const RSS_FETCH_INTERVAL = 30; // 30 minutes

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["feeds", "news", "lastImage", "lastImageTime"],
    (result) => {
      const updateObj = {};
      if (!result.feeds) updateObj.feeds = DEFAULT_RSS;
      if (!result.news) updateObj.news = [];
      if (!result.lastImage) updateObj.lastImage = null;
      if (!result.lastImageTime) updateObj.lastImageTime = 0;
      if (Object.keys(updateObj).length > 0) {
        chrome.storage.local.set(updateObj);
      }
    },
  );

  chrome.contextMenus.create({
    id: "next-wallpaper",
    title: "Next wallpaper",
    contexts: ["all"],
    documentUrlPatterns: ["chrome-extension://*/*"],
  });

  fetchFeeds();
  fetchNewImage();
  chrome.alarms.create("refresh-rss", { periodInMinutes: RSS_FETCH_INTERVAL });
  chrome.alarms.create("refresh-image", {
    periodInMinutes: IMAGE_FETCH_INTERVAL,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refresh-rss") fetchFeeds();
  if (alarm.name === "refresh-image") fetchNewImage();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "next-wallpaper") {
    fetchNewImage();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refresh-feeds") {
    fetchFeeds().then(() => sendResponse({ status: "success" }));
    return true; // async response
  }
});

async function fetchFeeds() {
  const { feeds } = await chrome.storage.local.get("feeds");
  let allNews = [];

  if (!feeds) return;

  for (const url of feeds) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      // Simple regex-based XML parsing since DOMParser isn't in Service Worker
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
      const parsedItems = items.slice(0, 10).map((item) => {
        const title =
          item.match(/<title>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/)?.[2] ||
          "";
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        const description =
          item.match(
            /<description>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/description>/,
          )?.[2] || "";
        return {
          title,
          link,
          pubDate,
          description:
            description.replace(/<[^>]*>?/gm, "").substring(0, 150) + "...",
        };
      });
      allNews = [...allNews, ...parsedItems];
    } catch (e) {
      console.error("Error fetching feed:", url, e);
    }
  }

  if (allNews.length > 0) {
    // Sort by date (desc)
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    chrome.storage.local.set({ news: allNews });
  }
}

async function fetchNewImage() {
  try {
    // We'll use a curated list of nature IDs for better reliability
    const natureIds = [
      "1470071459604-3b5ec3a7fe05", // Forest
      "1441974231531-c6227db76b6e", // Trees
      "1501854140801-50d01698950b", // Mountain
      "1464822759023-fed622ff2c3b", // Peaks
      "1506744038136-46273834b3fb", // Canyon

      "1506744038136-46273834b3fb",
      "1501785888041-af3ef285b470",
      "1511884642898-4c92249e20b6",
      "1464822759023-fed622ff2c3b",
      "1532274402911-5a369e4c4bb5",
      "1506260408121-e353d10b87c7",
      "1433838552652-f9a46b332c40",
      "1518098268026-4e89f1a2cd8e",
      "1523712999610-f77fbcfc3843",
      "1500964757637-c85e8a162699",
      "1434725039720-aaad6dd32dfe",
      "1472214103451-9374bd1c798e",
    ];
    const randomId = natureIds[Math.floor(Math.random() * natureIds.length)];
    const fetchUrl = `https://images.unsplash.com/photo-${randomId}?auto=format&fit=crop&w=1920&q=80`;

    chrome.storage.local.set({
      lastImage: fetchUrl,
      lastImageTime: Date.now(),
    });
  } catch (e) {
    console.error("Error setting image:", e);
  }
}
