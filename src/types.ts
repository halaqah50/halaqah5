export interface Member {
  nama: string;
  alamat: string;
  nomorWA: string;
  tanggalBergabung: string;
  pembina?: string;
}

export interface Attendance {
  timestamp: string;
  nama: string;
  tanggal: string;
  pertemuan: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  pembina: string;
}

export interface Pembina {
  nama: string;
  alamat: string;
  nomorWA: string;
  tanggalBergabung: string;
}

export interface AttendancePembina {
  timestamp: string;
  nama: string;
  tanggal: string;
  pertemuan: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  memberNames: string[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  actionType: string;
  description: string;
}

export interface AppState {
  members: Member[];
  attendance: Attendance[];
  pembina: Pembina[];
  attendancePembina: AttendancePembina[];
  groups?: Group[];
  activityLogs?: ActivityLog[];
  spreadsheetId: string | null;
  isLoading: boolean;
  error: string | null;
}
