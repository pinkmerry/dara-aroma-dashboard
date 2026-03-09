'use client';

import React, { useMemo, useState } from 'react';
import { EnrichedTransaction } from '@/types';
import { UserCheck, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
    data: EnrichedTransaction[];
}

interface StaffInfo {
    staffName: string;
    serviceCount: number;
    totalRevenue: number;
    commission: number;
    tips: number;
    requests: number;
    topService: string;
    avgRevenuePerService: number;
}

export default function StaffPerformanceChart({ data }: Props) {
    const [sortField, setSortField] = useState<'totalRevenue' | 'serviceCount' | 'commission' | 'tips'>('totalRevenue');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const staffData = useMemo(() => {
        const staffMap: Record<string, {
            serviceCount: number;
            totalRevenue: number;
            commission: number;
            tips: number;
            requests: number;
            services: Record<string, number>;
        }> = {};

        data.forEach(d => {
            const staffName = d['พนักงาน (1)']?.trim() || 'ไม่ระบุพนักงาน';

            if (!staffMap[staffName]) {
                staffMap[staffName] = {
                    serviceCount: 0,
                    totalRevenue: 0,
                    commission: 0,
                    tips: 0,
                    requests: 0,
                    services: {},
                };
            }

            staffMap[staffName].serviceCount += 1;
            staffMap[staffName].totalRevenue += d.netRevenue;

            const commissionVal = parseFloat(d['ค่ามือหมอนวด (1)'] || '0') || 0;
            const tipsVal = parseFloat(d['ทิปหมอนวด (1)'] || '0') || 0;
            const requestVal = parseFloat(d['ค่ารีเควส (1)'] || '0') || 0;

            staffMap[staffName].commission += commissionVal;
            staffMap[staffName].tips += tipsVal;
            staffMap[staffName].requests += requestVal;

            const service = d['รายการ']?.trim() || 'ไม่ระบุ';
            staffMap[staffName].services[service] = (staffMap[staffName].services[service] || 0) + 1;
        });

        const result: StaffInfo[] = Object.entries(staffMap).map(([name, info]) => {
            const topService = Object.entries(info.services).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            return {
                staffName: name,
                serviceCount: info.serviceCount,
                totalRevenue: info.totalRevenue,
                commission: info.commission,
                tips: info.tips,
                requests: info.requests,
                topService,
                avgRevenuePerService: info.serviceCount > 0 ? info.totalRevenue / info.serviceCount : 0,
            };
        });

        return result;
    }, [data]);

    const sortedData = useMemo(() => {
        return [...staffData].sort((a, b) => {
            const diff = a[sortField] - b[sortField];
            return sortOrder === 'desc' ? -diff : diff;
        });
    }, [staffData, sortField, sortOrder]);

    const totalRevenue = useMemo(() => data.reduce((sum, d) => sum + d.netRevenue, 0), [data]);

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: typeof sortField }) => {
        if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-600 ml-0.5" />;
        return sortOrder === 'desc'
            ? <ChevronDown className="w-3 h-3 text-blue-500 dark:text-blue-400 ml-0.5" />
            : <ChevronUp className="w-3 h-3 text-blue-500 dark:text-blue-400 ml-0.5" />;
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'from-amber-400 to-yellow-500 text-amber-900 shadow-amber-500/30';
        if (rank === 2) return 'from-slate-300 to-slate-400 text-slate-700 shadow-slate-400/30';
        if (rank === 3) return 'from-orange-300 to-orange-400 text-orange-800 shadow-orange-400/30';
        return 'from-slate-100 to-slate-200 text-slate-600 dark:from-slate-700 dark:to-slate-600 dark:text-slate-300 shadow-none';
    };

    if (sortedData.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                <UserCheck className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No staff data available for the selected filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="w-full flex justify-between items-end mb-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                        <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Staff Performance</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">All therapists ranked by revenue generated</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{sortedData.length} staff · {data.length.toLocaleString()} records</span>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="px-3 py-3 text-center w-14">Rank</th>
                            <th scope="col" className="px-4 py-3">Staff Name</th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition select-none"
                                onClick={() => toggleSort('serviceCount')}
                            >
                                <div className="flex items-center justify-end">
                                    Services Done
                                    <SortIcon field="serviceCount" />
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition select-none"
                                onClick={() => toggleSort('totalRevenue')}
                            >
                                <div className="flex items-center justify-end">
                                    Revenue
                                    <SortIcon field="totalRevenue" />
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition select-none"
                                onClick={() => toggleSort('commission')}
                            >
                                <div className="flex items-center justify-end">
                                    Commission
                                    <SortIcon field="commission" />
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition select-none"
                                onClick={() => toggleSort('tips')}
                            >
                                <div className="flex items-center justify-end">
                                    Tips
                                    <SortIcon field="tips" />
                                </div>
                            </th>
                            <th scope="col" className="px-4 py-3">Top Service</th>
                            <th scope="col" className="px-4 py-3 text-right min-w-[160px]">Revenue Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((staff, i) => {
                            const rank = i + 1;
                            const pct = totalRevenue > 0 ? (staff.totalRevenue / totalRevenue) * 100 : 0;
                            return (
                                <tr
                                    key={staff.staffName}
                                    className="bg-white border-b border-slate-200 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-700/80 transition"
                                >
                                    <td className="px-3 py-3.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-gradient-to-br ${getRankStyle(rank)} shadow-md`}>
                                            {rank}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className={`font-medium whitespace-nowrap ${staff.staffName === 'ไม่ระบุพนักงาน' ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-900 dark:text-slate-100'}`}>
                                            {staff.staffName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                            {staff.serviceCount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                        ฿{staff.totalRevenue.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        ฿{staff.commission.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                        ฿{staff.tips.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {staff.topService}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-500"
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
                    {/* Grand Total Row */}
                    <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-slate-100">
                            <td className="px-3 py-3.5 text-center" />
                            <td className="px-4 py-3.5">Total ({sortedData.length} staff)</td>
                            <td className="px-4 py-3.5 text-right">
                                {sortedData.reduce((sum, s) => sum + s.serviceCount, 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400">
                                ฿{sortedData.reduce((sum, s) => sum + s.totalRevenue, 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                                ฿{sortedData.reduce((sum, s) => sum + s.commission, 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400">
                                ฿{sortedData.reduce((sum, s) => sum + s.tips, 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5" />
                            <td className="px-4 py-3.5" />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
