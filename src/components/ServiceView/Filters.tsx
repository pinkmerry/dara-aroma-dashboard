'use client';

import React, { useMemo } from 'react';
import { useData } from '@/context/DataContext';

export default function Filters() {
    const { serviceData, filters, setFilters } = useData();

    // Extract unique years and months from data
    const { years, months } = useMemo(() => {
        const ySet = new Set<string>();
        const mSet = new Set<string>();

        serviceData.forEach(d => {
            if (d.parsedDate) {
                ySet.add(d.parsedDate.getFullYear().toString());
                // Month is 0-indexed, displaying 1-12
                mSet.add((d.parsedDate.getMonth() + 1).toString().padStart(2, '0'));
            }
        });

        return {
            years: Array.from(ySet).sort((a, b) => Number(b) - Number(a)),
            months: Array.from(mSet).sort((a, b) => Number(a) - Number(b)),
        };
    }, [serviceData]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters({ ...filters, year: e.target.value });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters({ ...filters, month: e.target.value });
    };

    const handleTimeChange = (period: 'All' | 'Morning' | 'Afternoon' | 'Evening') => {
        setFilters({ ...filters, timePeriod: period });
    };

    return (
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 transition-colors">

            {/* Year Filter */}
            <div className="flex items-center space-x-2">
                <label className="text-slate-600 dark:text-slate-400 text-sm font-medium">Year:</label>
                <select
                    value={filters.year}
                    onChange={handleYearChange}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors"
                >
                    <option value="All">All Time</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center space-x-2">
                <label className="text-slate-600 dark:text-slate-400 text-sm font-medium">Month:</label>
                <select
                    value={filters.month}
                    onChange={handleMonthChange}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 transition-colors"
                >
                    <option value="All">All Year</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-300 dark:bg-slate-700 mx-2 transition-colors"></div>

            {/* Time Toggle */}
            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-300 dark:border-slate-700 transition-colors">
                {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map(period => (
                    <button
                        key={period}
                        onClick={() => handleTimeChange(period)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filters.timePeriod === period
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {period === 'All' ? 'Whole Day' : period}
                    </button>
                ))}
            </div>

        </div>
    );
}
