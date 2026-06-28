function formatUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${d} ngày ${h} giờ ${m} phút ${s} giây`;
}

function getLevel(value, warn, danger) {
  if (value >= danger) return "danger";
  if (value >= warn) return "warning";
  return "good";
}

module.exports = { formatUptime, getLevel };