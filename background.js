const domainTimeMap = {};
const domainVisitPeriods = {};
let activeTabId = null;
let activeDomain = null;
let activeStartTime = null;

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.split('.').slice(-2).join('.');
  } catch (e) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

function updateActiveTime() {
  if (activeDomain && activeStartTime) {
    const elapsedTime = Date.now() - activeStartTime;
    if (!domainTimeMap[activeDomain]) {
      domainTimeMap[activeDomain] = 0;
      domainVisitPeriods[activeDomain] = [];
    }
    domainTimeMap[activeDomain] += elapsedTime;
    domainVisitPeriods[activeDomain].push({
      start: new Date(activeStartTime).toLocaleString(),
      end: new Date().toLocaleString()
    });
  }
}

chrome.tabs.onActivated.addListener(activeInfo => {
  updateActiveTime();
  activeTabId = activeInfo.tabId;
  activeStartTime = Date.now();
  chrome.tabs.get(activeTabId, tab => {
    const domain = getDomainFromUrl(tab.url);
    if (domain) {
      activeDomain = domain;
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    updateActiveTime();
    const domain = getDomainFromUrl(changeInfo.url);
    if (domain) {
      activeDomain = domain;
      activeStartTime = Date.now();
    }
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    updateActiveTime();
    activeTabId = null;
    activeDomain = null;
    activeStartTime = null;
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, tabs => {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        const domain = getDomainFromUrl(tabs[0].url);
        if (domain) {
          activeDomain = domain;
          activeStartTime = Date.now();
        }
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDomainTimeMap') {
    updateActiveTime();
    sendResponse({ domainTimeMap, domainVisitPeriods });
  }
});