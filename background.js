let domainTimeMap = {};
let domainVisitPeriods = {};
let activeTabId = null;
let activeDomain = null;
let activeStartTime = null;
let isChromeActive = true;

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

function updateActiveTime() {
  if (activeDomain && activeStartTime && isChromeActive) {
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
  activeStartTime = Date.now();
}

function setActiveTab(tabId, url) {
  updateActiveTime();
  activeTabId = tabId;
  activeDomain = getDomainFromUrl(url);
}

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    setActiveTab(tab.id, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    setActiveTab(tabId, changeInfo.url);
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    updateActiveTime();
    isChromeActive = false;
  } else {
    isChromeActive = true;
    chrome.tabs.query({ active: true, windowId: windowId }, tabs => {
      if (tabs.length > 0) {
        setActiveTab(tabs[0].id, tabs[0].url);
      }
    });
  }
});

chrome.idle.onStateChanged.addListener(state => {
  if (state === 'active') {
    isChromeActive = true;
    activeStartTime = Date.now();
  } else {
    updateActiveTime();
    isChromeActive = false;
  }
});

chrome.alarms.create('saveData', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'saveData') {
    updateActiveTime();
    chrome.storage.local.set({ domainTimeMap, domainVisitPeriods });
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['domainTimeMap', 'domainVisitPeriods'], result => {
    if (result.domainTimeMap) domainTimeMap = result.domainTimeMap;
    if (result.domainVisitPeriods) domainVisitPeriods = result.domainVisitPeriods;
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDomainTimeMap') {
    updateActiveTime();
    sendResponse({ domainTimeMap, domainVisitPeriods });
  }
});