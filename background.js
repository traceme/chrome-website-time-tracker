let domainTimeMap = {};
let domainVisitPeriods = {};
let activeTabId = null;
let activeDomain = null;
let activeStartTime = null;
let isChromeActive = true;
let lastResetDate = null;

// 初始化函数，在扩展启动时调用
function initialize() {
  chrome.storage.local.get(['domainTimeMap', 'domainVisitPeriods', 'lastResetDate', 'activeTabId', 'activeDomain', 'activeStartTime'], result => {
    domainTimeMap = result.domainTimeMap || {};
    domainVisitPeriods = result.domainVisitPeriods || {};
    lastResetDate = result.lastResetDate || new Date().toDateString();
    activeTabId = result.activeTabId || null;
    activeDomain = result.activeDomain || null;
    activeStartTime = result.activeStartTime || null;
    
    checkAndResetDaily();
    
    // 如果有活动标签，重新开始计时
    if (activeTabId) {
      chrome.tabs.get(activeTabId, tab => {
        if (tab) {
          setActiveTab(tab.id, tab.url);
        }
      });
    }
  });
}

function getDomainFromUrl(url) {
  if (!url) return null;
  
  // 处理 chrome:// 和 edge:// 等特殊 URL
  if (url.startsWith('chrome://') || url.startsWith('edge://')) {
    return url.split('://')[0] + '://';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname || urlObj.protocol;
  } catch (e) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

function updateActiveTime() {
  if (activeDomain && activeStartTime && isChromeActive) {
    const now = Date.now();
    const elapsedTime = now - activeStartTime;
    if (!domainTimeMap[activeDomain]) {
      domainTimeMap[activeDomain] = 0;
      domainVisitPeriods[activeDomain] = [];
    }
    domainTimeMap[activeDomain] += elapsedTime;
    
    // 更新或添加访问时间段
    const lastPeriod = domainVisitPeriods[activeDomain][domainVisitPeriods[activeDomain].length - 1];
    if (lastPeriod && lastPeriod.end === activeStartTime) {
      lastPeriod.end = now;
    } else {
      domainVisitPeriods[activeDomain].push({
        start: activeStartTime,
        end: now
      });
    }
    
    activeStartTime = now;
    saveData();
  }
}

function setActiveTab(tabId, url) {
  updateActiveTime();
  activeTabId = tabId;
  const domain = getDomainFromUrl(url);
  if (domain) {
    activeDomain = domain;
    activeStartTime = Date.now();
  } else {
    console.warn(`Unable to get domain from URL: ${url}`);
    activeDomain = null;
    activeStartTime = null;
  }
  saveData();
}

function resetDailyData() {
  domainTimeMap = {};
  domainVisitPeriods = {};
  lastResetDate = new Date().toDateString();
  saveData();
}

function checkAndResetDaily() {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    resetDailyData();
  }
}

function saveData() {
  chrome.storage.local.set({ 
    domainTimeMap, 
    domainVisitPeriods, 
    lastResetDate,
    activeTabId,
    activeDomain,
    activeStartTime
  });
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
    handleChromeBecomingActive();
  }
});

chrome.idle.onStateChanged.addListener(state => {
  if (state === 'active') {
    handleChromeBecomingActive();
  } else {
    updateActiveTime();
    isChromeActive = false;
  }
});

// 每分钟更新一次数据
chrome.alarms.create('updateData', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'updateData') {
    updateActiveTime();
    checkAndResetDaily();
  }
});

chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDomainTimeMap') {
    updateActiveTime();
    sendResponse({ domainTimeMap, domainVisitPeriods });
  } else if (request.action === 'focusRegained') {
    handleChromeBecomingActive();
  }
});

function handleChromeBecomingActive() {
  isChromeActive = true;
  if (!activeStartTime) {
    activeStartTime = Date.now();
  }
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id, tabs[0].url);
    }
  });
}

// 初始化
initialize();