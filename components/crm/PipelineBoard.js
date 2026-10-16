import React, { useState, useMemo } from 'react'
import {
  FiPhone,
  FiMessageSquare,
  FiClock,
  FiPlus,
  FiSearch,
  FiFilter,
  FiZap,
  FiLayers,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiUser
} from 'react-icons/fi'
import ActionQueue from './ActionQueue'
import ColdCallQueue from './ColdCallQueue'
import LeadModal from './LeadModal'
import BranchActivationModal from './BranchActivationModal'

const STAGES = [
  { key: 'YET_TO_REACH_OUT', label: '📞 Cold Calling Pool', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', desc: 'New phone leads not contacted yet' },
  { key: 'NEW_INQUIRY', label: '📥 Inbound Inquiries', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', desc: 'WhatsApp & web inbound leads' },
  { key: 'IN_DISCUSSION', label: '💬 In Discussion', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', desc: 'Pitching, requirement analysis' },
  { key: 'DEMO_SCHEDULED', label: '📅 Demo Scheduled', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', desc: 'Live walkthrough booked' },
  { key: 'ONBOARDED_TRIAL', label: '⏳ Trial Account', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', desc: 'Exploring free trial' },
  { key: 'PAID_ACTIVE', label: '💳 Paid & Active', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', desc: 'Paid subscriber or activated' },
  { key: 'COLD_FOLLOW_UP', label: '❄️ Cold Follow-Up', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', desc: 'Nurture later / deferred' },
  { key: 'LOST', label: '❌ Lost / Dropped', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', desc: 'Competitor / closed' },
]

export default function PipelineBoard({
  leads = [],
  overdueLeads = [],
  dueTodayLeads = [],
  allClients = [],
  apiBase,
  founderKey,
  onRefresh,
  onSaveLead,
  onDeleteLead,
  onUpdateLeadStatus,
  onLogActivity
}) {
  const [activeSubView, setActiveSubView] = useState('kanban') // 'kanban' | 'dialer'
  const [mobileActiveStage, setMobileActiveStage] = useState('YET_TO_REACH_OUT')
  const [search, setSearch] = useState('')
  const [tempFilter, setTempFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')

  // Modals
  const [selectedLead, setSelectedLead] = useState(null)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
  const [activationBranch, setActivationBranch] = useState(null)
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false)

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (tempFilter !== 'ALL' && l.temperature !== tempFilter) return false
      if (sourceFilter !== 'ALL' && l.source !== sourceFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = (l.name || '').toLowerCase().includes(q)
        const matchesBiz = (l.businessName || '').toLowerCase().includes(q)
        const matchesPhone = (l.primaryPhone || '').includes(q) || (l.whatsappNumber || '').includes(q)
        const matchesCity = (l.city || '').toLowerCase().includes(q)
        const matchesNotes = (l.notes || '').toLowerCase().includes(q)
        if (!matchesName && !matchesBiz && !matchesPhone && !matchesCity && !matchesNotes) return false
      }
      return true
    })
  }, [leads, tempFilter, sourceFilter, search])

  // Group by stage
  const stageGroups = useMemo(() => {
    const groups = {}
    for (const s of STAGES) groups[s.key] = []
    for (const l of filteredLeads) {
      const st = l.status || 'YET_TO_REACH_OUT'
      if (groups[st]) groups[st].push(l)
      else groups['YET_TO_REACH_OUT'].push(l)
    }
    return groups
  }, [filteredLeads])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = leads.length
    const coldPoolCount = (stageGroups['YET_TO_REACH_OUT'] || []).length
    const activePipelineCount = leads.filter(l => !['PAID_ACTIVE', 'LOST'].includes(l.status)).length
    const totalPipelineValuePaise = leads
      .filter(l => !['LOST'].includes(l.status))
      .reduce((sum, l) => sum + (l.dealValueEstimatePaise || 0), 0)
    const paidCount = (stageGroups['PAID_ACTIVE'] || []).length

    return {
      totalCount,
      coldPoolCount,
      activePipelineCount,
      totalPipelineValuePaise,
      paidCount
    }
  }, [leads, stageGroups])

  const openCreateModal = () => {
    setSelectedLead(null)
    setIsLeadModalOpen(true)
  }

  const openEditModal = (lead) => {
    setSelectedLead(lead)
    setIsLeadModalOpen(true)
  }

  const openActivationForBranch = (branchObj) => {
    setActivationBranch(branchObj)
    setIsActivationModalOpen(true)
  }

  const renderLeadCard = (lead) => {
    const cleanPhone = (lead.primaryPhone || '').replace(/[^0-9]/g, '')
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const dealValue = lead.dealValueEstimatePaise ? Math.round(lead.dealValueEstimatePaise / 100) : 0

    // Follow-up status
    const isOverdue = lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date() && !['PAID_ACTIVE', 'LOST'].includes(lead.status)

    return (
      <div
        key={lead.id}
        onClick={() => openEditModal(lead)}
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: `1.5px solid ${isOverdue ? '#FECACA' : '#E2E8F0'}`,
          padding: '14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#FF7A00'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isOverdue ? '#FECACA' : '#E2E8F0'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'
        }}
      >
        {/* Card Header: Name + Temperature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lead.name || 'Prospect'}
            </div>
            {lead.businessName && (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                🏢 {lead.businessName}
              </div>
            )}
          </div>

          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 6,
            flexShrink: 0,
            background: lead.temperature === 'HOT' ? '#FEF2F2' : lead.temperature === 'COLD' ? '#EFF6FF' : '#FFF7ED',
            color: lead.temperature === 'HOT' ? '#DC2626' : lead.temperature === 'COLD' ? '#2563EB' : '#C2410C',
            border: `1px solid ${lead.temperature === 'HOT' ? '#FCA5A5' : lead.temperature === 'COLD' ? '#BFDBFE' : '#FED7AA'}`
          }}>
            {lead.temperature || 'WARM'}
          </span>
        </div>

        {/* Location & Deal Value */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
          <span>{lead.city ? `📍 ${lead.city}` : `Source: ${lead.source || 'PHONE'}`}</span>
          {dealValue > 0 && (
            <span style={{ fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4 }}>
              ₹{dealValue.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Follow-up / Overdue Alert */}
        {lead.nextFollowUpAt && !['PAID_ACTIVE', 'LOST'].includes(lead.status) && (
          <div style={{
            fontSize: 10.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            background: isOverdue ? '#FEF2F2' : '#FFFBEB',
            color: isOverdue ? '#DC2626' : '#B45309'
          }}>
            <FiClock size={11} />
            <span>
              {isOverdue ? 'Overdue: ' : 'Follow-up: '}
              {new Date(lead.nextFollowUpAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        )}

        {/* Matched Branch tag if exists */}
        {lead.matchedBranchName && (
          <div style={{ fontSize: 10.5, color: '#0284C7', background: '#F0F9FF', padding: '2px 6px', borderRadius: 6, display: 'inline-block' }}>
            Linked: {lead.matchedBranchName} ({lead.matchedSubscriptionStatus || 'UNPAID'})
          </div>
        )}

        {/* Actions Row */}
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 8, marginTop: 2 }}
        >
          {/* Quick Call & WA */}
          <div style={{ display: 'flex', gap: 6 }}>
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => onLogActivity && onLogActivity(lead.id, 'CALL', 'Outbound phone call clicked')}
              title={`Call +91 ${cleanPhone}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#0284C7',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              <FiPhone size={13} />
            </a>

            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${lead.name || ''}, checking in from Cafe QR POS!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLogActivity && onLogActivity(lead.id, 'WHATSAPP', 'Quick WhatsApp clicked')}
              title={`WhatsApp +91 ${cleanPhone}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#16A34A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}
            >
              <FiMessageSquare size={13} />
            </a>
          </div>

          {/* Quick Move Stage Dropdown */}
          <select
            value={lead.status}
            onChange={e => onUpdateLeadStatus(lead.id, { status: e.target.value })}
            style={{
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 10.5,
              fontWeight: 700,
              background: '#F8FAFC',
              color: '#334155',
              outline: 'none',
              maxWidth: 130
            }}
          >
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top CRM Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 12
      }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #0284C7', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Cold Calling Pool</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{metrics.coldPoolCount}</div>
          <div style={{ fontSize: 11, color: '#0284C7', fontWeight: 600 }}>Yet to contact</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #8B5CF6', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active In Pipeline</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{metrics.activePipelineCount}</div>
          <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }}>Discussion & trials</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #10B981', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Paid Merchants</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{metrics.paidCount}</div>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Active subscriptions</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #FF7A00', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pipeline Value</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FF7A00', fontFamily: 'Outfit, sans-serif' }}>
            ₹{Math.round(metrics.totalPipelineValuePaise / 100).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Total deal potential</div>
        </div>
      </div>

      {/* Pinned Action Queue (Overdue & Due Today alerts) */}
      <ActionQueue
        overdueLeads={overdueLeads}
        dueTodayLeads={dueTodayLeads}
        onSelectLead={openEditModal}
        onQuickUpdateStatus={onUpdateLeadStatus}
        onLogActivity={onLogActivity}
      />

      {/* CRM Control Toolbar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '14px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left: View Switcher (Kanban vs Rapid Cold Caller) */}
        <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveSubView('kanban')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeSubView === 'kanban' ? '#FFFFFF' : 'transparent',
              color: activeSubView === 'kanban' ? '#FF7A00' : '#64748B',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: activeSubView === 'kanban' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <FiLayers /> Kanban Board
          </button>

          <button
            onClick={() => setActiveSubView('dialer')}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: activeSubView === 'dialer' ? '#FFFFFF' : 'transparent',
              color: activeSubView === 'dialer' ? '#0284C7' : '#64748B',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: activeSubView === 'dialer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <FiPhone /> Rapid Cold Caller ({stageGroups['YET_TO_REACH_OUT']?.length || 0})
          </button>
        </div>

        {/* Center: Search & Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, flex: '1 1 320px', minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, restaurant..."
            style={{
              flex: '1 1 180px',
              minWidth: 140,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1.5px solid #CBD5E1',
              fontSize: 12.5,
              outline: 'none'
            }}
          />

          <select
            value={tempFilter}
            onChange={e => setTempFilter(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12, fontWeight: 600 }}
          >
            <option value="ALL">All Temps</option>
            <option value="HOT">🔥 Hot</option>
            <option value="WARM">☀️ Warm</option>
            <option value="COLD">❄️ Cold</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => openActivationForBranch(null)}
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1.5px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FiZap color="#FF7A00" />
            <span>1-Click Activate Branch</span>
          </button>

          <button
            onClick={openCreateModal}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #FF7A00, #FF4D00)',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
            }}
          >
            <FiPlus />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Rapid Cold Dialer */}
      {activeSubView === 'dialer' && (
        <ColdCallQueue
          coldLeads={stageGroups['YET_TO_REACH_OUT'] || []}
          onUpdateLeadStatus={onUpdateLeadStatus}
          onLogActivity={onLogActivity}
          onSelectLead={openEditModal}
        />
      )}

      {/* VIEW 2: Kanban Pipeline Board */}
      {activeSubView === 'kanban' && (
        <div>
          {/* Mobile Swipeable Stage Selector Pills (visible on mobile / narrow screens) */}
          <div className="crm-mobile-pills" style={{
            display: 'none', // Controlled via CSS media query below
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 8,
            marginBottom: 12
          }}>
            {STAGES.map(st => {
              const count = (stageGroups[st.key] || []).length
              const isActive = mobileActiveStage === st.key
              return (
                <button
                  key={st.key}
                  onClick={() => setMobileActiveStage(st.key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1.5px solid ${isActive ? st.color : '#CBD5E1'}`,
                    background: isActive ? st.bg : '#FFFFFF',
                    color: isActive ? st.color : '#64748B',
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {st.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Desktop/Tablet Horizontal Kanban Scroll Container */}
          <div className="crm-kanban-board" style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            paddingBottom: 16,
            minHeight: 520,
            alignItems: 'flex-start'
          }}>
            {STAGES.map(stage => {
              const stageLeads = stageGroups[stage.key] || []
              const stageValue = stageLeads.reduce((s, l) => s + (l.dealValueEstimatePaise || 0), 0)

              return (
                <div
                  key={stage.key}
                  className={`crm-kanban-col ${mobileActiveStage === stage.key ? 'mobile-active' : ''}`}
                  style={{
                    flex: '0 0 280px',
                    background: '#F8FAFC',
                    borderRadius: 16,
                    border: `1.5px solid ${stage.border}`,
                    borderTop: `4px solid ${stage.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '75vh',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                        {stage.label}
                      </span>
                      <span style={{
                        background: stage.bg,
                        color: stage.color,
                        border: `1px solid ${stage.border}`,
                        borderRadius: 999,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 900
                      }}>
                        {stageLeads.length}
                      </span>
                    </div>

                    {stageValue > 0 && (
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                        ₹{Math.round(stageValue / 100).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  {/* Cards Container */}
                  <div style={{
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    overflowY: 'auto',
                    flex: 1
                  }}>
                    {stageLeads.length === 0 ? (
                      <div style={{
                        padding: '28px 12px',
                        textAlign: 'center',
                        color: '#94A3B8',
                        fontSize: 12,
                        fontStyle: 'italic'
                      }}>
                        No leads in this stage
                      </div>
                    ) : (
                      stageLeads.map(lead => renderLeadCard(lead))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lead Create / Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={selectedLead}
        apiBase={apiBase}
        founderKey={founderKey}
        onSaveLead={async (id, data) => {
          await onSaveLead(id, data)
          if (onRefresh) onRefresh()
        }}
        onDeleteLead={async (id) => {
          await onDeleteLead(id)
          if (onRefresh) onRefresh()
        }}
        onOpenActivationModal={openActivationForBranch}
      />

      {/* 1-Click Branch & Modules Activation Modal */}
      <BranchActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        branch={activationBranch}
        allClients={allClients}
        apiBase={apiBase}
        founderKey={founderKey}
        onSuccess={() => {
          if (onRefresh) onRefresh()
        }}
      />

      {/* Responsive Dimensioning CSS for Mobile */}
      <style jsx>{`
        @media (max-width: 768px) {
          .crm-mobile-pills {
            display: flex !important;
          }
          .crm-kanban-board {
            display: block !important;
          }
          .crm-kanban-col {
            display: none !important;
            width: 100% !important;
            flex: none !important;
          }
          .crm-kanban-col.mobile-active {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
