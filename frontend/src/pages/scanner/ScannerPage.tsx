import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, CheckCircle, XCircle, AlertCircle, FlipHorizontal } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { eventService } from '../../services/eventService';
import { Event, ScanResult } from '../../types';
import { Button } from '../../components/ui/Button';

interface CameraDevice {
  id: string;
  label: string;
}

const ScannerPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || '');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventService.listEvents();
        if (res.success && res.data) {
          const active = (Array.isArray(res.data) ? res.data : []).filter(e => e.status === 'active');
          setEvents(active);
          if (!preselectedEventId && active.length > 0) setSelectedEventId(active[0].id);
        }
      } catch {
        // ignore
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  const stopScanner = async () => {
    const s = scannerRef.current as { stop: () => Promise<void> } | null;
    if (s) {
      try { await s.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  };

  const startScanner = async (cameraId: string) => {
    const { Html5Qrcode } = await import('html5-qrcode');
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    await qr.start(
      cameraId,
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        await stopScanner();
        setScanning(false);

        const token = decodedText.includes('/invite/')
          ? decodedText.split('/invite/').pop() || decodedText
          : decodedText;

        try {
          const res = await eventService.scanQr(selectedEventId, token);
          setScanResult(res.success && res.data ? res.data : { valid: false, message: t('scanner.invalid') });
        } catch {
          setScanResult({ valid: false, message: t('common.error') });
        }
      },
      () => { /* ignore per-frame errors */ }
    );
  };

  const startScanning = async () => {
    if (!selectedEventId) return;
    setScanning(true);
    setScanResult(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices: CameraDevice[] = await Html5Qrcode.getCameras();

      if (!devices.length) {
        setScanResult({ valid: false, message: 'No camera found' });
        setScanning(false);
        return;
      }

      // Prefer back camera: look for "environment" / "back" in label
      const backIndex = devices.findIndex(d =>
        /back|rear|environment/i.test(d.label)
      );
      const startIndex = backIndex >= 0 ? backIndex : 0;

      setCameras(devices);
      setActiveCameraIndex(startIndex);

      // Give React a tick to render the #qr-reader div before starting
      setTimeout(() => startScanner(devices[startIndex].id), 100);
    } catch {
      setScanning(false);
      setScanResult({ valid: false, message: t('common.error') });
    }
  };

  const flipCamera = async () => {
    if (cameras.length < 2) return;
    await stopScanner();
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
    setTimeout(() => startScanner(cameras[next].id), 100);
  };

  const resetScan = () => {
    setScanResult(null);
    setScanning(false);
  };

  const ResultDisplay = ({ result }: { result: ScanResult }) => {
    if (result.already_arrived) {
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
          <AlertCircle size={56} className="text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-orange-700 mb-2">{t('scanner.already_arrived')}</h2>
          <p className="text-orange-600">{result.guest_name}</p>
        </div>
      );
    }
    if (result.valid) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-700 mb-2">{t('scanner.valid')}</h2>
          <p className="text-gray-600 text-sm mb-1">{t('scanner.guest_name')}</p>
          <p className="text-lg font-semibold text-gray-900">{result.guest_name}</p>
        </div>
      );
    }
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <XCircle size={56} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700">{t('scanner.invalid')}</h2>
        {result.message && <p className="text-red-600 mt-2 text-sm">{result.message}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('scanner.title')}</h1>

      {/* Event selector */}
      {loadingEvents ? (
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{t('scanner.select_event')}</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
            disabled={scanning}
          >
            <option value="">-- {t('scanner.select_event')} --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* QR reader + flip button */}
      {scanning && !scanResult && (
        <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div id="qr-reader" className="w-full" />
          {cameras.length > 1 && (
            <button
              onClick={flipCamera}
              className="absolute bottom-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors"
              title="Switch camera"
            >
              <FlipHorizontal size={20} />
            </button>
          )}
        </div>
      )}

      {/* Scan result */}
      {scanResult && (
        <div>
          <ResultDisplay result={scanResult} />
          <Button onClick={resetScan} className="w-full mt-4" variant="outline">
            <QrCode size={16} />
            {t('scanner.scan_another')}
          </Button>
        </div>
      )}

      {/* Start button */}
      {!scanning && !scanResult && (
        <Button
          onClick={startScanning}
          disabled={!selectedEventId}
          className="w-full gap-2"
          size="lg"
        >
          <QrCode size={18} />
          {t('scanner.start_scanning')}
        </Button>
      )}

      {!navigator.mediaDevices && (
        <p className="text-xs text-gray-400 text-center">
          ⚠️ Camera access requires HTTPS.
        </p>
      )}
    </div>
  );
};

export default ScannerPage;
