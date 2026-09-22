# ลงชื่อปฏิบัติงานคณะกรรมการ

เว็บเดียว ไม่มีขั้นตอน build — เปิด `index.html` ตรงๆ ก็ใช้ได้ ใช้ **Firebase
(Firestore)** แผนฟรี (Spark) เป็นฐานข้อมูล ไม่ต้องผูกบัตรเครดิต และแยกจาก
Supabase ของโปรเจกต์อื่นโดยสิ้นเชิง

## 1. สร้าง Firebase project (ทำเอง — ผู้ช่วยสร้างบัญชีให้ไม่ได้)

1. ไปที่ https://console.firebase.google.com แล้วล็อกอินด้วย Google account
2. กด **Add project** ตั้งชื่อ เช่น `committee-schedule` ปิด Google Analytics
   ก็ได้ (ไม่จำเป็น) แล้วกด Create
3. ในเมนูซ้าย ไปที่ **Build → Firestore Database** กด **Create database**
   เลือก location ใกล้ๆ (เช่น `asia-southeast1`) แล้วเริ่มด้วยโหมดใดก็ได้
   (rules จะถูกแทนที่ในขั้นตอนถัดไป)
4. แท็บ **Rules** ของ Firestore วางเนื้อหาทั้งหมดจากไฟล์ [`firestore.rules`](firestore.rules)
   ของโปรเจกต์นี้ทับของเดิม แล้วกด **Publish**
5. กลับไปหน้า Project overview กดไอคอน **`</>`** (Add app → Web) ตั้งชื่อ
   อะไรก็ได้ ไม่ต้องติ๊ก Firebase Hosting กด Register app
6. คัดลอกค่าใน `firebaseConfig` ที่ขึ้นมา (apiKey, projectId, ...) มาแทนที่
   ค่าใน [`firebase-config.js`](firebase-config.js) ของโปรเจกต์นี้ — ค่าพวกนี้
   ไม่ใช่ความลับ ใส่ในโค้ดที่ public ได้ปกติ การป้องกันข้อมูลทำผ่าน
   `firestore.rules` ที่วางไว้ในข้อ 4 แล้ว

## 2. ทดสอบในเครื่อง

```bash
npx serve .
```

แล้วเปิดลิงก์ที่ขึ้นมา (หรือเปิด `index.html` ตรงๆ ก็ได้ แต่บาง browser
บล็อก ES module จาก `file://` ให้ใช้ `npx serve` แทน)

## 3. Deploy ด้วย GitHub Pages (ฟรี)

1. สร้าง repo ใหม่บน GitHub แล้ว push โค้ดโฟลเดอร์นี้ขึ้นไป
2. ใน repo → **Settings → Pages** → Source เลือก **Deploy from a branch**
   → Branch เลือก `main` / `(root)` → Save
3. รอสักครู่ ลิงก์เว็บจะขึ้นที่ด้านบนของหน้านั้น (รูปแบบ
   `https://<username>.github.io/<repo>/`)

## กติกาที่ตั้งไว้

- 13 วัน × 6 ช่วงเวลา (9.00–16.00 เว้น 12.00–13.00) ช่วงละ 2 คน — แก้ได้ที่
  [`duty-slots.js`](duty-slots.js)
- จำนวนที่นั่งสูงสุดต่อช่วงถูกบังคับโดย **Firestore rules เอง** (ไม่ใช่แค่
  โค้ดฝั่งเว็บ) เพราะแต่ละที่นั่งผูกกับ document id ที่ตายตัว เขียนซ้ำไม่ได้
  — สองคนกดพร้อมกันในช่องสุดท้ายก็ไม่มีทางได้ 3 คน
- **ไม่มีระบบล็อกอิน** ใครมีลิงก์ก็ลงชื่อและกด "ยกเลิก" ชื่อคนอื่นได้ เหมาะกับ
  กลุ่มกรรมการที่ไว้ใจกันเอง ถ้าต้องการกันตรงนี้ในอนาคตต้องเพิ่มระบบล็อกอิน
  (Firebase Auth) และแก้ rules ให้เช็คสิทธิ์
- อัปเดตแบบเรียลไทม์ — ไม่ต้องรีเฟรชหน้าก็เห็นชื่อที่คนอื่นเพิ่งลง (ต่างจาก
  เวอร์ชัน Supabase ก่อนหน้าที่ต้องรีเฟรชเอง)
