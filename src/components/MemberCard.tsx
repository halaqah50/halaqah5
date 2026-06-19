import { Member } from '../types';
import { QrCode, Smartphone, MapPin, Calendar, Printer, X } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClose: () => void;
}

function formatToDdMmYyyy(dateStr: string): string {
  if (!dateStr) return '';
  
  const cleaned = dateStr.trim();
  
  // Try pattern matching for dd/mm/yyyy with or without times (e.g., "17/06/2026 07:58:00" or "17-06-2026" or "17/6/2026")
  const slashDashRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const match = cleaned.match(slashDashRegex);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${day}-${month}-${year}`;
  }

  // Indonesian Text Month parser, e.g. "18 Januari 2026" or "18 Jan 2026"
  const indonesianMonths: Record<string, string> = {
    januari: '01', jan: '01',
    februari: '02', feb: '02',
    maret: '03', mar: '03',
    april: '04', apr: '04',
    mei: '05',
    juni: '06', jun: '06',
    juli: '07', jul: '07',
    agustus: '08', agu: '08', ags: '08',
    september: '09', sep: '09',
    oktober: '10', okt: '10',
    november: '11', nov: '11',
    desember: '12', des: '12'
  };

  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.length >= 3) {
    const dVal = parseInt(words[0], 10);
    const yVal = parseInt(words[2], 10);
    if (!isNaN(dVal) && !isNaN(yVal) && yVal > 1900 && yVal < 2100) {
      const monthWord = words[1];
      const mVal = indonesianMonths[monthWord];
      if (mVal) {
        return `${String(dVal).padStart(2, '0')}-${mVal}-${yVal}`;
      }
    }
  }

  // Try parsing with native Date if everything else fails
  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (err) {
    // ignore
  }

  return cleaned;
}

export default function MemberCard({ member, onClose }: MemberCardProps) {
  // Address is limited to 25 characters
  const rawAlamat = member.alamat || '';
  const limitedAlamat = rawAlamat.substring(0, 25);
  
  // Date is formatted strictly to dd-mm-yyyy without time
  const formattedDate = formatToDdMmYyyy(member.tanggalBergabung);

  // We use QR Server API to generate high-fidelity vectors
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(member.nama)}&color=0f172a&margin=10`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up blocker dimatikan.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Anggota - ${member.nama}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;750&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #f8fafc;
              margin: 0;
            }
            .card {
              width: 320px;
              height: 480px;
              background: #ffffff;
              border-radius: 20px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
              border: 1px solid #e2e8f0;
              overflow: hidden;
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
            }
            .card-header {
              width: 100%;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              padding: 24px 16px;
              color: white;
              box-sizing: border-box;
            }
            .card-title {
              font-size: 18px;
              font-weight: 700;
              letter-spacing: 1.5px;
              margin: 0;
              color: #ffffff;
            }
            .card-subtitle {
              font-size: 11px;
              color: #cbd5e1;
              margin-top: 4px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .card-body {
              flex: 1;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              width: 100%;
              box-sizing: border-box;
            }
            .member-name {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
              margin: 8px 0 2px 0;
            }
            .member-status {
              font-size: 11px;
              font-weight: 600;
              background-color: #eff6ff;
              color: #1e3a8a;
              padding: 4px 12px;
              border-radius: 12px;
              text-transform: uppercase;
            }
            .qr-wrapper {
              margin: 15px 0;
              padding: 10px;
              border: 1px dashed #cbd5e1;
              border-radius: 16px;
              background-color: #f8fafc;
            }
            .qr-code {
              width: 150px;
              height: 150px;
              display: block;
            }
            .meta-info {
              width: 100%;
              text-align: left;
              border-top: 1px solid #f1f5f9;
              padding-top: 12px;
              font-size: 11px;
              color: #475569;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .meta-row {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .meta-tag {
              font-weight: bold;
              color: #64748b;
              width: 100px;
            }
            .card-footer {
              background-color: #f8fafc;
              width: 100%;
              padding: 10px;
              font-size: 9px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              box-sizing: border-box;
            }
            @media print {
              body {
                background: none;
              }
              .card {
                box-shadow: none;
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <div class="card-title">HALAQAH 5.0</div>
              <div class="card-subtitle">Islamic Student Fellowship</div>
            </div>
            <div class="card-body">
              <div>
                <div class="member-status">ANGGOTA AKTIF</div>
                <div class="member-name">${member.nama}</div>
              </div>
              
              <div class="qr-wrapper">
                <img class="qr-code" src="${qrCodeUrl}" alt="QR Code" />
              </div>
              
              <div class="meta-info">
                <div class="meta-row">
                  <span class="meta-tag">WA:</span>
                  <span>${member.nomorWA}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-tag">Alamat:</span>
                  <span>${limitedAlamat}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-tag">Tgl Daftar:</span>
                  <span>${formattedDate}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              Scan kartu ini setiap halaqah untuk daftar hadir otomatis.
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 flex flex-col items-center">
        
        {/* Header controller */}
        <div className="w-full flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">ID Card Preview</span>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Beautiful Physical Card Style */}
        <div className="p-6 flex flex-col items-center w-full">
          <div className="w-72 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col items-center select-none">
            {/* Dark Professional Top Banner */}
            <div className="w-full bg-blue-900 py-4 px-4 text-center border-b border-blue-950">
              <span className="text-white text-sm font-extrabold tracking-[2px] block">HALAQAH 5.0</span>
              <span className="text-[10px] text-blue-100 block mt-0.5 uppercase tracking-widest font-bold">Sistem Pembinaan Karakter</span>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col items-center text-center w-full bg-white">
              <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-100 mb-2">
                ANGGOTA AKTIF
              </span>
              <h4 className="text-lg font-extrabold text-slate-800 truncate max-w-full leading-tight">
                {member.nama}
              </h4>

              {/* QR wrapper */}
              <div className="mt-4 mb-4 p-2 bg-white rounded-xl border border-slate-200">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-32 h-32 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Details */}
              <div className="w-full space-y-1.5 mt-1 border-t border-slate-100 pt-3 text-[11px] text-slate-600 text-left">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-blue-900" />
                  <span className="font-bold text-slate-500 w-24 shrink-0">No. WA:</span>
                  <span className="text-slate-800 font-semibold truncate">{member.nomorWA}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  <span className="font-bold text-slate-500 w-24 shrink-0">Alamat:</span>
                  <span className="text-slate-800 font-semibold truncate">{limitedAlamat}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-900" />
                  <span className="font-bold text-slate-500 w-24 shrink-0">Tgl Daftar:</span>
                  <span className="text-slate-800 font-semibold">{formattedDate}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full bg-slate-50 border-t border-slate-100 py-2.5 text-center text-[9px] text-slate-500 font-bold">
              Scan kartu ini untuk pendaftaran hadir real-time
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="w-full bg-slate-50 p-4 border-t border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Kartu QR
          </button>
        </div>

      </div>
    </div>
  );
}
