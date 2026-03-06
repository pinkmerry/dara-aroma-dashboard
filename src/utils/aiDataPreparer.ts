import { EnrichedTransaction } from '@/types';

export type AnalysisType = 'mom' | 'yoy' | 'quarterly' | 'monthly';

interface MonthlyAggregate {
    year: number;
    month: number;
    label: string;
    totalRevenue: number;
    totalTransactions: number;
    uniqueCustomers: number;
    avgTicketSize: number;
    totalServiceHours: number;
    cashPayments: number;
    transferPayments: number;
    creditPayments: number;
    topServices: { name: string; count: number; revenue: number }[];
    topChannels: { name: string; count: number }[];
    peakHours: { hour: number; count: number }[];
}

interface DailyAggregate {
    date: string; // e.g. "2025-01-15"
    dayOfWeek: string;
    totalRevenue: number;
    totalTransactions: number;
    uniqueCustomers: number;
}

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

function aggregateMonth(data: EnrichedTransaction[], year: number, month: number): MonthlyAggregate | null {
    const filtered = data.filter(d => {
        if (!d.parsedDate) return false;
        return d.parsedDate.getFullYear() === year && d.parsedDate.getMonth() === month;
    });

    if (filtered.length === 0) return null;

    const totalRevenue = filtered.reduce((sum, d) => sum + d.netRevenue, 0);
    const totalTransactions = filtered.length;
    const customers = new Set<string>();
    let totalMinutes = 0;
    let cash = 0, transfer = 0, credit = 0;

    const serviceCount: Record<string, { count: number; revenue: number }> = {};
    const channelCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};

    filtered.forEach(d => {
        if (d['id ของลูกค้า']) customers.add(d['id ของลูกค้า']);
        totalMinutes += d.durationMinutes;
        cash += d.cashPayment;
        transfer += d.transferPayment;
        credit += d.creditCardPayment;

        // Service tracking
        const service = d['รายการ'] || 'ไม่ระบุ';
        if (!serviceCount[service]) serviceCount[service] = { count: 0, revenue: 0 };
        serviceCount[service].count++;
        serviceCount[service].revenue += d.netRevenue;

        // Channel tracking
        const channel = d['ช่องทางการจอง'] || 'ไม่ระบุ';
        channelCount[channel] = (channelCount[channel] || 0) + 1;

        // Peak hours
        if (d.parsedDate) {
            const hour = d.parsedDate.getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        }
    });

    const topServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    const topChannels = Object.entries(channelCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const peakHours = Object.entries(hourCount)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        year,
        month,
        label: `${THAI_MONTHS[month]} ${year}`,
        totalRevenue,
        totalTransactions,
        uniqueCustomers: customers.size,
        avgTicketSize: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        totalServiceHours: Math.round(totalMinutes / 60 * 10) / 10,
        cashPayments: cash,
        transferPayments: transfer,
        creditPayments: credit,
        topServices,
        topChannels,
        peakHours,
    };
}

/**
 * Aggregate daily data for a given month
 */
function aggregateDailyForMonth(data: EnrichedTransaction[], year: number, month: number): DailyAggregate[] {
    const filtered = data.filter(d => {
        if (!d.parsedDate) return false;
        return d.parsedDate.getFullYear() === year && d.parsedDate.getMonth() === month;
    });

    const dailyMap: Record<string, { revenue: number; txns: number; customers: Set<string>; dayOfWeek: number }> = {};

    filtered.forEach(d => {
        if (!d.parsedDate) return;
        const dateKey = `${d.parsedDate.getFullYear()}-${String(d.parsedDate.getMonth() + 1).padStart(2, '0')}-${String(d.parsedDate.getDate()).padStart(2, '0')}`;
        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = { revenue: 0, txns: 0, customers: new Set(), dayOfWeek: d.parsedDate.getDay() };
        }
        dailyMap[dateKey].revenue += d.netRevenue;
        dailyMap[dateKey].txns += 1;
        if (d['id ของลูกค้า']) dailyMap[dateKey].customers.add(d['id ของลูกค้า']);
    });

    return Object.entries(dailyMap)
        .map(([date, info]) => ({
            date,
            dayOfWeek: THAI_DAYS[info.dayOfWeek],
            totalRevenue: info.revenue,
            totalTransactions: info.txns,
            uniqueCustomers: info.customers.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function formatAggregate(agg: MonthlyAggregate): string {
    let result = `\n📅 ${agg.label}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `💰 รายได้รวม: ฿${agg.totalRevenue.toLocaleString()}\n`;
    result += `📊 จำนวนรายการ: ${agg.totalTransactions.toLocaleString()}\n`;
    result += `👥 ลูกค้าที่ไม่ซ้ำ: ${agg.uniqueCustomers.toLocaleString()}\n`;
    result += `🎫 ยอดเฉลี่ย/ครั้ง: ฿${Math.round(agg.avgTicketSize).toLocaleString()}\n`;
    result += `⏰ ชั่วโมงบริการรวม: ${agg.totalServiceHours} ชม.\n`;
    result += `\n💳 การชำระเงิน:\n`;
    result += `  - เงินสด: ฿${agg.cashPayments.toLocaleString()}\n`;
    result += `  - เงินโอน: ฿${agg.transferPayments.toLocaleString()}\n`;
    result += `  - บัตรเครดิต: ฿${agg.creditPayments.toLocaleString()}\n`;

    result += `\n🏆 Top 10 บริการ (ตามรายได้):\n`;
    agg.topServices.forEach((s, i) => {
        result += `  ${i + 1}. ${s.name} — ${s.count} ครั้ง, ฿${s.revenue.toLocaleString()}\n`;
    });

    result += `\n📢 ช่องทางจอง:\n`;
    agg.topChannels.forEach(c => {
        result += `  - ${c.name}: ${c.count} ครั้ง\n`;
    });

    result += `\n🕐 ช่วงเวลาที่ยอดนิยม:\n`;
    agg.peakHours.forEach(h => {
        result += `  - ${h.hour}:00 น. — ${h.count} รายการ\n`;
    });

    return result;
}

/**
 * Format daily breakdown data as string
 */
function formatDailyBreakdown(dailyData: DailyAggregate[], monthLabel: string): string {
    if (dailyData.length === 0) return '';

    let result = `\n📆 ข้อมูลรายวัน — ${monthLabel}\n`;
    result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    result += `วันที่ | วัน | รายได้ | รายการ | ลูกค้า\n`;
    result += `------|------|--------|--------|-------\n`;

    dailyData.forEach(d => {
        result += `${d.date} | ${d.dayOfWeek} | ฿${d.totalRevenue.toLocaleString()} | ${d.totalTransactions} | ${d.uniqueCustomers}\n`;
    });

    // Add daily summary statistics
    const revenues = dailyData.map(d => d.totalRevenue);
    const avgDaily = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const maxDay = dailyData.reduce((max, d) => d.totalRevenue > max.totalRevenue ? d : max, dailyData[0]);
    const minDay = dailyData.reduce((min, d) => d.totalRevenue < min.totalRevenue ? d : min, dailyData[0]);

    result += `\n📊 สรุปประจำวัน:\n`;
    result += `  - รายได้เฉลี่ย/วัน: ฿${Math.round(avgDaily).toLocaleString()}\n`;
    result += `  - วันที่ขายดีสุด: ${maxDay.date} (${maxDay.dayOfWeek}) — ฿${maxDay.totalRevenue.toLocaleString()}\n`;
    result += `  - วันที่ขายน้อยสุด: ${minDay.date} (${minDay.dayOfWeek}) — ฿${minDay.totalRevenue.toLocaleString()}\n`;
    result += `  - จำนวนวันที่เปิดทำการ: ${dailyData.length} วัน\n`;

    return result;
}

/**
 * Get all available months from the data
 */
export function getAvailableMonths(data: EnrichedTransaction[]): { year: number; month: number; label: string }[] {
    const monthSet = new Set<string>();
    const months: { year: number; month: number; label: string }[] = [];

    data.forEach(d => {
        if (!d.parsedDate) return;
        const y = d.parsedDate.getFullYear();
        const m = d.parsedDate.getMonth();
        const key = `${y}-${m}`;
        if (!monthSet.has(key)) {
            monthSet.add(key);
            months.push({ year: y, month: m, label: `${THAI_MONTHS[m]} ${y}` });
        }
    });

    return months.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
}

export function getAvailableMomOptions(data: EnrichedTransaction[]) {
    const months = getAvailableMonths(data);
    const options = [];
    for (let i = 0; i < months.length - 1; i++) {
        const current = months[i];
        const prev = months[i + 1];
        options.push({
            key: `${current.year}-${current.month}`,
            label: `${current.label} vs ${prev.label}`
        });
    }
    return options;
}

export function getAvailableYoyOptions(data: EnrichedTransaction[]) {
    const months = getAvailableMonths(data);
    const options = [];
    for (let i = 0; i < months.length; i++) {
        const current = months[i];
        const lastYear = months.find(m => m.month === current.month && m.year === current.year - 1);
        if (lastYear) {
            options.push({
                key: `${current.year}-${current.month}`,
                label: `${current.label} vs ${lastYear.label}`
            });
        }
    }
    return options;
}

export function getAvailableQuarterOptions(data: EnrichedTransaction[]) {
    const months = getAvailableMonths(data);
    const quarterMap = new Map();
    months.forEach(m => {
        const q = Math.floor(m.month / 3) + 1;
        const key = `${m.year}-Q${q}`;
        if (!quarterMap.has(key)) {
            quarterMap.set(key, { year: m.year, quarter: q, months: [] });
        }
        // only push if not already
        if (!quarterMap.get(key).months.some((existing: any) => existing.month === m.month)) {
            quarterMap.get(key).months.push(m);
        }
    });

    const options: { key: string; label: string; months: any[] }[] = [];
    quarterMap.forEach((val, key) => {
        const sortedMonths = val.months.sort((a: any, b: any) => a.month - b.month);
        options.push({
            key,
            label: `Q${val.quarter} ${val.year} (${sortedMonths[0].label.split(' ')[0]} - ${sortedMonths[sortedMonths.length - 1].label.split(' ')[0]})`,
            months: sortedMonths
        });
    });

    return options.sort((a, b) => {
        if (a.key > b.key) return -1;
        if (a.key < b.key) return 1;
        return 0;
    });
}

/**
 * Prepare data payload for MoM analysis — includes daily breakdown for both months
 */
export function prepareMoMData(data: EnrichedTransaction[], baseKey?: string): string | null {
    const availableMonths = getAvailableMonths(data);
    if (availableMonths.length < 2) return null;

    let currentIndex = 0;
    if (baseKey) {
        currentIndex = availableMonths.findIndex(m => `${m.year}-${m.month}` === baseKey);
        if (currentIndex === -1 || currentIndex >= availableMonths.length - 1) return null;
    }

    const currentMonth = availableMonths[currentIndex];
    const previousMonth = availableMonths[currentIndex + 1];

    const currentAgg = aggregateMonth(data, currentMonth.year, currentMonth.month);
    const prevAgg = aggregateMonth(data, previousMonth.year, previousMonth.month);

    if (!currentAgg || !prevAgg) return null;

    let payload = `=== การวิเคราะห์ Month-over-Month (MoM) ===\n`;
    payload += `เปรียบเทียบ: ${prevAgg.label} → ${currentAgg.label}\n`;
    payload += `\n--- เดือนก่อนหน้า ---`;
    payload += formatAggregate(prevAgg);
    payload += `\n--- เดือนปัจจุบัน ---`;
    payload += formatAggregate(currentAgg);

    // Add change summary
    const revChange = currentAgg.totalRevenue - prevAgg.totalRevenue;
    const revPct = prevAgg.totalRevenue > 0 ? ((revChange / prevAgg.totalRevenue) * 100).toFixed(1) : 'N/A';
    const txnChange = currentAgg.totalTransactions - prevAgg.totalTransactions;
    const custChange = currentAgg.uniqueCustomers - prevAgg.uniqueCustomers;

    payload += `\n\n--- สรุปการเปลี่ยนแปลง ---\n`;
    payload += `รายได้เปลี่ยนแปลง: ${revChange >= 0 ? '+' : ''}฿${revChange.toLocaleString()} (${revPct}%)\n`;
    payload += `รายการเปลี่ยนแปลง: ${txnChange >= 0 ? '+' : ''}${txnChange.toLocaleString()}\n`;
    payload += `ลูกค้าเปลี่ยนแปลง: ${custChange >= 0 ? '+' : ''}${custChange.toLocaleString()}\n`;

    // Daily breakdown for previous month
    const prevDaily = aggregateDailyForMonth(data, previousMonth.year, previousMonth.month);
    payload += formatDailyBreakdown(prevDaily, prevAgg.label);

    // Daily breakdown for current month
    const currentDaily = aggregateDailyForMonth(data, currentMonth.year, currentMonth.month);
    payload += formatDailyBreakdown(currentDaily, currentAgg.label);

    return payload;
}

/**
 * Prepare data payload for YoY analysis — includes daily breakdown for both months
 */
export function prepareYoYData(data: EnrichedTransaction[], baseKey?: string): string | null {
    const availableMonths = getAvailableMonths(data);
    if (availableMonths.length === 0) return null;

    let latestMonth = availableMonths[0];
    if (baseKey) {
        const found = availableMonths.find(m => `${m.year}-${m.month}` === baseKey);
        if (found) latestMonth = found;
    }

    // Find same month in previous year
    const lastYearMonth = availableMonths.find(
        m => m.month === latestMonth.month && m.year === latestMonth.year - 1
    );

    if (!lastYearMonth) return null;

    const currentAgg = aggregateMonth(data, latestMonth.year, latestMonth.month);
    const lastYearAgg = aggregateMonth(data, lastYearMonth.year, lastYearMonth.month);

    if (!currentAgg || !lastYearAgg) return null;

    let payload = `=== การวิเคราะห์ Year-over-Year (YoY) ===\n`;
    payload += `เปรียบเทียบ: ${lastYearAgg.label} → ${currentAgg.label}\n`;
    payload += `\n--- ปีที่แล้ว ---`;
    payload += formatAggregate(lastYearAgg);
    payload += `\n--- ปีนี้ ---`;
    payload += formatAggregate(currentAgg);

    const revChange = currentAgg.totalRevenue - lastYearAgg.totalRevenue;
    const revPct = lastYearAgg.totalRevenue > 0 ? ((revChange / lastYearAgg.totalRevenue) * 100).toFixed(1) : 'N/A';
    const txnChange = currentAgg.totalTransactions - lastYearAgg.totalTransactions;
    const custChange = currentAgg.uniqueCustomers - lastYearAgg.uniqueCustomers;

    payload += `\n\n--- สรุปการเปลี่ยนแปลง YoY ---\n`;
    payload += `รายได้เปลี่ยนแปลง: ${revChange >= 0 ? '+' : ''}฿${revChange.toLocaleString()} (${revPct}%)\n`;
    payload += `รายการเปลี่ยนแปลง: ${txnChange >= 0 ? '+' : ''}${txnChange.toLocaleString()}\n`;
    payload += `ลูกค้าเปลี่ยนแปลง: ${custChange >= 0 ? '+' : ''}${custChange.toLocaleString()}\n`;

    // Daily breakdown for last year month
    const lastYearDaily = aggregateDailyForMonth(data, lastYearMonth.year, lastYearMonth.month);
    payload += formatDailyBreakdown(lastYearDaily, lastYearAgg.label);

    // Daily breakdown for current month
    const currentDaily = aggregateDailyForMonth(data, latestMonth.year, latestMonth.month);
    payload += formatDailyBreakdown(currentDaily, currentAgg.label);

    return payload;
}

/**
 * Prepare data payload for Quarterly analysis — includes daily breakdown per month
 */
export function prepareQuarterlyData(data: EnrichedTransaction[], baseKey?: string): string | null {
    const options = getAvailableQuarterOptions(data);
    if (options.length === 0) return null;

    let targetQuarter = options[0];
    if (baseKey) {
        const found = options.find(o => o.key === baseKey);
        if (found) targetQuarter = found;
    }

    const { months } = targetQuarter;
    if (months.length === 0) return null;

    const aggregates = months
        .map(m => aggregateMonth(data, m.year, m.month))
        .filter(Boolean) as MonthlyAggregate[];

    if (aggregates.length === 0) return null;

    let payload = `=== การวิเคราะห์แนวโน้มรายไตรมาส (Quarterly Trend) ===\n`;
    payload += `ช่วงเวลา: ${aggregates[0].label} ถึง ${aggregates[aggregates.length - 1].label}\n`;

    aggregates.forEach((agg, idx) => {
        payload += `\n--- เดือนที่ ${idx + 1} ---`;
        payload += formatAggregate(agg);
    });

    // Overall trend summary
    if (aggregates.length >= 2) {
        const first = aggregates[0];
        const last = aggregates[aggregates.length - 1];
        const revTrend = last.totalRevenue - first.totalRevenue;
        const txnTrend = last.totalTransactions - first.totalTransactions;

        payload += `\n\n--- สรุปแนวโน้ม ---\n`;
        payload += `รายได้ (เดือนแรก→เดือนล่าสุด): ${revTrend >= 0 ? '+' : ''}฿${revTrend.toLocaleString()}\n`;
        payload += `รายการ (เดือนแรก→เดือนล่าสุด): ${txnTrend >= 0 ? '+' : ''}${txnTrend.toLocaleString()}\n`;
        payload += `รายได้รวมทั้งไตรมาส: ฿${aggregates.reduce((s, a) => s + a.totalRevenue, 0).toLocaleString()}\n`;
        payload += `รายการรวมทั้งไตรมาส: ${aggregates.reduce((s, a) => s + a.totalTransactions, 0).toLocaleString()}\n`;
    }

    // Daily breakdown for each month in the quarter
    months.forEach(m => {
        const daily = aggregateDailyForMonth(data, m.year, m.month);
        payload += formatDailyBreakdown(daily, `${THAI_MONTHS[m.month]} ${m.year}`);
    });

    return payload;
}

export function getAvailableMonthlyOptions(data: EnrichedTransaction[]) {
    const months = getAvailableMonths(data);
    return months.map(m => ({
        key: `${m.year}-${m.month}`,
        label: m.label,
    }));
}

/**
 * Prepare data payload for single Monthly analysis — includes daily breakdown
 */
export function prepareMonthlyData(data: EnrichedTransaction[], baseKey?: string): string | null {
    const availableMonths = getAvailableMonths(data);
    if (availableMonths.length === 0) return null;

    let targetMonth = availableMonths[0];
    if (baseKey) {
        const found = availableMonths.find(m => `${m.year}-${m.month}` === baseKey);
        if (found) targetMonth = found;
    }

    const agg = aggregateMonth(data, targetMonth.year, targetMonth.month);
    if (!agg) return null;

    let payload = `=== การวิเคราะห์รายเดือน (Monthly Deep Dive) ===\n`;
    payload += `เดือนที่วิเคราะห์: ${agg.label}\n`;
    payload += formatAggregate(agg);

    // Daily breakdown
    const daily = aggregateDailyForMonth(data, targetMonth.year, targetMonth.month);
    payload += formatDailyBreakdown(daily, agg.label);

    return payload;
}

/**
 * Get the label for the analysis type period
 */
export function getAnalysisPeriodLabel(type: AnalysisType, data: EnrichedTransaction[], baseKey?: string): string {
    switch (type) {
        case 'mom': {
            const options = getAvailableMomOptions(data);
            if (options.length === 0) return 'ข้อมูลไม่เพียงพอ';
            if (baseKey) {
                const found = options.find(o => o.key === baseKey);
                if (found) return found.label;
            }
            return options[0].label;
        }
        case 'yoy': {
            const options = getAvailableYoyOptions(data);
            if (options.length === 0) return 'ไม่มีข้อมูลปีที่แล้ว';
            if (baseKey) {
                const found = options.find(o => o.key === baseKey);
                if (found) return found.label;
            }
            return options[0].label;
        }
        case 'quarterly': {
            const options = getAvailableQuarterOptions(data);
            if (options.length === 0) return 'ไม่มีข้อมูล';
            if (baseKey) {
                const found = options.find(o => o.key === baseKey);
                if (found) return found.label;
            }
            return options[0].label;
        }
        case 'monthly': {
            const options = getAvailableMonthlyOptions(data);
            if (options.length === 0) return 'ไม่มีข้อมูล';
            if (baseKey) {
                const found = options.find(o => o.key === baseKey);
                if (found) return found.label;
            }
            return options[0].label;
        }
    }
}
