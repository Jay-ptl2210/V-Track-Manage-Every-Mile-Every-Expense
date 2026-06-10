import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Skeleton from '../components/Skeleton';
import Spinner from '../components/Spinner';
import ProgressBar from '../components/ProgressBar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, Landmark, Route, TrendingUp, Calendar, AlertTriangle, Plus, Car, Fuel, Wrench, MapPin, Navigation, Paperclip } from 'lucide-react';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [timePeriod, setTimePeriod] = useState('all'); // 30, 90, 365, all, custom
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, getHeaders } = useAuth();

  // Quick Add Modal States
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState('Fuel'); // Fuel, Expense, Vehicle
  const [submitting, setSubmitting] = useState(false);

  // Common upload/GPS states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Vehicle form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [year, setYear] = useState('');
  const [vFuelType, setVFuelType] = useState('Petrol');

  // Fuel stop form states
  const [vId, setVId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelVolume, setFuelVolume] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [fuelNotes, setFuelNotes] = useState('');
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Expense form states
  const [expenseCategory, setExpenseCategory] = useState('Maintenance & Service');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseAttachmentUrl, setExpenseAttachmentUrl] = useState('');

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!make || !model || !licensePlate) {
      alert('Please fill in make, model and license plate');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/vehicles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ make, model, licensePlate, year, fuelType: vFuelType }),
      });

      if (res.ok) {
        // Reset form
        setMake('');
        setModel('');
        setLicensePlate('');
        setYear('');
        setVFuelType('Petrol');
        setShowQuickAdd(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to add vehicle');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFuel = async (e) => {
    e.preventDefault();
    if (!vId || !odometer || !fuelVolume || !pricePerLiter) {
      alert('Please provide vehicle, odometer reading, liters filled, and price/L');
      return;
    }

    setSubmitting(true);
    const amount = parseFloat(fuelVolume) * parseFloat(pricePerLiter);

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category: 'Fuel',
          vehicle: vId,
          amount,
          date: fuelDate,
          notes: fuelNotes,
          attachmentUrl,
          odometer,
          fuelVolume,
          fuelType,
          pricePerLiter,
          location,
        }),
      });

      if (res.ok) {
        // Reset form
        setOdometer('');
        setFuelVolume('');
        setPricePerLiter('');
        setFuelNotes('');
        setAttachmentUrl('');
        setLocation(null);
        setShowQuickAdd(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit fuel log');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!vId || !expenseCategory || !expenseAmount) {
      alert('Please provide vehicle, category and cost amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category: expenseCategory,
          vehicle: vId,
          amount: expenseAmount,
          date: expenseDate,
          notes: expenseNotes,
          attachmentUrl: expenseAttachmentUrl,
        }),
      });

      if (res.ok) {
        // Reset form
        setExpenseAmount('');
        setExpenseNotes('');
        setExpenseAttachmentUrl('');
        setShowQuickAdd(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to record expense');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e, targetSetter) => {
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
        targetSetter(data.fileUrl);
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

  const captureGPS = () => {
    if (!navigator.geolocation) {
      alert('Mobile GPS Geolocation is not supported by your browser');
      return;
    }

    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let address = `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name || address;
          }
        } catch (geocodeErr) {
          console.error('Failed to geocode location:', geocodeErr);
        }

        setLocation({ latitude, longitude, address });
        setLocLoading(false);
      },
      (geoErr) => {
        console.error(geoErr);
        alert(`Mobile GPS Error: ${geoErr.message}`);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch vehicles
      const vRes = await fetch(`${API_URL}/api/vehicles`, { headers: getHeaders() });
      let vehiclesData = [];
      if (vRes.ok) {
        vehiclesData = await vRes.json();
        setVehicles(vehiclesData);
        if (vehiclesData.length > 0) {
          setVId(vehiclesData[0]._id);
        }
      }

      // Fetch expenses
      let url = '/api/expenses';
      const params = [];
      if (selectedVehicle) params.push(`vehicle=${selectedVehicle}`);
      
      if (timePeriod === 'custom') {
        if (filterStartDate) {
          params.push(`startDate=${new Date(filterStartDate).toISOString()}`);
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          params.push(`endDate=${end.toISOString()}`);
        }
      } else if (timePeriod !== 'all') {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(timePeriod, 10));
        params.push(`startDate=${date.toISOString()}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const eRes = await fetch(`${API_URL}${url}`, { headers: getHeaders() });
      if (eRes.ok) {
        const expensesData = await eRes.json();
        setExpenses(expensesData);
      } else {
        setError('Failed to load expense logs');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure to MERN backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedVehicle, timePeriod, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (vId && vehicles.length > 0) {
      const selectedVeh = vehicles.find((v) => v._id === vId);
      if (selectedVeh && selectedVeh.fuelType) {
        setFuelType(selectedVeh.fuelType);
      }
    }
  }, [vId, vehicles]);

  // Aggregate Calculations
  const totalCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Distance calculation
  const calculateDistance = () => {
    if (selectedVehicle) {
      const fuelLogs = expenses.filter(
        (e) => e.category === 'Fuel' && e.vehicle?._id === selectedVehicle && e.odometer !== undefined
      );
      if (fuelLogs.length < 2) return 0;
      const odometers = fuelLogs.map((e) => e.odometer);
      return Math.max(...odometers) - Math.min(...odometers);
    } else {
      // Sum distance for all vehicles individually
      let sumDistance = 0;
      vehicles.forEach((v) => {
        const fuelLogs = expenses.filter(
          (e) => e.category === 'Fuel' && e.vehicle?._id === v._id && e.odometer !== undefined
        );
        if (fuelLogs.length >= 2) {
          const odometers = fuelLogs.map((e) => e.odometer);
          sumDistance += Math.max(...odometers) - Math.min(...odometers);
        }
      });
      return sumDistance;
    }
  };

  const totalKM = calculateDistance();
  const costPerKM = totalKM > 0 ? (totalCost / totalKM).toFixed(2) : null;

  // Category breakdown for chart
  const categories = ['Fuel', 'Maintenance & Service', 'Fastag', 'Other'];
  const COLORS = {
    Fuel: 'var(--color-primary)', // Purple
    'Maintenance & Service': 'var(--color-accent-pink)', // Pink
    Fastag: 'var(--color-accent-orange)', // Orange
    Other: '#6b7280', // Grey
  };

  const chartData = categories
    .map((cat) => {
      const amount = expenses
        .filter((e) => e.category === cat)
        .reduce((sum, curr) => sum + curr.amount, 0);
      return { name: cat, value: amount };
    })
    .filter((d) => d.value > 0);

  return (
    <div style={{ position: 'relative' }}>
      {/* Glow overlays */}
      <div className="bg-glow-purple" />
      
      {/* Top Header & Filters */}
      <div className="page-header">
        <div className="page-header-title">
          <h1>Dashboard</h1>
          <p>Overview of expenses and mileage trends</p>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <button
            onClick={() => {
              setShowQuickAdd(true);
              if (vehicles.length > 0) {
                setVId(vehicles[0]._id);
              }
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <Plus size={18} /> Quick Add
          </button>

          <select
            className="input-field"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            style={{ padding: '8px 16px', background: 'var(--panel-bg)', minWidth: '160px' }}
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.make} {v.model} ({v.licensePlate.toUpperCase()})
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            style={{ padding: '8px 16px', background: 'var(--panel-bg)' }}
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {timePeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
              <input
                type="date"
                className="input-field"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ padding: '8px 12px', background: 'var(--panel-bg)', minWidth: '130px', fontSize: '0.85rem' }}
                placeholder="Start Date"
              />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>to</span>
              <input
                type="date"
                className="input-field"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ padding: '8px 12px', background: 'var(--panel-bg)', minWidth: '130px', fontSize: '0.85rem' }}
                placeholder="End Date"
              />
            </div>
          )}
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

      {/* Stats Cards Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {loading ? (
          <Skeleton type="card" count={3} />
        ) : (
          <>
            {/* Card 1: Total Cost */}
            <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  padding: '10px',
                  background: 'rgba(124, 58, 237, 0.12)',
                  borderRadius: '12px',
                  color: 'var(--color-primary)',
                }}
              >
                <DollarSign size={22} />
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Total Expenses
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '6px' }}>
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Accumulated costs across categories
              </p>
            </div>

            {/* Card 2: Total KM */}
            <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  padding: '10px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  borderRadius: '12px',
                  color: 'var(--color-secondary)',
                }}
              >
                <Route size={22} />
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Distance Travelled
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '6px' }}>
                {totalKM.toLocaleString()} KM
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Based on odometer interval logs
              </p>
            </div>

            {/* Card 3: Cost per KM */}
            <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  padding: '10px',
                  background: 'rgba(249, 115, 22, 0.12)',
                  borderRadius: '12px',
                  color: 'var(--color-accent-orange)',
                }}
              >
                <TrendingUp size={22} />
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>
                Cost Per Kilometer
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '6px' }}>
                {costPerKM ? `₹${costPerKM}/KM` : 'N/A'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {costPerKM ? 'Total Cost / Total Distance' : 'Requires min 2 fuel logs'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main Charts & Overview Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '32px',
          marginBottom: '32px',
        }}
      >
        {/* Cost Breakdown Chart */}
        <div className="glass-panel" style={{ padding: '30px', minHeight: '380px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Expenses by Category</h2>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px' }}>
              <Spinner size="medium" />
            </div>
          ) : chartData.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '260px',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
              }}
            >
              <AlertTriangle size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No expense data recorded in this period.</p>
            </div>
          ) : (
            <div style={{ width: '100%', minWidth: 0, height: '280px', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#7c3aed'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13, 16, 27, 0.9)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      color: 'white',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Cost']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={10}
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#fff', fontSize: '0.85rem' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity summary */}
        <div className="glass-panel" style={{ padding: '30px', maxHeight: '380px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Recent Expenses</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton-shimmer" style={{ height: '50px', width: '100%' }} />
              <div className="skeleton-shimmer" style={{ height: '50px', width: '100%' }} />
              <div className="skeleton-shimmer" style={{ height: '50px', width: '100%' }} />
            </div>
          ) : expenses.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '220px',
                color: 'var(--color-text-muted)',
              }}
            >
              <p>No logs found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {expenses.slice(0, 5).map((exp) => (
                <div
                  key={exp._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{exp.category}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {exp.vehicle ? `${exp.vehicle.make} ${exp.vehicle.model}` : 'Deleted Vehicle'} •{' '}
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: COLORS[exp.category] || 'var(--color-text-main)',
                      }}
                    >
                      ₹{exp.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Unified Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={20} style={{ color: 'var(--color-primary)' }} />
              Quick Add Log
            </h2>

            {/* Dropdown to select type */}
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Select Add Type</label>
              <select
                className="input-field"
                value={quickAddType}
                onChange={(e) => setQuickAddType(e.target.value)}
              >
                <option value="Fuel">Fuel Stop Log</option>
                <option value="Expense">Other Expense Log</option>
                <option value="Vehicle">Vehicle (Garage)</option>
              </select>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', marginBottom: '24px' }} />

            {/* Render fields dynamically */}
            {quickAddType === 'Vehicle' && (
              <form onSubmit={handleAddVehicle}>
                <div className="input-group">
                  <label className="input-label">Make / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Honda, Maruti Suzuki"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. City, Swift"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">License Plate Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Manufacture Year (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2022"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="input-label">Fuel Type</label>
                  <select
                    value={vFuelType}
                    onChange={(e) => setVFuelType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? <Spinner size="small" color="white" inline /> : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            )}

            {quickAddType === 'Fuel' && (
              <form onSubmit={handleSaveFuel}>
                <div className="input-group">
                  <label className="input-label">Vehicle</label>
                  {vehicles.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>Please add a vehicle first!</p>
                  ) : (
                    <select
                      className="input-field"
                      value={vId}
                      onChange={(e) => setVId(e.target.value)}
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.make} {v.model} ({v.licensePlate.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Odometer Reading (KM)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45200"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Fuel Volume (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 32.5"
                      value={fuelVolume}
                      onChange={(e) => setFuelVolume(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="input-group">
                    <label className="input-label">Fuel Type</label>
                    <select
                      className="input-field"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      disabled={true}
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                      <option value="EV Charging">EV Charging</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Price per Liter (₹/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 104.5"
                      value={pricePerLiter}
                      onChange={(e) => setPricePerLiter(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                {fuelVolume && pricePerLiter && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px dashed var(--panel-border)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>Calculated Cost:</span>
                    <span style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>
                      ₹{(parseFloat(fuelVolume) * parseFloat(pricePerLiter)).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">GPS Location (Auto-captured)</label>
                    <button
                      type="button"
                      onClick={captureGPS}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600',
                      }}
                      disabled={locLoading}
                    >
                      <Navigation size={12} /> {locLoading ? 'Capturing...' : 'Recapture'}
                    </button>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: 'var(--input-radius)',
                      padding: '12px 14px',
                      fontSize: '0.85rem',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: location ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                    }}
                  >
                    <MapPin size={16} style={{ color: 'var(--color-accent-pink)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {locLoading ? (
                        <Spinner size="small" inline />
                      ) : location ? (
                        location.address
                      ) : (
                        'GPS location details...'
                      )}
                    </span>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label className="input-label">Attach Bill Receipt (Optional)</label>
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
                      <input type="file" onChange={(e) => handleFileUpload(e, setAttachmentUrl)} style={{ display: 'none' }} disabled={uploading || submitting} />
                    </label>
                    {attachmentUrl && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                        Uploaded ✓
                      </span>
                    )}
                  </div>
                  {uploading && <ProgressBar progress={uploadProgress} label="Uploading bill receipt..." type="upload" />}
                </div>

                <div className="input-group">
                  <label className="input-label">Note</label>
                  <textarea
                    placeholder="Remarks, fuel station name, etc."
                    value={fuelNotes}
                    onChange={(e) => setFuelNotes(e.target.value)}
                    className="input-field"
                    rows="2"
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || uploading || vehicles.length === 0}
                  >
                    {submitting ? <Spinner size="small" color="white" inline /> : 'Submit Fuel Log'}
                  </button>
                </div>
              </form>
            )}

            {quickAddType === 'Expense' && (
              <form onSubmit={handleSaveExpense}>
                <div className="input-group">
                  <label className="input-label">Vehicle</label>
                  {vehicles.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-danger)' }}>Please add a vehicle first!</p>
                  ) : (
                    <select
                      className="input-field"
                      value={vId}
                      onChange={(e) => setVId(e.target.value)}
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.make} {v.model} ({v.licensePlate.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="input-field"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
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
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

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
                      <input type="file" onChange={(e) => handleFileUpload(e, setExpenseAttachmentUrl)} style={{ display: 'none' }} disabled={uploading || submitting} />
                    </label>
                    {expenseAttachmentUrl && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                        Uploaded ✓
                      </span>
                    )}
                  </div>
                  {uploading && <ProgressBar progress={uploadProgress} label="Uploading receipt..." type="upload" />}
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="input-label">Notes / Description</label>
                  <textarea
                    placeholder="Details of repair, service description, or toll location..."
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    className="input-field"
                    rows="3"
                    style={{ resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="btn btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || uploading || vehicles.length === 0}
                  >
                    {submitting ? <Spinner size="small" color="white" inline /> : 'Record Log'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
