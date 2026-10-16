import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FiX, FiCheck, FiPhone, FiMessageSquare, FiCalendar, FiDollarSign, FiSearch, FiClock, FiPlus, FiTrash2, FiZap } from 'react-icons/fi'

const SOURCES = ['PHONE_CALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'WEBSITE', 'WALK_IN', 'REFERRAL']
const STATUSES = [
  { key: 'YET_TO_REACH_OUT', label: '📞 Yet to Reach Out (Cold Pool)' },
  { key: 'NEW_INQUIRY', label: '📥 New Inquiry (Inbound)' },
  { key: 'IN_DISCUSSION', label: '💬 In Discussion' },
  { key: 'DEMO_SCHEDULED', label: '📅 Demo Scheduled' },
  { key: 'ONBOARDED_TRIAL', label: '⏳ Onboarded (Free Trial)' },
  { key: 'PAID_ACTIVE', label: '💳 Paid & Active' },
  { key: 'COLD_FOLLOW_UP', label: '❄️ Cold Follow-Up' },
  { key: 'LOST', label: '❌ Lost / Dropped' },
]

export default function LeadModal({
  isOpen,
  onClose,
  lead,
  apiBase,
  founderKey,
  onSaveLead,
  onDeleteLead,
  onOpenActivationModal
}) {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    primaryPhone: '',
    whatsappNumber: '',
    alternatePhone: '',
    email: '',
    city: '',
    source: 'PHONE_CALL',
    status: 'YET_TO_REACH_OUT',
    temperature: 'WARM',
    dealValueEstimatePaise: 0,
    nextFollowUpAt: '',
    followUpNote: '',
    notes: '',
    lostReason: '',
    assignedOrgId: null,
    assignedClientId: null
  })

  const [dealValueRupees, setDealValueRupees] = useState('')
  const [activities, setActivities] = useState([])
  const [newActivityType, setNewActivityType] = useState('NOTE')
  const [newActivityDesc, setNewActivityDesc] = useState('')
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [saving, setSaving] = useState(false)
  const [matchedMerchant, setMatchedMerchant] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        businessName: lead.businessName || '',
        primaryPhone: lead.primaryPhone || '',
        whatsappNumber: lead.whatsappNumber || '',
        alternatePhone: lead.alternatePhone || '',
        email: lead.email || '',
        city: lead.city || '',
        source: lead.source || 'PHONE_CALL',
        status: lead.status || 'YET_TO_REACH_OUT',
        temperature: lead.temperature || 'WARM',
        dealValueEstimatePaise: lead.dealValueEstimatePaise || 0,
        nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : '',
        followUpNote: lead.followUpNote || '',
        notes: lead.notes || '',
        lostReason: lead.lostReason || '',
        assignedOrgId: lead.assignedOrgId || null,
        assignedClientId: lead.assignedClientId || null
      })
      setDealValueRupees(lead.dealValueEstimatePaise ? String(Math.round(lead.dealValueEstimatePaise / 100)) : '')
      loadActivities(lead.id)
      checkMerchantLookup(lead.primaryPhone)
    } else {
      setFormData({
        name: '',
        businessName: '',
        primaryPhone: '',
        whatsappNumber: '',
        alternatePhone: '',
        email: '',
        city: '',
        source: 'PHONE_CALL',
        status: 'YET_TO_REACH_OUT',
        temperature: 'WARM',
        dealValueEstimatePaise: 0,
        nextFollowUpAt: '',
        followUpNote: '',
        notes: '',
        lostReason: '',
        assignedOrgId: null,
        assignedClientId: null
      })
      setDealValueRupees('')
      setActivities([])
      setMatchedMerchant(null)
    }
  }, [lead])

  const loadActivities = async (leadId) => {
    if (!leadId) return
    try {
      setLoadingActivities(true)
      const res = await axios.get(`${apiBase}/api/v1/founder/leads/${leadId}/activities`, {
        headers: { 'X-Founder-Key': founderKey }
      })
      setActivities(res.data?.data || [])
    } catch (e) {
      console.error('Failed to load lead activities:', e)
    } finally {
      setLoadingActivities(false)
    }
  }

  const checkMerchantLookup = async (phoneToLookup) => {
    if (!phoneToLookup) return
    try {
      setLookupLoading(true)
      const res = await axios.get(`${apiBase}/api/v1/founder/lookup-merchant?phone=${encodeURIComponent(phoneToLookup)}`, {
        headers: { 'X-Founder-Key': founderKey }
      })
      const match = res.data?.data
      if (match && match.matched) {
        setMatchedMerchant(match)
        if (match.orgId && !formData.assignedOrgId) {
          setFormData(prev => ({ ...prev, assignedOrgId: match.orgId, assignedClientId: match.clientId }))
        }
      } else {
        setMatchedMerchant(null)
      }
    } catch (e) {
      console.warn('Merchant lookup err:', e)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!lead?.id || !newActivityDesc.trim()) return
    try {
      const res = await axios.post(
        `${apiBase}/api/v1/founder/leads/${lead.id}/activity`,
        { activityType: newActivityType, description: newActivityDesc.trim() },
        { headers: { 'X-Founder-Key': founderKey } }
      )
      setNewActivityDesc('')
      loadActivities(lead.id)
    } catch (e) {
      alert('Failed to log activity: ' + e.message)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.primaryPhone.trim()) {
      alert('Primary Phone is required')
      return
    }

    try {
      setSaving(true)
      const cleanPhone = formData.primaryPhone.replace(/[^0-9]/g, '')
      const dealPaise = dealValueRupees ? Math.round(parseFloat(dealValueRupees) * 100) : 0

      const payload = {
        ...formData,
        primaryPhone: cleanPhone,
        whatsappNumber: formData.whatsappNumber ? formData.whatsappNumber.replace(/[^0-9]/g, '') : cleanPhone,
        dealValueEstimatePaise: dealPaise,
        nextFollowUpAt: formData.nextFollowUpAt ? formData.nextFollowUpAt : null
      }

      await onSaveLead(lead?.id, payload)
      onClose()
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        maxWidth: 780,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFBFF'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              {lead ? `Edit Prospect: ${lead.name || 'Lead'}` : '➕ Add New Lead / Prospect'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#64748B' }}>
              Sales pipeline tracking & merchant account link
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B'
            }}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Matched Merchant Banner if found in Cafe QR */}
          {matchedMerchant && matchedMerchant.matched && (
            <div style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✓ Existing Cafe QR Account Matched ({matchedMerchant.matchedType})
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                  {matchedMerchant.businessName} {matchedMerchant.branchName ? `(${matchedMerchant.branchName} [${matchedMerchant.branchCode}])` : ''}
                </div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Status: <strong style={{ color: matchedMerchant.isSubscriptionActive ? '#16A34A' : '#DC2626' }}>{matchedMerchant.subscriptionStatus || 'UNPAID'}</strong>
                  {matchedMerchant.subscriptionExpiryDate && ` • Expiry: ${new Date(matchedMerchant.subscriptionExpiryDate).toLocaleDateString('en-IN')}`}
                </div>
              </div>

              {matchedMerchant.orgId && onOpenActivationModal && (
                <button
                  type="button"
                  onClick={() => onOpenActivationModal({ id: matchedMerchant.orgId, name: matchedMerchant.branchName || matchedMerchant.businessName, modules: matchedMerchant.activeModules })}
                  style={{
                    background: 'linear-gradient(135deg, #16A34A, #15803D)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FiZap /> 1-Click Activate Branch
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Core Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Contact Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Business / Cafe Name
                </label>
                <input
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Chai Point Indiranagar"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Primary Phone *
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    required
                    value={formData.primaryPhone}
                    onChange={e => setFormData({ ...formData, primaryPhone: e.target.value })}
                    onBlur={() => checkMerchantLookup(formData.primaryPhone)}
                    placeholder="e.g. 9847920009"
                    style={{ flex: 1, boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => checkMerchantLookup(formData.primaryPhone)}
                    title="Lookup in Cafe QR Database"
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, padding: '0 10px', cursor: 'pointer' }}
                  >
                    <FiSearch size={14} color="#64748B" />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  WhatsApp Number
                </label>
                <input
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="Defaults to Primary Phone"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Alternate Phone
                </label>
                <input
                  value={formData.alternatePhone}
                  onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })}
                  placeholder="Manager / Cashier Phone"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cafe@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  City / Location
                </label>
                <input
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Bangalore, Kochi, Dubai"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Lead Source
                </label>
                <select
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                >
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Pipeline Stage & Deal Value */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Pipeline Stage
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                >
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Lead Temperature
                </label>
                <select
                  value={formData.temperature}
                  onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                >
                  <option value="HOT">🔥 Hot (Ready to Buy)</option>
                  <option value="WARM">☀️ Warm (Considering)</option>
                  <option value="COLD">❄️ Cold (Casual Inquiry)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Estimated Deal Value (₹)
                </label>
                <input
                  type="number"
                  value={dealValueRupees}
                  onChange={e => setDealValueRupees(e.target.value)}
                  placeholder="e.g. 12000"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Follow-up Planner */}
            <div style={{ background: '#FFFBF5', border: '1px solid #FED7AA', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiClock /> Scheduled Follow-Up Task
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Next Follow-Up Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextFollowUpAt}
                    onChange={e => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Follow-Up Agenda / Note
                  </label>
                  <input
                    value={formData.followUpNote}
                    onChange={e => setFormData({ ...formData, followUpNote: e.target.value })}
                    placeholder="e.g. Call to finalize 1-year annual plan"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                Lead Background & Discussion Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Details about restaurant size, POS requirements, printer setup, budget..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>

            {/* Lost Reason if status is LOST */}
            {formData.status === 'LOST' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: 4 }}>
                  Reason Lost
                </label>
                <input
                  value={formData.lostReason}
                  onChange={e => setFormData({ ...formData, lostReason: e.target.value })}
                  placeholder="e.g. Chose competitor, pricing too high, shut down..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #F87171', fontSize: 13 }}
                />
              </div>
            )}

            {/* Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              {lead?.id && onDeleteLead ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
                      onDeleteLead(lead.id)
                      onClose()
                    }
                  }}
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#DC2626',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <FiTrash2 /> Delete Lead
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF7A00, #FF4D00)',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Lead Details'}
                </button>
              </div>
            </div>
          </form>

          {/* Activity Timeline Section (Only for existing leads) */}
          {lead?.id && (
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 18 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                📜 Activity & Interaction History ({activities.length})
              </h4>

              {/* Add Interaction Subform */}
              <form onSubmit={handleAddActivity} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <select
                  value={newActivityType}
                  onChange={e => setNewActivityType(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  <option value="NOTE">📝 Note</option>
                  <option value="CALL">📞 Phone Call</option>
                  <option value="WHATSAPP">💬 WhatsApp</option>
                  <option value="DEMO">📅 Live Demo</option>
                </select>

                <input
                  required
                  value={newActivityDesc}
                  onChange={e => setNewActivityDesc(e.target.value)}
                  placeholder="Record what was discussed or agreed upon..."
                  style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13 }}
                />

                <button
                  type="submit"
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <FiPlus /> Log Activity
                </button>
              </form>

              {/* Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', margin: '8px 0' }}>
                    No recorded activities yet.
                  </p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      fontSize: 12.5
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        background: act.activityType === 'CALL' ? '#EFF6FF' : act.activityType === 'WHATSAPP' ? '#ECFDF5' : '#F1F5F9',
                        color: act.activityType === 'CALL' ? '#2563EB' : act.activityType === 'WHATSAPP' ? '#059669' : '#475569'
                      }}>
                        {act.activityType}
                      </span>
                      <div style={{ flex: 1, color: '#1E293B', wordBreak: 'break-word' }}>
                        {act.description}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {new Date(act.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
