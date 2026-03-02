import { RawTransaction, EnrichedTransaction, ItemType, ProductSummary } from '../types';
import { parse } from 'date-fns';

// Hardcoded Master Lists for Services and Products
const servicesText = `บริการ
นวดไทย
นวดเท้า
ไทยออยล์
คอบ่าไหล่
นวดประคบ
แก้อาการ
นวดหน้าอก
เคลียร์ริ่งเล็ก
เคลียร์ริ่งใหญ่
อโรม่า
นวดครีม
นวด hot-oil
ระเบิดขี้ไคล
ไวท์เทนนิ่ง
อโรม่าสครับ
นวดสายมู
สุดคุ้ม
ตัวแม่ 3  ชม
สระเดี่ยว S
สระคู่ S คนแรก
สระเดี่ยว M
สระเดี่ยว L
สระคู่ M คนแรก
สระคู่ L คนแรก
สระคู่ S คนสอง
สระคู่ M คนสอง
สระคู่ L คนสอง
ตัวแม่ (สปา)
ตัวแม่ (สระ)
อบสมุนไพร+นวด
ทรีทเม้นเคราติน
สครับหนังศีรษะ
ลูกกลิ้ง Sleeping
ลูกกลิ้ง Relaxing
น้ำมันทันใจ (สายมู)
ลิปมู
องค์พระแม่ลักษมี
โปรสินค้ามู 2ชิ้น
D1  (เลือกได้หมด)
นวดไทย ห้องส่วนตัว
รีวิวสระคู่ L คนแรก
รีวิวสระคู่ L คนสอง
รีวิวสระเดี่ยว L
โปรนวดไทย 199
ผมต่อ ชำระเพิ่ม
อบสมุนไพร 30นาที
ผมต่อ คนแรก
ผมต่อ คนสอง
รีวิวสระเดี่ยว M
รีวิวสระเดี่ยว S
รีิวิวสระคู่ M คนแรก
รีิวิวสระคู่ M คนสอง
รีวิวไทยออยล์
รีวิวมู
ถอนหงอก 60 นาที
ถอนหงอก 30 นาที
ถอนหงอก 90 นาที
ถอนหงอก 120 นาที
นวดหน้ายกกระชับ 60 นาที
นวดหน้ายกกระชับ 90 นาที
นวดหน้ายกกระชับ 120 นาที
Premium 60 นาที
Premium 90 นาที
Premium 120 นาที
บอกรักแม่ : นวดหน้า
บอกรักแม่ : สระผม
บอกรักแม่ : นวดเท้า 30 นาที
โปร 7.7 ถอนหงอก 30 นาที
โปร 7.7 นวดหน้า 60 นาที
โปร 7.7 นวดมู 60 นาที
โปร 7.7 นวด Hot-Oil 60 นาที
โปร 7.7 ออร่าระเบิดขี้ไคล 120 นาที
โปรนวดเท้า 199
โปร : ขัดผิว999 คนแรก
โปร : ขัดผิว999 คนสอง
เกาหลัง 30 นาที
เกาหลัง 60 นาที
เกาหลัง 90 นาที
โปร : ขัดผิวคนเดียว (ตัดแพคเกจได้ 2 ครั้ง)
มาร์คหน้า
มาร์คมือ
มาร์คเท้า
มาร์คตาอุ่น
ขัดผิวเดี่ยว 590
รีวิวเกาหลัง 30 นาที
รีวิวเกาหลัง 60 นาที
รีวิวเกาหลัง 90 นาที
เกาหลัง 30 + ฮอตออยล์ 60
ขัดผิว 60 + ฮอตออยล์ 60
โปร: ขัดผิวเดี่ยว 590
D1 คนแรก
D1 คนสอง
C : ลูกกลิ้งเขียว Sleeping
C :  ลูกกลิ้งชมพู Relaxing
C :  ไวท์เทนนิ่ง
C :  สครับศีรษะ
C :  ทรีทเม้นเคราติน
C :  มาร์คตาอุ่น
C :  มาร์คหน้า
C :  มาร์คมือ
C :  มาร์คเท้า
C : เมมเบอร์ 5,000/5500
C : เมมเบอร์ 10,000/11,500
C : เมมเบอร์ 20,000/24,000
เทสลุกกลิ้งสีรุ้ง
ผมต่อ 0.5
โปร ขัดผิวเดี่ยว 590
ลูกกลิ้ง (หมอเติม)
TCB 1 :  เท้า 40 + คบล 20
TCB 2 :  เท้า 60 + คบล 30
TCB 3 : เท้า 30 + คบล 60
TCB 4 : เท้า 60 + คบล 60
ผ่อนคลาย 1 : เกา 20 + เท้า 40
ผ่อนคลาย 2 : เกา 20 + ไทย 40
ผ่อนคลาย 3 : เกา 20 + คบล 40
ผ่อนคลาย 4 : เกา 20 + ศีรษะ 20 + คบล 60
สระไดร์ไดสัน
เพิ่ม : นวดศีรษะ 10 นาที
อบตัว (หมอใช้ตู้อบ)
ยาหม่อง
C : เมมเบอร์ 25,000/28,500
C : เมมเบอร์ 15,000/16,800
สุดคุ้ม (สปา)
สุดคุ้ม (อโรม่า30นาที)
ขัดผิวโปรคนเดียว ใช้ 2 ครั้ง
ลิปมู Lucky 300 ชิ้น`;

const productsText = `สินค้า
ทรีทเม้น (ขาย)
สครับศีรษะ (ขาย)
ลูกกลิ้ง Sleeping (ตัดสต๊อก)
น้ำมันทันใจ (ตัดสต๊อค)
องค์พระแม่ลักษมี (ตัดสต๊อค)
ลิปมู (ตัดสต๊อค)
โปรสินค้ามู 2ชิ้น
ลูกกลิ้ง Relaxing (ตัดสต๊อค)
น้ำผึ้ง
อโวคาโด้
ทับทิม ตัวเก่า
มาร์คตา
มาร์คมือ
มาร์คเท้า
นวดไทย ห้องส่วนตัว
ผมต่อ
อบสมุนไพร30นาที
เคราตินผม (ตัดสต๊อค)
สครับหนังศีรษะ (Store)
เจลอโรเวร่า (Store)
ครีมนวดหน้า %
คลีนซิ่งล้างหน้า %
น้ำมันมะพร้าวนวดหน้า %
กานิเย่
ฟองน้ำ (เบิกที่ ผจก)
สำลี (ห่อ)
มาร์คหน้า (ตัดสต๊อค)
มาร์คมือ (ตัดสต๊อค)
มาร์คเท้า (ตัดสต๊อค)
มาร์คตาอุ่น (ตัดสต๊อค)
น้ำมันไม่มีกลิ่น (แกลลอน)
น้ำมันลาเวนเดอร์ (แกลลอน)
น้ำมันน้ำนมข้าว (แกลลอน)
น้ำมันรีแลกซิ่ง (แกลลอน)
โลชั่นนวดเท้า (แกลลอน)
ยาหม่อง (ถุง)
สครับระเบิดขี้ไคล
สครับตัว (Store)
ไวท์เทนนิ่ง (Store)
ไวท์เทนนิ่ง (ตัดสต๊อก)
สครับผิว (ตัดสต๊อค)
หมวกอโรม่า (ตัดสต๊อค)
สมุนไพร อบตัว (ตัดสต๊อค)
ดอกไม้ประดับเตียงนวด (Store)
กางเกงใน (ตัดสต๊อค)
ลูกอม แพค
รองเท้าลูกค้า
กระดาษเอ4
ปากกาเน้นคำสีส้ม
ปากกาเน้นคำสีฟ้า
ปากกาเน้นคำสีเหลือง
ปากกาเน้นคำสีเขียว
น้ำยาลบคำผิด
ถ่าน AA
ถ่าน AAA
ยางลบ
ก้อนดับกลิ่น
การบูร (%)
ทิชชู่ม้วน ห้องน้ำ
หัวเชื้อน้ำยาถูพื้น (ชุด)
หัวเชื้อน้ำยาซักผ้า % (ถังน้ำเงิน)
หัวเชื้อน้ำยาล้างจาน (ถุง)
น้ำยาปรับผ้านุ่ม (ถุง)
ฟองน้ำล้างแก้วสีขาว (อัน)
สก๊อตไบร์ท (อัน)
ถุงขยะ 30*40 (ม้วน)
ถุงขยะ18*20 (ม้วน)
สเปร์ยปรับอากาศ (ขวด)
ไฮเตอร์ %
ผงเทท่อตัน (กระปุกเปิดใช้แล้ว) %
ผงเทท่อตัน (ซอง)
แฟ้บซักผ้าขาว ถุง
โฟมอาบน้ำ  (แกลลอน)
น้ำขิง (กระปุก)
น้ำถ้วย (ลัง)
คัตเติ้ลบัท %
คัทเติ้ลบัท (กระปุก)
คัทเติ้ลบัท (ซองเล็ก)
ยาสระผม
ครีมนวดผม
แปรงเล็กทำความสะอาดรูวงแหวน
น้ำมันใส่ผม
เทียน กล่อง (Store)
ดอกไม้มู
เสื้อหมอ (พร้อมใส่)
เน็ตติดผม
แมสผ้า
เสื้อยืด (หมอ)
เสื้อแม่มู
ลูกน้ำม่วง เล็ก
ลูกน้ำม่วง ใหญ่
น้ำยาทำความสะอาดกระเบื้องร่องยาแนว (แกลลอน)
น้ำยาซักผ้าขาว
น้ำส้มสายชู %
Sleeping (เขียว) แพ็ค
Relaxing (ชมพู) แพ็ค
หลอดน้ำถ้วย (แพค)
ลูกประคบ (Store)
ยาฉีดยุง
ผงเทท่อตันใหม่ (กระปุก)
มือลิงชมพู (Store)
ผ้าไม้ม็อบ
ผ้าม็อบสีม่วง (ชั้น1,2)
ผ้าม็อบสีส้ม (ชั้น3)
ผ้าม็อบสีฟ้า (ชั้น4)
ผ้าม็อบสีเทา (ห้องครัว)
ถุงมือS
ถุงมือM
ปากกาน้ำเงิน
ปากกาแดง
รีโมทแอร์
กล่องใส่สำลี
มาร์คมือ (ขาย)
มาร์คเท้า (ขาย)
มาร์คตาอุ่น (ขาย)
ไวท์เทนนิ่ง (ขาย)
ลูกกลิ้ง กาว
มาร์คหน้า (ขาย)
หัวชาร์จ
กำไลกรุ๊งกริ๊ง
หวีเป่าแห้ง
ฝักบัว (เตียงสระ)
จุลินทรีย์
วิม ขัดพื้น ขวด
ขวดน้ำมัน
กรอบตั้งป้าย
ลูกกลิ้ง (หมอเติม)
สครับศีรษะ (ตัดสต๊อค)
อโรเวล่า (ตัดสต๊อค)
หมวกสปา (ตัดสต๊อค)
เทส : ลูกกลิ้งม่วง
ถ่าน เฉพาะใส่นาฬิกา (ก้อน)
ก้อนดับกลิ่น กุหลาบ
หน้า (ลังใหญ่)
มือ (ลังใหญ่)
เท้า (ลังใหญ่)
ตา (ลังใหญ่)
เคราติน กระปุก
ไม้กวาด
น้ำหอม Glade
ฝอยขัดหม้อ
เคราติน (Store)
เสื้อหมอM (ขาย)
เสื้อหมอL (ขาย)
เสื้อหมอXL (ขาย)`;

// Helper to clean up strings by removing parentheses and prefixes
const cleanString = (s: string) => {
    return s.replace(/\(.*?\)/g, '').replace(/^[\w\d]+\s*:\s*/, '').trim().toLowerCase();
};

const servicesSet = new Set(servicesText.split('\n').map(cleanString).filter(s => s.length > 2));
const productsSet = new Set(productsText.split('\n').map(cleanString).filter(s => s.length > 2));

// Sort by length so longest strings match first
const MASTER_SERVICES = Array.from(servicesSet).sort((a, b) => b.length - a.length);
const MASTER_PRODUCTS = Array.from(productsSet).sort((a, b) => b.length - a.length);

const parseThaiNumber = (val: string | undefined): number => {
    if (!val) return 0;
    const cleaned = val.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

export const enrichTransactions = (
    transactions: RawTransaction[]
): EnrichedTransaction[] => {
    return transactions.map((t) => {
        const rawItemName = t['รายการ'] ? String(t['รายการ']).trim() : '';
        const lowerItemName = rawItemName.toLowerCase();

        let itemType: ItemType = 'Other';

        // Exact and Substring Match Logic (Case Insensitive)
        if (MASTER_SERVICES.find(s => lowerItemName.includes(s))) {
            itemType = 'Service';
        } else if (MASTER_PRODUCTS.find(p => lowerItemName.includes(p))) {
            itemType = 'Product';
        }

        // 2. Parse Date
        let parsedDate: Date | null = null;
        try {
            if (t['วัน-เวลา']) {
                // Example: "01/01/2025 10:45"
                parsedDate = parse(t['วัน-เวลา'], 'dd/MM/yyyy HH:mm', new Date());
            } else if (t['วันที่']) {
                parsedDate = parse(t['วันที่'], 'dd/MM/yyyy', new Date());
            }
            if (isNaN(parsedDate?.getTime() || NaN)) {
                parsedDate = null; // invalid date
            }
        } catch (e) {
            parsedDate = null;
        }

        // 3. Parse numerics safely
        const netRevenue = parseThaiNumber(t['ยอดชำระสุทธิ']);
        const durationMinutes = parseThaiNumber(t['เวลาบริการ']);
        const quantity = parseThaiNumber(t['จำนวนรายการทั้งหมด']);
        const cashPayment = parseThaiNumber(t['เงินสด']);
        const transferPayment = parseThaiNumber(t['เงินโอน']);
        const creditCardPayment = parseThaiNumber(t['บัตรเครดิต']);

        return {
            ...t,
            parsedDate,
            itemType,
            netRevenue,
            durationMinutes,
            quantity,
            cashPayment,
            transferPayment,
            creditCardPayment,
        };
    });
};

export const aggregateProducts = (rawTransactions: RawTransaction[]): ProductSummary[] => {
    // The CSV has an appended summary table at the bottom.
    // Because PapaParse uses the first row as headers, the summary table at the bottom:
    // "กลุ่มบริการ,บริการ,จำนวน,ราคาขาย,"
    // gets mapped to the headers:
    // "รหัสการจอง" -> "กลุ่มบริการ"
    // "วันที่" -> "บริการ"
    // "เวลา" -> "จำนวน"
    // "วัน-เวลา" -> "ราคาขาย"

    const products: ProductSummary[] = [];

    // Find the start of the summary table
    let isSummaryTable = false;

    for (const row of rawTransactions) {
        // The header row of the embedded table
        if (row['รหัสการจอง'] === 'กลุ่มบริการ' && row['วันที่'] === 'บริการ') {
            isSummaryTable = true;
            continue;
        }

        if (isSummaryTable) {
            // Stop if we hit an empty row or another table
            if (!row['รหัสการจอง']) {
                if (products.length > 0) {
                    continue; // Skip empty rows, but keep going in case there's more
                }
            }

            const category = row['รหัสการจอง'];
            const itemName = row['วันที่'];
            const qtyStr = row['เวลา'];
            const revenueStr = row['วัน-เวลา'];

            // Identify products: either category is "สินค้าขาย", or it matches our product master list
            const cleanName = itemName ? itemName.trim().toLowerCase() : '';
            const isProductMatch = MASTER_PRODUCTS.some(p => cleanName.includes(p));

            if (category === 'สินค้าขาย' || isProductMatch) {
                const quantity = parseInt(qtyStr || '0', 10);
                const revenue = parseFloat((revenueStr || '0').replace(/,/g, ''));

                if (!isNaN(quantity) && quantity > 0) {
                    // Check if already exists (like "ลิปมู" which might appear twice)
                    const existing = products.find(p => p.productName === itemName);
                    if (existing) {
                        existing.quantitySold += quantity;
                        existing.totalRevenue += revenue;
                    } else {
                        products.push({
                            productName: itemName,
                            quantitySold: quantity,
                            totalRevenue: revenue
                        });
                    }
                }
            }
        }
    }

    return products.sort((a, b) => b.quantitySold - a.quantitySold);
};
