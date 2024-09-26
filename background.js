let siteTimeMap = {};
let pageTimeMap = {};
let pageTitleMap = {}; // 新增：存储页面标题
let pageVisitPeriods = {}; // 新增：存储页面访问时间段
let activeTabId = null;
let activeSite = null;
let activePage = null;
let activeStartTime = null;
let isChromeActive = true;
let isActiveWindow = true; // 新增：跟踪当前窗口是否活跃
let lastResetDate = null;

// 初始化函数，在扩展启动时调用
function initialize() {
  chrome.storage.local.get(['siteTimeMap', 'pageTimeMap', 'pageTitleMap', 'pageVisitPeriods', 'lastResetDate', 'activeTabId', 'activeSite', 'activePage', 'activeStartTime'], result => {
    siteTimeMap = result.siteTimeMap || {};
    pageTimeMap = result.pageTimeMap || {};
    pageTitleMap = result.pageTitleMap || {}; // 新增
    pageVisitPeriods = result.pageVisitPeriods || {}; // 新增
    lastResetDate = result.lastResetDate || new Date().toDateString();
    activeTabId = result.activeTabId || null;
    activeSite = result.activeSite || null;
    activePage = result.activePage || null;
    activeStartTime = result.activeStartTime || null;
    
    checkAndResetDaily();
    
    if (activeTabId) {
      chrome.tabs.get(activeTabId, tab => {
        if (chrome.runtime.lastError) {
          console.warn(`Error getting tab: ${chrome.runtime.lastError.message}`);
          resetActiveState();
        } else if (tab) {
          setActiveTab(tab.id, tab.url, tab.title);
        }
      });
    }
  });
  
  // 设置每天0点重置数据的闹钟
  chrome.alarms.create('dailyReset', {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60 // 每24小时重复一次
  });
}

function getNextMidnight() {
  let midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

function getSiteFromUrl(url) {
  if (!url) return null;
  
  if (url.startsWith('chrome://') || url.startsWith('edge://')) {
    return url.split('://')[0] + '://';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
}

function updateActiveTime() {
  if (activeSite && activePage && activeStartTime && isChromeActive && isActiveWindow) {
    const now = Date.now();
    const elapsedTime = now - activeStartTime;
    
    siteTimeMap[activeSite] = (siteTimeMap[activeSite] || 0) + elapsedTime;
    pageTimeMap[activeSite] = pageTimeMap[activeSite] || {};
    pageTimeMap[activeSite][activePage] = (pageTimeMap[activeSite][activePage] || 0) + elapsedTime;
    
    // 更新访问时间段
    pageVisitPeriods[activeSite] = pageVisitPeriods[activeSite] || {};
    pageVisitPeriods[activeSite][activePage] = pageVisitPeriods[activeSite][activePage] || [];
    pageVisitPeriods[activeSite][activePage].push({
      start: activeStartTime,
      end: now
    });
  }
  
  activeStartTime = Date.now();
  saveData();
}

function setActiveTab(tabId, url, title) {
  updateActiveTime();
  activeTabId = tabId;
  const site = getSiteFromUrl(url);
  if (site) {
    activeSite = site;
    activePage = url;
    activeStartTime = Date.now();
    
    // 存储页面标题
    pageTitleMap[site] = pageTitleMap[site] || {};
    pageTitleMap[site][url] = title;
  } else {
    resetActiveState();
  }
  saveData();
}

function resetActiveState() {
  activeTabId = null;
  activeSite = null;
  activePage = null;
  activeStartTime = null;
  saveData();
}

function resetDailyData() {
  siteTimeMap = {};
  pageTimeMap = {};
  pageTitleMap = {}; // 新增
  pageVisitPeriods = {}; // 新增
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
    siteTimeMap, 
    pageTimeMap, 
    pageTitleMap, // 新增
    pageVisitPeriods, // 新增
    lastResetDate,
    activeTabId,
    activeSite,
    activePage,
    activeStartTime
  });
}

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (chrome.runtime.lastError) {
      console.warn(`Error getting tab: ${chrome.runtime.lastError.message}`);
      return;
    }
    updateActiveTime(); // 在切换标签页时更新时间
    setActiveTab(tab.id, tab.url, tab.title);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && (changeInfo.url || changeInfo.title)) {
    setActiveTab(tabId, tab.url, tab.title);
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    updateActiveTime();
    isChromeActive = false;
    isActiveWindow = false;
  } else {
    handleChromeBecomingActive();
    isActiveWindow = true;
  }
});

chrome.idle.onStateChanged.addListener(state => {
  if (state === 'active') {
    handleChromeBecomingActive();
  } else {
    updateActiveTime();
    isChromeActive = false;
    isActiveWindow = false;
  }
});

// 每分钟更新一次数据
chrome.alarms.create('updateData', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'dailyReset') {
    resetDailyData();
  } else if (alarm.name === 'updateData') {
    updateActiveTime();
    checkAndResetDaily();
  }
});

chrome.runtime.onStartup.addListener(initialize);
chrome.runtime.onInstalled.addListener(initialize);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTimeMap') {
    updateActiveTime();
    sendResponse({ siteTimeMap, pageTimeMap, pageTitleMap, pageVisitPeriods });
  } else if (request.action === 'focusRegained') {
    handleChromeBecomingActive();
  }
});

function handleChromeBecomingActive() {
  isChromeActive = true;
  isActiveWindow = true;
  if (!activeStartTime) {
    activeStartTime = Date.now();
  }
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (chrome.runtime.lastError) {
      console.warn(`Error querying tabs: ${chrome.runtime.lastError.message}`);
      return;
    }
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id, tabs[0].url, tabs[0].title);
    }
  });
}

// 初始化
initialize();