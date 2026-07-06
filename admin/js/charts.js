/* HABÄNE ADMIN — Chart.js Configurations */

// Brand theme constants
export const ChartColors = {
  navy: '#0b1240',
  navyLight: '#1e2865',
  ice: '#8fd4ec',
  iceLight: '#bfe8f5',
  silver: '#d7dade',
  accent: '#00e5ff',
  success: '#00c853',
  danger: '#ff1744',
  warning: '#ffd600',
  text: '#1e254c',
  grid: 'rgba(0, 0, 0, 0.05)',
  colorsArray: [
    '#0b1240', '#8fd4ec', '#00e5ff', '#1e2865', '#5e668e', 
    '#00c853', '#ff1744', '#ffd600', '#2979ff', '#8e2f3f'
  ]
};

// Set global Chart.js defaults
if (window.Chart) {
  const Chart = window.Chart;
  
  // Font configuration
  Chart.defaults.font.family = '"Montserrat", system-ui, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#5e668e';
  
  // Tooltip configuration
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(11, 18, 64, 0.9)';
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
  Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: 'bold' };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.15)';
  
  // Animations
  Chart.defaults.animation.duration = 1000;
  Chart.defaults.animation.easing = 'easeOutQuart';
}

// 1. Line Chart Helper
export function createLineChart(ctx, labels, datasetLabel, dataPoints, isCurrency = true) {
  if (!window.Chart) return null;
  
  return new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: datasetLabel,
        data: dataPoints,
        borderColor: ChartColors.navy,
        backgroundColor: 'rgba(11, 18, 64, 0.04)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: ChartColors.accent,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              let value = context.parsed.y;
              if (isCurrency) {
                return `${context.dataset.label}: ₹${value.toLocaleString('en-IN')}`;
              }
              return `${context.dataset.label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45 }
        },
        y: {
          grid: { color: ChartColors.grid },
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              if (isCurrency) {
                if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
                if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'k';
                return '₹' + value;
              }
              return value;
            }
          }
        }
      }
    }
  });
}

// 2. Bar Chart Helper
export function createBarChart(ctx, labels, datasetLabel, dataPoints, isCurrency = false) {
  if (!window.Chart) return null;
  
  return new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: datasetLabel,
        data: dataPoints,
        backgroundColor: ChartColors.ice,
        hoverBackgroundColor: ChartColors.navy,
        borderRadius: 6,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              let value = context.parsed.y;
              if (isCurrency) {
                return `${context.dataset.label}: ₹${value.toLocaleString('en-IN')}`;
              }
              return `${context.dataset.label}: ${value}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: {
          grid: { color: ChartColors.grid },
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              if (isCurrency) {
                if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
                if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'k';
                return '₹' + value;
              }
              return value;
            }
          }
        }
      }
    }
  });
}

// 3. Doughnut / Pie Chart Helper
export function createDoughnutChart(ctx, labels, dataPoints) {
  if (!window.Chart) return null;
  
  return new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints,
        backgroundColor: ChartColors.colorsArray,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 14
          }
        }
      },
      cutout: '65%'
    }
  });
}
