'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    data: EnrichedTransaction[];
}

const COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#06b6d4', '#10b981'];

export default function ChannelPerformanceChart({ data }: Props) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};

        data.forEach(d => {
            const rawChannel = d['ช่องทางการจอง']?.trim() || '';
            const lower = rawChannel.toLowerCase();

            let channel = 'Unknow';
            if (lower.includes('facebook') || lower.includes('fb') || lower.includes('messenger') || lower.includes('messnger')) {
                channel = 'Facebook Messnger';
            } else if (lower.includes('phone') || lower.includes('โทร')) {
                channel = 'Phone';
            } else if (lower.includes('line') || lower.includes('ไลน์')) {
                channel = 'Line';
            } else if (lower.includes('direct') || lower.includes('booking')) {
                channel = 'Direct Booking';
            } else if (lower.includes('walk-in') || lower.includes('walk in') || lower.includes('walkin') || lower.includes('หน้าร้าน')) {
                channel = 'Walk-in';
            }

            if (!counts[channel]) counts[channel] = 0;
            counts[channel] += 1;
        });

        const formatted = Object.keys(counts).map(key => ({
            name: key,
            value: counts[key]
        })).sort((a, b) => b.value - a.value);

        return formatted;
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-600 dark:text-slate-400">
                No channel data available.
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#64748b' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
