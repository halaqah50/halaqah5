import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isScanningActive: boolean;
  onScanningStateChange: (isActive: boolean) => void;
}

export default function QrScanner({
  onScanSuccess,
  isScanningActive,
  onScanningStateChange,
}: QrScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedText = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);

  // Success beep sound
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch check sound
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Web Audio check failed:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      if (!isMounted) return;
      setErrorMessage(null);
      setSuccessMessage(null);
      lastScannedText.current = null;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setHasCameraPermission(false);
          setErrorMessage('Kamera tidak ditemukan pada perangkat ini.');
          onScanningStateChange(false);
          return;
        }

        setHasCameraPermission(true);
        const scanner = new Html5Qrcode('qr-reader-container');
        qrScannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width, height) => {
              // Ensure minimum qrbox size is strictly at least 50px to prevent library validation error
              const calculated = Math.min(width, height) * 0.7;
              const size = Math.max(50, Math.round(calculated));
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            const now = Date.now();
            if (lastScannedText.current === decodedText && now - lastScannedTime.current < 2500) {
              return;
            }

            lastScannedText.current = decodedText;
            lastScannedTime.current = now;

            playSuccessBeep();
            if (isMounted) {
              setSuccessMessage(`Berhasil menscan: "${decodedText}"`);
            }

            onScanSuccess(decodedText);

            setTimeout(() => {
              if (isMounted) {
                setSuccessMessage(null);
              }
            }, 3000);
          },
          () => {
            // Un-detected frames are ignored
          }
        );
      } catch (err: any) {
        console.error('Failed to start QR scanner:', err);
        if (isMounted) {
          setErrorMessage(`Gagal mengakses kamera: ${err.message || err}`);
          setHasCameraPermission(false);
          onScanningStateChange(false);
        }
      }
    };

    const stopScanner = async () => {
      const activeScanner = qrScannerRef.current;
      if (activeScanner) {
        try {
          if (activeScanner.isScanning) {
            await activeScanner.stop();
          }
        } catch (err) {
          console.warn('Silenced stop scanner error:', err);
        } finally {
          qrScannerRef.current = null;
        }
      }
    };

    if (isScanningActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isScanningActive]);

  const toggleScanner = () => {
    onScanningStateChange(!isScanningActive);
  };

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto w-full">
      <div className="text-center mb-4">
        <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wider">Scan QR Code Kehadiran</h3>
        <p className="text-[10px] text-slate-500 mt-1 font-semibold">
          Arahkan QR Code anggota halaqah pada kartu ke arah kamera pembina untuk input kehadiran cepat.
        </p>
      </div>

      <div className="relative w-full aspect-square max-w-[280px] bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-200">
        <div id="qr-reader-container" className="w-full h-full"></div>

        {/* Framing Grid Overlay */}
        {isScanningActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[180px] h-[180px] border-2 border-dashed border-blue-900 rounded-lg animate-pulse flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-900/20 rounded-full animate-ping"></div>
            </div>
            {/* Real-time laser line scanning effect */}
            <div className="absolute w-full h-[2px] bg-blue-900 top-1/4 left-0 right-0 shadow-[0_0_8px_rgba(30,58,138,0.8)] animate-[bounce_3s_infinite]" />
          </div>
        )}

        {!isScanningActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 bg-slate-50">
            <Camera className="w-12 h-12 text-slate-400 stroke-[1.5] mb-2 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">Kamera Dinatikan</span>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="w-full mt-4">
        {isScanningActive ? (
          <button
            type="button"
            onClick={toggleScanner}
            className="w-full py-2.5 px-4 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all rounded-xl border border-red-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            Hentikan Kamera
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleScanner}
            className="w-full py-2.5 px-4 text-xs font-extrabold text-white bg-blue-900 hover:bg-blue-950 transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Camera className="w-4 h-4 text-white" /> Aktifkan Scanner QR
          </button>
        )}
      </div>

      {/* Error / Success states */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600 w-full animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-900 w-full animate-fade-in font-semibold">
          <CheckCircle className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
