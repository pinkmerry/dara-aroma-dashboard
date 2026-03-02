'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { DollarSign, Activity, Users, Clock } from 'lucide-react';

interface Props {
    data: EnrichedTransaction[];
}

export default function KeyMetrics({ data }: Props) {
    const metrics = useMemo(() => {
        let revenue = 0;
        const transactions = data.length;
        const customers = new Set<string>();
        let totalMinutes = 0;

        data.forEach(d => {
            revenue += d.netRevenue;
            if (d['id ของลูกค้า']) customers.add(d['id ของลูกค้า']);
            totalMinutes += d.durationMinutes;
        });

        const avgTicket = transactions > 0 ? revenue / transactions : 0;

        return {
            revenue,
            transactions,
            avgTicket,
            uniqueCustomers: customers.size,
            totalHours: (totalMinutes / 60).toFixed(1)
        };
    }, [data]);

    const cards = [
        { label: 'Total Revenue (THB)', value: `฿${metrics.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-400/10' },
        { label: 'Total Transactions', value: metrics.transactions.toLocaleString(), icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10' },
        { label: 'Avg. Ticket Size', value: `฿${metrics.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-400/10' },
        { label: 'Total Service Hours', value: `${metrics.totalHours} hrs`, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-400/10' },
    ];

    return (
        <>
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div key={i} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex items-center space-x-4 shadow-sm hover:bg-white dark:hover:bg-slate-800/80 transition cursor-default">
                        <div className={`p-3 rounded-lg ${card.bg}`}>
                            <Icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</h3>
                        </div>
                    </div>
                )
            })}
        </>
    );
}
