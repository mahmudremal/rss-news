const feedsInput = document.getElementById('feeds');
const saveBtn = document.getElementById('save');

const offlineToggle = document.getElementById('offline-toggle');
const toggleBg = document.getElementById('toggle-bg');
const toggleDot = document.getElementById('toggle-dot');

function updateToggleUI() {
  if (offlineToggle.checked) {
    toggleBg.style.backgroundColor = '#18181b'; // zinc-900 equivalent
    toggleDot.style.transform = 'translateX(16px)';
  } else {
    toggleBg.style.backgroundColor = '#e4e4e7'; // zinc-200 equivalent
    toggleDot.style.transform = 'translateX(0)';
  }
}

offlineToggle.addEventListener('change', updateToggleUI);

// Load settings
chrome.storage.local.get(['feeds', 'offlineReadingEnabled'], ({ feeds, offlineReadingEnabled }) => {
  if (feeds) {
    feedsInput.value = feeds.join(', ');
  }
  if (offlineReadingEnabled !== undefined) {
    offlineToggle.checked = offlineReadingEnabled;
  }
  updateToggleUI();
});

// Save settings
saveBtn.addEventListener('click', () => {
  const newFeeds = feedsInput.value
    .split(',')
    .map(url => url.trim())
    .filter(url => url.startsWith('http'));

  if (newFeeds.length === 0) {
    alert('Please enter at least one valid RSS URL.');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  chrome.storage.local.set({ 
    feeds: newFeeds,
    offlineReadingEnabled: offlineToggle.checked 
  }, () => {
    // Notify background script to fetch immediately
    chrome.runtime.sendMessage({ action: 'refresh-feeds' }, () => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Saved & Refreshed!';
      setTimeout(() => {
        saveBtn.textContent = 'Save & Refresh';
        window.close();
      }, 1000);
    });
  });
});
