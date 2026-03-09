'use client';

import React, { useMemo } from 'react';
import { EnrichedTransaction } from '@/types';
import { Crown, TrendingUp, Users } from 'lucide-react';

interface Props {
    data: EnrichedTransaction[];
}

interface SpenderInfo {
    customerId: string;
    customerName: string;
    phone?: string;
    totalSpend: number;
    visitCount: number;
    avgSpend: number;
    favoriteService: string;
    lastVisit: Date | null;
}

export default function TopSpendersChart({ data }: Props) {
    const topSpenders = useMemo(() => {
        const customerMap: Record<string, {
            name: string;
            phone?: string;
            totalSpend: number;
            visitCount: number;
            services: Record<string, number>;
            lastVisit: Date | null;
        }> = {};

        data.forEach(d => {
            const id = d['id ของลูกค้า']?.trim();
            if (!id) return;

            if (!customerMap[id]) {
                customerMap[id] = {
                    name: d['ลูกค้า']?.trim() || 'ไม่ระบุชื่อ',
                    phone: d['เบอร์โทร']?.trim(),
                    totalSpend: 0,
                    visitCount: 0,
                    services: {},
                    lastVisit: null,
                };
            }

            customerMap[id].totalSpend += d.netRevenue;
            customerMap[id].visitCount += 1;

            const service = d['รายการ']?.trim() || 'ไม่ระบุ';
            customerMap[id].services[service] = (customerMap[id].services[service] || 0) + 1;

            if (d.parsedDate) {
                if (!customerMap[id].lastVisit || d.parsedDate > customerMap[id].lastVisit!) {
                    customerMap[id].lastVisit = d.parsedDate;
                }
            }
        });

        const spenders: SpenderInfo[] = Object.entries(customerMap).map(([id, info]) => {
            const favoriteService = Object.entries(info.services).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            return {
                customerId: id,
                customerName: info.name,
                phone: info.phone,
                totalSpend: info.totalSpend,
                visitCount: info.visitCount,
                avgSpend: info.visitCount > 0 ? info.totalSpend / info.visitCount : 0,
                favoriteService,
                lastVisit: info.lastVisit,
            };
        });

        return spenders.sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10);
    }, [data]);

    const totalFilteredRevenue = useMemo(() => {
        return data.reduce((sum, d) => sum + d.netRevenue, 0);
    }, [data]);

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'from-amber-400 to-yellow-500 text-amber-900 shadow-amber-500/30';
        if (rank === 2) return 'from-slate-300 to-slate-400 text-slate-700 shadow-slate-400/30';
        if (rank === 3) return 'from-orange-300 to-orange-400 text-orange-800 shadow-orange-400/30';
        return 'from-slate-100 to-slate-200 text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300 shadow-none';
    };

    if (topSpenders.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                <Users className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No customer data available for the selected filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full flex justify-between items-end mb-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                        <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Top 10 Spenders</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by total spending</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{data.length.toLocaleString()} records analyzed</span>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="px-3 py-3 text-center w-14">Rank</th>
                            <th scope="col" className="px-4 py-3">Customer</th>
                            <th scope="col" className="px-4 py-3 text-right">Visits</th>
                            <th scope="col" className="px-4 py-3 text-right">Avg/Visit</th>
                            <th scope="col" className="px-4 py-3">Favorite Service</th>
                            <th scope="col" className="px-4 py-3 text-right">Total Spend</th>
                            <th scope="col" className="px-4 py-3 text-right min-w-[160px]">Share of Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topSpenders.map((spender, i) => {
                            const rank = i + 1;
                            const pct = totalFilteredRevenue > 0 ? (spender.totalSpend / totalFilteredRevenue) * 100 : 0;
                            return (
                                <tr
                                    key={spender.customerId}
                                    className="bg-white border-b border-slate-200 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-700/80 transition"
                                >
                                    <td className="px-3 py-3.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-gradient-to-br ${getRankStyle(rank)} shadow-md`}>
                                            {rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                {spender.customerName}
                                            </span>
                                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                รหัส: {spender.customerId}
                                                {spender.phone && spender.phone !== '-' && (
                                                    <span className="inline-flex items-center ml-1 pl-1 border-l border-slate-300 dark:border-slate-600">
                                                        โทร: {spender.phone}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                            {spender.visitCount.toLocaleString()} times
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                                        ฿{Math.round(spender.avgSpend).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {spender.favoriteService}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                        ฿{spender.totalSpend.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(pct * 3, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] text-slate-500 w-12 text-right">{pct.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
