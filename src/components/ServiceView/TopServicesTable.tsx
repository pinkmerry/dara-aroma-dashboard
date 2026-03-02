'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { EnrichedTransaction } from '@/types';

interface Props {
    data: EnrichedTransaction[];
}

export default function TopServicesTable({ data }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const tableData = useMemo(() => {
        const services: Record<string, { duration: number, revenue: number, qty: number }> = {};

        data.forEach(d => {
            const name = d['รายการ']?.trim() || 'Unknown';
            if (!services[name]) {
                services[name] = { duration: 0, revenue: 0, qty: 0 };
            }
            services[name].duration += d.durationMinutes;
            services[name].revenue += d.netRevenue;
            services[name].qty += d.quantity;
        });

        const list = Object.keys(services).map(name => ({
            name,
            hours: (services[name].duration / 60).toFixed(1),
            revenue: services[name].revenue,
            qty: services[name].qty
        }));

        // Sort by revenue
        return list.sort((a, b) => b.revenue - a.revenue);
    }, [data]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tableData]);

    const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
    const displayedData = tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="w-full flex flex-col items-start justify-start">
            <div className="w-full flex justify-between items-end mb-4 px-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Top Performing Services</h3>
                <span className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">Sorted by Revenue</span>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Service Name</th>
                            <th scope="col" className="px-6 py-3 text-right">Transactions</th>
                            <th scope="col" className="px-6 py-3 text-right">Total Hours</th>
                            <th scope="col" className="px-6 py-3 text-right">Net Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center">No data available for selected filters</td>
                            </tr>
                        )}
                        {displayedData.map((row, i) => (
                            <tr key={`${row.name}-${i}`} className="bg-slate-900 border-b border-slate-800 hover:bg-slate-50 dark:bg-slate-800/60 transition">
                                <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                                    {row.name}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {row.qty.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {row.hours} h
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                                    ฿{row.revenue.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {tableData.length > 0 && (
                <div className="w-full flex justify-between items-center mt-4 px-2">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)} of {tableData.length} records
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-50 hover:bg-slate-600 transition"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1 text-slate-600 dark:text-slate-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 bg-slate-700 text-slate-700 dark:text-slate-300 rounded disabled:opacity-50 hover:bg-slate-600 transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
