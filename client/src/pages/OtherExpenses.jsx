import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import ProgressBar from '../components/ProgressBar';
import { Wrench, CreditCard, Layers, Plus, Calendar, Paperclip, Trash2, Edit2, TrendingUp, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const OtherExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState('Maintenance & Service'); // Maintenance & Service, Fastag, Other
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [category, setCategory] = useState('Maintenance & Service');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD

  const [editingExpense, setEditingExpense] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');

  const { token, getHeaders } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vehicles
      const vRes = await fetch(`${API_URL}/api/vehicles`, { headers: getHeaders() });
      if (vRes.ok) {
        const vehiclesData = await vRes.json();
        setVehicles(vehiclesData);
        if (vehiclesData.length > 0 && !vehicleId) {
          setVehicleId(vehiclesData[0]._id);
        }
      }

      // Fetch all non-fuel expenses
      const eRes = await fetch(`${API_URL}/api/expenses`, { headers: getHeaders() });
      if (eRes.ok) {
        const expensesData = await eRes.json();
        setExpenses(expensesData.filter((e) => e.category !== 'Fuel'));
      } else {
        setError('Failed to fetch expense records');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle file uploads with progress tracking
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('attachment', file);

    setUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/expenses/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percentComplete = (evt.loaded / evt.total) * 100;
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setAttachmentUrl(data.fileUrl);
      } else {
        alert('File upload failed: ' + xhr.statusText);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      alert('Upload error');
    };

    xhr.send(formData);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!vehicleId || !category || !amount) {
      setError('Please provide vehicle, category and cost amount');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category,
          vehicle: vehicleId,
          amount,
          date,
          notes,
          attachmentUrl,
        }),
      });

      if (res.ok) {
        // Reset form
        setAmount('');
        setNotes('');
        setAttachmentUrl('');
        // Re-fetch data
        fetchData();
        setShowAddModal(false);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to record expense');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditExpense = (exp) => {
    setEditingExpense(exp);
    setEditVehicleId(exp.vehicle?._id || exp.vehicle || '');
    setEditCategory(exp.category);
    setEditAmount(exp.amount);
    setEditDate(new Date(exp.date).toISOString().slice(0, 10)); // YYYY-MM-DD
    setEditNotes(exp.notes || '');
    setEditAttachmentUrl(exp.attachmentUrl || '');
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editVehicleId || !editCategory || !editAmount) {
      alert('Please provide vehicle, category and cost amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses/${editingExpense._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          category: editCategory,
          vehicle: editVehicleId,
          amount: editAmount,
          date: editDate,
          notes: editNotes,
          attachmentUrl: editAttachmentUrl,
        }),
      });

      if (res.ok) {
        setEditingExpense(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update expense log');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('attachment', file);

    setUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/expenses/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const percentComplete = (evt.loaded / evt.total) * 100;
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setEditAttachmentUrl(data.fileUrl);
      } else {
        alert('File upload failed: ' + xhr.statusText);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      alert('Upload error');
    };

    xhr.send(formData);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;

    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (res.ok) {
        setExpenses(expenses.filter((e) => e._id !== id));
      } else {
        alert('Failed to delete expense log');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };


  const getTabIcon = (tab) => {
    switch (tab) {
      case 'Maintenance & Service':
        return <Wrench size={18} />;
      case 'Fastag':
        return <CreditCard size={18} />;
      default:
        return <Layers size={18} />;
    }
  };

  const tabs = ['Maintenance & Service', 'Fastag', 'Other'];

  const categoryColors = {
    'Maintenance & Service': 'var(--color-accent-pink)',
    Fastag: 'var(--color-accent-orange)',
    Other: '#9ca3af',
  };

  // Filter logs according to selected vehicle and active tab
  const filteredByVehicleExpenses = selectedVehicle
    ? expenses.filter((e) => (e.vehicle?._id || e.vehicle) === selectedVehicle)
    : expenses;

  const filteredExpenses = filteredByVehicleExpenses.filter((e) => e.category === activeTab);

  // Aggregated calculations for dashboard
  const totalCategoryCost = filteredExpenses.reduce((sum, curr) => sum + curr.amount, 0);
  const totalAllCost = filteredByVehicleExpenses.reduce((sum, curr) => sum + curr.amount, 0);
  const logsCount = filteredExpenses.length;
  const avgLogCost = logsCount > 0 ? (totalCategoryCost / logsCount).toFixed(2) : '0.00';

  // Prepare chart data chronologically (ascending date)
  const chartData = [...filteredExpenses]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      Amount: e.amount,
    }));

  return (
    <div style={{ position: 'relative' }}>
      <div className="bg-glow-purple" />
      <div className="bg-glow-cyan" />

      <div className="page-header">
        <div className="page-header-title">
          <h1>Expense logs</h1>
          <p>Log and filter maintenance, services, tolls, and other expenses</p>
        </div>
        
        <div className="filters-container">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Record Expense
          </button>

          <select
            className="input-field"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            style={{ padding: '8px 16px', background: 'var(--panel-bg)', minWidth: '180px' }}
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.make} {v.model} ({v.licensePlate.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-danger)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--panel-border)',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '32px',
          overflowX: 'auto',
          maxWidth: 'fit-content',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn"
            style={{
              padding: '10px 20px',
              fontSize: '0.9rem',
              borderRadius: '10px',
              background: activeTab === tab ? categoryColors[tab] : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {getTabIcon(tab)}
            {tab}
          </button>
        ))}
      </div>

      {/* Expenses Dashboard stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            {activeTab} Total (₹)
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: categoryColors[activeTab] }}>
            ₹{totalCategoryCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            Total Combined Expenses (₹)
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            ₹{totalAllCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            {activeTab} Logs Count
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{logsCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            {activeTab} Avg/Log (₹)
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            ₹{parseFloat(avgLogCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      {/* Charts section */}
      {chartData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '32px',
            marginBottom: '32px',
          }}
        >
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: categoryColors[activeTab] }} />
              {activeTab} Expense Trend (₹)
            </h2>
            <div style={{ width: '100%', minWidth: 0, height: '260px', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <ChartTooltip
                    contentStyle={{
                      background: 'rgba(13, 16, 27, 0.9)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Amount"
                    stroke={categoryColors[activeTab]}
                    strokeWidth={3}
                    dot={{ fill: categoryColors[activeTab], strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* List panel */}
      <div style={{ width: '100%', marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>{activeTab} History Logs</h2>
          
          {loading ? (
            <Skeleton type="feed" count={3} />
          ) : filteredExpenses.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              {getTabIcon(activeTab)}
              <p style={{ marginTop: '12px' }}>No {activeTab.toLowerCase()} logs found.</p>
            </div>
          ) : (
            <div className="responsive-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th>Description / Notes</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>
                        {exp.vehicle ? `${exp.vehicle.make} ${exp.vehicle.model}` : 'Deleted Vehicle'}
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--panel-border)',
                            color: categoryColors[exp.category],
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '700', color: categoryColors[exp.category] }}>
                        ₹{exp.amount.toFixed(2)}
                      </td>
                      <td>
                        {exp.attachmentUrl ? (
                          <a
                            href={exp.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--color-secondary)',
                              textDecoration: 'none',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Paperclip size={12} /> View
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-text-darker)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          {exp.notes || '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => startEditExpense(exp)}
                            style={{
                              background: 'rgba(6, 182, 212, 0.15)',
                              border: '1px solid rgba(6, 182, 212, 0.2)',
                              padding: '6px',
                              borderRadius: '6px',
                              color: 'var(--color-secondary)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-secondary)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                              e.currentTarget.style.color = 'var(--color-secondary)';
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp._id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '6px',
                              borderRadius: '6px',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-danger)';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.color = 'var(--color-danger)';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} style={{ color: categoryColors[category] }} />
              Record Expense
            </h2>

            <form onSubmit={handleSaveExpense}>
              <div className="input-group">
                <label className="input-label">Vehicle</label>
                <select
                  className="input-field"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  disabled={submitting}
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.make} {v.model} ({v.licensePlate.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="input-field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Maintenance & Service">Maintenance & Service</option>
                  <option value="Fastag">Fastag Toll</option>
                  <option value="Other">Other Expense</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              {/* Attachment Optional + Progress Bar */}
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label className="input-label">Attach Bill/Receipt (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      margin: 0,
                    }}
                  >
                    <Paperclip size={14} /> Choose File
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading || submitting} />
                  </label>
                  {attachmentUrl && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                      Uploaded ✓
                    </span>
                  )}
                </div>

                {uploading && (
                  <ProgressBar progress={uploadProgress} label="Uploading bill receipt..." type="upload" />
                )}
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Notes / Description</label>
                <textarea
                  placeholder="Details of repair, service description, or toll location..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows="3"
                  style={{ resize: 'none' }}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: categoryColors[category],
                    boxShadow: `0 4px 14px rgba(255, 255, 255, 0.05)`,
                  }}
                  disabled={submitting || uploading}
                >
                  {submitting ? (
                    <Spinner size="small" color="white" inline />
                  ) : (
                    <>
                      <Plus size={18} /> Record Log
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} style={{ color: categoryColors[editCategory] }} />
              Edit Expense Record
            </h2>
            <form onSubmit={handleUpdateExpense}>
              <div className="input-group">
                <label className="input-label">Vehicle</label>
                <select
                  className="input-field"
                  value={editVehicleId}
                  onChange={(e) => setEditVehicleId(e.target.value)}
                  disabled={submitting}
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.make} {v.model} ({v.licensePlate.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="input-field"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Maintenance & Service">Maintenance & Service</option>
                  <option value="Fastag">Fastag Toll</option>
                  <option value="Other">Other Expense</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              {/* Attachment Bill */}
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label className="input-label">Attach Bill/Receipt (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      margin: 0,
                    }}
                  >
                    <Paperclip size={14} /> Choose File
                    <input type="file" onChange={handleEditFileUpload} style={{ display: 'none' }} disabled={uploading || submitting} />
                  </label>
                  {editAttachmentUrl && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                      Uploaded ✓
                    </span>
                  )}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Notes / Description</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-field"
                  rows="3"
                  style={{ resize: 'none' }}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: categoryColors[editCategory],
                    boxShadow: `0 4px 14px rgba(255, 255, 255, 0.05)`,
                  }}
                  disabled={submitting || uploading}
                >
                  {submitting ? <Spinner size="small" color="white" inline /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherExpenses;
