import { useState, useEffect } from 'react';
import {
  X, MessageSquare, Send, ExternalLink, AlertTriangle,
  CheckCircle2, Copy, Sparkles, User, Car, Phone, Clock
} from 'lucide-react';
import {
  sanitizeSriLankanPhone,
  generateWhatsAppLink,
  DEFAULT_WHATSAPP_TEMPLATES,
  renderWhatsAppTemplate
} from '../utils/phoneSanitizer';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function WhatsAppModal({
  isOpen,
  onClose,
  recipient = {},
  defaultTemplateId = 'work_started',
  onSuccess
}) {
  if (!isOpen) return null;

  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateId);
  const [customNote, setCustomNote] = useState('');
  const [phoneInput, setPhoneInput] = useState(recipient.phone || '');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sri Lanka Phone Sanitization
  const phoneSanitized = sanitizeSriLankanPhone(phoneInput);

  // Sync state when recipient or template changes
  useEffect(() => {
    if (recipient.phone) {
      setPhoneInput(recipient.phone);
    }
  }, [recipient.phone]);

  useEffect(() => {
    const templateObj = DEFAULT_WHATSAPP_TEMPLATES[selectedTemplate];
    const templateContent = templateObj ? templateObj.content : '';

    const vars = {
      customer_name: recipient.name || recipient.customer || 'Valued Customer',
      vehicle_no: recipient.vehicle ? `${recipient.vehicle} (${recipient.plate || 'Vehicle'})` : (recipient.plate || 'Vehicle'),
      service_name: recipient.service || 'Automotive Service',
      booking_date: recipient.date || recipient.bookingDate || 'Today',
      booking_time: recipient.time || recipient.bookingTime || '09:30 AM',
      total_amount: recipient.total !== undefined ? Number(recipient.total).toFixed(2) : (recipient.cost ? Number(recipient.cost).toFixed(2) : '0.00'),
      assigned_tech: recipient.tech || 'Senior Workshop Technician',
      invoice_no: recipient.invoiceNo || 'INV-2026-00041',
      payment_method: recipient.method || 'Card',
      custom_note: customNote.trim() || 'Front brake pads worn below safety limit (2mm). Brake rotor resurfacing recommended. Additional estimate: Rs. 14,500.'
    };

    setMessageBody(renderWhatsAppTemplate(templateContent, vars));
  }, [selectedTemplate, customNote, recipient]);

  // Fallback / Direct Web WhatsApp
  const handleOpenWhatsAppWeb = async () => {
    if (!phoneSanitized.isValid) {
      toast.warning('Invalid Phone Number', 'Please enter a valid Sri Lankan mobile number (e.g. 077 123 4567).');
      return;
    }

    const waLink = generateWhatsAppLink(phoneSanitized.clean, messageBody);

    // Also record dispatch log in backend
    try {
      await api.whatsapp.send({
        phone: phoneSanitized.clean,
        message: messageBody,
        template_id: selectedTemplate,
        variables: {
          customer_name: recipient.name || recipient.customer || 'Customer',
          vehicle_no: recipient.plate || recipient.vehicle || 'Vehicle'
        }
      });
    } catch (e) {
      console.warn('Backend log sync skipped:', e);
    }

    window.open(waLink, '_blank', 'noopener,noreferrer');
    toast.success('WhatsApp Opened', `Chat launched for ${phoneSanitized.formatted}`);
    if (onSuccess) onSuccess();
    onClose();
  };

  // Automated API Dispatch
  const handleSendViaAPI = async () => {
    if (!phoneSanitized.isValid) {
      toast.warning('Invalid Phone Number', 'Please enter a valid Sri Lankan mobile number (e.g. 077 123 4567).');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.whatsapp.send({
        phone: phoneSanitized.clean,
        message: messageBody,
        template_id: selectedTemplate,
        variables: {
          customer_name: recipient.name || recipient.customer || 'Customer',
          vehicle_no: recipient.plate || recipient.vehicle || 'Vehicle',
          total_amount: recipient.total || recipient.cost || '0.00'
        }
      });

      if (res.success) {
        toast.success(
          'WhatsApp Dispatched',
          `Message sent to ${recipient.name || 'Customer'} (${phoneSanitized.formatted}) [Mode: ${res.mode.toUpperCase()}].`
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error('API Error', res.error || 'Failed to dispatch via API. Opening Web WhatsApp fallback.');
        window.open(res.wa_link || generateWhatsAppLink(phoneSanitized.clean, messageBody), '_blank');
      }
    } catch (err) {
      toast.warning('API Offline — Opening WhatsApp Web', 'Backend automated dispatch unavailable. Opening via WhatsApp Web.');
      const fallbackLink = generateWhatsAppLink(phoneSanitized.clean, messageBody);
      window.open(fallbackLink, '_blank');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    toast.info('Copied', 'Message text copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-handle-bar" />
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Send WhatsApp Notification
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                  background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)'
                }}>
                  🇱🇰 Sri Lanka Standard
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Targeting customer mobile for automated updates or manual chat
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Recipient & Phone Sanitization Strip */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)', padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Customer &amp; Vehicle
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
                {recipient.name || recipient.customer || 'Walk-in Client'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-primary)', marginTop: 2 }}>
                {recipient.vehicle ? `${recipient.vehicle} • ${recipient.plate || ''}` : (recipient.plate || 'No plate registered')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                Customer Phone (Auto-Formatted)
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="e.g. 077 123 4567 or 771234567"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    borderColor: phoneSanitized.isValid ? 'rgba(37,211,102,0.5)' : '#ef4444',
                    paddingRight: 60
                  }}
                />
                <span style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 700, color: phoneSanitized.isValid ? '#25D366' : '#ef4444'
                }}>
                  {phoneSanitized.isSriLankan ? '🇱🇰 +94' : (phoneSanitized.isValid ? '🌐 Valid' : '⚠️ Error')}
                </span>
              </div>
              {phoneSanitized.isValid ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  WhatsApp target: <code style={{ color: '#25D366' }}>{phoneSanitized.clean}</code> ({phoneSanitized.formatted})
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                  {phoneSanitized.error}
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle Event Template Selector */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Select Trigger Lifecycle Template
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {Object.entries(DEFAULT_WHATSAPP_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTemplate(key)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    fontSize: 11.5,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: selectedTemplate === key ? 'rgba(37,211,102,0.12)' : 'var(--bg-surface)',
                    borderColor: selectedTemplate === key ? '#25D366' : 'var(--border-subtle)',
                    color: selectedTemplate === key ? '#25D366' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{tpl.name}</span>
                    {selectedTemplate === key && <CheckCircle2 size={13} style={{ color: '#25D366' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Note for Urgent Alert / Parts Approval */}
          {selectedTemplate === 'urgent_update' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} /> Custom Notice / Reason for Client Action
              </div>
              <textarea
                className="form-control"
                rows={2}
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="e.g. Front brake pads are worn below 2mm. Replacement cost Rs. 14,500. Please approve."
                style={{ fontSize: 12, resize: 'vertical' }}
              />
            </div>
          )}

          {/* Live Rendered Message Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Rendered WhatsApp Message
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '3px 8px', height: 26 }}
              >
                <Copy size={11} /> {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>

            <textarea
              className="form-control mono"
              rows={8}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              style={{
                fontSize: 12,
                lineHeight: 1.5,
                background: '#0d1117',
                color: '#e6edf3',
                borderColor: 'var(--border-subtle)',
                resize: 'vertical',
                whiteSpace: 'pre-wrap'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Formatted with WhatsApp bold (`*text*`) and emoji markup</span>
              <span>{messageBody.length} characters</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', justifyContent: 'space-between', paddingTop: 14 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <div className="modal-footer-actions flex gap-2 flex-wrap" style={{ display: 'flex', gap: 10 }}>
            {/* Zero-Cost Direct Web WhatsApp */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleOpenWhatsAppWeb}
              disabled={!phoneSanitized.isValid}
              style={{
                borderColor: '#25D366',
                color: '#25D366',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ExternalLink size={14} /> Send via WhatsApp Web (wa.me)
            </button>

            {/* Automated API Delivery */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSendViaAPI}
              disabled={isSending || !phoneSanitized.isValid}
              style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
              }}
            >
              <Send size={14} /> {isSending ? 'Sending...' : 'Automated API Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
