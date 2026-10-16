import React, { useState } from 'react'
import { FiPhone, FiMessageSquare, FiCheck, FiX, FiClock, FiChevronLeft, FiChevronRight, FiMapPin, FiUser, FiInfo } from 'react-icons/fi'

export default function ColdCallQueue({ coldLeads = [], onUpdateLeadStatus, onLogActivity, onSelectLead }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quickNote, setQuickNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  if (coldLeads.length === 0) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '48px 24px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#ECFDF5',
          color: '#10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 24
        }}>✓</div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
          Cold Call Queue is Clear!
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
          No prospects currently pending in the "Yet to Reach Out" cold calling pool.
        </p>
      </div>
    )
  }

  const safeIndex = Math.min(currentIndex, coldLeads.length - 1)
  const lead = coldLeads[safeIndex] || coldLeads[0]
  const cleanPhone = (lead.primaryPhone || '').replace(/[^0-9]/g, '')
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const handleOutcome = async (newStatus, noteText, nextFollowUpAt = null) => {
    try {
      setActionLoading(true)
      if (onLogActivity) {
        await onLogActivity(lead.id, 'CALL', noteText || `Cold call outcome: ${newStatus}`)
      }
      if (onUpdateLeadStatus) {
        await onUpdateLeadStatus(lead.id, {
          status: newStatus,
          notes: lead.notes ? `${lead.notes}\n${noteText}` : noteText,
          nextFollowUpAt: nextFollowUpAt || lead.nextFollowUpAt,
          followUpNote: nextFollowUpAt ? noteText : lead.followUpNote
        })
      }
      setQuickNote('')
      // Move to next card in queue
      if (currentIndex < coldLeads.length - 1) {
        setCurrentIndex(currentIndex)
      } else {
        setCurrentIndex(Math.max(0, coldLeads.length - 2))
      }
    } catch (e) {
      alert('Error updating lead: ' + e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoAnswer = () => {
    // Reschedule for tomorrow morning
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(11, 0, 0, 0)
    handleOutcome('YET_TO_REACH_OUT', 'Called prospect: No answer / Ringing. Rescheduled for tomorrow 11:00 AM.', tomorrow.toISOString())
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Top Queue Progress Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: '0 4px'
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
          📞 Cold Call Prospect <span style={{ color: '#FF7A00', fontWeight: 900 }}>{safeIndex + 1}</span> of <span style={{ fontWeight: 800 }}>{coldLeads.length}</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: safeIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: safeIndex === 0 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <FiChevronLeft /> Prev
          </button>
          <button
            onClick={() => setCurrentIndex(Math.min(coldLeads.length - 1, safeIndex + 1))}
            disabled={safeIndex >= coldLeads.length - 1}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: safeIndex >= coldLeads.length - 1 ? 'not-allowed' : 'pointer',
              opacity: safeIndex >= coldLeads.length - 1 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Main Dialer Focus Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: 20,
        padding: '28px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                {lead.name || 'New Prospect'}
              </h2>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 8,
                background: lead.temperature === 'HOT' ? '#FEF2F2' : '#FFF7ED',
                color: lead.temperature === 'HOT' ? '#DC2626' : '#C2410C',
                border: `1px solid ${lead.temperature === 'HOT' ? '#FECACA' : '#FED7AA'}`
              }}>
                {lead.temperature || 'WARM'}
              </span>
            </div>

            {lead.businessName ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
                🏢 {lead.businessName}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>
                No business name recorded
              </div>
            )}

            {lead.city && (
              <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <FiMapPin size={13} color="#94A3B8" /> {lead.city}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectLead(lead)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#475569',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Edit Lead Full Profile
          </button>
        </div>

        {/* Big 1-Tap Dialing Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0284C7, #0369A1)',
          borderRadius: 16,
          padding: '20px 24px',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.25)'
        }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700 }}>
              Primary Mobile Number
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.03em', fontFamily: 'monospace', marginTop: 4 }}>
              +91 {cleanPhone}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => onLogActivity && onLogActivity(lead.id, 'CALL', 'Initiated outbound cold call')}
              style={{
                background: '#FFFFFF',
                color: '#0284C7',
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 900,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <FiPhone size={18} />
              <span>Call Now</span>
            </a>

            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${lead.name || ''}, I saw you might be looking for a POS & QR billing system for ${lead.businessName || 'your restaurant'}. Free for a quick 2-minute call?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLogActivity && onLogActivity(lead.id, 'WHATSAPP', 'Sent cold WhatsApp introduction')}
              style={{
                background: '#16A34A',
                color: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <FiMessageSquare size={16} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Lead Existing Notes & Context */}
        {lead.notes && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              Lead Notes / Inbound Request
            </div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {lead.notes}
            </div>
          </div>
        )}

        {/* Quick Call Outcome Buttons */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
            Post-Call Outcome (1-Click Pipeline Shift)
          </label>

          <input
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            placeholder="Add quick notes from the call (e.g. interested in KOT, 20 tables, wants demo)..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 12,
              outline: 'none'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <button
              disabled={actionLoading}
              onClick={() => handleOutcome('IN_DISCUSSION', quickNote || 'Prospect answered, interested in exploring Cafe QR')}
              style={{
                background: '#EFF6FF',
                border: '1.5px solid #93C5FD',
                color: '#1D4ED8',
                borderRadius: 10,
                padding: '12px 10px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>💬 Interested</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#3B82F6' }}>Move to Discussion</span>
            </button>

            <button
              disabled={actionLoading}
              onClick={() => handleOutcome('DEMO_SCHEDULED', quickNote || 'Booked live demo walkthrough')}
              style={{
                background: '#F5F3FF',
                border: '1.5px solid #C4B5FD',
                color: '#6D28D9',
                borderRadius: 10,
                padding: '12px 10px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>📅 Booked Demo</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#8B5CF6' }}>Schedule Walkthrough</span>
            </button>

            <button
              disabled={actionLoading}
              onClick={handleNoAnswer}
              style={{
                background: '#FFFBEB',
                border: '1.5px solid #FCD34D',
                color: '#B45309',
                borderRadius: 10,
                padding: '12px 10px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>📴 No Answer / Ringing</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#D97706' }}>Retry Tomorrow</span>
            </button>

            <button
              disabled={actionLoading}
              onClick={() => handleOutcome('LOST', quickNote || 'Not interested in Cafe QR / wrong timing')}
              style={{
                background: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                color: '#DC2626',
                borderRadius: 10,
                padding: '12px 10px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span>❌ Not Interested</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#EF4444' }}>Move to Lost</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
