import { Member } from '../types';
import { QrCode, Smartphone, MapPin, Calendar, Download, X } from 'lucide-react';
import { useState } from 'react';

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
  // Address is limited to 60 characters
  const rawAlamat = member.alamat || '';
  const limitedAlamat = rawAlamat.substring(0, 60);
  
  // Date is formatted strictly to dd-mm-yyyy without time
  const formattedDate = formatToDdMmYyyy(member.tanggalBergabung);

  // We use QR Server API to generate high-fidelity vectors
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(member.nama)}&color=0f172a&margin=10`;

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImage = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert('Gagal mendownload kartu (Canvas tidak didukung browser ini).');
      setIsDownloading(false);
      return;
    }

    // High resolution card layout: 450px * 680px
    const width = 450;
    const height = 680;
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    // Draw header banner
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(6, 6, width - 12, 110);

    // Draw banner text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ID Card HALAQAH 5.0', width / 2, 61);

    // Reset alignment
    ctx.textBaseline = 'alphabetic';

    // Draw status badge
    const badgeW = 150;
    const badgeH = 26;
    const badgeX = (width - badgeW) / 2;
    const badgeY = 140;
    ctx.fillStyle = '#eff6ff';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('ANGGOTA AKTIF', width / 2, badgeY + 17);

    // Draw Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(member.nama, width / 2, 205);

    // Load and draw QR code
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = qrCodeUrl;
    qrImg.onload = () => {
      const qrSize = 180;
      const qrX = (width - qrSize) / 2;
      const qrY = 230;

      // Draw outline for QR Code
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // Draw white background for QR
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);

      // Draw QR Image
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw divider
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(35, 450);
      ctx.lineTo(width - 35, 450);
      ctx.stroke();

      // Drawer Metadata Fields
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px system-ui, sans-serif';

      // No. WA Row
      ctx.fillStyle = '#64748b';
      ctx.fillText('No. WA:', 45, 485);
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(member.nomorWA, 155, 485);

      // Alamat Row
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('Alamat:', 45, 520);
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 13px system-ui, sans-serif';
      
      const addr = limitedAlamat;
      // Wrap if over 32 characters
      if (addr.length > 32) {
        const line1 = addr.substring(0, 32);
        const line2 = addr.substring(32);
        ctx.fillText(line1, 155, 520);
        ctx.fillText(line2, 155, 538);
      } else {
        ctx.fillText(addr, 155, 520);
      }

      // Tgl Daftar Row
      const dateY = addr.length > 32 ? 570 : 555;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('Tgl Daftar:', 45, dateY);
      ctx.fillStyle = '#1e293b';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText(formattedDate, 155, dateY);

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('Scan kartu ini untuk pendaftaran hadir real-time', width / 2, height - 35);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${member.nama}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error(e);
        alert('Gagal mendownload gambar secara otomatis. Klik kanan pada gambar QR Code di kartu untuk menyimpannya.');
      } finally {
        setIsDownloading(false);
      }
    };

    qrImg.onerror = () => {
      alert('Gagal memuat gambar QR code.');
      setIsDownloading(false);
    };
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
            <div className="w-full bg-blue-900 py-5 px-4 text-center border-b border-blue-950">
              <span className="text-white text-base font-extrabold tracking-[1px] block">ID Card HALAQAH 5.0</span>
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
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {isDownloading ? 'Mengunduh...' : 'Unduh Kartu QR (Save Image)'}
          </button>
        </div>

      </div>
    </div>
  );
}
