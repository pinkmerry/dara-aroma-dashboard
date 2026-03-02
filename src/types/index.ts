export interface RawTransaction {
    'รหัสการจอง': string;
    'วันที่': string;
    'เวลา': string;
    'วัน-เวลา': string;
    'เลขใบเสร็จ': string;
    'ช่องทางการจอง': string;
    'รหัสเอเจนซี่': string;
    'ประเภท': string;
    'id ของลูกค้า': string;
    'ลูกค้า': string;
    'เบอร์โทร': string;
    'รายการ': string;
    'เวลาบริการ': string;
    'ราคาต่อบริการ': string;
    'จำนวนรายการทั้งหมด': string;
    'ราคารวม': string;
    'โปรโมชั่น': string;
    'ส่วลดโปรโมชั่น': string; // Typo in CSV header
    'ส่วนลดต่อบริการ': string;
    'ส่วนลดรวมบริการ': string;
    'ส่วนลดรวมสินค้า': string;
    'ส่วนลดรวม': string;
    'ราคาหลังหักส่วนลด': string;
    'เซอร์วิสชาร์จ': string;
    'ชาร์จ': string;
    'ราคาก่อน VAT': string;
    'VAT (7%)': string;
    'ทิปรวม': string;
    'ค่าคอมมิชชันเอเจนซี': string;
    'ยอดชำระสุทธิ': string;
    'เงินสด': string;
    'เงินโอน': string;
    'บัตรเครดิต': string;
    'เอเจนซี': string;
    'แพ็กเกจ': string;
    'E-Wallet': string;
    'ประเภท บัตรเครดิต': string;
    'ประเภท E-Wallet': string;
    'ธนาคารที่รับโอน': string;
    'พนักงาน (1)': string;
    'ค่ามือหมอนวด (1)': string;
    'ทิปหมอนวด (1)': string;
    'ค่ารีเควส (1)': string;
    'ต้นทุนบริการ': string;
    'หมายเหตุการจอง': string;
    'หมายเหตุการชำระเงิน': string;
    'ผู้ทำรายการ': string;
}

export type ItemType = 'Service' | 'Product' | 'Other';

export interface EnrichedTransaction extends RawTransaction {
    parsedDate: Date | null;
    itemType: ItemType;
    netRevenue: number;
    durationMinutes: number;
    quantity: number;

    // Parsed payments for easy computation
    cashPayment: number;
    transferPayment: number;
    creditCardPayment: number;
}

export interface ProductSummary {
    productName: string;
    quantitySold: number;
    totalRevenue: number;
}

export interface RawProductSales {
    'กลุ่มสินค้า': string;
    'สินค้า': string;
    'จำนวน': string;
    'ราคาขาย': string;
}
