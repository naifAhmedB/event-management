import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrCode, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { eventService } from '../../services/eventService';
import { Event, ScanResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const ScannerPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const preselectedEventId = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(preselectedEventId || '');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventService.listEvents();
        if (res.success && res.data) {
          const active = (Array.isArray(res.data) ? res.data : []).filter(e => e.status === 'active');
          setEvents(active);
          if (!preselectedEventId && active.length > 0) {
            setSelectedEventId(active[0].id);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingEvents(false);
      }
    };
    load();
  }, []);

  const startScanning = async () => {
    if (!selectedEventId) return;
    setScanning(true);
    setScanResult(null);

    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onSuccess = async (decodedText: string) => {
        scanner.clear();
        setScanning(false);

        // Extract invite token from URL
        const token = decodedText.includes('/invite/')
          ? decodedText.split('/invite/').pop() || decodedText
          : decodedText;

        try {
          const res = await eventService.scanQr(selectedEventId, token);
          if (res.success && res.data) {
            setScanResult(res.data);
          } else {
            setScanResult({ valid: false, message: t('scanner.invalid') });
          }
        } catch {
          setScanResult({ valid: false, message: t('common.error') });
        }
      };

      const onError = () => { /* ignore individual frame errors */ };

      scanner.render(onSuccess, onError);
      scannerRef.current = scanner;
    } catch {
      setScanning(false);
      setScanResult({ valid: false, message: t('common.error') });
    }
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

      {/* QR reader container */}
      {scanning && !scanResult && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div id="qr-reader" className="w-full" />
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

      {/* Note about HTTPS */}
      <p className="text-xs text-gray-400 text-center">
        {navigator.mediaDevices ? '' : '⚠️ Camera access requires HTTPS. Use https:// URL.'}
      </p>
    </div>
  );
};

export default ScannerPage;
