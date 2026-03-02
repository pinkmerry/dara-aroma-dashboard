'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { useData } from '@/context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Props {
    data: EnrichedTransaction[];
}

export default function TrendSummaryChart({ data }: Props) {
    const { filters } = useData();

    const chartData = useMemo(() => {
        const aggregated: Record<string, { revenue: number; transactions: number }> = {};

        data.forEach(d => {
            if (!d.parsedDate) return;

            let key = '';
            // If viewing all months, group by Month (YYYY-MM)
            // If viewing a specific month, group by Day (YYYY-MM-DD or just DD)
            if (filters.month === 'All') {
                // e.g., "2024-01"
                key = format(d.parsedDate, 'yyyy-MM');
            } else {
                // e.g., "2024-01-15"
                key = format(d.parsedDate, 'yyyy-MM-dd');
            }

            if (!aggregated[key]) {
                aggregated[key] = { revenue: 0, transactions: 0 };
            }
            aggregated[key].revenue += d.netRevenue;
            aggregated[key].transactions += 1;
        });

        const formatted = Object.keys(aggregated).map(key => ({
            date: key,
            displayDate: filters.month === 'All' ? format(parseISO(`${key}-01`), 'MMM yyyy') : format(parseISO(key), 'MMM dd'),
            revenue: aggregated[key].revenue,
            transactions: aggregated[key].transactions
        })).sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

        return formatted;
    }, [data, filters.month]);

    const title = filters.month === 'All' ? 'Monthly Revenue Growth' : 'Daily Revenue Growth';
    const subtitle = filters.month === 'All' ? 'Showing trends across all available months' : `Showing daily trends for selected month`;

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-600 dark:text-slate-400 min-h-[300px]">
                No trend data available for selected filters.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="mb-4 px-2">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>

            <div className="w-full mt-2" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="displayDate"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={20}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip
                            cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                            formatter={(value: any, name: any) => {
                                if (name === 'revenue') return [`฿${Number(value).toLocaleString()}`, 'Revenue'];
                                return [Number(value).toLocaleString(), 'Transactions'];
                            }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
