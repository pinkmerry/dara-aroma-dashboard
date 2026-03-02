'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    data: EnrichedTransaction[];
}

export default function PeakHoursChart({ data }: Props) {
    const chartData = useMemo(() => {
        // 0-23 hours
        const hoursCount = new Array(24).fill(0);

        data.forEach(d => {
            if (d.parsedDate) {
                const hour = d.parsedDate.getHours();
                hoursCount[hour] += 1;
            }
        });

        const formatted = hoursCount.map((count, hour) => ({
            name: `${hour.toString().padStart(2, '0')}:00`,
            count
        }));

        // Optionally slice if shop is only open 10am to 10pm to save space
        // Let's just keep 08:00 to 23:00 for a typical spa
        return formatted.slice(8, 24);
    }, [data]);

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 px-2">Peak Hours Performance</h3>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'จำนวนรายการ', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: '#1e293b' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                            formatter={(value: number | undefined) => [value || 0, 'จำนวนรายการ']}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3b82f6' : '#1e293b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
