import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { FiX, FiCheck, FiCalendar, FiPackage, FiZap, FiCheckCircle, FiDollarSign, FiAlertCircle } from 'react-icons/fi'

const BASE_POS_ANNUAL_PRICE = 999

const ALL_MODULES = [
  { key: 'KOT', label: 'KOT & Kitchen Display (KDS)', desc: 'Kitchen tickets, stations, print jobs', priceAnnual: 499, scope: 'Branch-scoped' },
  { key: 'INVENTORY', label: 'Inventory & Recipe Costing ERP', desc: 'Stock alerts, raw items, deductions', priceAnnual: 1999, scope: 'Branch-scoped' },
  { key: 'TABLE_QR', label: 'Dine-In Table QR Ordering', desc: 'Customer self-order & table service', priceAnnual: 0, scope: 'Included in Base' },
  { key: 'CRM', label: 'CRM & Customer Loyalty', desc: 'Customer directory & SMS/WhatsApp', priceAnnual: 999, scope: 'Client-scoped' },
  { key: 'CREDIT_LEDGER', label: 'Credit Ledger (Udhaar / Khata)', desc: 'Merchant & customer credit balances', priceAnnual: 499, scope: 'Client-scoped' },
  { key: 'BARCODE_SCANNER', label: 'Barcode Scanner & Label Printing', desc: 'Instant item lookup at POS', priceAnnual: 999, scope: 'Client-scoped' },
  { key: 'MENU_IMAGES', label: 'Visual Menu Photos', desc: 'High-res food dish images on digital menu', priceAnnual: 0, scope: 'Included in Base' },
  { key: 'ONLINE_DELIVERY', label: 'Direct Online Delivery Website', desc: 'Customer direct storefront', priceAnnual: 0, scope: 'Included in Base' },
]

export default function BranchActivationModal({
  isOpen,
  onClose,
  branch,
  allClients = [],
  apiBase,
  founderKey,
  onSuccess
}) {
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [daysToAdd, setDaysToAdd] = useState(365)
  const [selectedModules, setSelectedModules] = useState(['KOT', 'INVENTORY', 'TABLE_QR', 'CRM', 'CREDIT_LEDGER', 'BARCODE_SCANNER'])
  const [recordPayment, setRecordPayment] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Flatten all branches across clients for the selector
  const availableBranches = useMemo(() => {
    const list = []
    for (const c of allClients || []) {
      if (c.branches && c.branches.length > 0) {
        for (const b of c.branches) {
          list.push({
            ...b,
            clientName: c.name,
            clientId: c.id
          })
        }
      } else if (c.primaryOrgId) {
        list.push({
          id: c.primaryOrgId,
          name: c.primaryBranchName || c.name,
          branchCode: c.primaryBranchCode || 'HQ',
          clientName: c.name,
          clientId: c.id,
          subscriptionStatus: c.subscriptionStatus,
          subscriptionExpiryDate: c.subscriptionExpiryDate,
          modules: c.subscriptionModules || []
        })
      }
    }
    return list
  }, [allClients])

  // Calculate live modules total
  const calculatedModulesTotal = useMemo(() => {
    return selectedModules.reduce((acc, mKey) => {
      const mod = ALL_MODULES.find(m => m.key === mKey)
      return acc + (mod ? mod.priceAnnual : 0)
    }, 0)
  }, [selectedModules])

  // Annual standard total based on active modules + base POS
  const calculatedStandardTotal = useMemo(() => {
    return BASE_POS_ANNUAL_PRICE + calculatedModulesTotal
  }, [calculatedModulesTotal])

  // Update default payment amount whenever modules change (unless user custom edited it)
  useEffect(() => {
    if (!isAmountManuallyEdited) {
      setPaymentAmount(calculatedStandardTotal)
    }
  }, [calculatedStandardTotal, isAmountManuallyEdited])

  useEffect(() => {
    if (branch) {
      const directId = branch.id || branch.orgId
      let matchedBranch = availableBranches.find(b => b.id === directId)
      if (!matchedBranch && branch.clientId) {
        matchedBranch = availableBranches.find(b => b.clientId === branch.clientId && (!branch.branchCode || b.branchCode === branch.branchCode)) ||
                        availableBranches.find(b => b.clientId === branch.clientId)
      }
      if (matchedBranch) {
        setSelectedBranchId(matchedBranch.id)
        if (matchedBranch.modules && matchedBranch.modules.length > 0 && (!branch.modules || branch.modules.length === 0)) {
          setSelectedModules(matchedBranch.modules.map(m => typeof m === 'string' ? m : m.moduleName))
        }
      } else if (directId) {
        setSelectedBranchId(directId)
      }

      if (branch.modules && branch.modules.length > 0) {
        setSelectedModules(branch.modules.map(m => typeof m === 'string' ? m : m.moduleName))
      }
    } else if (availableBranches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(availableBranches[0].id)
    }
  }, [branch, availableBranches])

  if (!isOpen) return null

  const activeBranchObj = availableBranches.find(b => b.id === selectedBranchId) || branch

  const handleToggleModule = (modKey) => {
    if (selectedModules.includes(modKey)) {
      setSelectedModules(selectedModules.filter(k => k !== modKey))
    } else {
      setSelectedModules([...selectedModules, modKey])
    }
  }

  const handleSelectAllModules = () => {
    if (selectedModules.length === ALL_MODULES.length) {
      setSelectedModules([])
    } else {
      setSelectedModules(ALL_MODULES.map(m => m.key))
    }
  }

  const handleActivate = async () => {
    if (!selectedBranchId) {
      alert('Please select a branch to activate.')
      return
    }

    const numericAmount = parseFloat(paymentAmount)
    if (recordPayment && (isNaN(numericAmount) || numericAmount < 0)) {
      alert('Please enter a valid payment amount.')
      return
    }

    try {
      setLoading(true)
      setSuccessMsg('')
      await axios.post(
        `${apiBase}/api/v1/founder/organization/${selectedBranchId}/activate-subscription`,
        {
          daysToAdd: parseInt(daysToAdd),
          subscriptionStatus: 'ACTIVE',
          activeModules: selectedModules,
          recordPayment: recordPayment,
          paymentAmountPaise: recordPayment ? Math.round(numericAmount * 100) : 0,
          paymentMethod: paymentMethod,
          paymentNotes: paymentNotes.trim()
        },
        { headers: { 'X-Founder-Key': founderKey } }
      )

      setSuccessMsg('Branch subscription, add-on modules & payment ledger updated successfully!')
      if (onSuccess) onSuccess()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err) {
      alert('Activation failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        maxWidth: 680,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAFBFF'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
              ⚡ Branch Module Activation & Billing Engine
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748B' }}>
              Extends branch license, activates add-on ERP modules & automatically records revenue
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

        {/* Content Form */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Branch Picker */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
              Target Branch (Outlet)
            </label>
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F172A',
                background: '#F8FAFC',
                outline: 'none'
              }}
            >
              {availableBranches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name || 'Main Branch'} [{b.branchCode || 'HQ'}] — Client: {b.clientName || 'N/A'} (Exp: {b.subscriptionExpiryDate ? new Date(b.subscriptionExpiryDate).toLocaleDateString('en-IN') : 'None'})
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Box */}
          {activeBranchObj && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: 12
            }}>
              <div>
                <span style={{ color: '#64748B' }}>Current Status: </span>
                <span style={{ fontWeight: 800, color: activeBranchObj.subscriptionStatus === 'ACTIVE' ? '#10B981' : '#F59E0B' }}>
                  {activeBranchObj.subscriptionStatus || 'UNPAID'}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Current Expiry: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {activeBranchObj.subscriptionExpiryDate ? new Date(activeBranchObj.subscriptionExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never activated'}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Commercial Policy: </span>
                <span style={{ fontWeight: 800, color: '#FF7A00' }}>Strict Paid (Zero-Trial)</span>
              </div>
            </div>
          )}

          {/* Duration Presets */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
              Extend Expiry Duration
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 10 }}>
              {[
                { days: 365, label: '365 Days (1 Yr Annual)' },
                { days: 90, label: '90 Days (Quarterly)' },
                { days: 180, label: '180 Days (Half-Year)' },
                { days: 730, label: '730 Days (2 Years)' },
              ].map(p => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setDaysToAdd(p.days)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${daysToAdd === p.days ? '#FF7A00' : '#E2E8F0'}`,
                    background: daysToAdd === p.days ? '#FFF3E8' : '#FFFFFF',
                    color: daysToAdd === p.days ? '#FF7A00' : '#475569',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Custom Days:</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={daysToAdd}
                onChange={e => setDaysToAdd(e.target.value)}
                style={{
                  width: 90,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13,
                  fontWeight: 700
                }}
              />
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                Status: ACTIVE (Paid License)
              </span>
            </div>
          </div>

          {/* Module Toggles with Exact Codebase Prices */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Active Add-On Modules & Exact Pricing
              </label>
              <button
                type="button"
                onClick={handleSelectAllModules}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF7A00',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {selectedModules.length === ALL_MODULES.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
              {ALL_MODULES.map(mod => {
                const isChecked = selectedModules.includes(mod.key)
                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggleModule(mod.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1.5px solid ${isChecked ? '#FF7A00' : '#E2E8F0'}`,
                      background: isChecked ? '#FFFBF5' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: `1.5px solid ${isChecked ? '#FF7A00' : '#CBD5E1'}`,
                      background: isChecked ? '#FF7A00' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: 12,
                      flexShrink: 0,
                      marginTop: 2
                    }}>
                      {isChecked && <FiCheck strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isChecked ? '#0F172A' : '#334155' }}>
                          {mod.label}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: mod.priceAnnual > 0 ? '#10B981' : '#64748B'
                        }}>
                          {mod.priceAnnual > 0 ? `₹${mod.priceAnnual.toLocaleString('en-IN')}/yr` : 'Included'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                        {mod.desc}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pricing Summary & Mandatory Payment Recording Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 14,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Standard Annual Contract Value
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{calculatedStandardTotal.toLocaleString('en-IN')} <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>/ year</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B' }}>
                <div>Base POS: <strong>₹{BASE_POS_ANNUAL_PRICE}</strong></div>
                <div>Add-ons ({selectedModules.length}): <strong>₹{calculatedModulesTotal}</strong></div>
              </div>
            </div>

            {/* Checkbox: Record Payment */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              <input
                type="checkbox"
                checked={recordPayment}
                onChange={e => setRecordPayment(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#FF7A00' }}
              />
              <span>💰 Record Payment in Ledger (Audit Trail & Accurate Revenue)</span>
            </label>

            {recordPayment && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, paddingTop: 4 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Amount Collected (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={paymentAmount}
                    onChange={e => {
                      setPaymentAmount(e.target.value)
                      setIsAmountManuallyEdited(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#0F172A',
                      background: '#FFFFFF'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#0F172A',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                    <option value="CASH">Direct Cash</option>
                    <option value="RAZORPAY">Razorpay Online Gateway</option>
                    <option value="PENDING_INVOICE">📋 Pending Invoice (Accounts Receivable / Payment Due)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Transaction Reference / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref #493821039, Cheque #01923, or custom package note"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 12.5,
                      color: '#0F172A',
                      background: '#FFFFFF'
                    }}
                  />
                </div>

                {paymentMethod === 'PENDING_INVOICE' && (
                  <div style={{
                    gridColumn: '1 / -1',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11.5,
                    color: '#92400E',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <FiAlertCircle size={14} />
                    <span>Strict Commercial Policy: ₹{paymentAmount || 0} is recorded as an outstanding Accounts Receivable. Zero free trials permitted.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#065F46',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FiCheckCircle size={16} color="#10B981" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: '#FAFBFF'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleActivate}
            disabled={loading}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #FF7A00, #FF4D00)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)'
            }}
          >
            <FiZap />
            <span>{loading ? 'Activating & Recording...' : 'Activate Branch & Modules'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
