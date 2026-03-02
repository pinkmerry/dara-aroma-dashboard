'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ProductSummary } from '@/types';
import { Search, ArrowUpDown } from 'lucide-react';

interface Props {
    data: ProductSummary[];
}

type SortField = 'productName' | 'quantitySold' | 'totalRevenue';
type SortOrder = 'asc' | 'desc';

export default function ProductAggregateTable({ data }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('totalRevenue');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const tableData = useMemo(() => {
        let filtered = data;

        // Search
        if (searchTerm.trim() !== '') {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(row => row.productName.toLowerCase().includes(lowerSearch));
        }

        // Sort
        return filtered.sort((a, b) => {
            let comparison = 0;
            if (typeof a[sortField] === 'string') {
                comparison = (a[sortField] as string).localeCompare(b[sortField] as string);
            } else {
                comparison = (a[sortField] as number) - (b[sortField] as number);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [data, searchTerm, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const getSortIconClass = (field: SortField) => {
        if (sortField !== field) return "text-slate-600";
        return "text-blue-400";
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [tableData]);

    const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE);
    const displayedData = tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400">
                <p>No product sales data found.</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-full">
            {/* Table Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500 dark:text-slate-600 dark:text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-64"
                    />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {tableData.length} products
                </div>
            </div>

            {/* Table Container */}
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 flex-1">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:bg-slate-700 transition" onClick={() => toggleSort('productName')}>
                                <div className="flex items-center">
                                    Product Name
                                    <ArrowUpDown className={`ml-1 w-3 h-3 ${getSortIconClass('productName')}`} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4 text-right cursor-pointer hover:bg-slate-700 transition" onClick={() => toggleSort('quantitySold')}>
                                <div className="flex items-center justify-end">
                                    Total Sold (Units)
                                    <ArrowUpDown className={`ml-1 w-3 h-3 ${getSortIconClass('quantitySold')}`} />
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-4 text-right cursor-pointer hover:bg-slate-700 transition" onClick={() => toggleSort('totalRevenue')}>
                                <div className="flex items-center justify-end">
                                    Gross Revenue
                                    <ArrowUpDown className={`ml-1 w-3 h-3 ${getSortIconClass('totalRevenue')}`} />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-500 dark:text-slate-600 dark:text-slate-400">No products match your search.</td>
                            </tr>
                        )}
                        {displayedData.map((row, i) => (
                            <tr key={i} className="bg-slate-900 border-b border-slate-800 hover:bg-slate-50 dark:bg-slate-800/60 transition">
                                <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">
                                    {row.productName}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {row.quantitySold.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                                    ฿{row.totalRevenue.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {/* Grand Total Row */}
                        {tableData.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-600 font-bold text-slate-100">
                                <td className="px-6 py-4 text-right">Total</td>
                                <td className="px-6 py-4 text-right">
                                    {tableData.reduce((acc, row) => acc + row.quantitySold, 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right text-emerald-400">
                                    ฿{tableData.reduce((acc, row) => acc + row.totalRevenue, 0).toLocaleString()}
                                </td>
                            </tr>
                        )}
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
