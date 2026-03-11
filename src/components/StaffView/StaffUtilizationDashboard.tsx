'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { EnrichedTransaction } from '@/types';
import { Users, Timer, Star, Clock, Heart, Activity, BarChart3, ChevronDown, ChevronUp, Medal, DollarSign, ArrowUpRight } from 'lucide-react';

// Working minutes per month: 17,280 minutes
const WORKING_MINUTES_PER_MONTH = 17280;

interface StaffMonthlyData {
    staffName: string;
    totalServiceMinutes: number;
    serviceCount: number;
    efficiency: number; // percentage
    totalRevenue: number;
    commission: number;
    tips: number;
    
    // New Metrics
    requestCount: number;
    requestRate: number; // percentage
    tippedServiceCount: number;
    tipRate: number; // percentage
    avgTip: number;
    revenuePerHour: number;
    retentionRate: number; // percentage
}

interface MonthYearGroup {
    year: number;
    month: number;
    label: string;
    staffData: StaffMonthlyData[];
}

export default function StaffUtilizationDashboard() {
    const { serviceData } = useData();
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [sortField, setSortField] = useState<keyof StaffMonthlyData>('efficiency');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const monthlyGroups: MonthYearGroup[] = useMemo(() => {
        const serviceOnly = serviceData.filter(d => d.itemType === 'Service' && d.parsedDate);

        // Pre-calculate first visit for retention (staff-customer pair)
        const staffCustomerFirstVisit = new Map<string, Date>();
        serviceOnly.forEach(t => {
            const staff = t['พนักงาน (1)']?.trim();
            const phone = t['เบอร์โทร']?.trim();
            if (!staff || !phone || phone.length <= 5 || phone === '-') return;
            
            const key = `${staff}-|-${phone}`;
            const existing = staffCustomerFirstVisit.get(key);
            if (!existing || t.parsedDate! < existing) {
                staffCustomerFirstVisit.set(key, t.parsedDate!);
            }
        });

        const groupMap: Record<string, EnrichedTransaction[]> = {};

        serviceOnly.forEach(d => {
            const date = d.parsedDate!;
            const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(d);
        });

        const groups: MonthYearGroup[] = Object.entries(groupMap).map(([key, transactions]) => {
            const [yearStr, monthStr] = key.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);

            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            // Month start date for retention logic
            const monthStart = new Date(year, month - 1, 1);

            const staffMap: Record<string, {
                totalMinutes: number;
                serviceCount: number;
                totalRevenue: number;
                commission: number;
                tips: number;
                requestCount: number;
                tippedServiceCount: number;
                uniquePhonesThisMonth: Set<string>;
            }> = {};

            transactions.forEach(d => {
                const staffName = d['พนักงาน (1)']?.trim() || 'ไม่ระบุพนักงาน';

                if (!staffMap[staffName]) {
                    staffMap[staffName] = {
                        totalMinutes: 0,
                        serviceCount: 0,
                        totalRevenue: 0,
                        commission: 0,
                        tips: 0,
                        requestCount: 0,
                        tippedServiceCount: 0,
                        uniquePhonesThisMonth: new Set(),
                    };
                }

                staffMap[staffName].totalMinutes += d.durationMinutes;
                staffMap[staffName].serviceCount += 1;
                staffMap[staffName].totalRevenue += d.netRevenue;

                const commissionVal = parseFloat(d['ค่ามือหมอนวด (1)'] || '0') || 0;
                const tipsVal = parseFloat(d['ทิปหมอนวด (1)'] || '0') || 0;
                const requestVal = parseFloat(d['ค่ารีเควส (1)'] || '0') || 0;

                staffMap[staffName].commission += commissionVal;
                staffMap[staffName].tips += tipsVal;
                
                if (requestVal > 0) staffMap[staffName].requestCount++;
                if (tipsVal > 0) staffMap[staffName].tippedServiceCount++;

                const phone = d['เบอร์โทร']?.trim();
                if (phone && phone.length > 5 && phone !== '-') {
                    staffMap[staffName].uniquePhonesThisMonth.add(phone);
                }
            });

            const staffData: StaffMonthlyData[] = Object.entries(staffMap).map(([name, info]) => {
                // Determine retention
                let totalTrackableCustomers = 0;
                let retainedCustomers = 0;
                
                info.uniquePhonesThisMonth.forEach(phone => {
                    totalTrackableCustomers++;
                    const key = `${name}-|-${phone}`;
                    const firstVisit = staffCustomerFirstVisit.get(key);
                    if (firstVisit && firstVisit < monthStart) {
                        retainedCustomers++;
                    }
                });

                const retentionRate = totalTrackableCustomers > 0 ? (retainedCustomers / totalTrackableCustomers) * 100 : 0;
                const requestRate = info.serviceCount > 0 ? (info.requestCount / info.serviceCount) * 100 : 0;
                const tipRate = info.serviceCount > 0 ? (info.tippedServiceCount / info.serviceCount) * 100 : 0;
                const avgTip = info.tippedServiceCount > 0 ? info.tips / info.tippedServiceCount : 0;
                const revenuePerHour = info.totalMinutes > 0 ? (info.totalRevenue / (info.totalMinutes / 60)) : 0;

                return {
                    staffName: name,
                    totalServiceMinutes: info.totalMinutes,
                    serviceCount: info.serviceCount,
                    efficiency: (info.totalMinutes / WORKING_MINUTES_PER_MONTH) * 100,
                    totalRevenue: info.totalRevenue,
                    commission: info.commission,
                    tips: info.tips,
                    requestCount: info.requestCount,
                    requestRate,
                    tippedServiceCount: info.tippedServiceCount,
                    tipRate,
                    avgTip,
                    revenuePerHour,
                    retentionRate
                };
            });

            return {
                year,
                month,
                label: `${monthNames[month - 1]} ${year}`,
                staffData,
            };
        });

        // Sort by year desc, then month desc
        return groups.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }, [serviceData]);

    useEffect(() => {
        if (monthlyGroups.length > 0 && !selectedPeriod) {
            setSelectedPeriod(`${monthlyGroups[0].year}-${monthlyGroups[0].month}`);
        }
    }, [monthlyGroups, selectedPeriod]);

    const activeGroup = monthlyGroups.find(g => `${g.year}-${g.month}` === selectedPeriod) || monthlyGroups[0];

    const sortStaffData = (data: StaffMonthlyData[]) => {
        return [...data].sort((a, b) => {
            const valA = a[sortField] || 0;
            const valB = b[sortField] || 0;
            const diff = (valA as number) - (valB as number);
            return sortOrder === 'desc' ? -diff : diff;
        });
    };

    const toggleSort = (field: keyof StaffMonthlyData) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }: { field: keyof StaffMonthlyData }) => {
        if (sortField !== field) return <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-600 ml-0.5" />;
        return sortOrder === 'desc'
            ? <ChevronDown className="w-3 h-3 text-blue-500 dark:text-blue-400 ml-0.5" />
            : <ChevronUp className="w-3 h-3 text-blue-500 dark:text-blue-400 ml-0.5" />;
    };

    const getEfficiencyColor = (pct: number) => {
        if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (pct >= 50) return 'text-blue-600 dark:text-blue-400';
        if (pct >= 30) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-500 dark:text-red-400';
    };

    if (monthlyGroups.length === 0) {
        return (
            <div className="p-2 md:p-6 text-slate-900 dark:text-white space-y-6 max-w-[1920px] mx-auto transition-colors">
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                    <Users className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No staff utilization data available</p>
                    <p className="text-sm mt-1">Upload service data to view staff efficiency metrics.</p>
                </div>
            </div>
        );
    }

    const sortedData = activeGroup ? sortStaffData(activeGroup.staffData) : [];
    
    // Summary computation for active group
    const avgEfficiency = sortedData.length > 0 ? sortedData.reduce((s, x) => s + x.efficiency, 0) / sortedData.length : 0;
    const topRequested = [...sortedData].sort((a,b) => b.requestRate - a.requestRate)[0];
    const topEarner = [...sortedData].sort((a,b) => b.revenuePerHour - a.revenuePerHour)[0];

    return (
        <div className="p-2 md:p-6 text-slate-900 dark:text-white space-y-6 max-w-[1920px] mx-auto transition-colors">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-500 dark:from-violet-400 dark:to-purple-300">
                        Staff Performance Analytics
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                        Deep dive into therapist efficiency, popularity, customer satisfaction, and revenue generation metrics.
                    </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">
                        Select Period
                    </label>
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium rounded-xl focus:ring-violet-500 focus:border-violet-500 block p-3 pr-8 min-w-[200px] shadow-sm transition-all hover:border-violet-400"
                    >
                        {monthlyGroups.map(g => (
                            <option key={`${g.year}-${g.month}`} value={`${g.year}-${g.month}`}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Stats Banner */}
            {activeGroup && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Staff Active</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{sortedData.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Avg Efficiency</p>
                            <p className={`text-2xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>{avgEfficiency.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Most Requested</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate w-32">{topRequested?.staffName || '-'}</p>
                            <p className="text-xs font-medium text-pink-500">{topRequested?.requestRate.toFixed(1)}% req rate</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Top Earner / Hr</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate w-32">{topEarner?.staffName || '-'}</p>
                            <p className="text-xs font-medium text-emerald-500">฿{Math.round(topEarner?.revenuePerHour || 0).toLocaleString()}/hr</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table */}
            {activeGroup && (
                <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Medal className="w-5 h-5 text-violet-500" />
                                Comprehensive Staff Ranking ({activeGroup.label})
                            </h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <thead className="text-[11px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-4 text-center w-10">#</th>
                                    <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-300">Staff Name</th>
                                    
                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none" onClick={() => toggleSort('efficiency')}>
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Efficiency <SortIcon field="efficiency" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none" onClick={() => toggleSort('serviceCount')}>
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Volume <SortIcon field="serviceCount" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none group" onClick={() => toggleSort('requestRate')} title="Percentage of services where this staff was specifically requested by the customer">
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Popularity (Req%) <SortIcon field="requestRate" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none" onClick={() => toggleSort('retentionRate')} title="Percentage of customers this month who have visited this staff in previous months">
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Retention % <SortIcon field="retentionRate" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none" onClick={() => toggleSort('tipRate')} title="Percentage of services that received tips and average tip array">
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Tip Rate / Avg <SortIcon field="tipRate" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none group" onClick={() => toggleSort('revenuePerHour')} title="Total revenue generated divided by service hours. Excludes empty/inactive hours.">
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Rev / Hour <SortIcon field="revenuePerHour" />
                                        </div>
                                    </th>

                                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition select-none bg-emerald-50/50 dark:bg-emerald-900/10" onClick={() => toggleSort('totalRevenue')}>
                                        <div className="flex items-center justify-end font-semibold text-slate-700 dark:text-slate-300">
                                            Total Rev <SortIcon field="totalRevenue" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {sortedData.map((staff, i) => (
                                    <tr key={staff.staffName} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-slate-400 font-medium">{i + 1}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100">{staff.staffName}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{staff.totalServiceMinutes.toLocaleString()} mins</div>
                                        </td>
                                        
                                        {/* Efficiency */}
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold ${getEfficiencyColor(staff.efficiency)}`}>
                                                    {staff.efficiency.toFixed(1)}%
                                                </span>
                                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${staff.efficiency >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                        style={{ width: `${Math.min(staff.efficiency, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Volume */}
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{staff.serviceCount}</span>
                                            <span className="text-slate-400 ml-1">svcs</span>
                                        </td>

                                        {/* Popularity (Request) */}
                                        <td className="px-4 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${staff.requestRate >= 20 ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                <Heart className={`w-3 h-3 ${staff.requestRate >= 20 ? 'fill-pink-500 text-pink-500' : ''}`} />
                                                {staff.requestRate.toFixed(1)}%
                                            </div>
                                        </td>

                                        {/* Retention */}
                                        <td className="px-4 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${staff.retentionRate >= 30 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {staff.retentionRate > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                                                {staff.retentionRate.toFixed(1)}%
                                            </div>
                                        </td>

                                        {/* Tip Rate & Avg Tip */}
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    <Star className={`w-3 h-3 ${staff.tipRate > 50 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                                                    <span className={`font-semibold ${staff.tipRate > 50 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                                        {staff.tipRate.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    ฿{Math.round(staff.avgTip).toLocaleString()} avg
                                                </span>
                                            </div>
                                        </td>

                                        {/* Revenue Per Hour */}
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                                ฿{Math.round(staff.revenuePerHour).toLocaleString()}
                                            </span>
                                            <span className="text-slate-400 text-xs">/hr</span>
                                        </td>

                                        {/* Total Revenue */}
                                        <td className="px-4 py-4 text-right bg-emerald-50/30 dark:bg-emerald-900/5 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                                ฿{staff.totalRevenue.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
