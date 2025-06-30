import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GeoChartProps {
  data: Array<{
    state: string;
    count: number;
    amount: number;
  }>;
}

const GeoChart: React.FC<GeoChartProps> = ({ data }) => {
  // Sort data by amount descending and take top 15 for readability
  const sortedData = [...data].sort((a, b) => b.amount - a.amount).slice(0, 15);

  const chartData = {
    labels: sortedData.map(item => item.state),
    datasets: [
      {
        label: 'Total Contribution Amount ($)',
        data: sortedData.map(item => item.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'State'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Total Amount ($)'
        }
      }
    }
  };

  return <Bar options={options} data={chartData} />;
};

export default GeoChart; 