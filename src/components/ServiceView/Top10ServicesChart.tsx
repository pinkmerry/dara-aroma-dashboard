'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    data: EnrichedTransaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

export default function Top10ServicesChart({ data }: Props) {
    const chartData = useMemo(() => {
        const services: Record<string, number> = {};

        data.forEach(d => {
            const name = d['รายการ']?.trim() || 'Unknown';
            if (!services[name]) {
                services[name] = 0;
            }
            services[name] += d.netRevenue;
        });

        const list = Object.keys(services).map(name => ({
            name,
            revenue: services[name]
        }));

        // Sort descending by revenue and take top 10
        const sorted = list.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        return sorted;
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-600 dark:text-slate-400">
                No service data available for chart.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis
                            type="number"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                            formatter={(value: number | undefined) => [`฿${(value || 0).toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
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
