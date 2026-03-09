'use client';

import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import Filters from './Filters';
import KeyMetrics from './KeyMetrics';
import PeakHoursChart from './PeakHoursChart';
import PaymentMethodsChart from './PaymentMethodsChart';
import Top10ServicesChart from './Top10ServicesChart';
import ChannelPerformanceChart from './ChannelPerformanceChart';
import TopServicesTable from './TopServicesTable';
import TopSpendersChart from './TopSpendersChart';
import TrendSummaryChart from './TrendSummaryChart';
import StaffPerformanceChart from './StaffPerformanceChart';
import AIInsightsPanel from './AIInsightsPanel';

export default function ServiceDashboard() {
    const { serviceData, productData, filters } = useData();

    // Apply Filters to get 'filteredData'
    const filteredData = useMemo(() => {
        return serviceData.filter(d => {
            if (!d.parsedDate) return true;

            if (filters.year !== 'All') {
                if (d.parsedDate.getFullYear().toString() !== filters.year) return false;
            }

            if (filters.month !== 'All') {
                const itemMonth = (d.parsedDate.getMonth() + 1).toString().padStart(2, '0');
                if (itemMonth !== filters.month) return false;
            }

            if (filters.timePeriod !== 'All') {
                const hours = d.parsedDate.getHours();
                if (filters.timePeriod === 'Morning' && hours >= 12) return false;
                if (filters.timePeriod === 'Afternoon' && (hours < 12 || hours >= 17)) return false;
                if (filters.timePeriod === 'Evening' && hours < 17) return false;
            }

            return true;
        });
    }, [serviceData, filters]);

    return (
        <div className="p-2 md:p-6 text-slate-900 dark:text-white space-y-6 max-w-[1920px] mx-auto transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
                            Service Performance
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Analyzing {filteredData.length.toLocaleString()} out of {serviceData.length.toLocaleString()} records.
                        </p>
                    </div>
                    <AIInsightsPanel />
                </div>
                <Filters />
            </div>

            {/* Grid for Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KeyMetrics data={filteredData} />
            </div>

            {/* Full Width Trend Summary Chart */}
            <div className="w-full bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-md transition-colors">
                <TrendSummaryChart data={filteredData} />
            </div>

            {/* Grid for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md transition-colors">
                    <PeakHoursChart data={filteredData} />
                </div>
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md transition-colors">
                    <PaymentMethodsChart data={filteredData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 px-2 pb-2 border-b border-slate-200 dark:border-slate-700">Booking Channels</h3>
                    <ChannelPerformanceChart data={filteredData} />
                </div>
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md flex flex-col transition-colors">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 px-2 pb-2 border-b border-slate-200 dark:border-slate-700">Top 10 Service Performance</h3>
                    <Top10ServicesChart data={filteredData} />
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md mt-6 transition-colors">
                <TopServicesTable data={filteredData} />
            </div>

            <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md mt-6 transition-colors">
                <TopSpendersChart data={filteredData} />
            </div>

            <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 min-h-80 shadow-md mt-6 transition-colors">
                <StaffPerformanceChart data={filteredData} />
            </div>

        </div>
    );
}
