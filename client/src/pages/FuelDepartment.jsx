import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import ProgressBar from '../components/ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Fuel, MapPin, Calendar, Paperclip, Plus, Navigation, TrendingUp, Navigation2, HelpCircle, Edit2, Trash2 } from 'lucide-react';

const FuelDepartment = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Geolocation states
  const [locLoading, setLocLoading] = useState(false);
  const [location, setLocation] = useState(null);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelVolume, setFuelVolume] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM

  const [editingFuel, setEditingFuel] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editOdometer, setEditOdometer] = useState('');
  const [editFuelVolume, setEditFuelVolume] = useState('');
  const [editFuelType, setEditFuelType] = useState('Petrol');
  const [editPricePerLiter, setEditPricePerLiter] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVehicleId, setEditVehicleId] = useState('');
  const [editLocation, setEditLocation] = useState(null);
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
  const [editLocLoading, setEditLocLoading] = useState(false);

  const { token, getHeaders } = useAuth();

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
          // Set defaults
          setVehicleId(vehiclesData[0]._id);
          if (!selectedVehicle) {
            setSelectedVehicle(vehiclesData[0]._id);
          }
        }
      }

      // Fetch fuel expenses for selected vehicle
      let url = '/api/expenses?category=Fuel';
      if (selectedVehicle) {
        url += `&vehicle=${selectedVehicle}`;
      } else if (vehiclesData.length > 0) {
        url += `&vehicle=${vehiclesData[0]._id}`;
      }

      const eRes = await fetch(`${API_URL}${url}`, { headers: getHeaders() });
      if (eRes.ok) {
        const expensesData = await eRes.json();
        setExpenses(expensesData);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure to MERN API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedVehicle]);

  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      const selectedVeh = vehicles.find((v) => v._id === vehicleId);
      if (selectedVeh && selectedVeh.fuelType) {
        setFuelType(selectedVeh.fuelType);
      }
    }
  }, [vehicleId, vehicles]);

  useEffect(() => {
    if (editVehicleId && vehicles.length > 0) {
      const selectedVeh = vehicles.find((v) => v._id === editVehicleId);
      if (selectedVeh && selectedVeh.fuelType) {
        setEditFuelType(selectedVeh.fuelType);
      }
    }
  }, [editVehicleId, vehicles]);

  // Capture GPS from device
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
          // Reverse geocode via free nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' }
            }
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

  // Trigger location capture once when page loads or vehicle changes
  useEffect(() => {
    captureGPS();
  }, []);

  // Handle file uploads with XMLHttpRequest progress listener
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
        try {
          const errData = JSON.parse(xhr.responseText);
          alert(errData.message || 'File upload failed');
        } catch(e) {
          alert('File upload failed: ' + xhr.statusText);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      alert('Upload error');
    };

    xhr.send(formData);
  };

  // Submit fuel expense
  const handleSaveFuel = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!vehicleId || !odometer || !fuelVolume || !pricePerLiter) {
      setError('Please provide vehicle, odometer reading, liters filled, and price/L');
      return;
    }

    setSubmitting(true);
    setError('');
    
    // Amount is calculated as fuelVolume * pricePerLiter
    const amount = parseFloat(fuelVolume) * parseFloat(pricePerLiter);

    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          category: 'Fuel',
          vehicle: vehicleId,
          amount,
          date,
          notes,
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
        setNotes('');
        setAttachmentUrl('');
        // Re-fetch data
        fetchData();
        // Recapture GPS for next entry
        captureGPS();
        setShowAddModal(false);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to submit fuel log');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditFuel = (log) => {
    setEditingFuel(log);
    setEditOdometer(log.odometer || '');
    setEditFuelVolume(log.fuelVolume || '');
    setEditFuelType(log.fuelType || 'Petrol');
    setEditPricePerLiter(log.pricePerLiter || '');
    setEditNotes(log.notes || '');
    setEditDate(new Date(log.date).toISOString().slice(0, 16));
    setEditVehicleId(log.vehicle?._id || log.vehicle || '');
    setEditLocation(log.location || null);
    setEditAttachmentUrl(log.attachmentUrl || '');
  };

  const handleUpdateFuel = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!editVehicleId || !editOdometer || !editFuelVolume || !editPricePerLiter) {
      alert('Please provide vehicle, odometer reading, liters filled, and price/L');
      return;
    }

    setSubmitting(true);
    setError('');
    const amount = parseFloat(editFuelVolume) * parseFloat(editPricePerLiter);

    try {
      const res = await fetch(`${API_URL}/api/expenses/${editingFuel._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          category: 'Fuel',
          vehicle: editVehicleId,
          amount,
          date: editDate,
          notes: editNotes,
          attachmentUrl: editAttachmentUrl,
          odometer: editOdometer,
          fuelVolume: editFuelVolume,
          fuelType: editFuelType,
          pricePerLiter: editPricePerLiter,
          location: editLocation,
        }),
      });

      if (res.ok) {
        setEditingFuel(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update fuel log');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFuel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fuel log?')) return;
    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete fuel log');
      }
    } catch (err) {
      console.error(err);
      alert('Server connection error');
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

  const captureEditGPS = () => {
    if (!navigator.geolocation) {
      alert('Mobile GPS Geolocation is not supported by your browser');
      return;
    }

    setEditLocLoading(true);
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

        setEditLocation({ latitude, longitude, address });
        setEditLocLoading(false);
      },
      (geoErr) => {
        console.error(geoErr);
        alert(`Mobile GPS Error: ${geoErr.message}`);
        setEditLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Calculations for fuel statistics
  const totalVolume = expenses.reduce((sum, curr) => sum + (curr.fuelVolume || 0), 0);
  const totalFuelCost = expenses.reduce((sum, curr) => sum + curr.amount, 0);

  // Total KM run for selected vehicle: Max Odo - Min Odo
  const sortedOdos = expenses
    .map((e) => e.odometer)
    .filter((o) => o !== undefined)
    .sort((a, b) => a - b);
  
  const distanceRun = sortedOdos.length >= 2 ? sortedOdos[sortedOdos.length - 1] - sortedOdos[0] : 0;

  // Average mileage (calculated overall: total distance / total volume of fills starting from second fill onwards)
  // Or average of all individual logs' mileage
  const logsWithMileage = expenses.filter((e) => e.mileage !== null && e.mileage !== undefined);
  const avgMileage = logsWithMileage.length > 0 
    ? (logsWithMileage.reduce((sum, curr) => sum + curr.mileage, 0) / logsWithMileage.length).toFixed(2) 
    : 'N/A';

  // Prepare chart data (reversing expenses to display chronologically from left to right)
  const lineChartData = [...expenses]
    .reverse()
    .filter((e) => e.odometer !== undefined)
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      Mileage: e.mileage || null,
      'Price/L': e.pricePerLiter || null,
    }));

  const selectedVehicleData = vehicles.find((v) => v._id === selectedVehicle);
  const displayFuelType = selectedVehicleData?.fuelType || 'Petrol';
  const displayVolumeUnit = displayFuelType === 'CNG' ? 'Kg' : (displayFuelType.includes('Electric') || displayFuelType === 'EV Charging' ? 'kWh' : 'L');

  return (
    <div style={{ position: 'relative' }}>
      <div className="bg-glow-purple" />
      <div className="bg-glow-cyan" />

      {/* Header and selector */}
      <div className="page-header">
        <div className="page-header-title">
          <h1>Fuel Department</h1>
          <p>Fuel logs, fuel economy analysis, and efficiency charts</p>
        </div>

        <div className="filters-container">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Log Fuel Stop
          </button>
          
          <select
            className="input-field"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            style={{ padding: '8px 16px', background: 'var(--panel-bg)', minWidth: '180px' }}
          >
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

      {/* Fuel Dashboard stats */}
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
            Fuel Used ({displayVolumeUnit})
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{totalVolume.toFixed(2)} {displayVolumeUnit}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            Distance Run (KM)
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{distanceRun.toLocaleString()} KM</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            Total Fuel Cost
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{totalFuelCost.toFixed(2)}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid var(--color-primary)' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
            Avg Mileage
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {avgMileage !== 'N/A' ? `${avgMileage} KM/${displayVolumeUnit}` : 'N/A'}
          </h3>
        </div>
      </div>

      {/* Charts section */}
      {lineChartData.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '32px',
            marginBottom: '32px',
          }}
        >
          {/* Mileage trend */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
              Mileage Trend (KM/{displayVolumeUnit})
            </h2>
            <div style={{ width: '100%', minWidth: 0, height: '240px', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <Tooltip
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
                    dataKey="Mileage"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--color-primary)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price trend */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--color-secondary)' }} />
              Fuel Price/{displayVolumeUnit} Trend (₹)
            </h2>
            <div style={{ width: '100%', minWidth: 0, height: '240px', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                  <Tooltip
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
                    dataKey="Price/L"
                    stroke="var(--color-secondary)"
                    strokeWidth={3}
                    dot={{ fill: 'var(--color-secondary)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Feed panel */}
      <div style={{ width: '100%', marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Fuel History Logs</h2>
        
        {loading ? (
          <Skeleton type="feed" count={3} />
        ) : expenses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '800px', margin: '0 auto' }}>
            <Fuel size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No fuel stops recorded yet for this vehicle.</p>
          </div>
        ) : (
          <div className="responsive-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Odometer</th>
                  <th>Distance Run</th>
                  <th>Volume/Qty</th>
                  <th>Fuel Type</th>
                  <th>Price/Unit</th>
                  <th>Total Cost</th>
                  <th>Mileage</th>
                  <th>Location & Notes</th>
                  <th>Receipt</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((log, idx) => {
                  const nextLog = expenses[idx + 1]; // sorted by date/odo descending (so nextLog is older)
                  const distanceSinceLast = nextLog && log.odometer !== undefined && nextLog.odometer !== undefined
                    ? log.odometer - nextLog.odometer
                    : null;

                  return (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.odometer?.toLocaleString()} KM</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {distanceSinceLast !== null ? `${distanceSinceLast} KM` : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {log.fuelVolume} {log.fuelType === 'CNG' ? 'Kg' : (log.fuelType?.includes('Electric') || log.fuelType === 'EV Charging' ? 'kWh' : 'L')}
                      </td>
                      <td>
                        <span
                          style={{
                            background: 'rgba(124, 58, 237, 0.12)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            color: 'var(--color-primary)',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                          }}
                        >
                          {log.fuelType || 'Petrol'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>₹{log.pricePerLiter}</td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '700', color: 'var(--color-secondary)' }}>
                        ₹{log.amount.toFixed(2)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: 'var(--color-primary)' }}>
                        {log.mileage ? `${log.mileage} KM/${log.fuelType === 'CNG' ? 'Kg' : (log.fuelType?.includes('Electric') || log.fuelType === 'EV Charging' ? 'kWh' : 'L')}` : '—'}
                      </td>
                      <td>
                        <div style={{ minWidth: '180px' }}>
                          {log.notes && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}>{log.notes}</div>}
                          {log.location?.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              <MapPin size={10} style={{ color: 'var(--color-accent-pink)', flexShrink: 0 }} />
                              <span style={{ lineHeight: '1.2' }}>{log.location.address}</span>
                            </div>
                          )}
                          {!log.notes && !log.location?.address && <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No remarks</span>}
                        </div>
                      </td>
                      <td>
                        {log.attachmentUrl ? (
                          <a
                            href={log.attachmentUrl}
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
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => startEditFuel(log)}
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
                            onClick={() => handleDeleteFuel(log._id)}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Fuel Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fuel size={20} style={{ color: 'var(--color-primary)' }} />
              Log Fuel Stop
            </h2>

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

            <form onSubmit={handleSaveFuel}>
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

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Odometer Reading (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45200"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="input-field"
                    disabled={submitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Fuel Volume/Quantity ({fuelType === 'CNG' ? 'Kg' : fuelType.includes('Electric') || fuelType === 'EV Charging' ? 'kWh' : 'Liters'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 32.5"
                    value={fuelVolume}
                    onChange={(e) => setFuelVolume(e.target.value)}
                    className="input-field"
                    disabled={submitting}
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
                  <label className="input-label">
                    Price per Unit ({fuelType === 'CNG' ? '₹/Kg' : fuelType.includes('Electric') || fuelType === 'EV Charging' ? '₹/kWh' : '₹/L'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 104.50"
                    value={pricePerLiter}
                    onChange={(e) => setPricePerLiter(e.target.value)}
                    className="input-field"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Total Cost Display (Calculated) */}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              {/* Location (Auto) GPS */}
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
                      'Waiting for mobile GPS lock...'
                    )}
                  </span>
                </div>
              </div>

              {/* Attachment Optional + Progress Bar */}
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
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading || submitting} />
                  </label>
                  {attachmentUrl && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                      Uploaded ✓
                    </span>
                  )}
                </div>

                {uploading && (
                  <ProgressBar progress={uploadProgress} label="Uploading Bill..." type="upload" />
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Note</label>
                <textarea
                  placeholder="Remarks, fuel station name, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows="2"
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
                  className="btn btn-primary"
                  disabled={submitting || uploading}
                >
                  {submitting ? (
                    <Spinner size="small" color="white" inline />
                  ) : (
                    <>
                      <Fuel size={18} /> Submit Entry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fuel Modal */}
      {editingFuel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fuel size={20} style={{ color: 'var(--color-secondary)' }} />
              Edit Fuel Entry
            </h2>

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

            <form onSubmit={handleUpdateFuel}>
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

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Odometer (KM)</label>
                  <input
                    type="number"
                    value={editOdometer}
                    onChange={(e) => setEditOdometer(e.target.value)}
                    className="input-field"
                    disabled={submitting}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Volume/Qty ({editFuelType === 'CNG' ? 'Kg' : editFuelType.includes('Electric') || editFuelType === 'EV Charging' ? 'kWh' : 'Liters'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFuelVolume}
                    onChange={(e) => setEditFuelVolume(e.target.value)}
                    className="input-field"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Fuel Type</label>
                  <select
                    className="input-field"
                    value={editFuelType}
                    onChange={(e) => setEditFuelType(e.target.value)}
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
                  <label className="input-label">
                    Price per Unit ({editFuelType === 'CNG' ? '₹/Kg' : editFuelType.includes('Electric') || editFuelType === 'EV Charging' ? '₹/kWh' : '₹/L'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPricePerLiter}
                    onChange={(e) => setEditPricePerLiter(e.target.value)}
                    className="input-field"
                    disabled={submitting}
                  />
                </div>
              </div>

              {editFuelVolume && editPricePerLiter && (
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
                    ₹{(parseFloat(editFuelVolume) * parseFloat(editPricePerLiter)).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              {/* Location (Auto) GPS */}
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">GPS Location (Auto-captured)</label>
                  <button
                    type="button"
                    onClick={captureEditGPS}
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
                    disabled={editLocLoading}
                  >
                    <Navigation size={12} /> {editLocLoading ? 'Capturing...' : 'Recapture'}
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
                    color: editLocation ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                  }}
                >
                  <MapPin size={16} style={{ color: 'var(--color-accent-pink)', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {editLocLoading ? (
                      <Spinner size="small" inline />
                    ) : editLocation ? (
                      editLocation.address
                    ) : (
                      'No location set'
                    )}
                  </span>
                </div>
              </div>

              {/* Attachment Bill */}
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
                    <input type="file" onChange={handleEditFileUpload} style={{ display: 'none' }} disabled={uploading || submitting} />
                  </label>
                  {editAttachmentUrl && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '500' }}>
                      Uploaded ✓
                    </span>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Note</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input-field"
                  rows="2"
                  style={{ resize: 'none' }}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setEditingFuel(null)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #6366f1 100%)' }}
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

export default FuelDepartment;
