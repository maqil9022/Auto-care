// Mock data for the entire Auto Lab 360 system
// In production, this would come from the PostgreSQL API

export const STATS = {
  todayAppointments: 14,
  activeJobs: 7,
  monthlyRevenue: 18640,
  totalVehicles: 342,
  pendingInvoices: 9,
  lowStockParts: 3,
  totalEmployees: 18,
  availableTechs: 5,
};

export const APPOINTMENTS = [
  { id: 'APT-001', customer: 'Ahmed Al-Rashid',  vehicle: 'Toyota Corolla 2021',   plate: 'ABC-1234', service: 'Full Service & Lube',     date: '2026-09-26', time: '09:00', status: 'confirmed',  tech: 'Mohamed Hassan',  est: 120, cost: 85 },
  { id: 'APT-002', customer: 'Sara Khalid',       vehicle: 'Honda Civic 2022',      plate: 'XYZ-5678', service: 'Computer Diagnostics',   date: '2026-09-26', time: '10:30', status: 'in_progress', tech: 'Ali Sayed',       est: 45,  cost: 40 },
  { id: 'APT-003', customer: 'James Okonkwo',     vehicle: 'Ford F-150 2020',       plate: 'JKL-9012', service: 'Brake & Suspension',     date: '2026-09-26', time: '11:00', status: 'pending',     tech: null,              est: 90,  cost: 120 },
  { id: 'APT-004', customer: 'Fatima Nasser',     vehicle: 'BMW 3 Series 2023',     plate: 'MNO-3456', service: 'AC Service',             date: '2026-09-26', time: '13:00', status: 'confirmed',  tech: 'Yusuf Ali',       est: 60,  cost: 55 },
  { id: 'APT-005', customer: 'David Mensah',      vehicle: 'Hyundai Tucson 2021',   plate: 'PQR-7890', service: 'Wheel Alignment',        date: '2026-09-26', time: '14:00', status: 'pending',     tech: null,              est: 45,  cost: 45 },
  { id: 'APT-006', customer: 'Layla Ibrahim',     vehicle: 'Nissan Altima 2022',    plate: 'STU-1234', service: 'Car Wash & Detailing',   date: '2026-09-26', time: '15:30', status: 'confirmed',  tech: 'Kwame Asante',    est: 45,  cost: 25 },
  { id: 'APT-007', customer: 'Omar Farouq',       vehicle: 'Mercedes C200 2023',    plate: 'VWX-5678', service: 'Full Detail Package',    date: '2026-09-27', time: '09:00', status: 'pending',     tech: null,              est: 180, cost: 80 },
  { id: 'APT-008', customer: 'Priya Sharma',      vehicle: 'Kia Sportage 2020',     plate: 'YZA-9012', service: 'Oil Change',             date: '2026-09-27', time: '10:00', status: 'confirmed',  tech: 'Mohamed Hassan',  est: 30,  cost: 25 },
];

export const SERVICE_JOBS = [
  { id: 'JOB-2026-00042', appt: 'APT-002', vehicle: 'Honda Civic 2022', plate: 'XYZ-5678', customer: 'Sara Khalid',    service: 'OBD Diagnostic Scan',      tech: 'Ali Sayed',       status: 'in_progress', start: '10:30', mileage: 34200, labor: 40, parts: 0,   total: 40  },
  { id: 'JOB-2026-00041', appt: 'APT-001', vehicle: 'Toyota Corolla 2021', plate: 'ABC-1234', customer: 'Ahmed Al-Rashid', service: 'Full Service',          tech: 'Mohamed Hassan',  status: 'completed',   start: '09:00', mileage: 28500, labor: 85, parts: 22,  total: 107 },
  { id: 'JOB-2026-00040', appt: null,       vehicle: 'Audi A4 2022',     plate: 'BCD-2345', customer: 'Hamid Azizi',    service: 'Brake Disc Replacement',   tech: 'Yusuf Ali',       status: 'completed',   start: '08:00', mileage: 51000, labor: 120, parts: 85,  total: 205 },
  { id: 'JOB-2026-00039', appt: null,       vehicle: 'Suzuki Baleno',    plate: 'CDE-3456', customer: 'Grace Addo',     service: 'AC Full Service',          tech: 'Ali Sayed',       status: 'on_hold',     start: '14:00', mileage: 42000, labor: 120, parts: 60,  total: 180 },
  { id: 'JOB-2026-00038', appt: null,       vehicle: 'Lexus RX 2021',    plate: 'DEF-4567', customer: 'Hassan Murad',   service: 'Wheel Alignment + Balancing', tech: 'Kwame Asante', status: 'queued',      start: null,    mileage: 19800, labor: 75, parts: 0,   total: 75  },
];

export const EMPLOYEES = [
  { id: 'EMP-001', name: 'Tariq Mansoor',   role: 'General Manager',   dept: 'Management', type: 'full_time', salary: 4500, hire: '2018-03-01', status: 'active', phone: '+966501234567', email: 'tariq@autolab360.com' },
  { id: 'EMP-002', name: 'Mohamed Hassan',  role: 'Senior Technician', dept: 'Workshop',   type: 'full_time', salary: 2200, hire: '2019-06-15', status: 'active', phone: '+966502345678', email: 'mhassan@autolab360.com' },
  { id: 'EMP-003', name: 'Ali Sayed',       role: 'Technician',        dept: 'Workshop',   type: 'full_time', salary: 1800, hire: '2021-01-10', status: 'active', phone: '+966503456789', email: 'asayed@autolab360.com' },
  { id: 'EMP-004', name: 'Yusuf Ali',       role: 'Technician',        dept: 'Workshop',   type: 'full_time', salary: 1800, hire: '2022-04-20', status: 'active', phone: '+966504567890', email: 'yali@autolab360.com' },
  { id: 'EMP-005', name: 'Kwame Asante',    role: 'Junior Technician', dept: 'Workshop',   type: 'full_time', salary: 1400, hire: '2023-08-01', status: 'active', phone: '+966505678901', email: 'kasante@autolab360.com' },
  { id: 'EMP-006', name: 'Nadia Khalil',    role: 'Receptionist',      dept: 'Front Desk', type: 'full_time', salary: 1600, hire: '2020-11-15', status: 'active', phone: '+966506789012', email: 'nkhalil@autolab360.com' },
  { id: 'EMP-007', name: 'Aisha Bello',     role: 'Service Advisor',   dept: 'Front Desk', type: 'full_time', salary: 1900, hire: '2021-07-01', status: 'active', phone: '+966507890123', email: 'abello@autolab360.com' },
  { id: 'EMP-008', name: 'Samira Osei',     role: 'HR Manager',        dept: 'Management', type: 'full_time', salary: 3000, hire: '2019-02-01', status: 'active', phone: '+966508901234', email: 'sosei@autolab360.com' },
  { id: 'EMP-009', name: 'Faisal Rahman',   role: 'Accountant',        dept: 'Accounts',   type: 'full_time', salary: 2500, hire: '2020-05-10', status: 'active', phone: '+966509012345', email: 'frahman@autolab360.com' },
  { id: 'EMP-010', name: 'Kofi Mensah',     role: 'Store Keeper',      dept: 'Stores',     type: 'full_time', salary: 1500, hire: '2022-09-01', status: 'on_leave', phone: '+966500123456', email: 'kmensah@autolab360.com' },
];

export const PAYROLL = [
  { id: 'PR-001', employee: 'EMP-002', name: 'Mohamed Hassan', period: 'September 2026', basic: 2200, overtime: 4.5, otRate: 20, allowances: 400,  deductions: 220, status: 'approved' },
  { id: 'PR-002', employee: 'EMP-003', name: 'Ali Sayed',       period: 'September 2026', basic: 1800, overtime: 6,   otRate: 18, allowances: 350,  deductions: 180, status: 'draft' },
  { id: 'PR-003', employee: 'EMP-004', name: 'Yusuf Ali',       period: 'September 2026', basic: 1800, overtime: 2,   otRate: 18, allowances: 350,  deductions: 180, status: 'draft' },
  { id: 'PR-004', employee: 'EMP-005', name: 'Kwame Asante',    period: 'September 2026', basic: 1400, overtime: 0,   otRate: 14, allowances: 250,  deductions: 140, status: 'draft' },
  { id: 'PR-005', employee: 'EMP-006', name: 'Nadia Khalil',    period: 'September 2026', basic: 1600, overtime: 3,   otRate: 16, allowances: 300,  deductions: 160, status: 'paid'  },
];

export const PARTS = [
  { id: 1, partNo: 'OIL-5W30-4L',  name: '5W-30 Engine Oil (4L)',     category: 'Oils & Fluids',    stock: 22, reorder: 10, unit: 'bottle', cost: 18, price: 28, supplier: 'Gulf Lubricants' },
  { id: 2, partNo: 'FLT-OIL-001',  name: 'Oil Filter — Universal',    category: 'Filters',          stock: 35, reorder: 15, unit: 'pcs',    cost: 4,  price: 9,  supplier: 'Al-Furat Parts' },
  { id: 3, partNo: 'BRK-PAD-F01',  name: 'Front Brake Pads (pair)',   category: 'Brakes',           stock: 8,  reorder: 8,  unit: 'pair',   cost: 25, price: 55, supplier: 'Brembo MENA' },
  { id: 4, partNo: 'BRK-PAD-R01',  name: 'Rear Brake Pads (pair)',    category: 'Brakes',           stock: 4,  reorder: 8,  unit: 'pair',   cost: 22, price: 50, supplier: 'Brembo MENA' },
  { id: 5, partNo: 'AC-REFR-134A', name: 'AC Refrigerant R-134a',     category: 'AC & Cooling',     stock: 12, reorder: 6,  unit: 'can',    cost: 12, price: 22, supplier: 'CoolMax Arabia' },
  { id: 6, partNo: 'FLT-AIR-002',  name: 'Air Filter — Standard',     category: 'Filters',          stock: 2,  reorder: 10, unit: 'pcs',    cost: 6,  price: 14, supplier: 'Al-Furat Parts' },
  { id: 7, partNo: 'BRK-DISC-F01', name: 'Front Brake Disc',          category: 'Brakes',           stock: 6,  reorder: 4,  unit: 'pcs',    cost: 55, price: 110,supplier: 'Brembo MENA' },
  { id: 8, partNo: 'SPARK-NGK-01', name: 'Spark Plugs NGK (set of 4)',category: 'Engine',           stock: 14, reorder: 6,  unit: 'set',    cost: 18, price: 38, supplier: 'NGK Arabia' },
  { id: 9, partNo: 'COOL-FLUID-5L',name: 'Coolant Fluid 5L',          category: 'Oils & Fluids',    stock: 3,  reorder: 5,  unit: 'bottle', cost: 10, price: 20, supplier: 'Gulf Lubricants' },
  { id: 10,partNo: 'WIPER-STD-24', name: 'Wiper Blade 24" Standard',  category: 'Exterior',         stock: 18, reorder: 8,  unit: 'pcs',    cost: 5,  price: 12, supplier: 'Clear View' },
];

export const INVOICES = [
  { id: 'INV-001', invoiceNo: 'INV-2026-00041', customer: 'Ahmed Al-Rashid', job: 'JOB-2026-00041', date: '2026-09-26', due: '2026-09-26', subtotal: 107, discount: 0, tax: 5, total: 112.35, paid: 112.35, status: 'paid',    method: 'card' },
  { id: 'INV-002', invoiceNo: 'INV-2026-00040', customer: 'Hamid Azizi',     job: 'JOB-2026-00040', date: '2026-09-25', due: '2026-09-25', subtotal: 205, discount: 10, tax: 5, total: 203.25, paid: 100,    status: 'partially_paid', method: 'cash' },
  { id: 'INV-003', invoiceNo: 'INV-2026-00039', customer: 'Grace Addo',      job: 'JOB-2026-00039', date: '2026-09-24', due: '2026-09-24', subtotal: 180, discount: 0, tax: 5, total: 189,    paid: 0,      status: 'overdue', method: null   },
  { id: 'INV-004', invoiceNo: 'INV-2026-00038', customer: 'Sara Khalid',     job: 'JOB-2026-00042', date: '2026-09-26', due: '2026-09-26', subtotal: 40,  discount: 0, tax: 5, total: 42,     paid: 0,      status: 'draft',   method: null   },
];

export const REVENUE_DATA = [
  { month: 'Apr', revenue: 12400, jobs: 98 },
  { month: 'May', revenue: 14200, jobs: 112 },
  { month: 'Jun', revenue: 13800, jobs: 108 },
  { month: 'Jul', revenue: 15600, jobs: 125 },
  { month: 'Aug', revenue: 17200, jobs: 138 },
  { month: 'Sep', revenue: 18640, jobs: 142 },
];

export const SERVICES_REVENUE = [
  { name: 'Full Service & Lube',         revenue: 5800, jobs: 68,  color: '#ff7a00' },
  { name: 'Computer Diagnostics',        revenue: 2100, jobs: 52,  color: '#7c3aed' },
  { name: 'Brake & Suspension',          revenue: 4600, jobs: 38,  color: '#f59e0b' },
  { name: 'AC Service & Repair',         revenue: 3200, jobs: 27,  color: '#10b981' },
  { name: 'Wheel Alignment & Balancing', revenue: 1940, jobs: 43,  color: '#ef4444' },
  { name: 'Car Wash & Detailing',        revenue: 1000, jobs: 100, color: '#22d3ee' },
];

export const ATTENDANCE_TODAY = [
  { emp: 'EMP-002', name: 'Mohamed Hassan',  checkIn: '08:02', checkOut: null,    status: 'present',  ot: 0 },
  { emp: 'EMP-003', name: 'Ali Sayed',        checkIn: '08:35', checkOut: null,    status: 'late',     ot: 0 },
  { emp: 'EMP-004', name: 'Yusuf Ali',        checkIn: '07:58', checkOut: null,    status: 'present',  ot: 0 },
  { emp: 'EMP-005', name: 'Kwame Asante',     checkIn: '08:01', checkOut: null,    status: 'present',  ot: 0 },
  { emp: 'EMP-006', name: 'Nadia Khalil',     checkIn: '08:00', checkOut: null,    status: 'present',  ot: 0 },
  { emp: 'EMP-007', name: 'Aisha Bello',      checkIn: '08:05', checkOut: null,    status: 'present',  ot: 0 },
  { emp: 'EMP-010', name: 'Kofi Mensah',      checkIn: null,    checkOut: null,    status: 'on_leave', ot: 0 },
];

export const SERVICES_CATALOG = [
  { id: 1, name: 'Full Service (Oil, Filter, Fluids)', category: 'General Service', price: 85, duration: 120, desc: 'Complete engine check, synthetic oil replacement, filter swap & 25-point vehicle inspection' },
  { id: 2, name: 'Standard Oil & Filter Change', category: 'General Service', price: 35, duration: 45, desc: 'High-grade motor oil and OEM filter replacement' },
  { id: 3, name: 'OBD Diagnostic Scan', category: 'Diagnostics', price: 40, duration: 45, desc: 'Comprehensive ECU fault code readout and sensor testing' },
  { id: 4, name: 'Full System Electronic Scan', category: 'Diagnostics', price: 70, duration: 90, desc: 'Deep module scanning across ABS, transmission, powertrain and airbags' },
  { id: 5, name: 'Brake Pad Replacement (Front)', category: 'Brakes & Suspension', price: 60, duration: 60, desc: 'Premium ceramic pads installation and caliper servicing' },
  { id: 6, name: 'Brake Disc & Rotor Replacement', category: 'Brakes & Suspension', price: 120, duration: 90, desc: 'Front or rear rotor replacement with precision bedding-in' },
  { id: 7, name: 'AC Regas (Refrigerant Top-up)', category: 'AC & Climate', price: 55, duration: 45, desc: 'R134a refrigerant replenishment with UV dye leak check' },
  { id: 8, name: 'AC Complete Overhaul & Sanitization', category: 'AC & Climate', price: 120, duration: 120, desc: 'Evaporator antibacterial cleaning, cabin filter and compressor performance check' },
  { id: 9, name: 'Four-Wheel Laser Alignment', category: 'Tyres & Alignment', price: 45, duration: 45, desc: 'Precision digital laser alignment for camber, caster and toe' },
  { id: 10, name: 'Alignment + Dynamic Balancing', category: 'Tyres & Alignment', price: 75, duration: 60, desc: 'Full alignment package plus high-speed wheel balancing on all 4 wheels' },
  { id: 11, name: 'Full Detail Package', category: 'Wash & Detailing', price: 80, duration: 180, desc: 'Exterior hand wash, clay bar, wax polish, engine bay steam & interior shampoo' },
  { id: 12, name: 'Basic Interior & Exterior Wash', category: 'Wash & Detailing', price: 25, duration: 45, desc: 'Foam wash, rim cleaning, interior vacuum and glass cleaning' },
];

