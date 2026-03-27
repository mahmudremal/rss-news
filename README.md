# RSS News New Tab

A clean and minimal Chrome extension that overrides your default new tab page with beautifully formatted RSS news feeds, stunning nature wallpapers from Unsplash, and an integrated offline reading mode.

Handcrafted by **Remal Mahmud**.

## ✨ Features

- **Minimalist New Tab Experience**: Enjoy a serene and clean aesthetic with a dynamic glassmorphism UI.
- **Dynamic Wallpapers**: Periodically fetches and rotates through curated, breathtaking nature wallpapers from Unsplash. You can also right-click anywhere to select "Next wallpaper" via the context menu.
- **Configurable RSS Feeds**: Easily add multiple RSS feeds separated by commas via the extension popup. Defaults to Al Jazeera.
- **Offline Reading Mode**: Toggle 'Offline Reading' from the popup. The top 5 articles are discreetly downloaded using Mozilla's pure JavaScript `Readability.js`. This allows you to instantly pop open a distraction-free, beautifully formatted reading modal on your dashboard without needing an internet connection.
- **Dark Mode Native**: A custom Tailwind CSS design tailored carefully around a sleek dark glass look, making your news feed incredibly easy on the eyes.
- **Clock & Date Integration**: Stay on track with time and date displayed centrally in an elegant typography layout.

## 🚀 Installation

Since this extension is not currently published on the Chrome Web Store, you can manually load it:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `rss-news` project directory.
6. Open a new tab and enjoy your new beautifully minimal feed!

## ⚙️ How To Use

1. Click on the extension icon in your toolbar to open the config popup.
2. Paste any valid RSS XML feeds (comma seperated) you prefer and click **Save & Refresh**.
3. Toggle the **Offline Reading** switch to pre-fetch reading modes for the top 5 articles automatically.
4. Click "Read More →" on any article to see it in full.

## 🛠️ Development

Built using purely modern Web APIs alongside tailored native tools:

- **Manifest V3** compliant.
- **Tailwind CSS** (compiled minimally via Local NPM script).
- Chrome Storage, Alarms, and Messages APIs.
- Built-in DOM Parser and RegEx parsing for maximum Service Worker compatibility.

To tinker with the styling, run the local tailwind compiler (ensure you have Node installed):

```bash
npm run tailwindmini
```

## 📜 License

© 2026 - Minimal RSS News.
