'use client';

import React, { useMemo } from 'react';
import { ProductSummary } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    data: ProductSummary[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

export default function TopProductsChart({ data }: Props) {
    const chartData = useMemo(() => {
        // Sort descending by revenue and take top 10
        const sorted = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
        return sorted;
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-600 dark:text-slate-400">
                No product data available for chart.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" horizontal={false} vertical={true} />
                        <XAxis
                            type="number"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <YAxis
                            dataKey="productName"
                            type="category"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={120}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: 'var(--tooltip-bg, #0f172a)', borderColor: 'var(--tooltip-border, #334155)', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                            formatter={(value: number | undefined) => [`฿${(value || 0).toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]} barSize={24}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
