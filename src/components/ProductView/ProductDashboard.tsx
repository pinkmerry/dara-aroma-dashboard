'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import TopProductsChart from './TopProductsChart';
import ProductAggregateTable from './ProductAggregateTable';
import { PackageOpen } from 'lucide-react';

export default function ProductDashboard() {
    const { productData } = useData();

    if (!productData || productData.length === 0) {
        return (
            <div className="p-6 text-slate-900 dark:text-white space-y-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] transition-colors">
                <PackageOpen className="w-20 h-20 text-slate-400 dark:text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No Product Data</h2>
                <p className="text-slate-500">
                    It looks like the uploaded data doesn{"'"}t contain any product sales, or product master data wasn{"'"}t matched.
                </p>
            </div>
        );
    }

    // Calculate High-level summaries
    const totalProductsSold = productData.reduce((acc, p) => acc + p.quantitySold, 0);
    const totalRevenue = productData.reduce((acc, p) => acc + p.totalRevenue, 0);

    return (
        <div className="p-2 md:p-6 text-slate-900 dark:text-white space-y-6 max-w-[1920px] mx-auto transition-colors">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 mb-2">
                        Product Inventory & Sales
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        Aggregate view of all product performances across the entire dataset. This view does not include time-based filtering.
                    </p>
                </div>

                <div className="flex space-x-6">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Units Sold</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalProductsSold.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Gross Revenue</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">฿{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Top Row: Chart */}
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-md flex flex-col min-h-[400px] transition-colors">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Top 10 Best Selling Products</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Highest grossing products by revenue</p>
                    </div>
                    <TopProductsChart data={productData} />
                </div>

                {/* Bottom Row: Table */}
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-md flex flex-col min-h-[500px] transition-colors">
                    <ProductAggregateTable data={productData} />
                </div>
            </div>

        </div>
    );
}
