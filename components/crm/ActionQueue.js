import React from 'react'
import { FiPhone, FiMessageSquare, FiClock, FiAlertCircle, FiCheckCircle, FiCalendar } from 'react-icons/fi'

export default function ActionQueue({ overdueLeads = [], dueTodayLeads = [], onSelectLead, onQuickUpdateStatus, onLogActivity }) {
  if (overdueLeads.length === 0 && dueTodayLeads.length === 0) {
    return (
      <div style={{
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#166534',
        fontSize: 13,
        fontWeight: 600
      }}>
        <FiCheckCircle size={18} color="#16A34A" />
        <span>All follow-ups are up to date! Zero overdue follow-up calls pending.</span>
      </div>
    )
  }

  const renderLeadRow = (lead, isOverdue) => {
    const cleanPhone = (lead.primaryPhone || '').replace(/[^0-9]/g, '')
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    return (
      <div
        key={lead.id}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: '#FFFFFF',
          border: `1px solid ${isOverdue ? '#FECACA' : '#FED7AA'}`,
          borderLeft: `4px solid ${isOverdue ? '#DC2626' : '#EA580C'}`,
          borderRadius: 10,
          padding: '10px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ minWidth: 180, flex: '1 1 200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              onClick={() => onSelectLead(lead)}
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#0F172A',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationColor: '#CBD5E1'
              }}
            >
              {lead.name || 'Prospect'}
            </span>
            {lead.businessName && (
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                ({lead.businessName})
              </span>
            )}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 6,
              background: lead.temperature === 'HOT' ? '#FEF2F2' : lead.temperature === 'COLD' ? '#EFF6FF' : '#FFF7ED',
              color: lead.temperature === 'HOT' ? '#DC2626' : lead.temperature === 'COLD' ? '#2563EB' : '#C2410C',
              border: `1px solid ${lead.temperature === 'HOT' ? '#FCA5A5' : lead.temperature === 'COLD' ? '#BFDBFE' : '#FFEDD5'}`
            }}>
              {lead.temperature || 'WARM'}
            </span>
          </div>

          <div style={{ fontSize: 11, color: isOverdue ? '#DC2626' : '#C2410C', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <FiClock size={12} />
            <span>
              {lead.followUpNote ? `${lead.followUpNote} • ` : ''}
              {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'No timestamp'}
            </span>
          </div>
        </div>

        {/* Quick Action Dial / WhatsApp / Reschedule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <a
            href={`tel:${cleanPhone}`}
            onClick={() => onLogActivity && onLogActivity(lead.id, 'CALL', 'Outbound phone call initiated from action queue')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#0284C7',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <FiPhone size={12} />
            <span>Call</span>
          </a>

          <a
            href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${lead.name || ''}, following up regarding Cafe QR POS system for ${lead.businessName || 'your restaurant'}. Let me know if you are free for a quick chat!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLogActivity && onLogActivity(lead.id, 'WHATSAPP', 'WhatsApp follow-up message sent from action queue')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#16A34A',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <FiMessageSquare size={12} />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={() => onSelectLead(lead)}
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#334155',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Details
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
      {/* Overdue Shelf */}
      {overdueLeads.length > 0 && (
        <div style={{
          background: '#FFF1F2',
          border: '1px solid #FECDD3',
          borderRadius: 14,
          padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#BE123C', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <FiAlertCircle size={16} />
              <span>🚨 Overdue Follow-Ups ({overdueLeads.length})</span>
            </div>
            <span style={{ fontSize: 11, color: '#9F1239' }}>Requires urgent outreach</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
            {overdueLeads.map(lead => renderLeadRow(lead, true))}
          </div>
        </div>
      )}

      {/* Due Today Shelf */}
      {dueTodayLeads.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 14,
          padding: '14px 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B45309', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <FiCalendar size={16} />
              <span>⏰ Scheduled For Today ({dueTodayLeads.length})</span>
            </div>
            <span style={{ fontSize: 11, color: '#92400E' }}>Planned outreach</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {dueTodayLeads.map(lead => renderLeadRow(lead, false))}
          </div>
        </div>
      )}
    </div>
  )
}
