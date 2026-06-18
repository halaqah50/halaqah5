import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  Smartphone, 
  Calendar, 
  Printer, 
  Plus, 
  Search, 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  Check, 
  GraduationCap, 
  Clock, 
  Sparkles,
  Barcode,
  Volume2,
  CalendarDays,
  FileCheck2,
  Lock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

import { Member, Attendance, Pembina, AttendancePembina, AppState } from './types';
import QrScanner from './components/QrScanner';
import MemberCard from './components/MemberCard';

// Recharts components
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

const STORAGE_KEY = 'halaqah_offline_db_v2';

const DEFAULT_MEMBERS: Member[] = [
  { nama: 'Ahmad Fauzan', alamat: 'Jl. Margonda Raya No. 12', nomorWA: '081234567891', tanggalBergabung: '10 Januari 2026' },
  { nama: 'Budi Santoso', alamat: 'Jl. Kemang Pratama Blok A5', nomorWA: '085712345672', tanggalBergabung: '12 Januari 2026' },
  { nama: 'Candra Wijaya', alamat: 'Jl. Dago No. 142', nomorWA: '089912345673', tanggalBergabung: '15 Januari 2026' },
  { nama: 'Dedi Kurniawan', alamat: 'Jl. Malioboro No. 55', nomorWA: '082112345674', tanggalBergabung: '18 Januari 2026' },
  { nama: 'Eko Prasetyo', alamat: 'Jl. Simpang Lima No. 3', nomorWA: '081312345675', tanggalBergabung: '20 Januari 2026' },
];

const DEFAULT_PEMBINA: Pembina[] = [
  { nama: 'Ustadz Ahmad Fauzi', alamat: 'Perum Graha Indah Blok C3', nomorWA: '08571234567', tanggalBergabung: '01 Januari 2026' },
  { nama: 'Ustadz Rahmat Hidayat', alamat: 'Jl. Raden Saleh No. 8', nomorWA: '08129876543', tanggalBergabung: '05 Januari 2026' },
];

const DEFAULT_ATTENDANCE: Attendance[] = [
  { timestamp: '2026-06-10 08:00:00', nama: 'Ahmad Fauzan', tanggal: '10/06/2026', pertemuan: 'Pertemuan 1', status: 'Hadir', pembina: 'Ustadz Ahmad Fauzi' },
  { timestamp: '2026-06-10 08:02:00', nama: 'Budi Santoso', tanggal: '10/06/2026', pertemuan: 'Pertemuan 1', status: 'Hadir', pembina: 'Ustadz Ahmad Fauzi' },
  { timestamp: '2026-06-10 08:15:00', nama: 'Candra Wijaya', tanggal: '10/06/2026', pertemuan: 'Pertemuan 1', status: 'Izin', pembina: 'Ustadz Ahmad Fauzi' },
  { timestamp: '2026-06-17 08:05:00', nama: 'Ahmad Fauzan', tanggal: '17/06/2026', pertemuan: 'Pertemuan 2', status: 'Hadir', pembina: 'Ustadz Ahmad Fauzi' },
  { timestamp: '2026-06-17 08:10:00', nama: 'Budi Santoso', tanggal: '17/06/2026', pertemuan: 'Pertemuan 2', status: 'Sakit', pembina: 'Ustadz Ahmad Fauzi' },
];

const DEFAULT_ATTENDANCE_PEMBINA: AttendancePembina[] = [
  { timestamp: '2026-06-10 07:55:00', nama: 'Ustadz Ahmad Fauzi', tanggal: '10/06/2026', pertemuan: 'Pertemuan 1', status: 'Hadir' },
  { timestamp: '2026-06-17 07:58:00', nama: 'Ustadz Ahmad Fauzi', tanggal: '17/06/2026', pertemuan: 'Pertemuan 2', status: 'Hadir' },
];

const APPS_SCRIPT_TEMPLATE = `// Paste kode ini di "Ekstensi" > "Apps Script" pada Google Sheet Anda.
// Lalu klik "Terapkan" > "Penerapan Baru", pilih Jenis: "Aplikasi Web",
// Konfigurasikan: Jalankan sebagai "Saya" dan Siapa yang memiliki akses: "Siapa saja",
// Kemudian Salin URL Aplikasi Web yang diberikan dan masukkan ke kolom "URL Aplikasi Web" di aplikasi ini.

function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "fetchData") {
    // 1. Members
    var membersSheet = sheet.getSheetByName("Members");
    var members = [];
    if (membersSheet) {
      var rows = membersSheet.getDataRange().getValues();
      if (rows.length > 1) {
        var header = rows[0].map(function(c) { return c ? c.toString().toLowerCase().trim() : ""; });
        var nameIdx = header.indexOf("nama");
        var addressIdx = header.indexOf("alamat");
        var waIdx = header.indexOf("nomor wa");
        if (waIdx === -1) waIdx = header.indexOf("no whatsapp");
        if (waIdx === -1) waIdx = header.indexOf("whatsapp");
        var dateIdx = header.indexOf("tanggal bergabung");
        if (dateIdx === -1) dateIdx = header.indexOf("tanggal");

        if (nameIdx === -1) nameIdx = 0;
        if (addressIdx === -1) addressIdx = 1;
        if (waIdx === -1) waIdx = 2;
        if (dateIdx === -1) dateIdx = 3;

        for (var i = 1; i < rows.length; i++) {
          if (rows[i][nameIdx]) {
            members.push({
              nama: rows[i][nameIdx].toString(),
              alamat: rows[i][addressIdx] ? rows[i][addressIdx].toString() : "",
              nomorWA: rows[i][waIdx] ? rows[i][waIdx].toString() : "",
              tanggalBergabung: rows[i][dateIdx] ? rows[i][dateIdx].toString() : ""
            });
          }
        }
      }
    }
    
    // 2. Attendance
    var attendanceSheet = sheet.getSheetByName("Attendance");
    var attendance = [];
    if (attendanceSheet) {
      var rows = attendanceSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][1]) {
          attendance.push({
            timestamp: rows[i][0] ? rows[i][0].toString() : "",
            nama: rows[i][1].toString(),
            tanggal: rows[i][2] ? rows[i][2].toString() : "",
            pertemuan: rows[i][3] ? rows[i][3].toString() : "",
            status: rows[i][4] ? rows[i][4].toString() : "Hadir",
            pembina: rows[i][5] ? rows[i][5].toString() : ""
          });
        }
      }
    }
    
    // 3. Pembina
    var pembinaSheet = sheet.getSheetByName("Pembina");
    var pembina = [];
    if (pembinaSheet) {
      var rows = pembinaSheet.getDataRange().getValues();
      if (rows.length > 1) {
        var header = rows[0].map(function(c) { return c ? c.toString().toLowerCase().trim() : ""; });
        var nameIdx = header.indexOf("nama");
        var addressIdx = header.indexOf("alamat");
        var waIdx = header.indexOf("nomor wa");
        if (waIdx === -1) waIdx = header.indexOf("no whatsapp");
        if (waIdx === -1) waIdx = header.indexOf("whatsapp");
        var dateIdx = header.indexOf("tanggal bergabung");
        if (dateIdx === -1) dateIdx = header.indexOf("tanggal");

        if (nameIdx === -1) nameIdx = 0;
        if (addressIdx === -1) addressIdx = 1;
        if (waIdx === -1) waIdx = 2;
        if (dateIdx === -1) dateIdx = 3;

        for (var i = 1; i < rows.length; i++) {
          if (rows[i][nameIdx]) {
            pembina.push({
              nama: rows[i][nameIdx].toString(),
              alamat: rows[i][addressIdx] ? rows[i][addressIdx].toString() : "",
              nomorWA: rows[i][waIdx] ? rows[i][waIdx].toString() : "",
              tanggalBergabung: rows[i][dateIdx] ? rows[i][dateIdx].toString() : ""
            });
          }
        }
      }
    }
    
    // 4. Attendance Pembina
    var attPembinaSheet = sheet.getSheetByName("Attendance_Pembina");
    var attendancePembina = [];
    if (attPembinaSheet) {
      var rows = attPembinaSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][1]) {
          attendancePembina.push({
            timestamp: rows[i][0] ? rows[i][0].toString() : "",
            nama: rows[i][1].toString(),
            tanggal: rows[i][2] ? rows[i][2].toString() : "",
            pertemuan: rows[i][3] ? rows[i][3].toString() : "",
            status: rows[i][4] ? rows[i][4].toString() : "Hadir"
          });
        }
      }
    }
    
    var output = {
      success: true,
      members: members,
      attendance: attendance,
      pembina: pembina,
      attendancePembina: attendancePembina
    };
    
    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Apps Script Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var payload = JSON.parse(e.postData.contents);
  var action = payload.action;
  var data = payload.data;
  
  if (action === "addMember") {
    var ws = sheet.getSheetByName("Members");
    if (!ws) {
      ws = sheet.insertSheet("Members");
      ws.appendRow(["Nama", "Alamat", "Nomor WA", "Tanggal Bergabung"]);
    }
    var rows = ws.getDataRange().getValues();
    var header = rows[0] || [];
    var hasTimestamp = false;
    if (header && header[0]) {
      var h0 = header[0].toString().toLowerCase();
      if (h0.indexOf("time") > -1 || (h0.indexOf("tanggal") > -1 && h0 !== "tanggal bergabung")) {
        hasTimestamp = true;
      }
    }
    if (hasTimestamp) {
      ws.appendRow([new Date(), data.nama, data.alamat, data.nomorWA, data.tanggalBergabung]);
    } else {
      ws.appendRow([data.nama, data.alamat, data.nomorWA, data.tanggalBergabung]);
    }
    
  } else if (action === "addPembina") {
    var ws = sheet.getSheetByName("Pembina");
    if (!ws) {
      ws = sheet.insertSheet("Pembina");
      ws.appendRow(["Nama", "Alamat", "Nomor WA", "Tanggal Bergabung"]);
    }
    var rows = ws.getDataRange().getValues();
    var header = rows[0] || [];
    var hasTimestamp = false;
    if (header && header[0]) {
      var h0 = header[0].toString().toLowerCase();
      if (h0.indexOf("time") > -1 || (h0.indexOf("tanggal") > -1 && h0 !== "tanggal bergabung")) {
        hasTimestamp = true;
      }
    }
    if (hasTimestamp) {
      ws.appendRow([new Date(), data.nama, data.alamat, data.nomorWA, data.tanggalBergabung]);
    } else {
      ws.appendRow([data.nama, data.alamat, data.nomorWA, data.tanggalBergabung]);
    }
    
  } else if (action === "addAttendance") {
    var ws = sheet.getSheetByName("Attendance");
    if (!ws) {
      ws = sheet.insertSheet("Attendance");
      ws.appendRow(["Timestamp", "Nama", "Tanggal", "Pertemuan", "Status", "Pembina"]);
    }
    ws.appendRow([data.timestamp, data.nama, data.tanggal, data.pertemuan, data.status, data.pembina]);
    
  } else if (action === "addAttendancePembina") {
    var ws = sheet.getSheetByName("Attendance_Pembina");
    if (!ws) {
      ws = sheet.insertSheet("Attendance_Pembina");
      ws.appendRow(["Timestamp", "Nama", "Tanggal", "Pertemuan", "Status"]);
    }
    ws.appendRow([data.timestamp, data.nama, data.tanggal, data.pertemuan, data.status]);
    
  } else if (action === "bulkUpload") {
    // 1. Members
    var wsM = sheet.getSheetByName("Members");
    if (wsM) {
      wsM.clear();
    } else {
      wsM = sheet.insertSheet("Members");
    }
    wsM.appendRow(["Nama", "Alamat", "Nomor WA", "Tanggal Bergabung"]);
    if (data.members && data.members.length > 0) {
      data.members.forEach(function(item) {
        wsM.appendRow([item.nama, item.alamat, item.nomorWA, item.tanggalBergabung]);
      });
    }
    
    // 2. Pembina
    var wsP = sheet.getSheetByName("Pembina");
    if (wsP) {
      wsP.clear();
    } else {
      wsP = sheet.insertSheet("Pembina");
    }
    wsP.appendRow(["Nama", "Alamat", "Nomor WA", "Tanggal Bergabung"]);
    if (data.pembina && data.pembina.length > 0) {
      data.pembina.forEach(function(item) {
        wsP.appendRow([item.nama, item.alamat, item.nomorWA, item.tanggalBergabung]);
      });
    }
    
    // 3. Attendance
    var wsA = sheet.getSheetByName("Attendance");
    if (wsA) {
      wsA.clear();
    } else {
      wsA = sheet.insertSheet("Attendance");
    }
    wsA.appendRow(["Timestamp", "Nama", "Tanggal", "Pertemuan", "Status", "Pembina"]);
    if (data.attendance && data.attendance.length > 0) {
      data.attendance.forEach(function(item) {
        wsA.appendRow([item.timestamp, item.nama, item.tanggal, item.pertemuan, item.status, item.pembina]);
      });
    }
    
    // 4. Attendance Pembina
    var wsAP = sheet.getSheetByName("Attendance_Pembina");
    if (wsAP) {
      wsAP.clear();
    } else {
      wsAP = sheet.insertSheet("Attendance_Pembina");
    }
    wsAP.appendRow(["Timestamp", "Nama", "Tanggal", "Pertemuan", "Status"]);
    if (data.attendancePembina && data.attendancePembina.length > 0) {
      data.attendancePembina.forEach(function(item) {
        wsAP.appendRow([item.timestamp, item.nama, item.tanggal, item.pertemuan, item.status]);
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export default function App() {
  // Auth state - Hardcoded to offline secure admin
  const [user, setUser] = useState<any>({
    displayName: 'Admin Halaqah 5.0',
    email: 'admin@halaqah.local',
    photoURL: null
  });
  const [token, setToken] = useState<string | null>('offline-token');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Business State
  const [state, setState] = useState<AppState>({
    members: [],
    attendance: [],
    pembina: [],
    attendancePembina: [],
    spreadsheetId: 'Local Device',
    isLoading: true,
    error: null
  });

  // UI state
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'scan' | 'members' | 'pembina' | 'sheets'>('dashboard');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const stored = localStorage.getItem('halaqah_apps_script_url');
    if (stored && stored.trim() !== '') return stored;
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbyKJBicRwQf8QPQuwtDIgEO2cX4IHcVg4s9oKj2KsHUSV1OIvXBE7P9SIVZOKRHb3BjRA/exec';
    localStorage.setItem('halaqah_apps_script_url', defaultUrl);
    return defaultUrl;
  });
  const [isRefreshing, setIsRefreshing ] = useState(false);
  const [successToast, setSuccessToast ] = useState<string | null>(null);
  const [activeQrMember, setActiveQrMember ] = useState<Member | null>(null);

  // Scanner Active state
  const [isScannerActive, setIsScannerActive ] = useState(false);

  // Form states - Member Baru
  const [newMemberForm, setNewMemberForm] = useState({
    nama: '',
    alamat: '',
    nomorWA: ''
  });
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  // Form states - Pembina Baru
  const [newPembinaForm, setNewPembinaForm] = useState({
    nama: '',
    alamat: '',
    nomorWA: ''
  });
  const [isSubmittingPembina, setIsSubmittingPembina] = useState(false);

  // Session state for current Presence Scanner
  const [sessionId, setSessionId] = useState('Pertemuan 1');
  const [sessionPembina, setSessionPembina] = useState('');
  const [manualSearchText, setManualSearchText] = useState('');
  const [manualStatus, setManualStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpa'>('Hadir');

  // Attendance Pembina Form
  const [pembinaAttendanceForm, setPembinaAttendanceForm] = useState<{
    [pembinaName: string]: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  }>({});
  const [isSubmittingPembinaAttendance, setIsSubmittingPembinaAttendance] = useState(false);
  const [pembinaSessionId, setPembinaSessionId] = useState('Pertemuan 1');

  // Filters for Monitoring Dashboard
  const [filterDate, setFilterDate] = useState('');
  const [filterMeeting, setFilterMeeting] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterPembina, setFilterPembina] = useState('Semua');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Audio confirm feedback
  const playSoundEffect = (type: 'success' | 'click' | 'info') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.22);
      } else {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Browser offline database bootstrap loader
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.members)) {
          setState({
            members: parsed.members || [],
            attendance: parsed.attendance || [],
            pembina: parsed.pembina || [],
            attendancePembina: parsed.attendancePembina || [],
            spreadsheetId: 'Local Device',
            isLoading: false,
            error: null
          });

          // Prepopulate Pembina checklist
          const initialPembinaAtt: any = {};
          (parsed.pembina || []).forEach((p: any) => {
            initialPembinaAtt[p.nama] = 'Hadir';
          });
          setPembinaAttendanceForm(initialPembinaAtt);
          
          if (parsed.pembina && parsed.pembina.length > 0) {
            setSessionPembina(parsed.pembina[0].nama);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed, reverting to seed', e);
    }

    // Default Seed Data Load
    setState({
      members: DEFAULT_MEMBERS,
      pembina: DEFAULT_PEMBINA,
      attendance: DEFAULT_ATTENDANCE,
      attendancePembina: DEFAULT_ATTENDANCE_PEMBINA,
      spreadsheetId: 'Local Device',
      isLoading: false,
      error: null
    });

    if (DEFAULT_PEMBINA.length > 0) {
      setSessionPembina(DEFAULT_PEMBINA[0].nama);
    }

    const initialPembinaAtt: any = {};
    DEFAULT_PEMBINA.forEach(p => {
      initialPembinaAtt[p.nama] = 'Hadir';
    });
    setPembinaAttendanceForm(initialPembinaAtt);
  }, []);

  // Initial silent cloud sync on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('halaqah_apps_script_url');
    if (savedUrl) {
      const timer = setTimeout(() => {
        handleSyncFromAppsScript(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [appsScriptUrl]);

  // Save changes automatically to browser space
  useEffect(() => {
    if (!state.isLoading && state.spreadsheetId === 'Local Device') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          members: state.members,
          pembina: state.pembina,
          attendance: state.attendance,
          attendancePembina: state.attendancePembina
        }));
      } catch (e) {
        console.error('Error saving state to localStorage:', e);
      }
    }
  }, [state.members, state.pembina, state.attendance, state.attendancePembina, state.isLoading, state.spreadsheetId]);

  // Dummy login triggers if any code path checks it
  const handleLogin = async () => {
    // Unused but kept as stub
  };

  // Reset database back to default state
  const handleResetDatabase = () => {
    playSoundEffect('click');
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus seluruh database lokal dan mereset ke pengaturan awal?');
    if (!confirm) return;

    localStorage.removeItem(STORAGE_KEY);
    setState({
      members: DEFAULT_MEMBERS,
      pembina: DEFAULT_PEMBINA,
      attendance: DEFAULT_ATTENDANCE,
      attendancePembina: DEFAULT_ATTENDANCE_PEMBINA,
      spreadsheetId: 'Local Device',
      isLoading: false,
      error: null
    });

    if (DEFAULT_PEMBINA.length > 0) {
      setSessionPembina(DEFAULT_PEMBINA[0].nama);
    }
    const initialPembinaAtt: any = {};
    DEFAULT_PEMBINA.forEach(p => {
      initialPembinaAtt[p.nama] = 'Hadir';
    });
    setPembinaAttendanceForm(initialPembinaAtt);
    showToast('Database berhasil di-reset ke pengaturan awal!');
  };

  // Export entire app database to JSON files
  const handleExportData = () => {
    playSoundEffect('click');
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        members: state.members,
        pembina: state.pembina,
        attendance: state.attendance,
        attendancePembina: state.attendancePembina
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `halaqah_offline_db_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Seluruh database berhasil diekspor!');
    } catch (e: any) {
      alert('Gagal mengekspor data: ' + e.message);
    }
  };

  // Import app database from JSON files
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    playSoundEffect('click');
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.members)) {
          const confirm = window.confirm('Apakah Anda yakin ingin mengganti seluruh database saat ini dengan data hasil impor?');
          if (!confirm) return;

          setState({
            members: parsed.members || [],
            attendance: parsed.attendance || [],
            pembina: parsed.pembina || [],
            attendancePembina: parsed.attendancePembina || [],
            spreadsheetId: 'Local Device',
            isLoading: false,
            error: null
          });
          showToast('Database lokal berhasil diimpor!');
        } else {
          alert('Format file JSON salah (Pastikan berisi daftar Anggota).');
        }
      } catch (err: any) {
        alert('Gagal mengimpor file: ' + err.message);
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Send data to Apps Script Web App for real-time sync (100% free, no billing)
  const sendToAppsScript = async (action: string, data: any) => {
    if (!appsScriptUrl) return;
    try {
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({ action, data })
      });
      console.log(`Successfully posted ${action} to Google Sheet.`);
    } catch (err) {
      console.warn(`Apps Script sync failed for ${action}:`, err);
    }
  };

  // Sync / pull all data from Google Sheet (100% free, no billing)
  const handleSyncFromAppsScript = async (silent = false) => {
    if (!appsScriptUrl) {
      if (!silent) alert('Silakan masukkan URL Aplikasi Web Google Apps Script Anda terlebih dahulu di tab Google Sheet.');
      return;
    }
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`${appsScriptUrl}?action=fetchData`);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const json = await res.json();
      
      if (json && json.success) {
        setState(s => ({
          ...s,
          members: json.members && json.members.length > 0 ? json.members : s.members,
          pembina: json.pembina && json.pembina.length > 0 ? json.pembina : s.pembina,
          attendance: json.attendance && json.attendance.length > 0 ? json.attendance : s.attendance,
          attendancePembina: json.attendancePembina && json.attendancePembina.length > 0 ? json.attendancePembina : s.attendancePembina,
          spreadsheetId: 'Google Sheet (Gratis)',
          error: null
        }));
        if (!silent) showToast('Sinkronisasi sukses! Data terbaru berhasil ditarik dari Google Sheets.');
      } else {
        throw new Error(json.error || 'Server Apps Script mengembalikan status gagal.');
      }
    } catch (err: any) {
      console.error('Error fetching from Apps Script:', err);
      if (!silent) {
        alert(`Sinkronisasi Gagal: ${err.message}. Pastikan URL Aplikasi Web Anda benar, dan pilihlah hak akses "Anyone/Siapa Saja".`);
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Bulk Upload local database to Google Sheet (100% free, no billing)
  const handleBulkUploadToAppsScript = async () => {
    if (!appsScriptUrl) {
      alert('Silakan masukkan URL Aplikasi Web Google Apps Script Anda terlebih dahulu.');
      return;
    }
    const confirm = window.confirm('Apakah Anda yakin ingin mengunggah SELURUH database lokal saat ini ke Google Sheet? Data lama di sheet akan diganti dengan data lokal.');
    if (!confirm) return;

    setIsRefreshing(true);
    try {
      const payload = {
        members: state.members,
        pembina: state.pembina,
        attendance: state.attendance,
        attendancePembina: state.attendancePembina
      };

      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({ action: 'bulkUpload', data: payload })
      });

      showToast('Seluruh database berhasil diupload ke Google Sheet Anda!');
    } catch (err: any) {
      alert('Gagal mengupload data: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Snippet simulation sync
  const handleRefresh = async () => {
    playSoundEffect('click');
    if (appsScriptUrl) {
      await handleSyncFromAppsScript();
    } else {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        showToast('Sinkronisasi luring selesai! Data tersimpan aman di browser Anda.');
      }, 400);
    }
  };

  // Add Member
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.nama.trim()) {
      alert('Nama wajib diisi.');
      return;
    }

    setIsSubmittingMember(true);
    try {
      const tgl = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const memberObj: Member = {
        nama: newMemberForm.nama.trim(),
        alamat: newMemberForm.alamat.trim() || '-',
        nomorWA: newMemberForm.nomorWA.trim() || '-',
        tanggalBergabung: tgl
      };

      // Direct local update
      setState(s => ({
        ...s,
        members: [memberObj, ...s.members]
      }));

      setNewMemberForm({ nama: '', alamat: '', nomorWA: '' });
      playSoundEffect('success');
      showToast(`Anggota "${memberObj.nama}" berhasil ditambahkan!`);
      sendToAppsScript('addMember', memberObj);
    } catch (err: any) {
      alert(`Gagal menambah anggota: ${err.message}`);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Add Pembina
  const handleAddPembinaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPembinaForm.nama.trim()) {
      alert('Nama Pembina wajib diisi.');
      return;
    }

    setIsSubmittingPembina(true);
    try {
      const tgl = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const pembinaObj: Pembina = {
        nama: newPembinaForm.nama.trim(),
        alamat: newPembinaForm.alamat.trim() || '-',
        nomorWA: newPembinaForm.nomorWA.trim() || '-',
        tanggalBergabung: tgl
      };

      // Direct local update
      setState(s => ({
        ...s,
        pembina: [...s.pembina, pembinaObj]
      }));

      // Update Pembina Attendance checklist form too
      setPembinaAttendanceForm(prev => ({
        ...prev,
        [pembinaObj.nama]: 'Hadir'
      }));

      setNewPembinaForm({ nama: '', alamat: '', nomorWA: '' });
      playSoundEffect('success');
      showToast(`Pembina "${pembinaObj.nama}" berhasil didaftarkan!`);
      sendToAppsScript('addPembina', pembinaObj);
    } catch (err: any) {
      alert(`Gagal menambah pembina: ${err.message}`);
    } finally {
      setIsSubmittingPembina(false);
    }
  };

  // Add Pembina Attendance list session
  const handlePembinaAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.pembina.length === 0) {
      alert('Belum ada pembina terdaftar.');
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin menyimpan daftar hadir Pembina untuk ${pembinaSessionId}?`
    );
    if (!confirm) return;

    setIsSubmittingPembinaAttendance(true);
    try {
      const today = new Date();
      const dateString = today.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const newRecords = Object.entries(pembinaAttendanceForm).map(([nama, status]) => {
        const payload: AttendancePembina = {
          timestamp: today.toLocaleString('id-ID'),
          nama,
          tanggal: dateString,
          pertemuan: pembinaSessionId,
          status: status as any
        };
        return payload;
      });

      setState(s => ({
        ...s,
        attendancePembina: [...newRecords, ...s.attendancePembina]
      }));

      playSoundEffect('success');
      showToast(`Kehadiran Pembina untuk "${pembinaSessionId}" berhasil disimpan!`);
      newRecords.forEach(rec => sendToAppsScript('addAttendancePembina', rec));
    } catch (err: any) {
      alert(`Gagal merekam presensi pembina: ${err.message}`);
    } finally {
      setIsSubmittingPembinaAttendance(false);
    }
  };

  // QR Code scan business rule processing
  const handleQrScanSuccess = async (scannedName: string) => {
    // Check if this member is actually registered
    const matchingMember = state.members.find(
      m => m.nama.toLowerCase() === scannedName.toLowerCase()
    );

    if (!matchingMember) {
      showToast(`Perhatian: "${scannedName}" tidak ditemukan di database anggota.`);
    }

    const today = new Date();
    const dateString = today.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const attendanceRecord: Attendance = {
      timestamp: today.toLocaleString('id-ID'),
      nama: matchingMember?.nama || scannedName, // Save original name if not found in db
      tanggal: dateString,
      pertemuan: sessionId,
      status: 'Hadir',
      pembina: sessionPembina || 'Umum'
    };

    try {
      // Append to local state
      setState(s => ({
        ...s,
        attendance: [attendanceRecord, ...s.attendance]
      }));

      showToast(`Check-In Berhasil: ${attendanceRecord.nama} hadir di ${sessionId}!`);
      playSoundEffect('success');
      sendToAppsScript('addAttendance', attendanceRecord);
    } catch (err: any) {
      console.error('Error recording attendance:', err);
      alert(`Gagal menyimpan presensi scan: ${err.message}`);
    }
  };

  // Manual Check-in helper
  const handleManualCheckIn = async (memberName: string, status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
    const today = new Date();
    const dateString = today.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const attendanceRecord: Attendance = {
      timestamp: today.toLocaleString('id-ID'),
      nama: memberName,
      tanggal: dateString,
      pertemuan: sessionId,
      status,
      pembina: sessionPembina || 'Umum'
    };

    try {
      setState(s => ({
        ...s,
        attendance: [attendanceRecord, ...s.attendance]
      }));

      showToast(`Pencatatan Sukses: ${memberName} (${status}) di ${sessionId}!`);
      playSoundEffect('success');
      sendToAppsScript('addAttendance', attendanceRecord);
    } catch (e: any) {
      alert(`Gagal mencatat presensi: ${e.message}`);
    }
  };

  // REKAPITULASI DYNAMIC ENGINE WITH FILTER COUPLING
  // Returns: Map of Member Name -> { Hadir: x, Izin: y, Sakit: z, Alpa: w, Percent: p }
  const individualRecap = useMemo(() => {
    const recapMap = new Map<string, { Hadir: number, Izin: number, Sakit: number, Alpa: number }>();

    // Prepare every registered member so that even those with 0 attendance show up
    state.members.forEach(member => {
      recapMap.set(member.nama, { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 });
    });

    // Process attendance list based on selected filters
    state.attendance.forEach(att => {
      // Apply filters: Meeting Name
      if (filterMeeting !== 'Semua' && att.pertemuan !== filterMeeting) return;
      
      // Apply filters: Specific Date input matcher
      if (filterDate && att.tanggal !== filterDate.split('-').reverse().join('/')) {
        // Simple adapt layout helper - date input usually outputs "YYYY-MM-DD", whereas Sheets are "DD/MM/YYYY" or "YYYY-MM-DD"
        const formattedFilterDate = filterDate.split('-').reverse().join('/'); // "DD/MM/YYYY"
        const formattedFilterDateAlt = filterDate.replace(/-/g, '/');
        if (att.tanggal !== formattedFilterDate && att.tanggal !== formattedFilterDateAlt && !att.tanggal.includes(filterDate)) {
          return;
        }
      }

      // Apply filters: Month match
      if (filterMonth !== 'Semua') {
        // Month indexes 01 = Januari, 02 = Februari, etc...
        const monthMapIndo: any = {
          '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
          '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
          '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
        };
        // parse the month from att.tanggal (usually formatted like "DD/MM/YYYY" or "YYYY-MM-DD")
        const dateParts = att.tanggal.split('/');
        const monthNum = dateParts[1];
        const recordMonthName = monthMapIndo[monthNum] || '';
        
        if (recordMonthName !== filterMonth && !att.tanggal.includes(filterMonth)) {
          return;
        }
      }

      // Apply filters: Pembina match
      if (filterPembina !== 'Semua' && att.pembina !== filterPembina) return;

      // Increment stats
      const current = recapMap.get(att.nama) || { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
      if (att.status === 'Hadir') current.Hadir += 1;
      else if (att.status === 'Izin') current.Izin += 1;
      else if (att.status === 'Sakit') current.Sakit += 1;
      else if (att.status === 'Alpa') current.Alpa += 1;
      
      recapMap.set(att.nama, current);
    });

    // Create printable array format
    const resultList: any[] = [];
    recapMap.forEach((stats, nama) => {
      const matchDb = state.members.find(m => m.nama === nama);
      const totalSessions = stats.Hadir + stats.Izin + stats.Sakit + stats.Alpa;
      const presenceRate = totalSessions > 0 ? Math.round((stats.Hadir / totalSessions) * 100) : 0;

      resultList.push({
        nama,
        alamat: matchDb?.alamat || '-',
        nomorWA: matchDb?.nomorWA || '-',
        hadir: stats.Hadir,
        izin: stats.Izin,
        sakit: stats.Sakit,
        alpa: stats.Alpa,
        total: totalSessions,
        persentase: presenceRate
      });
    });

    return resultList.filter(item => 
      item.nama.toLowerCase().includes(searchMemberQuery.toLowerCase())
    );
  }, [state.members, state.attendance, filterMeeting, filterDate, filterMonth, filterPembina, searchMemberQuery]);

  // Overall statistics counters
  const dashboardStats = useMemo(() => {
    const totalM = state.members.length;
    const totalP = state.pembina.length;

    // Filtered presence rate
    let sumPercentage = 0;
    individualRecap.forEach(r => {
      sumPercentage += r.persentase;
    });
    const avgPercentage = individualRecap.length > 0 ? Math.round(sumPercentage / individualRecap.length) : 0;

    return { totalM, totalP, avgPercentage };
  }, [state.members, state.pembina, individualRecap]);

  // Recharts Attendance Trend generator
  const attendanceTrendData = useMemo(() => {
    // Group attendance by Session / Meeting Name
    const groupMap: any = {};
    
    state.attendance.forEach(att => {
      if (!groupMap[att.pertemuan]) {
        groupMap[att.pertemuan] = { meeting: att.pertemuan, Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 };
      }
      if (att.status === 'Hadir') groupMap[att.pertemuan].Hadir += 1;
      else if (att.status === 'Izin') groupMap[att.pertemuan].Izin += 1;
      else if (att.status === 'Sakit') groupMap[att.pertemuan].Sakit += 1;
      else if (att.status === 'Alpa') groupMap[att.pertemuan].Alpa += 1;
    });

    return Object.values(groupMap).sort((a: any, b: any) => {
      // Simple sort: Pertemuan 1, Pertemuan 2, etc.
      const numA = parseInt(a.meeting.replace(/^\D+/g, '')) || 0;
      const numB = parseInt(b.meeting.replace(/^\D+/g, '')) || 0;
      return numA - numB;
    });
  }, [state.attendance]);

  // Handle PDF report printing
  const handlePrintPdfReport = () => {
    playSoundEffect('click');
    window.print();
  };

  // List of Month filter options in Indonesian language
  const idMonthNames = [
    'Semua', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // List of Meetings options (Pertemuan 1 - Pertemuan 16)
  const meetingOptions = useMemo(() => {
    return ['Semua', ...Array.from({ length: 16 }, (_, i) => `Pertemuan ${i + 1}`)];
  }, []);

  // Return Sign-In Card if not logged in
  if (needsAuth) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans bg-slate-50">
        
        {/* Abstract background blobs for modern feel */}
        <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-blue-600/10 blur-[135px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
 
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md bg-white p-8 text-center relative z-10 border border-slate-200 shadow-xl rounded-3xl"
        >
          {/* Custom Brand Logo - Biru Navy Tulisan Putih */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-2xl text-white font-black text-2xl mb-6 shadow-md shadow-blue-900/20">
            HQ
          </div>
 
          <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight leading-none">
            HALAQAH 5.0
          </h1>
          <p className="text-xs font-bold text-blue-900 uppercase tracking-widest mt-2 bg-blue-50 py-1.5 px-3 rounded-full inline-block border border-blue-100">
            Sistem Administrasi Aktivitas
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-4 max-w-xs mx-auto leading-relaxed">
            Platform modern pembinaan halaqah terintegrasi real-time dengan Google Sheets untuk scan QR presensi, input anggota, dan monitoring rekapitulasi otomatis.
          </p>
 
          <div className="my-6 border-b border-slate-200" />
 
          {/* Secure Google Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full inline-flex items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-sm py-3.5 px-6 rounded-xl border border-slate-200/80 transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoggingIn ? (
              <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span>{isLoggingIn ? 'Menghubungkan Akun...' : 'Masuk Dengan Google'}</span>
          </button>
 
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-4">
            <Lock className="w-3.5 h-3.5 text-blue-900" />
            <span className="text-slate-500">Secure OAuth Integration</span>
          </div>
        </motion.div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen text-slate-800 pb-16 flex flex-col relative print:bg-white print:text-black print:pb-0 font-sans bg-slate-50">
      
      {/* Background glass radial glow blobs */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[150px]"></div>
      </div>
      
      {/* GLOBAL TOAST NOTIFIER */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white py-3 px-6 rounded-xl shadow-xl border border-slate-800 flex items-center gap-3 z-50 text-xs font-semibold tracking-wide no-print"
          >
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <header className="glass-header py-4 px-6 md:px-12 sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 rounded-xl text-white font-black text-md flex items-center justify-center shadow-md shadow-blue-900/10">
            HQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-md font-bold text-blue-900 tracking-tight leading-none">HALAQAH 5.0</h1>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-900 mt-1">Admin Portal</p>
          </div>
        </div>

        {/* Sync state indicator and user Profile */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs cursor-pointer"
            title="Ekspor seluruh database ke file JSON"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-900" />
            <span>Ekspor (JSON)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5 text-blue-900 animate-pulse" />
            <span>Impor (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || state.isLoading}
            className="p-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all rounded-lg text-slate-600 disabled:opacity-50 cursor-pointer"
            title="Sinkronisasi Data Lokal"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-900' : ''}`} />
          </button>

          {/* User Meta */}
          {user && (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/60 pl-2 pr-3 py-1.5 rounded-lg">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User Avatar" className="w-5 h-5 rounded-md object-cover" />
              ) : (
                <div className="w-5 h-5 bg-blue-900 text-white rounded-md text-[10px] font-bold flex items-center justify-center">
                  H
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">{user.displayName || user.email}</span>
            </div>
          )}

          <button
            onClick={handleResetDatabase}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
            title="Reset Database ke Bawaan"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:flex flex-col items-center justify-center text-center p-6 border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-slate-950 uppercase tracking-tight">LAPORAN KEHADIRAN PENGAJIAN HALAQAH 5.0</h1>
        <p className="text-sm font-semibold tracking-widest text-slate-800 uppercase mt-1">Sistem Administrasi Aktivitas Kegitatan Halaqah</p>
        <div className="mt-4 flex gap-6 text-xs text-slate-700 font-bold">
          {filterMeeting !== 'Semua' && <span>Pertemuan: {filterMeeting}</span>}
          {filterMonth !== 'Semua' && <span>Bulan: {filterMonth}</span>}
          {filterPembina !== 'Semua' && <span>Pembina: {filterPembina}</span>}
          <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* LOADING COVER */}
      {state.isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 relative z-10">
          <RefreshCw className="w-10 h-10 text-blue-900 animate-spin mb-4" />
          <h3 className="text-md font-bold text-slate-800">Menyiapkan Database Lokal...</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center leading-relaxed font-semibold">
            Membaca data presensi, peserta, dan pembina dari penyimpanan luring browser Anda.
          </p>
        </div>
      )}

      {/* ERROR PANEL */}
      {!state.isLoading && state.error && (
        <div className="max-w-2xl mx-auto my-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center no-print relative z-10 animate-fade-in shadow-sm">
          <h3 className="text-red-600 font-bold text-md mb-2">Kesalahan Database Lokal</h3>
          <p className="text-xs text-red-500 leading-relaxed mb-4 font-semibold">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      )}

      {/* MAIN APPLICATION CONTAINER */}
      {!state.isLoading && !state.error && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 py-8 flex flex-col gap-8 print:p-0 relative z-10">
          
          {/* NAVIGATION TABS (no-print) */}
          <nav className="flex flex-wrap p-1.5 bg-slate-100 border border-slate-200 rounded-2xl gap-1 no-print">
            <button
              onClick={() => { setActiveTab('dashboard'); playSoundEffect('click'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-900 text-white font-extrabold shadow-sm' 
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
              }`}
            >
              Dashboard Monitoring
            </button>
            <button
              onClick={() => { setActiveTab('scan'); playSoundEffect('click'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer ${
                activeTab === 'scan' 
                  ? 'bg-blue-900 text-white font-extrabold shadow-sm' 
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
              }`}
            >
              Scan Presensi QR
            </button>
            <button
              onClick={() => { setActiveTab('members'); playSoundEffect('click'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer ${
                activeTab === 'members' 
                  ? 'bg-blue-900 text-white font-extrabold shadow-sm' 
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
              }`}
            >
              Anggota Halaqah ({state.members.length})
            </button>
            <button
              onClick={() => { setActiveTab('pembina'); playSoundEffect('click'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 cursor-pointer ${
                activeTab === 'pembina' 
                  ? 'bg-blue-900 text-white font-extrabold shadow-sm' 
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
              }`}
            >
              Pembina ({state.pembina.length})
            </button>
            <button
              onClick={() => { setActiveTab('sheets'); playSoundEffect('click'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-250 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sheets' 
                  ? 'bg-emerald-700 text-white font-extrabold shadow-sm' 
                  : 'text-emerald-750 hover:bg-emerald-50/50'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${appsScriptUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <span>Google Sheets Sync</span>
            </button>
          </nav>

          {/* TAB CONTENTS CONTAINER */}
          <div className="flex flex-col gap-8">

            {/* ----------------- TAB: DASHBOARD (MONITORING) ----------------- */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-8">
                
                {/* 1. Quick Info Filter Bar (no-print) */}
                <div className="glass-card bg-white rounded-2xl p-5 md:p-6 flex flex-col gap-4 no-print border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-900" />
                    <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Filter Presensi</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    
                    {/* Filter Pertemuan */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Pertemuan</label>
                      <select
                        value={filterMeeting}
                        onChange={(e) => setFilterMeeting(e.target.value)}
                        className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-medium cursor-pointer border border-slate-200 text-slate-800 bg-white"
                      >
                        <option value="Semua" className="bg-white text-slate-900">Semua Pertemuan</option>
                        {meetingOptions.filter(m => m !== 'Semua').map(meeting => (
                          <option key={meeting} value={meeting} className="bg-white text-slate-900">{meeting}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Bulan */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Bulan</label>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-medium cursor-pointer border border-slate-200 text-slate-800 bg-white"
                      >
                        {idMonthNames.map(m => (
                          <option key={m} value={m} className="bg-white text-slate-900">{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter Tanggal */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Tanggal Spesifik</label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-semibold border border-slate-200 text-slate-800 bg-white"
                      />
                    </div>

                    {/* Filter Pembina */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Pembina Halaqah</label>
                      <select
                        value={filterPembina}
                        onChange={(e) => setFilterPembina(e.target.value)}
                        className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-medium cursor-pointer border border-slate-200 text-slate-800 bg-white"
                      >
                        <option value="Semua" className="bg-white text-slate-900">Semua Pembina</option>
                        {state.pembina.map((p, pIdx) => (
                          <option key={p.nama + '-' + pIdx} value={p.nama} className="bg-white text-slate-900">{p.nama}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* 2. Bento Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                  <div className="glass-card print:border print:border-slate-350 p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-blue-900 uppercase tracking-widest font-extrabold block">Total Anggota</span>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardStats.totalM}</h3>
                      <span className="text-[10px] text-slate-500 mt-1 block font-semibold text-shadow-xs">Bimbingan Halaqah</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-blue-900 flex items-center justify-center no-print">
                      <Users className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>

                  <div className="glass-card print:border print:border-slate-350 p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-blue-900 uppercase tracking-widest font-extrabold block">Tingkat Kehadiran</span>
                      <h3 className="text-3xl font-extrabold text-blue-900 mt-1">{dashboardStats.avgPercentage}%</h3>
                      <span className="text-[10px] text-blue-800 mt-1 block font-bold uppercase tracking-wider">Presensi Rerata</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-900 flex items-center justify-center no-print">
                      <UserCheck className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>

                  <div className="glass-card print:border print:border-slate-350 p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white">
                    <div>
                      <span className="text-[10px] text-blue-900 uppercase tracking-widest font-extrabold block">Ustadz/Pembina</span>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{dashboardStats.totalP}</h3>
                      <span className="text-[10px] text-slate-500 mt-1 block font-semibold text-shadow-xs">Aktif Mengajar</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-blue-900 flex items-center justify-center no-print">
                      <GraduationCap className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>
                </div>

                {/* 3. Recharts Attendance Trend Area graph (no-print) */}
                {attendanceTrendData.length > 0 && (
                  <div className="glass-card rounded-2xl p-5 md:p-6 shadow-sm flex flex-col gap-4 no-print border border-slate-200 bg-white">
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Grafik Tren Kehadiran</h3>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">Jumlah kehadiran anggota per pertemuan yang terekam di Google Sheets.</p>
                    </div>
                    <div className="w-full h-64 mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                           data={attendanceTrendData}
                           margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                           <defs>
                            <linearGradient id="colorPresence" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 23, 42, 0.06)" />
                          <XAxis 
                            dataKey="meeting" 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#475569" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#0f172a'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Hadir" 
                            stroke="#1e3a8a" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorPresence)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 4. Rekapitulasi Data Per Individu TABLE (PDF Print target) */}
                <div className="glass-card bg-white print:bg-white print:text-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  
                  {/* Table title action panel */}
                  <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-slate-50">
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Rekapitulasi Kehadiran Individu</h3>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold">Data individual otomatis dihitung dari rekaman filter Google Sheets.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari Nama Anggota..."
                          value={searchMemberQuery}
                          onChange={(e) => setSearchMemberQuery(e.target.value)}
                          className="pl-9 pr-3 py-1.5 glass-input border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-900 w-full sm:w-44 focus:sm:w-60 transition-all placeholder-slate-450 bg-white"
                        />
                      </div>

                      <button
                        onClick={handlePrintPdfReport}
                        className="py-1.5 px-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Laporan Kehadiran</span>
                      </button>
                    </div>
                  </div>

                  {/* Actual Table Body */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse text-xs print:text-black">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] my-1 print:bg-slate-200 print:text-slate-900 border-b border-slate-200">
                          <th className="py-3.5 px-4 w-12 text-center">No</th>
                          <th className="py-3.5 px-4">Nama Lengkap</th>
                          <th className="py-3.5 px-4 no-print">No WA</th>
                          <th className="py-3.5 px-4 text-center text-blue-900 font-bold print:text-blue-900">Hadir (H)</th>
                          <th className="py-3.5 px-3 text-center text-amber-500 print:text-amber-800 font-bold">Izin (I)</th>
                          <th className="py-3.5 px-3 text-center text-sky-600 print:text-sky-800 font-bold">Sakit (S)</th>
                          <th className="py-3.5 px-3 text-center text-red-500 print:text-rose-800 font-bold">Alpa (A)</th>
                          <th className="py-3.5 px-4 text-center">% Presensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                        {individualRecap.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-slate-450 font-semibold md:text-sm">
                              Belum ada data anggota atau presensi yang memenuhui filter yang diterapkan.
                            </td>
                          </tr>
                        ) : (
                          individualRecap.map((recap, idx) => (
                            <tr key={recap.nama + '-' + idx} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                              <td className="py-3.5 px-4 text-center text-slate-450 font-bold print:text-neutral-500">{idx + 1}</td>
                              <td className="py-3.5 px-4">
                                <span className="font-extrabold text-slate-900 print:text-slate-950">{recap.nama}</span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 font-semibold no-print">{recap.nomorWA}</td>
                              <td className="py-3.5 px-4 text-center font-extrabold text-blue-900 print:text-blue-900 text-sm">{recap.hadir}</td>
                              <td className="py-3.5 px-3 text-center font-bold text-amber-500 print:text-amber-800 text-sm">{recap.izin}</td>
                              <td className="py-3.5 px-3 text-center font-bold text-sky-600 print:text-sky-800 text-sm">{recap.sakit}</td>
                              <td className="py-3.5 px-3 text-center font-bold text-red-500 print:text-rose-800 text-sm">{recap.alpa}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] shadow-sm ${
                                  recap.persentase >= 80 
                                    ? 'bg-blue-50 text-blue-900 border border-blue-100 print:bg-blue-100 print:text-blue-900' 
                                    : recap.persentase >= 50 
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100 print:bg-amber-100 print:text-amber-800' 
                                    : 'bg-rose-50 text-rose-600 border border-rose-100 print:bg-rose-100 print:text-rose-800'
                                }`}>
                                  {recap.persentase}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PRINT ONLY: Signatures at bottom */}
                  <div className="hidden print:grid grid-cols-2 gap-12 mt-16 text-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-500">Mengetahui,</p>
                      <p className="font-bold text-slate-900 mt-16">( ___________________________ )</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Pembina Halaqah</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500">Penanggung Jawab,</p>
                      <p className="font-bold text-slate-900 mt-16">( {user?.displayName || 'Administrator'} )</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Koordinator Halaqah 5.0</p>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ----------------- TAB: SCAN PRESENSI (QR READER) ----------------- */}
            {activeTab === 'scan' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visualizer Qr Scanner Section */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Session Context setup card */}
                  <div className="glass-card rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-blue-900" />
                      <h4 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Konfigurasi Pengajian</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Pilih Pertemuan</label>
                        <select
                          value={sessionId}
                          onChange={(e) => { setSessionId(e.target.value); playSoundEffect('click'); }}
                          className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-semibold cursor-pointer border border-slate-200 text-slate-800 bg-white"
                        >
                          <option value="Pertemuan 1" className="bg-white text-slate-900">Pertemuan 1</option>
                          <option value="Pertemuan 2" className="bg-white text-slate-900">Pertemuan 2</option>
                          <option value="Pertemuan 3" className="bg-white text-slate-900">Pertemuan 3</option>
                          <option value="Pertemuan 4" className="bg-white text-slate-900">Pertemuan 4</option>
                          <option value="Pertemuan 5" className="bg-white text-slate-900">Pertemuan 5</option>
                          <option value="Pertemuan 6" className="bg-white text-slate-900">Pertemuan 6</option>
                          <option value="Pertemuan 7" className="bg-white text-slate-900">Pertemuan 7</option>
                          <option value="Pertemuan 8" className="bg-white text-slate-900">Pertemuan 8</option>
                          <option value="Pertemuan 9" className="bg-slate-900">Pertemuan 9</option>
                          <option value="Pertemuan 10" className="bg-white text-slate-900">Pertemuan 10</option>
                          <option value="Pertemuan 11" className="bg-white text-slate-900">Pertemuan 11</option>
                          <option value="Pertemuan 12" className="bg-white text-slate-900">Pertemuan 12</option>
                          <option value="Pertemuan 13" className="bg-white text-slate-900">Pertemuan 13</option>
                          <option value="Pertemuan 14" className="bg-white text-slate-900">Pertemuan 14</option>
                          <option value="Pertemuan 15" className="bg-white text-slate-900">Pertemuan 15</option>
                          <option value="Pertemuan 16" className="bg-white text-slate-900 font-semibold">Pertemuan 16</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* QR camera component */}
                  <QrScanner
                    onScanSuccess={handleQrScanSuccess}
                    isScanningActive={isScannerActive}
                    onScanningStateChange={setIsScannerActive}
                  />
                </div>

                {/* Manual form input & Session scanned log */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Manual search and register form inside scan tab */}
                  <div className="glass-card bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Input Presensi Manual</h3>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Cari nama anggota dari database untuk didaftarkan hadir langsung tanpa scan.</p>
                    </div>

                    <div className="flex flex-wrap gap-3 items-end bg-white">
                      <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Cari Anggota</label>
                        <select
                          value={manualSearchText}
                          onChange={(e) => setManualSearchText(e.target.value)}
                          className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-semibold cursor-pointer border border-slate-200 text-slate-800 bg-white"
                        >
                          <option value="" className="bg-white text-slate-900">-- Pilih Anggota --</option>
                          {state.members.map((m, mIdx) => (
                            <option key={m.nama + '-' + mIdx} value={m.nama} className="bg-white text-slate-900">{m.nama}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32 flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Keterangan</label>
                        <select
                          value={manualStatus}
                          onChange={(e) => setManualStatus(e.target.value as any)}
                          className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-semibold cursor-pointer border border-slate-200 text-slate-800 bg-white"
                        >
                          <option value="Hadir" className="bg-white text-slate-900">Hadir</option>
                          <option value="Izin" className="bg-white text-slate-900">Izin</option>
                          <option value="Sakit" className="bg-white text-slate-900">Sakit</option>
                          <option value="Alpa" className="bg-white text-slate-900">Alpa</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          if (!manualSearchText) {
                            showToast('Silakan pilih anggota terlebih dahulu.');
                            return;
                          }
                          handleManualCheckIn(manualSearchText, manualStatus);
                          setManualSearchText('');
                        }}
                        className="py-2.5 px-5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Rekam Presensi
                      </button>
                    </div>
                  </div>

                  {/* Scanned Presence logs in this browser active session */}
                  <div className="glass-card rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                        <h4 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Papan Log Kehadiran Hari Ini</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Daftar kehadiran yang baru dicatatkan oleh Admin.</p>
                      </div>
                      <Volume2 className="w-4 h-4 text-blue-900 animate-pulse" />
                    </div>

                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[340px] bg-white">
                      {state.attendance.length === 0 ? (
                        <div className="py-12 text-center text-slate-450 text-xs font-semibold">
                          Belum ada aktivitas presensi atau scan hari ini.
                        </div>
                      ) : (
                        state.attendance.slice(0, 50).map((record, idx) => (
                          <div key={record.timestamp + idx} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-900 border border-blue-100/60 font-bold flex items-center justify-center text-[10px]">
                                {state.attendance.length - idx}
                              </span>
                              <div>
                                <span className="font-extrabold text-slate-900 block">{record.nama}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">Pertemuan: {record.pertemuan} • Pendamping: Kelompok Halaqah</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400 font-mono font-semibold">{record.timestamp.split(' ')[1] || record.timestamp}</span>
                              <span className={`px-2 py-0.5 font-bold uppercase tracking-wider text-[9px] rounded-md ${
                                record.status === 'Hadir' 
                                  ? 'bg-blue-50 text-blue-900 border border-blue-100' 
                                  : record.status === 'Izin' 
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                  : 'bg-rose-50 text-rose-600 border border-rose-100'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ----------------- TAB: ANGGOTA (MEMBERS) ----------------- */}
            {activeTab === 'members' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Member Enrollment Form */}
                <div className="lg:col-span-1">
                  <div className="glass-card bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5 sticky top-24">
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Pendaftaran Anggota Baru</h3>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Lengkapi data di bawah untuk didaftarkan langsung ke Google Sheets secara real-time.</p>
                    </div>

                    <form onSubmit={handleAddMemberSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={newMemberForm.nama}
                          onChange={(e) => setNewMemberForm({...newMemberForm, nama: e.target.value})}
                          placeholder="Contoh: Muhammad Ihsan"
                          className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Alamat Tinggal</label>
                        <input
                          type="text"
                          value={newMemberForm.alamat}
                          onChange={(e) => setNewMemberForm({...newMemberForm, alamat: e.target.value})}
                          placeholder="Contoh: Jl. Sudirman No 15"
                          className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Nomor WhatsApp</label>
                        <input
                          type="tel"
                          value={newMemberForm.nomorWA}
                          onChange={(e) => setNewMemberForm({...newMemberForm, nomorWA: e.target.value})}
                          placeholder="Contoh: 081234567890"
                          className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingMember}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        {isSubmittingMember ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>{isSubmittingMember ? 'Mendaftarkan...' : 'Daftarkan Anggota'}</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Member List Directory with Card generation link */}
                <div className="lg:col-span-2">
                  <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    
                    <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Daftar Anggota Halaqah</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Daftar bimbingan anggota aktif pembinaan harian.</p>
                      </div>
                      <span className="px-3 py-1 text-[10px] font-extrabold text-blue-900 bg-blue-50 border border-blue-100 rounded-lg">
                        {state.members.length} Anggota
                      </span>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <th className="py-3 px-4 w-12 text-center">No</th>
                            <th className="py-3 px-4">Nama</th>
                            <th className="py-3 px-4">WhatsApp</th>
                            <th className="py-3 px-4">Alamat</th>
                            <th className="py-3 px-4 text-center">Kartu QR Member</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {state.members.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                                Belum ada anggota yang terdaftar di Google Sheets. Silakan tambahkan anggota baru!
                              </td>
                            </tr>
                          ) : (
                            state.members.map((member, idx) => (
                              <tr key={member.nama + idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-3.5 px-4 font-extrabold text-slate-950">{member.nama}</td>
                                <td className="py-3.5 px-4 font-semibold text-slate-600">{member.nomorWA}</td>
                                <td className="py-3.5 px-4 text-slate-505 truncate max-w-[150px]">{member.alamat}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => {
                                      setActiveQrMember(member);
                                      playSoundEffect('click');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-100 font-bold text-[10px] rounded-lg transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                                  >
                                    <Barcode className="w-3.5 h-3.5" />
                                    <span>Lihat Kartu</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ----------------- TAB: PEMBINA (MENTOR MANAGEMENT) ----------------- */}
            {activeTab === 'pembina' && (
              <div className="flex flex-col gap-8">
                
                {/* 1. Pembina Directory and Addition Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                   {/* Form Pembina Baru */}
                  <div className="lg:col-span-1">
                    <div className="glass-card bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5 sticky top-24">
                      <div>
                        <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Daftar Pembina Baru</h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">Tambahkan guru/pembimbing ustadz yang memimpin aktivitas bimbingan halaqah.</p>
                      </div>

                      <form onSubmit={handleAddPembinaSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Nama Lengkap Pembina</label>
                          <input
                            type="text"
                            required
                            value={newPembinaForm.nama}
                            onChange={(e) => setNewPembinaForm({...newPembinaForm, nama: e.target.value})}
                            placeholder="Contoh: Ustadz Ahmad Fauzi"
                            className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Alamat</label>
                          <input
                            type="text"
                            value={newPembinaForm.alamat}
                            onChange={(e) => setNewPembinaForm({...newPembinaForm, alamat: e.target.value})}
                            placeholder="Contoh: Perum Graha Indah Blok C3"
                            className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Nomor WA</label>
                          <input
                            type="tel"
                             value={newPembinaForm.nomorWA}
                            onChange={(e) => setNewPembinaForm({...newPembinaForm, nomorWA: e.target.value})}
                            placeholder="Contoh: 08571234567"
                            className="w-full glass-input border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-semibold bg-white"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingPembina}
                          className="w-full inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          {isSubmittingPembina ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          <span>{isSubmittingPembina ? 'Menyimpan...' : 'Tambahkan Pembina'}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Pembina active list Directory */}
                  <div className="lg:col-span-2">
                    <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                          <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Majelis Guru / Dewan Pembina</h3>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">Daftar ustadz dan pendamping aktif di Halaqah 5.0.</p>
                        </div>
                        <span className="px-3 py-1 text-[10px] font-extrabold text-blue-900 bg-blue-50 border border-blue-100 rounded-lg">
                          {state.pembina.length} Pembina
                        </span>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                              <th className="py-3 px-4 w-12 text-center">No</th>
                              <th className="py-3 px-4">Nama Pembina</th>
                              <th className="py-3 px-4">Alamat</th>
                              <th className="py-3 px-4 font-mono">No WA Contact</th>
                              <th className="py-3 px-4">Tanggal Gabung</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {state.pembina.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 font-semibold">
                                  Belum ada Pembina terdaftar. Silakan tambahkan pembina baru untuk membimbing session halaqah.
                                </td>
                              </tr>
                            ) : (
                              state.pembina.map((p, idx) => (
                                <tr key={p.nama + idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                  <td className="py-3.5 px-4 font-extrabold text-slate-950">{p.nama}</td>
                                  <td className="py-3.5 px-4 text-slate-600">{p.alamat}</td>
                                  <td className="py-3.5 px-4 text-slate-600 font-mono font-semibold">{p.nomorWA}</td>
                                  <td className="py-3.5 px-4 text-slate-500">{p.tanggalBergabung}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. PRESENSI DAFTAR HADIR PEMBINA SECTION */}
                <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Presensi Kehadiran Pembina / Guru</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Formulir absensi pimpinan ustadz/pembina untuk merekam kehadiran dewan pengajar setiap pertemuan.</p>
                  </div>

                  {state.pembina.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs font-bold">
                      Silakan daftarkan pembina terlebih dahulu sebelum dapat mengisi presensi kehadiran dewan pembina.
                    </div>
                  ) : (
                    <form onSubmit={handlePembinaAttendanceSubmit} className="flex flex-col gap-6">
                      
                      {/* Session context selector */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Pertemuan Pembina</label>
                          <select
                            value={pembinaSessionId}
                            onChange={(e) => setPembinaSessionId(e.target.value)}
                            className="w-full glass-select rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-900 font-semibold cursor-pointer border border-slate-200 text-slate-800 bg-white"
                          >
                            <option value="Pertemuan 1" className="bg-white text-slate-900">Pertemuan 1</option>
                            <option value="Pertemuan 2" className="bg-white text-slate-900">Pertemuan 2</option>
                            <option value="Pertemuan 3" className="bg-white text-slate-900">Pertemuan 3</option>
                            <option value="Pertemuan 4" className="bg-white text-slate-900">Pertemuan 4</option>
                            <option value="Pertemuan 5" className="bg-white text-slate-900">Pertemuan 5</option>
                            <option value="Pertemuan 6" className="bg-white text-slate-900">Pertemuan 6</option>
                            <option value="Pertemuan 7" className="bg-white text-slate-900">Pertemuan 7</option>
                            <option value="Pertemuan 8" className="bg-white text-slate-900">Pertemuan 8</option>
                            <option value="Pertemuan 9" className="bg-white text-slate-900">Pertemuan 9</option>
                            <option value="Pertemuan 10" className="bg-white text-slate-900 font-semibold">Pertemuan 10</option>
                            <option value="Pertemuan 11" className="bg-white text-slate-900">Pertemuan 11</option>
                            <option value="Pertemuan 12" className="bg-white text-slate-900">Pertemuan 12</option>
                            <option value="Pertemuan 13" className="bg-white text-slate-900">Pertemuan 13</option>
                            <option value="Pertemuan 14" className="bg-white text-slate-900">Pertemuan 14</option>
                            <option value="Pertemuan 15" className="bg-white text-slate-900">Pertemuan 15</option>
                            <option value="Pertemuan 16" className="bg-white text-slate-900 font-bold">Pertemuan 16</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Tanggal Absensi</label>
                          <div className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                            {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Checklist grid list */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                        {state.pembina.map((p, pIdx) => (
                          <div key={p.nama + '-' + pIdx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs hover:bg-slate-50 transition-colors">
                            <span className="font-extrabold text-slate-900">{p.nama}</span>
                            
                            {/* Attendance values selectors radio group or buttons */}
                            <div className="flex gap-2">
                              {['Hadir', 'Izin', 'Sakit', 'Alpa'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setPembinaAttendanceForm(prev => ({
                                    ...prev,
                                    [p.nama]: st as any
                                  }))}
                                  className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                                    pembinaAttendanceForm[p.nama] === st
                                      ? st === 'Hadir' 
                                        ? 'bg-blue-900 border-blue-900 text-white shadow-sm' 
                                        : st === 'Izin' 
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-sm' 
                                        : st === 'Sakit' 
                                        ? 'bg-teal-600 border-teal-500 text-white shadow-sm' 
                                        : 'bg-red-600 border-red-500 text-white shadow-sm'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmittingPembinaAttendance}
                          className="py-2.5 px-6 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {isSubmittingPembinaAttendance ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>{isSubmittingPembinaAttendance ? 'Merekam Kehadiran...' : 'Simpan Presensi Pembina'}</span>
                        </button>
                      </div>

                    </form>
                  )}
                </div>

                {/* 3. LOG OF ACTIVE HISTORIC ATTENDANCE FOR PEMBINA */}
                <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xs font-bold text-blue-950 tracking-wider uppercase">Log Buku Kehadiran Pembina</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Histori presensi pembina halaqah dari Google Sheets.</p>
                  </div>

                  <div className="overflow-x-auto w-full bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                          <th className="py-3 px-4 w-12 text-center">No</th>
                          <th className="py-3 px-4">Nama Pembina</th>
                          <th className="py-3 px-4">Pertemuan</th>
                          <th className="py-3 px-4">Tanggal Kehadiran</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {state.attendancePembina.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-500 font-semibold">
                              Belum ada data riwayat presensi Pembina yang tersimpan di Google Sheet.
                            </td>
                          </tr>
                        ) : (
                          state.attendancePembina.map((ap, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                              <td className="py-3 px-4 font-extrabold text-slate-950">{ap.nama}</td>
                              <td className="py-3 px-4 font-semibold text-slate-600">{ap.pertemuan}</td>
                              <td className="py-3 px-4 text-slate-500 font-semibold">{ap.tanggal}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2.5 py-0.5 font-extrabold uppercase text-[9px] rounded-md ${
                                  ap.status === 'Hadir' 
                                    ? 'bg-blue-50 text-blue-900 border border-blue-100' 
                                    : ap.status === 'Izin' 
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                  {ap.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ----------------- TAB: GOOGLE SHEETS SYNC ----------------- */}
            {activeTab === 'sheets' && (
              <div className="flex flex-col gap-8 animate-fade-in select-text">
                
                {/* 1. Connection Status Banner */}
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs ${
                  appsScriptUrl 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex gap-4 items-start">
                    <div className={`p-3 rounded-xl ${appsScriptUrl ? 'bg-emerald-600' : 'bg-amber-600'} text-white shadow-sm`}>
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {appsScriptUrl ? 'Koneksi Cloud Google Sheets Aktif' : 'Penyimpanan Lokal - Google Sheets Belum Terhubung'}
                      </h3>
                      <p className="text-xs opacity-90 leading-relaxed mt-1 font-semibold">
                        {appsScriptUrl 
                          ? 'Setiap penambahan Anggota, Pembina, dan Presensi akan terkirim secara otomatis (real-time) ke Google Sheet Anda tanpa biaya billing.' 
                          : 'Saat ini aplikasi berjalan luring di browser Anda. Anda bisa mengaktifkan integrasi Google Sheet secara gratis menggunakan modul Apps Script di bawah.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {appsScriptUrl && (
                      <button
                        onClick={() => handleSyncFromAppsScript()}
                        disabled={isRefreshing}
                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Tarik Data Sheet</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Configuration Form */}
                <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Konfigurasi Jembatan Apps Script (100% Gratis & Tanpa Billing)</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Masukkan URL Aplikasi Web Google Apps Script hasil penyebaran (deploy) untuk memulai integrasi.</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">URL Aplikasi Web Google Apps Script</label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={appsScriptUrl}
                        onChange={(e) => {
                          const url = e.target.value.trim();
                          setAppsScriptUrl(url);
                          localStorage.setItem('halaqah_apps_script_url', url);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 rounded-xl px-4 py-3 text-xs focus:outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                      />
                      {appsScriptUrl && (
                        <button
                          onClick={() => {
                            setAppsScriptUrl('');
                            localStorage.removeItem('halaqah_apps_script_url');
                            showToast('Koneksi Google Sheet dinonaktifkan.');
                          }}
                          className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer animate-fade-in"
                        >
                          Putuskan Koneksi
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <div className="flex-1 min-w-[250px]">
                      <h4 className="font-bold text-xs text-slate-805">Unggah Database Lokal ke Sheet</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Jika sheet Anda kosong atau Anda baru memasang script baru, klik tombol ini untuk menyalin semua data lokal di browser ini ke dalam Google Sheet.
                      </p>
                    </div>
                    <button
                      onClick={handleBulkUploadToAppsScript}
                      disabled={isRefreshing || !appsScriptUrl}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-center"
                    >
                      Unggah Semua Data Lokal
                    </button>
                  </div>
                </div>

                {/* 3. Steps and Copier Section */}
                <div className="glass-card bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Panduan Pemasangan Google Apps Script (5 Menit Selesai)</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Ikuti langkah-langkah mudah berikut untuk mengintegrasikan Google Spreadsheet Anda secara gratis:</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-medium leading-relaxed">
                    <div className="flex flex-col gap-4">
                      {/* Step 1 */}
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 text-white font-extrabold flex items-center justify-center shrink-0">1</div>
                        <div>
                          <p className="font-bold text-slate-800">Buka Spreadsheet Target Anda</p>
                          <p className="text-slate-500 font-semibold leading-relaxed mt-0.5">
                            Buka link Spreadsheet Anda: <a href="https://docs.google.com/spreadsheets/d/1kfj5Y_UfcrmNZ-eArHQkGyw1bzDPvRSrm1RC3nxohQA/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">1kfj5Y...nxohQA</a>
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 text-white font-extrabold flex items-center justify-center shrink-0">2</div>
                        <div>
                          <p className="font-bold text-slate-800">Masuk ke Menu Apps Script</p>
                          <p className="text-slate-500 font-semibold leading-relaxed mt-0.5">
                            Pilih menu <strong className="text-slate-800">Ekstensi (Extensions)</strong> &gt; <strong className="text-slate-800">Apps Script</strong> di bagian atas layar Google Sheet Anda.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 text-white font-extrabold flex items-center justify-center shrink-0">3</div>
                        <div>
                          <p className="font-bold text-slate-805">Tempelkan Kode Apps Script</p>
                          <p className="text-slate-500 font-semibold leading-relaxed mt-0.5">
                            Hapus semua kode bawaan di editor Apps Script, lalu salin dan tempelkan seluruh kode yang ada di kotak sebelah kanan di bawah ini.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Step 4 */}
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 text-white font-extrabold flex items-center justify-center shrink-0">4</div>
                        <div>
                          <p className="font-bold text-slate-850">Terapkan Aplikasi Web (Deploy)</p>
                          <p className="text-slate-500 font-semibold leading-relaxed mt-0.5 text-justify">
                            Klik tombol biru <strong className="text-slate-800">Terapkan (Deploy)</strong> &gt; <strong className="text-slate-800">Penerapan Baru (New deployment)</strong> di bagian atas editor.
                          </p>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 text-white font-extrabold flex items-center justify-center shrink-0">5</div>
                        <div>
                          <p className="font-bold text-slate-850">Atur Hak Akses Ke "Siapa Saja"</p>
                          <p className="text-slate-500 font-semibold leading-relaxed mt-0.5 text-justify">
                            Pilih jenis: <strong className="text-slate-800">Aplikasi Web (Web App)</strong>.<br />
                            Jalankan sebagai: <strong className="text-slate-800">Saya sendiri (Me)</strong>.<br />
                            Siapa yang memiliki akses: <strong className="text-slate-800">Siapa saja (Anyone)</strong>.<br />
                            Klik <strong className="text-slate-800">Terapkan</strong>, berikan izin Google (Authorize), lalu salin URL Aplikasi Web yang dihasilkan dan tempelkan di kotak isian di atas!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy code container */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <span>Kode Apps Script (Copy Paste Ke Google Sheet)</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
                          showToast('Kode berhasil disalin ke clipboard!');
                        }}
                        className="px-3 py-1 bg-emerald-700 border border-emerald-800 text-white rounded-lg hover:bg-emerald-800 transition-colors pointer-events-auto cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                      >
                        <FileCheck2 className="w-3" />
                        <span>Salin Kode</span>
                      </button>
                    </div>

                    <textarea
                      readOnly
                      rows={12}
                      className="w-full bg-slate-900 border border-slate-950 text-slate-100 font-mono text-[10px] p-4 rounded-xl leading-relaxed focus:outline-none focus:ring-0"
                      value={APPS_SCRIPT_TEMPLATE}
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

        </main>
      )}

      {/* DETAILED QR CARD LIGHTBOX POPUP MODAL */}
      <AnimatePresence>
        {activeQrMember && (
          <MemberCard
            member={activeQrMember}
            onClose={() => {
              setActiveQrMember(null);
              playSoundEffect('click');
            }}
          />
        )}
      </AnimatePresence>

      {/* FOOTER SECTION */}
      <footer className="mt-auto py-8 text-center text-[10px] text-slate-500 font-semibold border-t border-slate-200 no-print flex flex-col sm:flex-row items-center justify-between px-12 gap-2 relative z-10">
        <p className="text-slate-500">© 2026 Administrasi Halaqah 5.0. Hak Cipta Dilindungi.</p>
        <p className="flex items-center gap-1.5 uppercase font-bold tracking-widest text-blue-900">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Google Drive Sync</span>
        </p>
      </footer>

    </div>
  );
}
