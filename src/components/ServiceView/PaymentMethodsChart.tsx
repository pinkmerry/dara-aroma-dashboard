'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    data: EnrichedTransaction[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export default function PaymentMethodsChart({ data }: Props) {
    const chartData = useMemo(() => {
        let cash = 0;
        let transfer = 0;
        let credit = 0;
        const ewallet = 0;

        data.forEach(d => {
            // The requirement states check specific columns. We parsed them in dataEnricher
            cash += d.cashPayment;
            transfer += d.transferPayment;
            credit += d.creditCardPayment;
            // Handle fallback if data isn't split evenly among columns
        });

        const result = [
            { name: 'Cash', value: cash },
            { name: 'Transfer', value: transfer },
            { name: 'Credit Card', value: credit },
            { name: 'E-Wallet', value: ewallet },
        ].filter(i => i.value > 0);

        return result.length > 0 ? result : [{ name: 'No Data', value: 1 }];
    }, [data]);

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 px-2">Payment Methods Breakdown</h3>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => `฿${(value || 0).toLocaleString()}`}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
