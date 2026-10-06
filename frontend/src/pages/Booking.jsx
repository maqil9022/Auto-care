import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Car, CheckCircle2, ChevronRight,
  ShieldCheck, Search, Sparkles, Wrench, Award, Check,
  Star, ChevronDown, Cpu, AlertCircle, Printer, UserCheck, UserPlus, Phone, MessageSquare, MapPin, Mail
} from 'lucide-react';
import { SERVICES_CATALOG, APPOINTMENTS } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import BookingDetailsModal from '../components/BookingDetailsModal';
import { sanitizeSriLankanPhone, generateWhatsAppLink } from '../utils/phoneSanitizer';

const TIME_SLOTS = [
  '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

function getStoredCustomers() {
  try {
    const d = JSON.parse(localStorage.getItem('autolab_customers') || '[]');
    if (d && d.length > 0) return d;
  } catch {}
  return [];
}

// Rich job description details for "What We Do"
const DETAILED_JOBS = [
  {
    id: 1,
    name: 'Full Service (Oil, Filter, Fluids)',
    category: 'General Maintenance',
    price: 85,
    duration: 120,
    tag: 'Most Popular',
    summary: 'Comprehensive 25-point inspection, synthetic motor oil change, filter replacement, and complete fluid renewal.',
    details: [
      'Full synthetic high-grade motor oil replacement (up to 4.5L)',
      'OEM certified oil filter replacement with torque validation',
      'Engine air filter & cabin pollen filter inspection & cleaning',
      'Brake fluid, steering fluid, and coolant concentration audit',
      '25-point computerized safety inspection (belts, hoses, suspension, exhaust)',
      'Digital health inspection report delivered to your phone'
    ]
  },
  {
    id: 2,
    name: 'OBD-II Diagnostic Scan & ECU Analysis',
    category: 'Computer Diagnostics',
    price: 40,
    duration: 45,
    tag: 'Dealership Grade',
    summary: 'Deep electronic scan using advanced telemetry tools to read, diagnose, and resolve engine check lights and sensor glitches.',
    details: [
      'Comprehensive scan across all ECU, TCU, ABS, and SRS safety modules',
      'Live engine sensor telemetry analysis (fuel trim, O2 sensors, MAF sensor)',
      'Identification of active and historical trouble codes (DTCs)',
      'Throttle body adaptation and sensor calibration',
      'Electronic fault reset and road-test verification'
    ]
  },
  {
    id: 3,
    name: 'Brake Pad Replacement & Rotor Servicing',
    category: 'Braking & Safety',
    price: 60,
    duration: 60,
    tag: 'Safety Critical',
    summary: 'Precision braking overhaul using high-temperature ceramic pads, rotor thickness measurement, and hydraulic caliper tuning.',
    details: [
      'Installation of premium low-dust ceramic brake pads (front or rear)',
      'Rotor run-out and thickness measurement against factory tolerances',
      'Caliper slide pin degreasing and synthetic high-temp lubrication',
      'Brake line inspection for micro-cracks or fluid weeping',
      'Bedding-in procedure for smooth, silent, and instant stopping power'
    ]
  },
  {
    id: 4,
    name: 'AC Regas & Complete Climate Overhaul',
    category: 'Climate & Comfort',
    price: 55,
    duration: 45,
    tag: 'Fast Service',
    summary: 'Recover old refrigerant, evacuate moisture, refill R-134a eco refrigerant, and test compressor head pressure.',
    details: [
      'Deep vacuum system evacuation to remove harmful moisture and air',
      'UV fluorescent dye injection to highlight hairline refrigerant leaks',
      'Precision digital recharge of R-134a refrigerant and PAG compressor oil',
      'Evaporator vent temperature audit (targets 4°C - 7°C output)',
      'Cabin air sanitization to eliminate bacteria and foul mold odors'
    ]
  },
  {
    id: 5,
    name: 'Four-Wheel Laser Alignment & Balancing',
    category: 'Tyres & Dynamics',
    price: 75,
    duration: 60,
    tag: 'Fuel Economy',
    summary: 'High-precision 3D digital laser alignment with dynamic high-speed wheel balancing to eliminate steering pull and vibration.',
    details: [
      '3D digital camera optical scanning of front and rear toe, camber, and caster',
      'Suspension geometry alignment to exact factory OEM specifications',
      'Computerized dynamic spin balancing for all 4 alloy rims with zinc weights',
      'Tire tread depth analysis and irregular wear pattern diagnostic',
      'Post-alignment highway stability and steering center verification'
    ]
  },
  {
    id: 6,
    name: 'Full Detail & Ceramic Protective Wash',
    category: 'Detail & Cosmetics',
    price: 80,
    duration: 180,
    tag: 'Showroom Finish',
    summary: 'Multi-stage foam wash, clay bar paint decontamination, high-gloss synthetic sealant, and interior steam deep clean.',
    details: [
      'Touchless pH-neutral pre-foam bath followed by two-bucket grit guard wash',
      'Wheels, brake caliper barrels, and wheel arch deep cleaning',
      'Surface clay bar decontamination to remove embedded industrial fallout',
      'Ultra high-gloss polymer paint sealant application for 3-month protection',
      'Interior antibacterial vacuuming, steam disinfection, and dashboard conditioning',
      'Engine bay dust removal, degreasing, and satin dressing'
    ]
  }
];

function loadBookingServices() {
  try {
    const stored = localStorage.getItem('autolab_services');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(s => s.is_active !== 0);
      }
    }
  } catch {}
  return SERVICES_CATALOG.filter(s => s.is_active !== 0);
}

export default function Booking() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'book' | 'lookup'
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Dynamic service offerings loaded from local storage / API
  const [catalogServices, setCatalogServices] = useState(loadBookingServices);

  // Multi-job Selection State (array of selected service objects)
  const [selectedServices, setSelectedServices] = useState(() => [loadBookingServices()[0] || SERVICES_CATALOG[0]]);
  
  const [bookingDate, setBookingDate] = useState('2026-09-28');
  const [bookingTime, setBookingTime] = useState('09:30 AM');

  // Customer Type State in Booking form: 'returning' | 'new'
  const [customerMode, setCustomerMode] = useState('returning');
  const [custLookupPhone, setCustLookupPhone] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState(null);
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [isNewVehicleForCustomer, setIsNewVehicleForCustomer] = useState(false);
  const [autoRegister, setAutoRegister] = useState(true);

  const [vehicle, setVehicle] = useState({
    make: 'Toyota',
    model: 'Camry',
    year: '2022',
    plate: '',
    fuel: 'petrol'
  });
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [viewingModalBooking, setViewingModalBooking] = useState(null);
  const [hoveredAboutCard, setHoveredAboutCard] = useState(null);

  // Toast notifications hook
  const toast = useToast();

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);

  // Sync services catalog with backend API & localStorage events
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const res = await api.services.getAll({ active_only: true });
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const map = new Map();
          loadBookingServices().forEach(s => map.set(Number(s.id), s));
          res.forEach(s => map.set(Number(s.id), {
            ...s,
            id: Number(s.id),
            price: Number(s.price),
            duration: Number(s.duration),
            is_active: s.is_active !== undefined ? s.is_active : 1
          }));
          const activeList = Array.from(map.values()).filter(s => s.is_active !== 0);
          setCatalogServices(activeList);
        }
      } catch (e) {
        console.warn('API services fetch error in booking:', e);
      }
    };
    fetchServices();

    const handleServicesUpdate = () => {
      setCatalogServices(loadBookingServices());
    };
    window.addEventListener('autolab_services_updated', handleServicesUpdate);
    window.addEventListener('storage', handleServicesUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('autolab_services_updated', handleServicesUpdate);
      window.removeEventListener('storage', handleServicesUpdate);
    };
  }, []);

  const categories = ['All', ...new Set(catalogServices.map(s => s.category).filter(Boolean))];

  const filteredServices = categoryFilter === 'All'
    ? catalogServices
    : catalogServices.filter(s => s.category === categoryFilter);

  const toggleService = (srv) => {
    if (selectedServices.some(s => s.id === srv.id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s.id !== srv.id));
        toast.info('Service Removed', `${srv.name} removed from your selection.`);
      } else {
        toast.warning('Selection Required', 'At least one service job must remain selected.');
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
      toast.success('Service Added', `${srv.name} added (Rs. ${srv.price}).`);
    }
  };

  const handleSelectFromDetails = (srvId) => {
    const srv = catalogServices.find(s => s.id === srvId) || catalogServices[0] || SERVICES_CATALOG[0];
    if (!selectedServices.some(s => s.id === srv.id)) {
      setSelectedServices([...selectedServices, srv]);
      toast.success('Service Selected', `${srv.name} added to your booking.`);
    }
    setActiveTab('book');
  };

  const totalCost = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalEstDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

  // Returning Customer Lookup logic
  const handleFindCustomer = (phoneToFind) => {
    const q = (phoneToFind !== undefined ? phoneToFind : custLookupPhone).trim().toLowerCase();
    if (!q) {
      toast.info('Enter Phone or Plate', 'Please enter your mobile phone or plate to find your registered profile.');
      return;
    }

    const allCustomers = getStoredCustomers();
    const found = allCustomers.find(c =>
      (c.phone && c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''))) ||
      c.name.toLowerCase().includes(q) ||
      c.vehicles?.some(v => v.plate && v.plate.toLowerCase().replace(/\s+/g, '').includes(q.replace(/\s+/g, '')))
    );

    if (found) {
      setMatchedCustomer(found);
      setCustomer(prev => ({
        ...prev,
        name: found.name,
        phone: found.phone,
        email: found.email || prev.email,
      }));
      if (found.vehicles && found.vehicles.length > 0) {
        const v = found.vehicles[0];
        setVehicle({
          make: v.make || 'Toyota',
          model: v.model || 'Corolla',
          year: v.year || '2022',
          plate: v.plate || '',
          fuel: v.fuel || 'petrol'
        });
        setSelectedVehicleIdx(0);
        setIsNewVehicleForCustomer(false);
      }
      toast.success('Profile Found', `Welcome back, ${found.name}! Your details have been auto-filled.`);
    } else {
      setMatchedCustomer(null);
      toast.warning('Not Found', 'No registered profile found matching that number. You can fill the form to register as a new customer.');
    }
  };

  const handleSelectCustVehicle = (idx) => {
    if (idx === '__new__') {
      setIsNewVehicleForCustomer(true);
      setVehicle({ make: '', model: '', year: '2023', plate: '', fuel: 'petrol' });
    } else {
      setIsNewVehicleForCustomer(false);
      setSelectedVehicleIdx(Number(idx));
      const v = matchedCustomer?.vehicles?.[Number(idx)];
      if (v) {
        setVehicle({
          make: v.make || '',
          model: v.model || '',
          year: v.year || '2022',
          plate: v.plate || '',
          fuel: v.fuel || 'petrol'
        });
      }
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!customer.name.trim()) errors.name = true;
    if (!customer.phone.trim()) errors.phone = true;
    if (!vehicle.make.trim()) errors.make = true;
    if (!vehicle.model.trim()) errors.model = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.warning(
        'Required Details Missing',
        'Please enter your vehicle make, model, full name, and mobile phone number.'
      );
      setTimeout(() => {
        const firstInput = document.getElementById(
          errors.name ? 'booking-cust-name' : errors.phone ? 'booking-cust-phone' : 'booking-veh-make'
        );
        if (firstInput) {
          firstInput.focus();
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setFieldErrors({});

    // If new customer and autoRegister checked, register them in database
    if (customerMode === 'new' && autoRegister && customer.name.trim()) {
      try {
        const stored = getStoredCustomers();
        const alreadyExists = stored.some(c => c.phone === customer.phone.trim());
        if (!alreadyExists) {
          const newCust = {
            id: `CUS-${Math.floor(100 + Math.random() * 900)}`,
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            email: customer.email.trim() || null,
            address: 'SA',
            notes: customer.notes.trim() || 'Self-registered via Customer Booking Portal',
            tag: 'new',
            joined: new Date().toISOString().slice(0, 10),
            vehicles: [{
              id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
              make: vehicle.make.trim(),
              model: vehicle.model.trim(),
              year: vehicle.year.trim() || '2022',
              plate: vehicle.plate.trim() || 'Pending check-in',
              color: 'Standard',
              fuel: vehicle.fuel || 'Petrol',
              mileage: 0
            }]
          };
          localStorage.setItem('autolab_customers', JSON.stringify([newCust, ...stored]));
          window.dispatchEvent(new CustomEvent('autolab_customers_updated', { detail: newCust }));
          toast.success('Customer Registered', `Welcome to Auto Lab 360, ${customer.name.trim()}! You are now a registered client.`);
        }
      } catch (err) {}
    }

    let newRef = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      id: newRef,
      customer: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email ? customer.email.trim() : null,
      vehicle: `${vehicle.make.trim()} ${vehicle.model.trim()} (${vehicle.year || '2022'})`,
      plate: vehicle.plate.trim() || 'Pending check-in',
      service: selectedServices.map(s => s.name).join(', '),
      date: bookingDate,
      time: bookingTime,
      status: 'pending', // Public bookings start in pending queue for workshop staff to assign tech & confirm
      tech: null,
      est: totalEstDuration,
      cost: totalCost,
      notes: customer.notes ? customer.notes.trim() : null,
    };

    // 1. Try API booking if backend is active
    try {
      const created = await api.appointments.create(payload);
      if (created?.id) {
        newRef = created.id;
        payload.id = created.id;
      }
    } catch (err) {
      console.warn('API booking sync failed, using offline reference:', err.message);
    }

    // 2. ALWAYS persist to localStorage and notify all other tabs and views
    try {
      const storedAppts = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
      const filteredStored = storedAppts.filter(a => a.id !== newRef);
      const updatedAppts = [payload, ...filteredStored];
      localStorage.setItem('autolab_appointments', JSON.stringify(updatedAppts));
      window.dispatchEvent(new CustomEvent('autolab_appts_updated', { detail: payload }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to sync appointment to localStorage:', e);
    }

    const result = {
      reference: newRef,
      services: selectedServices,
      date: bookingDate,
      time: bookingTime,
      vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.year || '2022'})`,
      plate: vehicle.plate || 'Pending check-in',
      customerName: customer.name,
      phone: customer.phone,
      total: totalCost,
      status: 'pending'
    };
    setBookingSuccess(result);
    toast.success(
      'Appointment Requested!',
      `Booking ${newRef} queued for ${customer.name}. Workshop advisors will assign a technician and confirm your time slot.`
    );
  };

  const handleLookup = async () => {
    if (!lookupQuery.trim()) {
      toast.info('Search Query Required', 'Please enter a booking code (e.g. APT-001) or license plate.');
      return;
    }
    const query = lookupQuery.toLowerCase().trim();

    try {
      const liveResults = await api.appointments.getAll({ search: query });
      if (liveResults && liveResults.length > 0) {
        setLookupResult(liveResults[0]);
        toast.success('Booking Located', `Found ${liveResults[0].id} for ${liveResults[0].customer} (${liveResults[0].status.toUpperCase()}).`);
        return;
      }
    } catch {}

    const storedAppts = (() => {
      try {
        const stored = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
        const map = new Map();
        APPOINTMENTS.forEach(a => map.set(a.id, a));
        stored.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        return Array.from(map.values());
      } catch {
        return APPOINTMENTS;
      }
    })();

    const found = storedAppts.find(a => 
      a.id.toLowerCase() === query || 
      (a.plate && a.plate.toLowerCase().includes(query)) ||
      (a.customer && a.customer.toLowerCase().includes(query))
    );
    setLookupResult(found || 'not_found');
    if (found) {
      toast.success('Booking Located', `Found ${found.id} for ${found.customer} (${found.status.toUpperCase()}).`);
    } else {
      toast.warning('No Match Found', `No active booking found matching "${lookupQuery.trim()}".`);
    }
  };

  return (
    <div>
      {/* Top Portal Navigation Tabs */}
      <div className="tabs" style={{ marginTop: 6, marginBottom: 24, position: 'relative', zIndex: 10 }}>
        <button
          className={`tab${activeTab === 'home' ? ' active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Award size={15} /> Overview & About Us
        </button>
        <button
          className={`tab${activeTab === 'book' ? ' active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <Calendar size={15} /> Book Appointment ({selectedServices.length} Job{selectedServices.length > 1 ? 's' : ''})
        </button>
        <button
          className={`tab${activeTab === 'lookup' ? ' active' : ''}`}
          onClick={() => setActiveTab('lookup')}
        >
          <Search size={15} /> Track Booking
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: HOME PAGE / ABOUT US / WHAT WE DO
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Hero Banner with Looping Background Video */}
          <div className="card hero-banner-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.14) 0%, rgba(234, 88, 12, 0.05) 50%, #111216 100%)',
            border: '1px solid var(--border-glow)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 1. Looping Background Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.32,
                filter: 'brightness(0.75) contrast(1.15)',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            >
              <source src="/videos/hero-loop.mp4" type="video/mp4" />
              <source src="/videos/hero-loop.webm" type="video/webm" />
              <source src="/videos/workshop-loop.mp4" type="video/mp4" />
            </video>

            {/* 2. Dark Atmospheric Gradient Overlay for High Contrast */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(12, 14, 20, 0.94) 0%, rgba(12, 14, 20, 0.72) 55%, rgba(12, 14, 20, 0.88) 100%)',
              zIndex: 1,
              pointerEvents: 'none'
            }} />

            {/* 3. Hero Card Content (Headline, Subtitle, Buttons, Metrics) */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ maxWidth: 680 }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(255, 122, 0, 0.15)',
                  color: 'var(--brand-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 14,
                  letterSpacing: 0.5
                }}>
                  <Sparkles size={14} /> AUTO LAB 360 · MOTORSPORT STANDARD WORKSHOP
                </div>
                <h1 style={{ fontSize: 'clamp(20px, 5.5vw, 32px)', fontWeight: 900, lineHeight: 1.25, marginBottom: 12, color: 'var(--text-primary)' }}>
                  Precision Automotive Engineering &amp; Complete Diagnostic Care
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(13px, 3.5vw, 15px)', lineHeight: 1.6, marginBottom: 24 }}>
                  We combine dealership-grade digital diagnostics, certified senior mechanics, transparent pricing in Rs., and 100% genuine OEM parts backed by a comprehensive warranty.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setActiveTab('book')}
                  >
                    <Calendar size={18} /> Book Your Service Now
                  </button>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => {
                      const el = document.getElementById('services-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Explore Detailed Jobs <ChevronDown size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 16,
                marginTop: 32,
                paddingTop: 24,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {[
                  { label: 'Vehicles Serviced', val: '10,000+' },
                  { label: 'Master Technicians', val: '18 Certified' },
                  { label: 'Diagnostic Accuracy', val: '99.8%' },
                  { label: 'Parts Guarantee', val: '6 Months' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-primary)' }}>{stat.val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About Us Section */}
          <div>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="section-title" style={{ fontSize: 20 }}>About Auto Lab 360</div>
                <div className="section-sub">Setting new benchmarks in automotive reliability and client transparency</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {/* Card 1: Diagnostic Tech */}
              <div
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  padding: 0,
                  minHeight: 270,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: hoveredAboutCard === 'tech' ? '1px solid var(--brand-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: hoveredAboutCard === 'tech' ? '0 14px 34px rgba(0, 0, 0, 0.65), 0 0 24px rgba(56, 189, 248, 0.2)' : '0 4px 18px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.35s ease',
                  cursor: 'default'
                }}
                onMouseEnter={() => setHoveredAboutCard('tech')}
                onMouseLeave={() => setHoveredAboutCard(null)}
              >
                {/* Background Image */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('/images/about/diagnostic-tech.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.38) contrast(1.15)',
                    transform: hoveredAboutCard === 'tech' ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.5s ease',
                    zIndex: 0
                  }}
                />
                {/* Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(8, 15, 30, 0.72) 0%, rgba(10, 16, 28, 0.88) 55%, rgba(5, 10, 20, 0.97) 100%)',
                    zIndex: 1
                  }}
                />
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 2, padding: '24px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(255, 122, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 122, 0, 0.45)',
                        color: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}>
                        <Cpu size={22} />
                      </div>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#f8fafc'
                      }}>
                        ECU &amp; Diagnostics
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: 17,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
                    }}>
                      Dealership Diagnostic Tech
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: '#e2e8f0',
                      lineHeight: 1.6,
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
                    }}>
                      Equipped with cutting-edge OBD-II and ECU flashing workstations that pinpoint faults down to individual sensors, preventing unnecessary parts replacements.
                    </p>
                  </div>

                  <div style={{
                    marginTop: 18,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: 'var(--brand-primary)'
                  }}>
                    <span>Digital Sensor Audit</span>
                    <span>✓ Active</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Master Mechanics */}
              <div
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  padding: 0,
                  minHeight: 270,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: hoveredAboutCard === 'mechanics' ? '1px solid var(--brand-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: hoveredAboutCard === 'mechanics' ? '0 14px 34px rgba(0, 0, 0, 0.65), 0 0 24px rgba(255, 122, 0, 0.25)' : '0 4px 18px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.35s ease',
                  cursor: 'default'
                }}
                onMouseEnter={() => setHoveredAboutCard('mechanics')}
                onMouseLeave={() => setHoveredAboutCard(null)}
              >
                {/* Background Image */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('/images/about/mechanics.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.38) contrast(1.15)',
                    transform: hoveredAboutCard === 'mechanics' ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.5s ease',
                    zIndex: 0
                  }}
                />
                {/* Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.72) 0%, rgba(12, 16, 26, 0.88) 55%, rgba(6, 9, 18, 0.97) 100%)',
                    zIndex: 1
                  }}
                />
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 2, padding: '24px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(255, 122, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 122, 0, 0.45)',
                        color: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}>
                        <Wrench size={22} />
                      </div>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#f8fafc'
                      }}>
                        Factory Trained
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: 17,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
                    }}>
                      Certified Master Mechanics
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: '#e2e8f0',
                      lineHeight: 1.6,
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
                    }}>
                      Every technician undergoes rigorous factory training across Japanese, European, American and Hybrid/EV powertrains with zero compromise on safety.
                    </p>
                  </div>

                  <div style={{
                    marginTop: 18,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: 'var(--brand-primary)'
                  }}>
                    <span>18 Certified Specialists</span>
                    <span>✓ On-Site</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Rupees & Transparent Pricing */}
              <div
                className="card"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-md)',
                  padding: 0,
                  minHeight: 270,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: hoveredAboutCard === 'rupees' ? '1px solid var(--brand-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: hoveredAboutCard === 'rupees' ? '0 14px 34px rgba(0, 0, 0, 0.65), 0 0 24px rgba(16, 185, 129, 0.25)' : '0 4px 18px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.35s ease',
                  cursor: 'default'
                }}
                onMouseEnter={() => setHoveredAboutCard('rupees')}
                onMouseLeave={() => setHoveredAboutCard(null)}
              >
                {/* Background Image */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('/images/about/pricing-rupees.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.38) contrast(1.15)',
                    transform: hoveredAboutCard === 'rupees' ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.5s ease',
                    zIndex: 0
                  }}
                />
                {/* Gradient Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(16, 22, 28, 0.72) 0%, rgba(12, 17, 24, 0.88) 55%, rgba(6, 10, 16, 0.97) 100%)',
                    zIndex: 1
                  }}
                />
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 2, padding: '24px 22px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(255, 122, 0, 0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 122, 0, 0.45)',
                        color: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                      }}>
                        <ShieldCheck size={22} />
                      </div>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#f8fafc'
                      }}>
                        Zero Hidden Fees
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: 17,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: '#ffffff',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)'
                    }}>
                      100% Transparent in Rs.
                    </h3>
                    <p style={{
                      fontSize: 13,
                      color: '#e2e8f0',
                      lineHeight: 1.6,
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
                    }}>
                      No surprise charges or unexplained shop fees. You receive a digital estimate in Rs. before work commences, and only pay after inspecting the vehicle.
                    </p>
                  </div>

                  <div style={{
                    marginTop: 18,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: 'var(--brand-primary)'
                  }}>
                    <span>All Pricing in Sri Lankan Rs.</span>
                    <span>✓ Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Workshop Location & Hotline Card */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(20, 24, 33, 0.95) 100%)',
            border: '1px solid var(--border-glow)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(255, 122, 0, 0.15)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={24} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Auto Lab 360 Service Center — Kegalle
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📍 No 787, Kandy Road, Meepitiya, Kegalle
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <Phone size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hotline &amp; WhatsApp</div>
                  <strong style={{ color: 'var(--text-primary)' }}>071-881 8898 / 071-881 8854</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <Mail size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Official Email</div>
                  <strong style={{ color: 'var(--text-primary)' }}>autolab360lk@gmail.com</strong>
                </div>
              </div>
            </div>
          </div>

          {/* What We Do & Detailed Jobs Breakdown */}
          <div id="services-section">
            <div className="section-header" style={{ marginBottom: 18 }}>
              <div>
                <div className="section-title" style={{ fontSize: 20 }}>What We Do — Every Job Described in Detail</div>
                <div className="section-sub">Choose any service below to add it directly to your appointment</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              {DETAILED_JOBS.map(job => (
                <div key={job.id} className="card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        padding: '3px 8px',
                        borderRadius: 10,
                        background: 'rgba(255, 122, 0, 0.12)',
                        color: 'var(--brand-primary)'
                      }}>
                        {job.category}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-warning)' }}>
                        ★ {job.tag}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 8px', color: 'var(--text-primary)' }}>
                      {job.name}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                      {job.summary}
                    </p>

                    <div style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      marginBottom: 16,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        What's Included in This Job:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {job.details.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <Check size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="divider" style={{ margin: '12px 0' }} />
                    <div className="flex justify-between items-center">
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {job.duration} mins
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)' }}>
                          Rs. {job.price}.00
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectFromDetails(job.id)}
                      >
                        + Select for Booking
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews & Trust */}
          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <div className="section-title mb-3" style={{ fontSize: 18 }}>Client Trust & Feedback</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { name: 'Ahmed Al-Rashid', car: 'Toyota Corolla 2021', text: 'Auto Lab 360 fixed my intermittent check-engine light in 40 minutes after two other workshops failed. Full transparent pricing in Rs.!' },
                { name: 'Sara Khalid', car: 'Honda Civic 2022', text: 'Loved selecting multiple jobs in one booking. The workshop lounge is clean, staff are courteous, and the vehicle drives like new.' },
                { name: 'David Mensah', car: 'Hyundai Tucson 2021', text: 'Laser wheel alignment eliminated high-speed steering shake completely. Professional diagnostic printout provided.' },
              ].map((rev, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-1 mb-2" style={{ color: 'var(--brand-warning)' }}>
                    {[...Array(5)].map((_, s) => <Star key={s} size={13} fill="currentColor" />)}
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                    "{rev.text}"
                  </p>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{rev.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rev.car}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BOOKING WIZARD (MULTI-JOB SELECTION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'book' && (
        bookingSuccess ? (
          /* Confirmation Receipt Card */
          <div className="card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: 36 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)', color: 'var(--brand-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={38} />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Appointment Received!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              Your appointment request is registered in the workshop queue. An Auto Lab 360 service advisor will assign a certified technician and confirm your time slot shortly.
            </p>

            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: 22,
              textAlign: 'left',
              marginBottom: 24
            }}>
              <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Booking Reference Code</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--brand-primary)', letterSpacing: 0.5 }}>
                  {bookingSuccess.reference}
                </span>
              </div>
              <div className="divider" style={{ margin: '10px 0' }} />
              
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Selected Jobs ({bookingSuccess.services.length}):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {bookingSuccess.services.map(s => (
                    <span key={s.id} style={{
                      background: 'rgba(255, 122, 0, 0.12)',
                      border: '1px solid var(--brand-primary)',
                      color: 'var(--brand-primary)',
                      padding: '3px 10px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {s.name} (Rs. {s.price})
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, fontSize: 13 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Requested Date & Time</div>
                  <div style={{ fontWeight: 600 }}>{bookingSuccess.date} @ {bookingSuccess.time}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Vehicle Registered</div>
                  <div style={{ fontWeight: 600 }}>{bookingSuccess.vehicle}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Customer</div>
                  <div style={{ fontWeight: 600 }}>{bookingSuccess.customerName}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Total Estimated (in Rs.)</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand-primary)' }}>
                    Rs. {bookingSuccess.total}.00
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(() => {
                const s = bookingSuccess.services ? bookingSuccess.services.map(srv => srv.name).join(', ') : 'Standard Service';
                const msg = `🚗 *Auto Lab 360 - Booking Confirmation* 🇱🇰\n\nDear ${bookingSuccess.customerName || 'Customer'},\nYour appointment *${bookingSuccess.reference}* is confirmed!\n\n📅 *Date:* ${bookingSuccess.date}\n⏰ *Time:* ${bookingSuccess.time}\n🚘 *Vehicle:* ${bookingSuccess.vehicle} (${bookingSuccess.plate || 'N/A'})\n🔧 *Service(s):* ${s}\n💰 *Estimated Total:* Rs. ${bookingSuccess.total}.00\n\n📍 *No 787, Kandy Road, Meepitiya, Kegalle*\n📞 071-881 8898 / 071-881 8854\n✉️ autolab360lk@gmail.com\nThank you for choosing Auto Lab 360!`;
                const waLink = generateWhatsAppLink(bookingSuccess.phone, msg);
                return (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                      background: '#25D366',
                      color: '#fff',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <MessageSquare size={16} /> Open Confirmation in WhatsApp
                  </a>
                );
              })()}
              <button
                className="btn btn-primary"
                onClick={() => setViewingModalBooking({
                  id: bookingSuccess.reference,
                  customer: bookingSuccess.customerName,
                  phone: bookingSuccess.phone,
                  vehicle: bookingSuccess.vehicle,
                  plate: bookingSuccess.plate,
                  services: bookingSuccess.services,
                  date: bookingSuccess.date,
                  time: bookingSuccess.time,
                  cost: bookingSuccess.total,
                  status: 'pending'
                })}
              >
                <Printer size={15} /> View & Print Booking Slip
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('home')}>
                Back to Home
              </button>
              <button className="btn btn-secondary" onClick={() => setBookingSuccess(null)}>
                Book Another Appointment
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Job Booking Form */
          <div className="booking-form-layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Step 1: Multi-Job Selection */}
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">1. Select Services (You can choose more than one job)</div>
                    <div className="section-sub">Pick all the jobs your car needs — prices and duration sum up automatically</div>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255, 122, 0, 0.15)',
                    color: 'var(--brand-primary)',
                    padding: '4px 10px',
                    borderRadius: 14
                  }}>
                    {selectedServices.length} Selected
                  </span>
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: '1px solid',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: categoryFilter === cat ? 'var(--brand-primary)' : '#16181e',
                        color: categoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                        borderColor: categoryFilter === cat ? 'var(--brand-primary)' : 'var(--border-subtle)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Service Cards Grid with Checkbox Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {filteredServices.map(srv => {
                    const isSelected = selectedServices.some(s => s.id === srv.id);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleService(srv)}
                        style={{
                          padding: 14,
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                          background: isSelected ? 'rgba(255, 122, 0, 0.1)' : '#16181e',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 0 14px rgba(255, 122, 0, 0.2)' : 'none'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                              {srv.name}
                            </span>
                            <div style={{
                              width: 18, height: 18, borderRadius: 4,
                              border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--text-muted)'}`,
                              background: isSelected ? 'var(--brand-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 11, flexShrink: 0, marginLeft: 8
                            }}>
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 10 }}>
                            {srv.desc}
                          </p>
                        </div>
                        <div className="flex justify-between items-center" style={{ fontSize: 12, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {srv.duration} mins
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-primary)' }}>
                            Rs. {srv.price}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Date & Slot */}
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">2. Select Date & Preferred Time</div>
                    <div className="section-sub">Workshop operating hours: 08:00 AM - 06:00 PM</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'start' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Service Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={bookingDate}
                      min="2026-09-26"
                      onChange={e => setBookingDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Available Time Slots</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookingTime(slot)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: bookingTime === slot ? 'rgba(255, 122, 0, 0.2)' : '#16181e',
                            color: bookingTime === slot ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            borderColor: bookingTime === slot ? 'var(--brand-primary)' : 'var(--border-subtle)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Vehicle & Contact with Registered Customer Search or New Registration */}
              <div className="card">
                <div className="section-header">
                  <div>
                    <div className="section-title">3. Vehicle & Customer Information</div>
                    <div className="section-sub">Find your registered customer record or register as a new client</div>
                  </div>
                </div>

                {/* Mode Selector */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 6,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 6,
                  marginBottom: 18,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('returning')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: customerMode === 'returning' ? 'var(--brand-primary)' : 'transparent',
                      color: customerMode === 'returning' ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <UserCheck size={16} /> Returning Registered Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('new');
                      setMatchedCustomer(null);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: customerMode === 'new' ? 'var(--brand-primary)' : 'transparent',
                      color: customerMode === 'new' ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <UserPlus size={16} /> First-Time / New Customer
                  </button>
                </div>

                {/* Returning Customer Quick Finder */}
                {customerMode === 'returning' && (
                  <div style={{
                    background: 'rgba(255, 122, 0, 0.05)',
                    border: '1px solid rgba(255, 122, 0, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    marginBottom: 18
                  }}>
                    <label className="form-label" style={{ marginBottom: 6 }}>
                      Find Your Registered Profile (by Mobile Phone or Plate Number)
                    </label>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div className="search-box" style={{ flex: '1 1 200px' }}>
                        <Phone size={14} className="search-icon" />
                        <input
                          type="tel"
                          inputMode="tel"
                          placeholder="e.g. 0771234567 or CAR-1234..."
                          value={custLookupPhone}
                          onChange={e => setCustLookupPhone(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFindCustomer())}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleFindCustomer()}
                        style={{ flex: '0 0 auto' }}
                      >
                        <Search size={14} /> Find Profile
                      </button>
                    </div>

                    {matchedCustomer ? (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle2 size={16} /> Welcome back, {matchedCustomer.name}!
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                            Member #{matchedCustomer.id} &middot; Phone: {matchedCustomer.phone}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--brand-success)',
                          padding: '2px 8px',
                          borderRadius: 10
                        }}>
                          {matchedCustomer.tag?.toUpperCase() || 'VIP'}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        Tip: You can search using demo numbers like <strong>+966501234567</strong> (Ahmed) or <strong>+966502345678</strong> (Sara).
                      </div>
                    )}

                    {matchedCustomer && matchedCustomer.vehicles && matchedCustomer.vehicles.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <label className="form-label">Select Registered Vehicle</label>
                        <select
                          className="form-control"
                          value={isNewVehicleForCustomer ? '__new__' : selectedVehicleIdx}
                          onChange={e => handleSelectCustVehicle(e.target.value)}
                        >
                          {matchedCustomer.vehicles.map((v, i) => (
                            <option key={i} value={i}>
                              {v.make} {v.model} ({v.year || '2021'}) — Plate: {v.plate}
                            </option>
                          ))}
                          <option value="__new__">+ Register a different vehicle for this booking</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Vehicle Details Fields */}
                <div className="form-grid" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle Make <span>*</span></label>
                    <input
                      id="booking-veh-make"
                      className={`form-control ${fieldErrors.make ? 'has-error' : ''}`}
                      placeholder="e.g. Toyota, Honda, Ford"
                      value={vehicle.make}
                      onChange={e => {
                        setVehicle({ ...vehicle, make: e.target.value });
                        if (fieldErrors.make) setFieldErrors(p => ({ ...p, make: false }));
                      }}
                    />
                    {fieldErrors.make && <div className="form-error-hint"><AlertCircle size={12} /> Make is required</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Model <span>*</span></label>
                    <input
                      className={`form-control ${fieldErrors.model ? 'has-error' : ''}`}
                      placeholder="e.g. Camry, Civic, F-150"
                      value={vehicle.model}
                      onChange={e => {
                        setVehicle({ ...vehicle, model: e.target.value });
                        if (fieldErrors.model) setFieldErrors(p => ({ ...p, model: false }));
                      }}
                    />
                    {fieldErrors.model && <div className="form-error-hint"><AlertCircle size={12} /> Model is required</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model Year</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control"
                      placeholder="2022"
                      value={vehicle.year}
                      onChange={e => setVehicle({ ...vehicle, year: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Plate Number</label>
                    <input
                      className="form-control"
                      placeholder="e.g. ABC-1234"
                      value={vehicle.plate}
                      onChange={e => setVehicle({ ...vehicle, plate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="divider" style={{ margin: '14px 0' }} />

                {/* Contact Fields */}
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name <span>*</span></label>
                    <input
                      id="booking-cust-name"
                      className={`form-control ${fieldErrors.name ? 'has-error' : ''}`}
                      placeholder="Your full name"
                      value={customer.name}
                      onChange={e => {
                        setCustomer({ ...customer, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: false }));
                      }}
                    />
                    {fieldErrors.name && (
                      <div className="form-error-hint">
                        <AlertCircle size={12} /> Full name is required
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Mobile Phone (Sri Lanka WhatsApp) <span>*</span>
                    </label>
                    <input
                      id="booking-cust-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className={`form-control ${fieldErrors.phone ? 'has-error' : ''}`}
                      placeholder="e.g. 077 123 4567 or 771234567"
                      value={customer.phone}
                      onChange={e => {
                        setCustomer({ ...customer, phone: e.target.value });
                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: false }));
                      }}
                    />
                    {customer.phone && (() => {
                      const clean = sanitizeSriLankanPhone(customer.phone);
                      return (
                        <div style={{
                          marginTop: 4,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          color: clean.valid ? 'var(--brand-success)' : 'var(--text-muted)'
                        }}>
                          <span>🇱🇰</span>
                          {clean.valid
                            ? <span>WhatsApp Format: <strong>{clean.formatted}</strong></span>
                            : <span>Enter 9 or 10 digits (e.g. 077 123 4567)</span>}
                        </div>
                      );
                    })()}
                    {fieldErrors.phone && (
                      <div className="form-error-hint">
                        <AlertCircle size={12} /> Mobile phone number is required
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="your.email@example.com"
                      value={customer.email}
                      onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Special Requests / Symptoms</label>
                    <input
                      className="form-control"
                      placeholder="e.g. squeaking brakes, check AC smell"
                      value={customer.notes}
                      onChange={e => setCustomer({ ...customer, notes: e.target.value })}
                    />
                  </div>
                </div>

                {customerMode === 'new' && (
                  <div style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <input
                      type="checkbox"
                      id="auto-reg-cb"
                      checked={autoRegister}
                      onChange={e => setAutoRegister(e.target.checked)}
                      style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="auto-reg-cb" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Register me as an Auto Lab 360 customer (Saves your vehicle & contact for one-click future booking & loyalty rewards)
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sticky Cart Summary */}
            <div style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 24px)' }}>
              <div className="card" style={{ border: '1px solid var(--border-glow)' }}>
                <div className="section-title mb-3" style={{ fontSize: 16 }}>Booking Summary</div>
                
                {/* List of Chosen Jobs */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    Chosen Jobs ({selectedServices.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedServices.map(s => (
                      <div key={s.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)',
                        fontSize: 12
                      }}>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>Rs. {s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 18 }}>
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} /> Total Est. Duration
                    </span>
                    <strong>{totalEstDuration} mins</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} /> Scheduled Date
                    </span>
                    <strong>{bookingDate}</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={14} /> Preferred Time
                    </span>
                    <strong>{bookingTime}</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Car size={14} /> Vehicle
                    </span>
                    <span>{vehicle.make} {vehicle.model}</span>
                  </div>

                  <div className="divider" style={{ margin: '8px 0' }} />

                  <div className="flex justify-between items-center" style={{ fontSize: 15 }}>
                    <span style={{ fontWeight: 600 }}>Estimated Total</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-primary)' }}>
                      Rs. {totalCost}.00
                    </span>
                  </div>
                </div>

                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                  marginBottom: 16,
                  display: 'flex',
                  gap: 6,
                  alignItems: 'flex-start'
                }}>
                  <ShieldCheck size={16} style={{ color: 'var(--brand-success)', flexShrink: 0 }} />
                  <span>No upfront payment required. Auto Lab 360 advisors will review your slot, assign a technician, and contact you.</span>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  onClick={handleBook}
                >
                  Request Appointment ({selectedServices.length} Job{selectedServices.length > 1 ? 's' : ''}) <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: TRACK EXISTING BOOKING
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'lookup' && (
        <div className="card" style={{ maxWidth: 650, margin: '0 auto' }}>
          <div className="section-title mb-2">Track Vehicle & Booking Status</div>
          <div className="section-sub mb-4" style={{ marginBottom: 16 }}>
            Enter your booking code (e.g. APT-001) or license plate to check real-time workshop progress.
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: '1 1 200px' }}>
              <Search size={16} className="search-icon" />
              <input
                placeholder="Enter APT-001, Plate ABC-1234, or Customer Name..."
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleLookup} style={{ flex: '0 0 auto' }}>
              Check Status
            </button>
          </div>

          {lookupResult === 'not_found' && (
            <div className="alert alert-warning">
              No active booking found matching "{lookupQuery}". Please double check your booking code.
            </div>
          )}

          {lookupResult && lookupResult !== 'not_found' && (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glow)',
              padding: '16px 14px'
            }}>
              <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {lookupResult.id}
                </span>
                <span className={`badge badge-${lookupResult.status}`}>
                  <span className="badge-dot" /> {lookupResult.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>{' '}
                  <strong>{lookupResult.customer}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>{' '}
                  <strong>{lookupResult.vehicle}</strong> ({lookupResult.plate})
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Services Requested:</span>{' '}
                  <strong>{lookupResult.service}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>{' '}
                  <strong>{lookupResult.date} at {lookupResult.time}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Tech:</span>{' '}
                  <strong>{lookupResult.tech || 'Pending Workshop Queue'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Cost:</span>{' '}
                  <strong style={{ color: 'var(--brand-primary)', fontSize: 15 }}>Rs. {lookupResult.cost}</strong>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setViewingModalBooking(lookupResult)}
                  title="View full booking breakdown and print official slip"
                >
                  <Printer size={14} /> View & Print Booking Slip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewingModalBooking && (
        <BookingDetailsModal
          booking={viewingModalBooking}
          onClose={() => setViewingModalBooking(null)}
        />
      )}
    </div>
  );
}
