import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { inviteService } from '../../services/inviteService';
import { InvitePublicInfo } from '../../types';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';

const InviteResponsePage = () => {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InvitePublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<'accepted' | 'declined' | null>(null);
  const [qrValue, setQrValue] = useState('');

  // Detect language from invite
  const isArabic = invite?.event_title ? true : false;

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await inviteService.getInvite(token);
        if (res.success && res.data) {
          setInvite(res.data);
          if (res.data.response_status === 'accepted') {
            setResponded('accepted');
            if (res.data.qr_code_image) setQrValue(res.data.qr_code_image);
          } else if (res.data.response_status === 'declined') {
            setResponded('declined');
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleRespond = async (response: 'accepted' | 'declined') => {
    if (!token || responding) return;
    setResponding(true);
    try {
      const res = await inviteService.respond(token, response);
      if (res.success) {
        setResponded(response);
        if (response === 'accepted' && res.data?.qr_code_url) {
          setQrValue(res.data.qr_code_url);
        } else if (response === 'accepted') {
          // Fallback QR content
          setQrValue(`${window.location.origin}/invite/${token}`);
        }
      }
    } catch {
      // ignore
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-gray-600">الدعوة غير موجودة أو منتهية الصلاحية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50" dir="rtl">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-6">
        {/* Card preview */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          {invite.card_image ? (
            <img src={invite.card_image} alt="Invitation Card" className="w-full" />
          ) : (
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 text-center">
              <div className="text-5xl mb-3">📨</div>
              <p className="text-gray-500 text-sm italic">{invite.welcome_message}</p>
            </div>
          )}

          <div className="p-5 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 text-center">
              {invite.event_title}
            </h2>
            {invite.invitee_name && (
              <p className="text-center text-purple-700 font-medium">{invite.invitee_name}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              {formatDate(invite.event_date, 'ar')}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              {invite.location_text}
            </div>
          </div>
        </div>

        {/* Response section */}
        {responded === null && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <p className="text-center text-sm text-gray-600 mb-4">هل ستحضر الفعالية؟</p>
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
              loading={responding}
              onClick={() => handleRespond('accepted')}
            >
              <CheckCircle size={18} />
              سأحضر
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
              loading={responding}
              onClick={() => handleRespond('declined')}
            >
              <XCircle size={18} />
              لن أتمكن من الحضور
            </Button>
          </div>
        )}

        {/* Accepted — show QR */}
        {responded === 'accepted' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">شكراً! نتطلع لرؤيتك</h3>
            <p className="text-sm text-gray-500 mb-5">أرِ هذا الرمز عند الدخول</p>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={qrValue || `${window.location.href}`}
                  size={180}
                  level="M"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
              <MapPin size={14} />
              {invite.location_text}
            </div>
          </div>
        )}

        {/* Declined */}
        {responded === 'declined' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">شكراً لإخبارنا</h3>
            <p className="text-sm text-gray-500">نتمنى لك يوماً سعيداً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteResponsePage;
