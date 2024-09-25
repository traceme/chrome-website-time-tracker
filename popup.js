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
  document.body.style.width = '1000px';
  document.body.style.height = '600px';

  chrome.runtime.sendMessage({ action: 'getDomainTimeMap' }, response => {
    const domainTimeList = document.getElementById('domain-time-list');
    domainTimeList.innerHTML = '';
    
    const sortedDomains = Object.entries(response.domainTimeMap)
      .sort((a, b) => b[1] - a[1]);

    sortedDomains.forEach(([domain, totalTime]) => {
      const listItem = document.createElement('li');
      
      const domainName = document.createElement('div');
      domainName.className = 'domain-name';
      domainName.textContent = `${domain}: ${formatTime(totalTime)}`;
      
      const visitPeriods = response.domainVisitPeriods[domain];
      const periodList = document.createElement('ul');
      
      // 合并相同 URL 的时间段
      const mergedPeriods = mergePeriods(visitPeriods);
      
      mergedPeriods.forEach(period => {
        const periodItem = document.createElement('li');
        periodItem.className = 'time-period';
        const duration = period.end - period.start;
        periodItem.innerHTML = `
          <span class="period-duration">${formatTime(duration)}</span>
          <span class="period-title">${period.title || '无标题'}</span>
          <span class="period-time">${formatDate(period.start)} 到 ${formatDate(period.end)}</span>
        `;
        periodList.appendChild(periodItem);
      });

      listItem.appendChild(domainName);
      listItem.appendChild(periodList);
      domainTimeList.appendChild(listItem);
    });
  });
});

function mergePeriods(periods) {
  if (!periods || periods.length === 0) return [];

  const sortedPeriods = periods.sort((a, b) => a.start - b.start);
  const mergedPeriods = [];

  let currentPeriod = sortedPeriods[0];

  for (let i = 1; i < sortedPeriods.length; i++) {
    const nextPeriod = sortedPeriods[i];

    // 如果两个时间段的间隔小于5分钟，我们认为它们是连续的
    if (nextPeriod.start - currentPeriod.end <= 5 * 60 * 1000) {
      // 合并时间段
      currentPeriod.end = Math.max(currentPeriod.end, nextPeriod.end);
      // 如果当前时间段有标题，更新合并后的时间段标题
      if (nextPeriod.title && nextPeriod.title !== currentPeriod.title) {
        currentPeriod.title = (currentPeriod.title || '无标题') + ' | ' + nextPeriod.title;
      }
    } else {
      // 如果不连续，添加当前时间段到结果中，并开始一个新的时间段
      mergedPeriods.push(currentPeriod);
      currentPeriod = nextPeriod;
    }
  }

  // 添加最后一个时间段
  mergedPeriods.push(currentPeriod);

  return mergedPeriods;
}