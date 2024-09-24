function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  return `${hours}小时 ${minutes % 60}分钟`;
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'getDomainTimeMap' }, response => {
    const domainTimeList = document.getElementById('domain-time-list');
    domainTimeList.innerHTML = '';
    for (const [domain, time] of Object.entries(response.domainTimeMap)) {
      const listItem = document.createElement('li');
      listItem.textContent = `${domain}: ${formatTime(time)}`;
      
      const visitPeriods = response.domainVisitPeriods[domain];
      const periodList = document.createElement('ul');
      visitPeriods.forEach(period => {
        const periodItem = document.createElement('li');
        periodItem.textContent = `从 ${period.start} 到 ${period.end}`;
        periodList.appendChild(periodItem);
      });

      listItem.appendChild(periodList);
      domainTimeList.appendChild(listItem);
    }
  });
});