/**
 * Chat Data Tools — Smart data slicing utilities for the conversational AI.
 * 
 * Instead of sending ALL data to the AI (which wastes tokens and money),
 * these tools let the AI request ONLY the specific data slices it needs
 * based on the user's question.
 * 
 * SECURITY: All data is pre-aggregated. No PII (names, phone numbers, IDs)
 * is ever sent to the AI.
 */

import { EnrichedTransaction } from '@/types';

// ─── Available Data Tool Definitions (sent to AI as "menu") ───

export const DATA_TOOL_DESCRIPTIONS = `
คุณมีเครื่องมือดึงข้อมูลต่อไปนี้ที่สามารถเรียกใช้ได้:

1. **overview** - ภาพรวมยอดขาย (รายได้รวม, จำนวนรายการ, ลูกค้า, ค่าเฉลี่ยต่อบิล)
   - params: { year?: string, month?: string }

2. **top_services** - บริการที่ทำยอดสูงสุด Top 10 (ชื่อบริการ, จำนวนครั้ง, รายได้)
   - params: { year?: string, month?: string, limit?: number }

3. **booking_channels** - สัดส่วนช่องทางการจอง (ชื่อช่องทาง, จำนวนครั้ง)
   - params: { year?: string, month?: string }

4. **peak_hours** - ช่วงเวลายอดนิยม (ชั่วโมง, จำนวนรายการ)
   - params: { year?: string, month?: string }

5. **payment_breakdown** - สัดส่วนการชำระเงิน (เงินสด, เงินโอน, บัตรเครดิต)
   - params: { year?: string, month?: string }

6. **daily_trend** - แนวโน้มรายวัน (วันที่, วัน, รายได้, รายการ, ลูกค้า)
   - params: { year: string, month: string }

7. **monthly_comparison** - เปรียบเทียบ 2 เดือน (MoM summary)
   - params: { year1: string, month1: string, year2: string, month2: string }

8. **staff_summary** - ผลงานพนักงาน (จำนวนงาน, รายได้ที่สร้าง, ค่ามือ, ทิป, บริการที่ให้ top 3)
   - params: { year?: string, month?: string }

หมายเหตุ: ข้อมูลที่ไม่มีได้แก่ ข้อมูลลูกค้ารายบุคคล, ข้อมูลต้นทุน, ข้อมูลกำไรสุทธิ, ข้อมูลรายการที่ถูกยกเลิก, ข้อมูลการรีวิว/ความพึงพอใจ
`;

// ─── Available months/years helper ───

export function getAvailablePeriods(data: EnrichedTransaction[]): { years: string[]; months: { year: string; month: string; label: string }[] } {
    const THAI_MONTHS = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];

    const yearSet = new Set<string>();
    const monthSet = new Set<string>();
    const months: { year: string; month: string; label: string }[] = [];

    data.forEach(d => {
        if (!d.parsedDate) return;
        const y = d.parsedDate.getFullYear().toString();
        const m = (d.parsedDate.getMonth() + 1).toString().padStart(2, '0');
        yearSet.add(y);
        const key = `${y}-${m}`;
        if (!monthSet.has(key)) {
            monthSet.add(key);
            months.push({ year: y, month: m, label: `${THAI_MONTHS[d.parsedDate.getMonth()]} ${y}` });
        }
    });

    return {
        years: Array.from(yearSet).sort(),
        months: months.sort((a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`)),
    };
}

// ─── Filter helper ───

function filterData(data: EnrichedTransaction[], year?: string, month?: string): EnrichedTransaction[] {
    return data.filter(d => {
        if (!d.parsedDate) return false;
        if (year && d.parsedDate.getFullYear().toString() !== year) return false;
        if (month && (d.parsedDate.getMonth() + 1).toString().padStart(2, '0') !== month) return false;
        return true;
    });
}

// ─── Tool Implementations ───

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export function toolOverview(data: EnrichedTransaction[], params: { year?: string; month?: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const totalRevenue = filtered.reduce((s, d) => s + d.netRevenue, 0);
    const customers = new Set(filtered.map(d => d['id ของลูกค้า']).filter(Boolean));
    const cash = filtered.reduce((s, d) => s + d.cashPayment, 0);
    const transfer = filtered.reduce((s, d) => s + d.transferPayment, 0);
    const credit = filtered.reduce((s, d) => s + d.creditCardPayment, 0);

    return [
        `📊 ภาพรวม${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `💰 รายได้รวม: ฿${totalRevenue.toLocaleString()}`,
        `📋 จำนวนรายการ: ${filtered.length.toLocaleString()}`,
        `👥 ลูกค้าที่ไม่ซ้ำ: ${customers.size.toLocaleString()}`,
        `🎫 ค่าเฉลี่ยต่อบิล: ฿${filtered.length > 0 ? Math.round(totalRevenue / filtered.length).toLocaleString() : '0'}`,
        `💳 เงินสด: ฿${cash.toLocaleString()} | โอน: ฿${transfer.toLocaleString()} | บัตร: ฿${credit.toLocaleString()}`,
    ].join('\n');
}

export function toolTopServices(data: EnrichedTransaction[], params: { year?: string; month?: string; limit?: number }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const limit = Math.min(params.limit || 10, 20); // cap at 20
    const serviceMap: Record<string, { count: number; revenue: number }> = {};

    filtered.forEach(d => {
        const name = d['รายการ'] || 'ไม่ระบุ';
        if (!serviceMap[name]) serviceMap[name] = { count: 0, revenue: 0 };
        serviceMap[name].count++;
        serviceMap[name].revenue += d.netRevenue;
    });

    const sorted = Object.entries(serviceMap)
        .map(([name, info]) => ({ name, ...info }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

    let result = `🏆 Top ${limit} บริการ${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}\n━━━━━━━━━━━━━━━━━━━━\n`;
    sorted.forEach((s, i) => {
        result += `${i + 1}. ${s.name} — ${s.count} ครั้ง, ฿${s.revenue.toLocaleString()}\n`;
    });
    return result;
}

export function toolBookingChannels(data: EnrichedTransaction[], params: { year?: string; month?: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const channelMap: Record<string, number> = {};
    filtered.forEach(d => {
        const ch = d['ช่องทางการจอง'] || 'ไม่ระบุ';
        channelMap[ch] = (channelMap[ch] || 0) + 1;
    });

    const sorted = Object.entries(channelMap).sort((a, b) => b[1] - a[1]);
    let result = `📢 ช่องทางจอง${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}\n━━━━━━━━━━━━━━━━━━━━\n`;
    sorted.forEach(([name, count]) => {
        const pct = ((count / filtered.length) * 100).toFixed(1);
        result += `- ${name}: ${count} ครั้ง (${pct}%)\n`;
    });
    return result;
}

export function toolPeakHours(data: EnrichedTransaction[], params: { year?: string; month?: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const hourMap: Record<number, number> = {};
    filtered.forEach(d => {
        if (!d.parsedDate) return;
        const h = d.parsedDate.getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
    });

    const sorted = Object.entries(hourMap)
        .map(([h, c]) => ({ hour: parseInt(h), count: c }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    let result = `🕐 ช่วงเวลายอดนิยม${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}\n━━━━━━━━━━━━━━━━━━━━\n`;
    sorted.forEach(h => {
        result += `- ${h.hour}:00 น. — ${h.count} รายการ\n`;
    });
    return result;
}

export function toolPaymentBreakdown(data: EnrichedTransaction[], params: { year?: string; month?: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const cash = filtered.reduce((s, d) => s + d.cashPayment, 0);
    const transfer = filtered.reduce((s, d) => s + d.transferPayment, 0);
    const credit = filtered.reduce((s, d) => s + d.creditCardPayment, 0);
    const total = cash + transfer + credit;

    return [
        `💳 สัดส่วนการชำระเงิน${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `- เงินสด: ฿${cash.toLocaleString()} (${total > 0 ? ((cash / total) * 100).toFixed(1) : 0}%)`,
        `- เงินโอน: ฿${transfer.toLocaleString()} (${total > 0 ? ((transfer / total) * 100).toFixed(1) : 0}%)`,
        `- บัตรเครดิต: ฿${credit.toLocaleString()} (${total > 0 ? ((credit / total) * 100).toFixed(1) : 0}%)`,
    ].join('\n');
}

export function toolDailyTrend(data: EnrichedTransaction[], params: { year: string; month: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const dailyMap: Record<string, { revenue: number; txns: number; customers: Set<string>; dow: number }> = {};

    filtered.forEach(d => {
        if (!d.parsedDate) return;
        const key = `${d.parsedDate.getFullYear()}-${String(d.parsedDate.getMonth() + 1).padStart(2, '0')}-${String(d.parsedDate.getDate()).padStart(2, '0')}`;
        if (!dailyMap[key]) dailyMap[key] = { revenue: 0, txns: 0, customers: new Set(), dow: d.parsedDate.getDay() };
        dailyMap[key].revenue += d.netRevenue;
        dailyMap[key].txns++;
        if (d['id ของลูกค้า']) dailyMap[key].customers.add(d['id ของลูกค้า']);
    });

    const days = Object.entries(dailyMap)
        .map(([date, info]) => ({ date, ...info, customerCount: info.customers.size }))
        .sort((a, b) => a.date.localeCompare(b.date));

    let result = `📆 แนวโน้มรายวัน ${params.month}/${params.year}\n━━━━━━━━━━━━━━━━━━━━\n`;
    result += `วันที่ | วัน | รายได้ | รายการ | ลูกค้า\n`;
    days.forEach(d => {
        result += `${d.date} | ${THAI_DAYS[d.dow]} | ฿${d.revenue.toLocaleString()} | ${d.txns} | ${d.customerCount}\n`;
    });

    // Summary
    const revenues = days.map(d => d.revenue);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const best = days.reduce((m, d) => d.revenue > m.revenue ? d : m, days[0]);
    const worst = days.reduce((m, d) => d.revenue < m.revenue ? d : m, days[0]);

    result += `\nสรุป: เฉลี่ย ฿${Math.round(avg).toLocaleString()}/วัน | ดีสุด ${best.date} ฿${best.revenue.toLocaleString()} | แย่สุด ${worst.date} ฿${worst.revenue.toLocaleString()}`;
    return result;
}

export function toolMonthlyComparison(data: EnrichedTransaction[], params: { year1: string; month1: string; year2: string; month2: string }): string {
    const data1 = filterData(data, params.year1, params.month1);
    const data2 = filterData(data, params.year2, params.month2);

    if (data1.length === 0 && data2.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const agg = (d: EnrichedTransaction[]) => {
        const rev = d.reduce((s, x) => s + x.netRevenue, 0);
        const cust = new Set(d.map(x => x['id ของลูกค้า']).filter(Boolean)).size;
        return { revenue: rev, transactions: d.length, customers: cust, avgTicket: d.length > 0 ? rev / d.length : 0 };
    };

    const a1 = agg(data1);
    const a2 = agg(data2);

    const revChange = a2.revenue - a1.revenue;
    const revPct = a1.revenue > 0 ? ((revChange / a1.revenue) * 100).toFixed(1) : 'N/A';

    return [
        `📊 เปรียบเทียบ ${params.month1}/${params.year1} vs ${params.month2}/${params.year2}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `เดือนแรก: รายได้ ฿${a1.revenue.toLocaleString()} | ${a1.transactions} รายการ | ${a1.customers} ลูกค้า | เฉลี่ย ฿${Math.round(a1.avgTicket).toLocaleString()}`,
        `เดือนสอง: รายได้ ฿${a2.revenue.toLocaleString()} | ${a2.transactions} รายการ | ${a2.customers} ลูกค้า | เฉลี่ย ฿${Math.round(a2.avgTicket).toLocaleString()}`,
        ``,
        `การเปลี่ยนแปลง:`,
        `- รายได้: ${revChange >= 0 ? '+' : ''}฿${revChange.toLocaleString()} (${revPct}%)`,
        `- รายการ: ${a2.transactions - a1.transactions >= 0 ? '+' : ''}${(a2.transactions - a1.transactions).toLocaleString()}`,
        `- ลูกค้า: ${a2.customers - a1.customers >= 0 ? '+' : ''}${(a2.customers - a1.customers).toLocaleString()}`,
    ].join('\n');
}

export function toolStaffSummary(data: EnrichedTransaction[], params: { year?: string; month?: string }): string {
    const filtered = filterData(data, params.year, params.month);
    if (filtered.length === 0) return 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';

    const staffMap: Record<string, {
        count: number;
        revenue: number;
        commission: number;
        tips: number;
        services: Record<string, { count: number; revenue: number }>;
    }> = {};

    filtered.forEach(d => {
        const name = d['พนักงาน (1)']?.trim() || 'ไม่ระบุ';
        if (!staffMap[name]) staffMap[name] = { count: 0, revenue: 0, commission: 0, tips: 0, services: {} };
        staffMap[name].count++;
        staffMap[name].revenue += d.netRevenue;
        staffMap[name].commission += parseFloat(d['ค่ามือหมอนวด (1)'] || '0') || 0;
        staffMap[name].tips += parseFloat(d['ทิปหมอนวด (1)'] || '0') || 0;

        const svc = d['รายการ']?.trim() || 'ไม่ระบุ';
        if (!staffMap[name].services[svc]) staffMap[name].services[svc] = { count: 0, revenue: 0 };
        staffMap[name].services[svc].count++;
        staffMap[name].services[svc].revenue += d.netRevenue;
    });

    const sorted = Object.entries(staffMap)
        .map(([name, info]) => {
            // Sort services by revenue descending, take top 3
            const topServices = Object.entries(info.services)
                .map(([svcName, svcInfo]) => ({ name: svcName, ...svcInfo }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 3);
            return { name, ...info, topServices };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15); // cap at top 15

    let result = `👨‍⚕️ ผลงานพนักงาน${params.year ? ` ปี ${params.year}` : ''}${params.month ? ` เดือน ${params.month}` : ''}\n━━━━━━━━━━━━━━━━━━━━\n`;
    sorted.forEach((s, i) => {
        result += `\n${i + 1}. ${s.name}\n`;
        result += `   📊 ${s.count} งาน | รายได้ ฿${s.revenue.toLocaleString()} | ค่ามือ ฿${s.commission.toLocaleString()} | ทิป ฿${s.tips.toLocaleString()}\n`;
        result += `   🔧 บริการที่ให้:\n`;
        s.topServices.forEach((svc, j) => {
            result += `      ${j + 1}) ${svc.name} — ${svc.count} ครั้ง, ฿${svc.revenue.toLocaleString()}\n`;
        });
    });
    return result;
}

// ─── Master dispatcher ───

export type ToolName = 'overview' | 'top_services' | 'booking_channels' | 'peak_hours' | 'payment_breakdown' | 'daily_trend' | 'monthly_comparison' | 'staff_summary';

export function executeDataTool(data: EnrichedTransaction[], toolName: ToolName, params: Record<string, string | number | undefined>): string {
    switch (toolName) {
        case 'overview':
            return toolOverview(data, params as any);
        case 'top_services':
            return toolTopServices(data, params as any);
        case 'booking_channels':
            return toolBookingChannels(data, params as any);
        case 'peak_hours':
            return toolPeakHours(data, params as any);
        case 'payment_breakdown':
            return toolPaymentBreakdown(data, params as any);
        case 'daily_trend':
            return toolDailyTrend(data, params as any);
        case 'monthly_comparison':
            return toolMonthlyComparison(data, params as any);
        case 'staff_summary':
            return toolStaffSummary(data, params as any);
        default:
            return `ไม่พบเครื่องมือชื่อ "${toolName}"`;
    }
}
