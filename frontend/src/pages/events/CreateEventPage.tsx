import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEventCreationStore } from '../../store/eventCreationStore';
import { eventService } from '../../services/eventService';
import WizardStepper from '../../components/event-creation/WizardStepper';
import EventTypeSelector from '../../components/event-creation/EventTypeSelector';
import DesignSelector from '../../components/event-creation/DesignSelector';
import CardEditor from '../../components/event-creation/CardEditor';
import EventInfoForm from '../../components/event-creation/EventInfoForm';
import InviteesManager from '../../components/event-creation/InviteesManager';
import MessageSettingsForm from '../../components/event-creation/MessageSettingsForm';
import ReviewPayment from '../../components/event-creation/ReviewPayment';
import { Button } from '../../components/ui/Button';
import { EventType, GuestPackage } from '../../types';

const TOTAL_STEPS = 6;

const CreateEventPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const store = useEventCreationStore();
  const [step3FormValid, setStep3FormValid] = useState(false);

  // Reset store when navigating to create page for first time
  useEffect(() => {
    if (store.step === 0 && !store.savedEventId) {
      store.reset();
    }
  }, []);

  const canGoNext = (): boolean => {
    switch (store.step) {
      case 0: return !!store.eventType;
      case 1: return !!(store.selectedDesign || store.customDesignPreview);
      case 2: return true; // Card editor is optional
      case 3: return step3FormValid && store.invitees.length > 0;
      case 4: return true;
      case 5: return false; // handled by ReviewPayment
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!canGoNext()) {
      toast.error(t('common.required'));
      return;
    }

    // Always read fresh state — avoids stale closure when called from setTimeout
    const s = useEventCreationStore.getState();

    // Save to backend progressively
    if (s.step === 3 && !s.savedEventId) {
      // Create draft event on Step 3 (first time we have enough data)
      try {
        const res = await eventService.createEvent({
          event_type: s.eventType!,
          title: s.eventTitle,
          location_text: s.locationText,
          event_date: s.eventDate,
          card_text_name: s.cardTexts.name,
          card_text_date: s.cardTexts.date,
          card_text_location: s.cardTexts.location,
          card_text_welcome: s.cardTexts.welcome,
          message_language: s.messageLanguage,
          include_qr: s.includeQr,
          delivery_method: s.deliveryMethod,
        });
        if (res.success && res.data) {
          s.setSavedEventId(res.data.id);
          // Add invitees
          if (s.invitees.length > 0) {
            await eventService.addInvitees(res.data.id, s.invitees.map(i => ({ name: i.name, phone: i.phone })));
          }
        }
      } catch {
        // Continue in MVP mode without backend
      }
    } else if (s.step === 4 && s.savedEventId) {
      // Update message settings
      try {
        await eventService.updateEvent(s.savedEventId, {
          message_language: s.messageLanguage,
          include_qr: s.includeQr,
          delivery_method: s.deliveryMethod,
        });
      } catch {
        // Continue
      }
    }

    s.setStep(s.step + 1);
  };

  const handleBack = () => {
    if (store.step > 0) store.setStep(store.step - 1);
  };

  const handleSuccess = () => {
    toast.success(t('payment.invitations_sent'));
    store.reset();
    navigate('/events');
  };

  const renderStep = () => {
    switch (store.step) {
      case 0:
        return (
          <EventTypeSelector
            selected={store.eventType}
            onSelect={(type: EventType) => store.setEventType(type)}
          />
        );
      case 1:
        return (
          <DesignSelector
            eventType={store.eventType!}
            selectedDesign={store.selectedDesign}
            customPreview={store.customDesignPreview}
            onSelectDesign={(d) => { store.setSelectedDesign(d); store.setCustomDesignFile(null, null); }}
            onUploadCustom={(file, preview) => { store.setCustomDesignFile(file, preview); store.setSelectedDesign(null); }}
          />
        );
      case 2:
        return (
          <CardEditor
            design={store.selectedDesign}
            customPreview={store.customDesignPreview}
            cardTexts={store.cardTexts}
            onChange={(field, value) => store.setCardTexts({ [field]: value })}
          />
        );
      case 3:
        return (
          <div className="space-y-8">
            <EventInfoForm
              defaultValues={{
                eventTitle: store.eventTitle,
                locationText: store.locationText,
                eventDate: store.eventDate,
              }}
              selectedPackage={store.selectedPackage}
              onSubmit={(data, pkg: GuestPackage) => {
                store.setEventInfo({
                  title: data.eventTitle,
                  location: data.locationText,
                  date: data.eventDate,
                  pkg,
                });
              }}
              onValidityChange={setStep3FormValid}
              formId="event-info"
            />
            <div className="border-t border-gray-200 pt-6">
              <InviteesManager
                invitees={store.invitees}
                onAdd={(inv) => store.addInvitee(inv)}
                onRemove={(phone) => store.removeInvitee(phone)}
                onBulkAdd={(invs) => store.setInvitees([...store.invitees, ...invs])}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <MessageSettingsForm
            messageLanguage={store.messageLanguage}
            includeQr={store.includeQr}
            deliveryMethod={store.deliveryMethod}
            onChange={(s) => store.setMessageSettings(s)}
          />
        );
      case 5:
        return <ReviewPayment onSuccess={handleSuccess} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('events.create_event')}</h1>
      </div>

      <WizardStepper currentStep={store.step} totalSteps={TOTAL_STEPS} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation buttons — hidden on review step */}
      {store.step < 5 && (
        <div className="flex gap-3">
          {store.step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              {t('wizard.back')}
            </Button>
          )}
          <Button
            onClick={store.step === 3 ? () => {
              // Trigger form submit for step 3
              const form = document.getElementById('event-info') as HTMLFormElement;
              form?.requestSubmit();
              // The form's onSubmit will update store; then we advance
              setTimeout(handleNext, 100);
            } : handleNext}
            disabled={!canGoNext()}
            className="flex-1"
          >
            {t('wizard.next')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateEventPage;
