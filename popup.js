window.addEventListener('focus', () => {
  chrome.runtime.sendMessage({ action: 'focusRegained' });
});

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}小时 ${minutes % 60}分钟`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.style.width = '800px';
  document.body.style.height = '600px';

  chrome.runtime.sendMessage({ action: 'getDomainTimeMap' }, response => {
    const domainTimeList = document.getElementById('domain-time-list');
    domainTimeList.innerHTML = '';
    
    // 将域名和时间转换为数组并按时间降序排序
    const sortedDomains = Object.entries(response.domainTimeMap)
      .sort((a, b) => b[1] - a[1]);

    sortedDomains.forEach(([domain, time]) => {
      const listItem = document.createElement('li');
      
      const domainName = document.createElement('div');
      domainName.className = 'domain-name';
      domainName.textContent = `${domain}: ${formatTime(time)}`;
      
      const visitPeriods = response.domainVisitPeriods[domain];
      const periodList = document.createElement('ul');
      visitPeriods.forEach(period => {
        const periodItem = document.createElement('li');
        periodItem.className = 'time-period';
        periodItem.textContent = `从 ${formatDate(period.start)} 到 ${formatDate(period.end)}`;
        periodList.appendChild(periodItem);
      });

      listItem.appendChild(domainName);
      listItem.appendChild(periodList);
      domainTimeList.appendChild(listItem);
    });
  });
});