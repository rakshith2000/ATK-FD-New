import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(...registerables);

interface DistributionChartProps {
    stats: {
        active: number;
        resolved: number;
        escalated: number;
    };
    filterStatus: string;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ stats, filterStatus }) => {
    const chartData = {
        labels: ['Active', 'Resolved', 'Escalated'],
        datasets: [
            {
                label: 'Ticket Count',
                data: [stats.active, stats.resolved, stats.escalated],
                backgroundColor: [
                    filterStatus === 'active' || filterStatus === 'all' ? '#4FC3F7' : '#CBD5E1',
                    filterStatus === 'resolved' || filterStatus === 'all' ? '#81C784' : '#CBD5E1',
                    filterStatus === 'escalated' || filterStatus === 'all' ? '#9FA8DA' : '#CBD5E1',
                ],
                borderRadius: 8,
                maxBarThickness: 45,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.04)' } },
            x: { grid: { display: false } },
        },
    };

    return (
        <div className="w-full bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm flex-shrink-0 [box-shadow:inset_0_2px_10px_0_#abc2ff]">
            <div className="flex items-center justify-between mb-4">
                <h6 className="text-xs font-bold text-[#011A80] uppercase tracking-wide">Status Distribution Model</h6>
            </div>
            <div className="h-[220px] relative w-full">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};
