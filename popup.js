window.addEventListener('focus', () => {
  chrome.runtime.sendMessage({ action: 'focusRegained' });
});

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}小时 ${minutes % 60}分钟 ${seconds % 60}秒`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.style.width = '1200px';
  document.body.style.height = '600px';

  chrome.runtime.sendMessage({ action: 'getTimeMap' }, response => {
    const siteTimeList = document.getElementById('site-time-list');
    siteTimeList.innerHTML = '';
    
    const sortedSites = Object.entries(response.siteTimeMap)
      .sort((a, b) => b[1] - a[1]);

    sortedSites.forEach(([site, totalTime]) => {
      const siteItem = document.createElement('li');
      
      const siteName = document.createElement('div');
      siteName.className = 'site-name';
      siteName.textContent = `${site}: ${formatTime(totalTime)}`;
      
      const pageList = document.createElement('ul');
      const pageTimeMap = response.pageTimeMap[site] || {};
      const pageTitleMap = response.pageTitleMap[site] || {};
      const pageVisitPeriods = response.pageVisitPeriods[site] || {};
      
      const sortedPages = Object.entries(pageTimeMap)
        .sort((a, b) => b[1] - a[1]);
      
      sortedPages.forEach(([page, pageTime]) => {
        const pageItem = document.createElement('li');
        pageItem.className = 'page-item';
        const title = (pageTitleMap[page] || 'Untitled').substring(0, 30);
        const period = pageVisitPeriods[page] || { start: 0, end: 0 };
        
        pageItem.innerHTML = `
          <div class="page-title">${title}</div>
          <div class="page-time">${formatTime(pageTime)}</div>
          <div class="page-period">${formatDate(period.start)} - ${formatDate(period.end)}</div>
        `;
        pageList.appendChild(pageItem);
      });

      siteItem.appendChild(siteName);
      siteItem.appendChild(pageList);
      siteTimeList.appendChild(siteItem);
    });
  });
});