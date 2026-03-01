import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';

const SYMPTOM_PRESETS = [
  'Kaszel nocny',
  'Świszczący oddech',
  'Ucisk w klatce',
  'Duszność',
  'Świsty',
  'Nasilone po wysiłku',
  'Nocne przebudzenia'
];

const TRIGGER_PRESETS = [
  'zimne powietrze',
  'alergeny',
  'wysiłek',
  'infekcja',
  'dym',
  'stres',
  'pyłki',
  'kurz'
];

const MED_PRESETS = [
  'Salbutamol',
  'Budezonid',
  'Formoterol',
  'Flutikazon',
  'Montelukast'
];

const TAG_PRESETS = [
  'poranny',
  'wieczorny',
  'przed_lekiem',
  'po_leku',
  'kaszel',
  'wysilek',
  'alergeny'
];

const SEVERITY_OPTIONS = [
  { value: 1, label: 'Łagodne' },
  { value: 2, label: 'Umiarkowane' },
  { value: 3, label: 'Nasilone' },
  { value: 4, label: 'Silne' },
  { value: 5, label: 'Bardzo silne' },
];

function AppWithRouter() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [measurementTag, setMeasurementTag] = useState(TAG_PRESETS[0] || '');
  const [filterRange, setFilterRange] = useState({ from: '', to: '', tag: '' });
  const [patientForm, setPatientForm] = useState({ name: '', notes: '' });
  const [measurementForm, setMeasurementForm] = useState({ type: 'PEF', value: '', recordedAt: localDateTime(), notes: '' });
  const [symptoms, setSymptoms] = useState([]);
  const [symptomForm, setSymptomForm] = useState({ severity: 3, description: SYMPTOM_PRESETS[0] || '', recordedAt: localDateTime(), triggerTag: TAG_PRESETS[0] || '' });
  const [triggers, setTriggers] = useState([]);
  const [triggerForm, setTriggerForm] = useState({ name: TRIGGER_PRESETS[0] || '', notes: '', recordedAt: localDateTime() });
  const [medications, setMedications] = useState([]);
  const [medForm, setMedForm] = useState({ name: MED_PRESETS[0] || '', dosage: '', schedule: '' });
  const [symptomOptions, setSymptomOptions] = useState([...SYMPTOM_PRESETS]);
  const [triggerOptions, setTriggerOptions] = useState([...TRIGGER_PRESETS]);
  const [medOptions, setMedOptions] = useState([...MED_PRESETS]);
  const [tagOptions, setTagOptions] = useState([...TAG_PRESETS]);
  const [newSymptomOption, setNewSymptomOption] = useState('');
  const [newTriggerOption, setNewTriggerOption] = useState('');
  const [newMedOption, setNewMedOption] = useState('');
  const [newTagOption, setNewTagOption] = useState('');
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [profileForm, setProfileForm] = useState({ email: '', userName: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [mockMode, setMockMode] = useState(false);

  const roles = profile?.roles || [];
  const canManagePatients = roles.includes('Admin') || roles.includes('Doctor');
  const canEditData = roles.includes('Admin') || roles.includes('Doctor') || roles.includes('Patient');
  const isPatientOnly = roles.includes('Patient') && !canManagePatients;

  const navigate = useNavigate();
  const location = useLocation();

  function localDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  const addOption = (value, list, setter, setTarget) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    if (setTarget) setTarget(trimmed);
  };

  const severityLabel = (sev) => {
    const found = SEVERITY_OPTIONS.find((o) => o.value === Number(sev));
    return found ? found.label : `Poziom ${sev}`;
  };

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get('/api/auth/me', { headers })
      .then((r) => {
        setProfile(r.data);
        setProfileForm({ email: r.data.email, userName: r.data.userName });
      })
      .catch(() => setProfile(null));

    if (mockMode) return;

    axios
      .get('/api/patients', { headers })
      .then((r) => {
        setPatients(r.data);
        if (!selectedPatientId && r.data.length > 0) {
          setSelectedPatientId(r.data[0].id);
        }
      })
      .catch(() => setPatients([]));
  }, [token, mockMode]);

  useEffect(() => {
    if (!token || !selectedPatientId || mockMode) return;
    const headers = { Authorization: `Bearer ${token}` };
    axios
      .get(`/api/patients/${selectedPatientId}/measurements`, { headers, params: { from: filterRange.from || undefined, to: filterRange.to || undefined, tag: filterRange.tag || undefined } })
      .then((r) => setMeasurements(r.data))
      .catch(() => setMeasurements([]));

    axios
      .get(`/api/patients/${selectedPatientId}/symptoms`, { headers })
      .then((r) => setSymptoms(r.data))
      .catch(() => setSymptoms([]));

    axios
      .get(`/api/patients/${selectedPatientId}/triggers`, { headers })
      .then((r) => setTriggers(r.data))
      .catch(() => setTriggers([]));

    axios
      .get(`/api/patients/${selectedPatientId}/medications`, { headers })
      .then((r) => setMedications(r.data))
      .catch(() => setMedications([]));
  }, [token, selectedPatientId, filterRange, mockMode]);

  const handleLogin = (t) => {
    localStorage.setItem('token', t);
    setToken(t);
    setMessage('');
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        '/api/auth/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // swallow errors on logout
    }
    localStorage.removeItem('token');
    setToken(null);
    setProfile(null);
    setPatients([]);
    setMessage('Logged out');
  };

  const submitPatient = async (e) => {
    e.preventDefault();
    if (!canManagePatients) return;
    if (!patientForm.name) return;
    if (mockMode) {
      const newPatient = { id: `mock-${Date.now()}`, name: patientForm.name, notes: patientForm.notes, mock: true };
      setPatients([newPatient]);
      setSelectedPatientId(newPatient.id);
      setMockMode(true);
      setPatientForm({ name: '', notes: '' });
      return;
    }
    await axios.post('/api/patients', patientForm, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await axios.get('/api/patients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setPatients(list.data);
    if (list.data.length > 0) {
      setSelectedPatientId(list.data[list.data.length - 1].id);
    }
    setPatientForm({ name: '', notes: '' });
  };

  const submitMeasurement = async (e) => {
    e.preventDefault();
    if (!canEditData) return;
    if (!selectedPatientId || !measurementForm.value) return;
    if (mockMode) {
      const newItem = {
        id: `mock-meas-${Date.now()}`,
        patientId: selectedPatientId,
        type: measurementForm.type,
        value: parseFloat(measurementForm.value),
        recordedAt: measurementForm.recordedAt,
        notes: measurementForm.notes,
        tag: measurementTag || null,
      };
      setMeasurements((prev) => [...prev, newItem]);
    } else {
      await axios.post(
        `/api/patients/${selectedPatientId}/measurements`,
        { ...measurementForm, value: parseFloat(measurementForm.value), tag: measurementTag || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = await axios.get(`/api/patients/${selectedPatientId}/measurements`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { from: filterRange.from || undefined, to: filterRange.to || undefined, tag: filterRange.tag || undefined },
      });
      setMeasurements(list.data);
    }
    setMeasurementForm({ type: measurementForm.type, value: '', recordedAt: localDateTime(), notes: '' });
    setMeasurementTag('');
  };

  const deleteMeasurement = async (id) => {
    if (!canEditData) return;
    if (mockMode) {
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    await axios.delete(`/api/patients/${selectedPatientId}/measurements/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const submitSymptom = async (e) => {
    e.preventDefault();
    if (!canEditData) return;
    if (!selectedPatientId || !symptomForm.description) return;
    if (mockMode) {
      const newItem = { ...symptomForm, id: `mock-sym-${Date.now()}`, patientId: selectedPatientId };
      setSymptoms((prev) => [...prev, newItem]);
    } else {
      await axios.post(
        `/api/patients/${selectedPatientId}/symptoms`,
        symptomForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = await axios.get(`/api/patients/${selectedPatientId}/symptoms`, { headers: { Authorization: `Bearer ${token}` } });
      setSymptoms(list.data);
    }
    setSymptomForm({ severity: 3, description: '', recordedAt: localDateTime(), triggerTag: '' });
  };

  const submitTrigger = async (e) => {
    e.preventDefault();
    if (!canEditData) return;
    if (!selectedPatientId || !triggerForm.name) return;
    if (mockMode) {
      const newItem = { ...triggerForm, id: `mock-tr-${Date.now()}`, patientId: selectedPatientId };
      setTriggers((prev) => [...prev, newItem]);
    } else {
      await axios.post(
        `/api/patients/${selectedPatientId}/triggers`,
        triggerForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = await axios.get(`/api/patients/${selectedPatientId}/triggers`, { headers: { Authorization: `Bearer ${token}` } });
      setTriggers(list.data);
    }
    setTriggerForm({ name: '', notes: '', recordedAt: localDateTime() });
  };

  const submitMed = async (e) => {
    e.preventDefault();
    if (!canEditData) return;
    if (!selectedPatientId || !medForm.name) return;
    if (mockMode) {
      const newItem = { ...medForm, id: `mock-med-${Date.now()}`, patientId: selectedPatientId, active: true };
      setMedications((prev) => [...prev, newItem]);
    } else {
      await axios.post(
        `/api/patients/${selectedPatientId}/medications`,
        medForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = await axios.get(`/api/patients/${selectedPatientId}/medications`, { headers: { Authorization: `Bearer ${token}` } });
      setMedications(list.data);
    }
    setMedForm({ name: '', dosage: '', schedule: '' });
  };

  const deleteMed = async (id) => {
    if (!canEditData) return;
    if (mockMode) {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    await axios.delete(`/api/patients/${selectedPatientId}/medications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteSymptom = async (id) => {
    if (!canEditData) return;
    if (mockMode) {
      setSymptoms((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    await axios.delete(`/api/patients/${selectedPatientId}/symptoms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  };

  const deleteTrigger = async (id) => {
    if (!canEditData) return;
    if (mockMode) {
      setTriggers((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await axios.delete(`/api/patients/${selectedPatientId}/triggers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    await axios.put('/api/auth/profile', profileForm, { headers: { Authorization: `Bearer ${token}` } });
    setMessage('Profile updated');
  };

  const deleteAccount = async () => {
    await axios.delete('/api/auth/delete-account', { headers: { Authorization: `Bearer ${token}` } });
    handleLogout();
  };

  const requestReset = async (e) => {
    e.preventDefault();
    const res = await axios.post('/api/auth/request-password-reset', { email: resetEmail });
    setMessage(`Reset token (demo): ${res.data.resetToken || 'sent'}`);
  };

  const doReset = async (e) => {
    e.preventDefault();
    await axios.post('/api/auth/reset-password', { email: resetEmail, token: resetToken, newPassword: resetNewPassword });
    setMessage('Password reset');
  };

  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

  const chartData = (type) => {
    const data = sortedMeasurements.filter((m) => m.type === type);
    return {
      labels: data.map((m) => new Date(m.recordedAt).toLocaleString()),
      datasets: [
        {
          label: `Trend ${type}`,
          data: data.map((m) => m.value),
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.15)',
          tension: 0.25,
          fill: true,
          pointRadius: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { maxTicksLimit: 6 } },
      y: { beginAtZero: false },
    },
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const slugify = (text) => {
    if (!text) return 'pacjent';
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/_+/g, '_')
      .replace(/^-+|-+$/g, '') || 'pacjent';
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadFile = async (path, filename, contentType) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(path, { responseType: 'arraybuffer', headers });
      const type = contentType || res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Nie udało się pobrać pliku.');
    }
  };

  const isMock = selectedPatientId && selectedPatientId.toString().startsWith('mock-');

  const exportCsv = () => {
    if (!selectedPatientId) return;
    const name = slugify(selectedPatient?.name) || selectedPatientId;
    if (mockMode || isMock) {
      const rows = [
        'typ;wartosc;czas;notatka;tag'
      ];
      measurements.forEach((m) => {
        rows.push([m.type, m.value, m.recordedAt, m.notes || '', m.tag || ''].join(';'));
      });
      rows.push('', 'OBJAWY:', 'opis;nasilenie;czas;tag');
      symptoms.forEach((s) => rows.push([s.description, s.severity, s.recordedAt, s.triggerTag || ''].join(';')));
      rows.push('', 'LEKI:', 'nazwa;dawka;harmonogram');
      medications.forEach((med) => rows.push([med.name, med.dosage || '', med.schedule || ''].join(';')));
      rows.push('', 'WYZWALACZE:', 'nazwa;notatki;czas');
      triggers.forEach((t) => rows.push([t.name, t.notes || '', t.recordedAt].join(';')));
      const csv = rows.join('\n');
      downloadBlob(csv, `pomiary-${name}.csv`, 'text/csv;charset=utf-8;');
      return;
    }
    downloadFile(`/api/reports/patients/${selectedPatientId}/measurements/csv`, `pomiary-${name}.csv`, 'text/csv');
  };

  const exportPdf = () => {
    if (!selectedPatientId) return;
    const name = slugify(selectedPatient?.name) || selectedPatientId;
    if (mockMode || isMock) {
      downloadFile('/api/reports/mock/pdf', `raport-${name}.pdf`, 'application/pdf');
      return;
    }
    downloadFile(`/api/reports/patients/${selectedPatientId}/full/pdf`, `raport-${name}.pdf`, 'application/pdf');
  };

  const measurementSummary = (type) => {
    const data = sortedMeasurements.filter((m) => m.type === type);
    if (!data.length) return null;
    const values = data.map((m) => m.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = data[data.length - 1];
    return {
      avg: Number.isFinite(avg) ? avg.toFixed(1) : '-',
      latest: latest.value,
      latestAt: new Date(latest.recordedAt).toLocaleString(),
    };
  };

  const tabPaths = {
    overview: '/',
    measurements: '/measurements',
    symptoms: '/symptoms',
    triggers: '/triggers',
    medications: '/medications',
    profile: '/profile',
    security: '/security',
    reports: '/reports',
  };

  useEffect(() => {
    const found = Object.entries(tabPaths).find(([, path]) => path === location.pathname);
    const nextTab = found ? found[0] : 'overview';
    if (nextTab !== activeTab) setActiveTab(nextTab);
  }, [location.pathname]);

  const handleNav = (tabId) => {
    setActiveTab(tabId);
    navigate(tabPaths[tabId] || '/');
  };

  const loadMockData = () => {
    const mockPatient = { id: 'mock-1', name: 'Demo pacjent', notes: 'Dane przykładowe (lokalne)', mock: true };
    const baseDate = new Date();
    const iso = (d) => new Date(d).toISOString().slice(0, 16);
    const mockMeasurements = [
      { id: 'mock-meas-1', patientId: 'mock-1', type: 'PEF', value: 420, recordedAt: iso(baseDate), notes: 'Poranek', tag: 'przed_lekiem' },
      { id: 'mock-meas-2', patientId: 'mock-1', type: 'PEF', value: 470, recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 6), notes: 'Po leku', tag: 'po_leku' },
      { id: 'mock-meas-3', patientId: 'mock-1', type: 'FEV1', value: 3.2, recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 24), notes: 'Stabilny', tag: '' },
      { id: 'mock-meas-4', patientId: 'mock-1', type: 'SpO2', value: 97, recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 30), notes: 'Bez zmian', tag: '' },
      { id: 'mock-meas-5', patientId: 'mock-1', type: 'PEF', value: 390, recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 48), notes: 'Lekki spadek', tag: 'objaw' },
    ];
    const mockSymptoms = [
      { id: 'mock-sym-1', patientId: 'mock-1', severity: 3, description: 'Kaszel', recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 20), triggerTag: 'pylki' },
      { id: 'mock-sym-2', patientId: 'mock-1', severity: 2, description: 'Świszczący oddech', recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 6), triggerTag: 'zimne_powietrze' },
    ];
    const mockTriggers = [
      { id: 'mock-tr-1', patientId: 'mock-1', name: 'Pyłki', notes: 'Wysokie pyłki traw', recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 24) },
      { id: 'mock-tr-2', patientId: 'mock-1', name: 'Zimne powietrze', notes: 'Wietrznie', recordedAt: iso(baseDate.getTime() - 3600 * 1000 * 48) },
    ];
    const mockMeds = [
      { id: 'mock-med-1', patientId: 'mock-1', name: 'Salbutamol', dosage: '2 wziewy', schedule: 'doraźnie', active: true },
      { id: 'mock-med-2', patientId: 'mock-1', name: 'Budezonid', dosage: '1 dawka', schedule: '08:00;20:00', active: true },
    ];
    setMockMode(true);
    setPatients([mockPatient]);
    setSelectedPatientId('mock-1');
    setMeasurements(mockMeasurements);
    setSymptoms(mockSymptoms);
    setTriggers(mockTriggers);
    setMedications(mockMeds);
    setFilterRange({ from: '', to: '', tag: '' });
  };

  const refreshFromApi = async () => {
    setMockMode(false);
    setSelectedPatientId(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const list = await axios.get('/api/patients', { headers });
      setPatients(list.data);
      if (list.data.length > 0) setSelectedPatientId(list.data[0].id);
    } catch {
      setPatients([]);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    await axios.post(
      '/api/auth/change-password',
      { currentPassword: passwords.oldPassword, newPassword: passwords.newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMessage('Password changed');
    setPasswords({ oldPassword: '', newPassword: '' });
  };

  const tabs = [
    { id: 'overview', label: 'Przegląd', icon: '📊' },
    { id: 'measurements', label: 'Pomiary', icon: '🫁' },
    { id: 'symptoms', label: 'Objawy', icon: '😷' },
    { id: 'triggers', label: 'Wyzwalacze', icon: '🌾' },
    { id: 'medications', label: 'Leki', icon: '💊' },
    { id: 'profile', label: 'Profil', icon: '👤' },
    { id: 'security', label: 'Bezpieczeństwo', icon: '🔒' },
    { id: 'reports', label: 'Raporty', icon: '📑' },
  ];

  const ensurePatient = (content) => {
    if (!selectedPatientId) {
      return <div className="panel">Dodaj i wybierz pacjenta, aby zacząć pracę.</div>;
    }
    return content;
  };

  const renderOverview = () => ensurePatient(
    <>
      <div className="grid cards">
        {['PEF', 'FEV1', 'SpO2'].map((type) => {
          const data = chartData(type);
          const summary = measurementSummary(type);
          const hasData = data.datasets[0].data.length > 0;
          return (
            <div key={type} className="panel">
              <div className="panel-head">
                <div>
                  <div className="eyebrow">{type}</div>
                  <strong>{type} trend</strong>
                </div>
                {summary && <span className="muted small">Ostatni: {summary.latest} @ {summary.latestAt}</span>}
              </div>
              <div className="chart-wrap">
                {hasData ? <Line data={data} options={chartOptions} /> : <div className="muted small">Brak danych</div>}
              </div>
              {summary && (
                <div className="muted small">Średnia {summary.avg}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">Szybki podgląd</div>
              <strong>Ostatnie pomiary</strong>
            </div>
            {selectedPatientId ? (
              <button type="button" className="link" onClick={exportCsv}>Pobierz CSV</button>
            ) : (
              <span className="muted small">Wybierz pacjenta</span>
            )}
          </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Wartość</th>
              <th>Czas</th>
              <th>Notatka / Tag</th>
            </tr>
          </thead>
          <tbody>
            {measurements.slice(0, 5).map((m) => (
              <tr key={m.id}>
                <td>{m.type}</td>
                <td>{m.value}</td>
                <td>{new Date(m.recordedAt).toLocaleString()}</td>
                <td>{m.notes} {m.tag ? `(${m.tag})` : ''}</td>
              </tr>
            ))}
            {measurements.length === 0 && (
              <tr><td colSpan="4" className="muted">Brak danych</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderMeasurements = () => ensurePatient(
    <>
      <div className="panel">
        <div className="panel-head"><strong>Filtry i eksport</strong></div>
        <div className="filters">
          <label>Od<input type="date" value={filterRange.from} onChange={(e) => setFilterRange({ ...filterRange, from: e.target.value })} /></label>
          <label>Do<input type="date" value={filterRange.to} onChange={(e) => setFilterRange({ ...filterRange, to: e.target.value })} /></label>
          <label>Tag
            <select value={filterRange.tag} onChange={(e) => setFilterRange({ ...filterRange, tag: e.target.value })}>
              <option value="">(wszystkie)</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
          {selectedPatientId ? (
            <button type="button" className="link" onClick={exportCsv}>Pobierz CSV</button>
          ) : (
            <span className="muted small">Wybierz pacjenta, aby eksportować</span>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><strong>Dodaj pomiar</strong></div>
        <form onSubmit={submitMeasurement} className="form-grid">
          <select
            value={measurementForm.type}
            onChange={(e) => setMeasurementForm({ ...measurementForm, type: e.target.value })}
            disabled={!canEditData}
          >
            <option value="PEF">PEF</option>
            <option value="FEV1">FEV1</option>
            <option value="SpO2">SpO2</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Wartość"
            value={measurementForm.value}
            onChange={(e) => setMeasurementForm({ ...measurementForm, value: e.target.value })}
            disabled={!canEditData}
          />
          <input
            type="datetime-local"
            value={measurementForm.recordedAt}
            onChange={(e) => setMeasurementForm({ ...measurementForm, recordedAt: e.target.value })}
            disabled={!canEditData}
          />
          <input
            placeholder="Notatki"
            value={measurementForm.notes}
            onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
            disabled={!canEditData}
          />
          <div className="preset-row inline-form">
            <select
              value={measurementTag}
              onChange={(e) => setMeasurementTag(e.target.value)}
              disabled={!canEditData}
            >
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <input
              placeholder="Dodaj nowy tag"
              value={newTagOption}
              onChange={(e) => setNewTagOption(e.target.value)}
              disabled={!canEditData}
            />
            <button
              type="button"
              onClick={() => {
                addOption(newTagOption, tagOptions, setTagOptions, setMeasurementTag);
                setNewTagOption('');
              }}
              disabled={!canEditData}
            >
              +
            </button>
          </div>
          <button type="submit" disabled={!canEditData}>Dodaj</button>
        </form>
      </div>

      <div className="grid cards">
        {['PEF', 'FEV1', 'SpO2'].map((type) => {
          const data = chartData(type);
          const summary = measurementSummary(type);
          const hasData = data.datasets[0].data.length > 0;
          return (
            <div key={type} className="panel">
              <div className="panel-head">
                <strong>{type}</strong>
                {summary && <span className="muted small">Latest {summary.latest}</span>}
              </div>
              <div className="chart-wrap">
                {hasData ? <Line data={data} options={chartOptions} /> : <div className="muted small">Brak danych</div>}
              </div>
              {summary && <div className="muted small">Avg {summary.avg}</div>}
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-head"><strong>Historia pomiarów</strong></div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Wartość</th>
              <th>Czas</th>
              <th>Notatka / Tag</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => (
              <tr key={m.id}>
                <td>{m.type}</td>
                <td>{m.value}</td>
                <td>{new Date(m.recordedAt).toLocaleString()}</td>
                <td>{m.notes} {m.tag ? `(${m.tag})` : ''}</td>
                <td><button className="ghost" onClick={() => deleteMeasurement(m.id)} disabled={!canEditData}>Usuń</button></td>
              </tr>
            ))}
            {measurements.length === 0 && (
              <tr><td colSpan="5" className="muted">Brak danych</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderSymptoms = () => ensurePatient(
    <div className="panel">
      <div className="panel-head"><strong>Objawy</strong></div>
      <form onSubmit={submitSymptom} className="form-grid balanced">
        <div className="stack" style={{ gap: 6 }}>
          <label className="muted small">Objaw</label>
          <select value={symptomForm.description} onChange={(e) => setSymptomForm({ ...symptomForm, description: e.target.value })} disabled={!canEditData}>
            {symptomOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <label className="muted small">Nasilenie</label>
          <select value={symptomForm.severity} onChange={(e) => setSymptomForm({ ...symptomForm, severity: parseInt(e.target.value || '1', 10) })} disabled={!canEditData}>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
            ))}
          </select>
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <label className="muted small">Czas</label>
          <input type="datetime-local" value={symptomForm.recordedAt} onChange={(e) => setSymptomForm({ ...symptomForm, recordedAt: e.target.value })} disabled={!canEditData} />
        </div>
        <div className="stack" style={{ gap: 6 }}>
          <label className="muted small">Tag wyzwalacza</label>
          <select value={symptomForm.triggerTag} onChange={(e) => setSymptomForm({ ...symptomForm, triggerTag: e.target.value })} disabled={!canEditData}>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="stack" style={{ gap: 6, alignSelf: 'end' }}>
          <button type="submit" disabled={!canEditData}>Dodaj</button>
        </div>
      </form>

      <div className="subpanel">
        <div className="panel-head"><span className="muted small">Dodaj nowy objaw do listy</span></div>
        <div className="preset-row">
          <input
            placeholder="Nowy objaw (np. krótki oddech)"
            value={newSymptomOption}
            onChange={(e) => setNewSymptomOption(e.target.value)}
            disabled={!canEditData}
          />
          <button
            type="button"
            onClick={() => {
              addOption(newSymptomOption, symptomOptions, setSymptomOptions, (val) => setSymptomForm({ ...symptomForm, description: val }));
              setNewSymptomOption('');
            }}
            disabled={!canEditData}
          >
            Dodaj do listy
          </button>
        </div>
      </div>
      <div className="pill-list">
        {symptoms.map((s) => (
          <div key={s.id} className="pill">
            <div>
              <strong>{s.description}</strong> <span className="muted">— {severityLabel(s.severity)} ({s.severity})</span> {s.triggerTag && <span className="muted">(tag: {s.triggerTag})</span>}<div className="muted small">{new Date(s.recordedAt).toLocaleString()}</div>
            </div>
            <button className="ghost" onClick={() => deleteSymptom(s.id)} disabled={!canEditData}>Usuń</button>
          </div>
        ))}
        {symptoms.length === 0 && <div className="muted">Brak wpisów</div>}
      </div>
    </div>
  );

  const renderTriggers = () => ensurePatient(
    <div className="panel">
      <div className="panel-head"><strong>Wyzwalacze</strong></div>
      <form onSubmit={submitTrigger} className="form-grid">
        <div className="preset-row">
          <select value={triggerForm.name} onChange={(e) => setTriggerForm({ ...triggerForm, name: e.target.value })} disabled={!canEditData}>
            {triggerOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            placeholder="Dodaj nowy wyzwalacz"
            value={newTriggerOption}
            onChange={(e) => setNewTriggerOption(e.target.value)}
            disabled={!canEditData}
          />
          <button
            type="button"
            onClick={() => {
              addOption(newTriggerOption, triggerOptions, setTriggerOptions, (val) => setTriggerForm({ ...triggerForm, name: val }));
              setNewTriggerOption('');
            }}
            disabled={!canEditData}
          >
            +
          </button>
        </div>
        <input placeholder="Notatki" value={triggerForm.notes} onChange={(e) => setTriggerForm({ ...triggerForm, notes: e.target.value })} disabled={!canEditData} />
        <input type="datetime-local" value={triggerForm.recordedAt} onChange={(e) => setTriggerForm({ ...triggerForm, recordedAt: e.target.value })} disabled={!canEditData} />
        <button type="submit" disabled={!canEditData}>Dodaj</button>
      </form>
      <div className="pill-list">
        {triggers.map((t) => (
          <div key={t.id} className="pill">
            <div>
              <strong>{t.name}</strong> {t.notes && <span className="muted">— {t.notes}</span>}<div className="muted small">{new Date(t.recordedAt).toLocaleString()}</div>
            </div>
            <button className="ghost" onClick={() => deleteTrigger(t.id)} disabled={!canEditData}>Usuń</button>
          </div>
        ))}
        {triggers.length === 0 && <div className="muted">Brak wpisów</div>}
      </div>
    </div>
  );

  const renderMedications = () => ensurePatient(
    <div className="panel">
      <div className="panel-head"><strong>Leki</strong></div>
      <form onSubmit={submitMed} className="form-grid">
        <div className="preset-row">
          <select value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} disabled={!canEditData}>
            {medOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            placeholder="Dodaj lek"
            value={newMedOption}
            onChange={(e) => setNewMedOption(e.target.value)}
            disabled={!canEditData}
          />
          <button
            type="button"
            onClick={() => {
              addOption(newMedOption, medOptions, setMedOptions, (val) => setMedForm({ ...medForm, name: val }));
              setNewMedOption('');
            }}
            disabled={!canEditData}
          >
            +
          </button>
        </div>
        <input placeholder="Dawka" value={medForm.dosage} onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })} disabled={!canEditData} />
        <input placeholder="Harmonogram (np. 08:00;20:00)" value={medForm.schedule} onChange={(e) => setMedForm({ ...medForm, schedule: e.target.value })} disabled={!canEditData} />
        <button type="submit" disabled={!canEditData}>Dodaj</button>
      </form>
      <div className="pill-list">
        {medications.map((m) => (
          <div key={m.id} className="pill">
            <div>
              <strong>{m.name}</strong> {m.dosage && <span className="muted">({m.dosage})</span>} {m.schedule && <span className="muted">— {m.schedule}</span>}
            </div>
            <button className="ghost" onClick={() => deleteMed(m.id)} disabled={!canEditData}>Usuń</button>
          </div>
        ))}
        {medications.length === 0 && <div className="muted">Brak wpisów</div>}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="panel">
      <div className="panel-head"><strong>Profil</strong></div>
      <form onSubmit={updateProfile} className="form-grid">
        <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" />
        <input value={profileForm.userName} onChange={(e) => setProfileForm({ ...profileForm, userName: e.target.value })} placeholder="Username" />
        <button type="submit">Zapisz</button>
        <button type="button" className="ghost" onClick={deleteAccount}>Usuń konto</button>
      </form>
    </div>
  );

  const renderSecurity = () => (
    <div className="panel">
      <div className="panel-head"><strong>Bezpieczeństwo</strong></div>
      <div className="stack">
        <form onSubmit={submitPassword} className="form-grid">
          <input
            placeholder="Stare hasło"
            type="password"
            value={passwords.oldPassword}
            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
          />
          <input
            placeholder="Nowe hasło"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <button type="submit">Zmień hasło</button>
        </form>
        <div className="divider" />
        <div>
          <div className="panel-head"><strong>Reset hasła (demo)</strong></div>
          <form onSubmit={requestReset} className="form-grid">
            <input placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            <button type="submit">Wyślij token</button>
          </form>
          <form onSubmit={doReset} className="form-grid">
            <input placeholder="Token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
            <input placeholder="Nowe hasło" type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} />
            <button type="submit">Resetuj</button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderReports = () => ensurePatient(
    <div className="panel">
      <div className="panel-head"><strong>Raporty</strong></div>
      <div className="pill-list">
        {selectedPatientId ? (
          <>
            <button type="button" className="pill link-pill" onClick={exportCsv}>Pobierz CSV</button>
            <button type="button" className="pill link-pill" onClick={exportPdf}>Pobierz PDF</button>
          </>
        ) : (
          <div className="muted">Wybierz pacjenta, aby eksportować.</div>
        )}
      </div>
      <div className="muted small">Raport PDF zawiera zestawienie pomiarów, objawów, leków i wyzwalaczy dla pacjenta.</div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'measurements':
        return renderMeasurements();
      case 'symptoms':
        return renderSymptoms();
      case 'triggers':
        return renderTriggers();
      case 'medications':
        return renderMedications();
      case 'profile':
        return renderProfile();
      case 'security':
        return renderSecurity();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  if (!token)
    return (
      <div className="page">
        <div className="auth-shell">
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="eyebrow">Respira Libere</div>
          <h1>Panel kontroli oddechu</h1>
        </div>
        <div className="top-actions">
          {profile && (
            <div className="muted">{profile.userName} ({profile.email})</div>
          )}
          <a href="http://localhost:5000/swagger" target="_blank" rel="noopener noreferrer" className="ghost" style={{ textDecoration: 'none' }}>Pomoc / API</a>
          <button className="ghost" onClick={handleLogout}>Wyloguj</button>
        </div>
      </header>

      {message && <div className="flash">{message}</div>}

      <div className="app-shell">
        <aside className="sidebar panel">
          <div className="nav-heading">Nawigacja</div>
          <div className="nav-list">
            {tabs.map((t) => (
              <button key={t.id} className={`nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => handleNav(t.id)}>
                <span className="icon">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="content">
          <div className="panel patient-bar">
            <div>
              <div className="eyebrow">Pacjenci</div>
              <div className="chip-row">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    className={`chip ${p.id === selectedPatientId ? 'chip-active' : ''}`}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setMockMode(!!p.mock);
                    }}
                  >
                    {p.name}{p.mock ? ' (demo)' : ''}
                  </button>
                ))}
                {patients.length === 0 && <span className="muted small">Brak pacjentów</span>}
              </div>
              {mockMode && <div className="muted small">Tryb danych demo — operacje nie dotykają API.</div>}
              {isPatientOnly && <div className="muted small">Tryb pacjenta — widzisz i edytujesz własne dane, ale nie zarządzasz listą pacjentów.</div>}
            </div>
            <div className="inline-form" style={{ gap: 6, flexWrap: 'wrap' }}>
              <form onSubmit={submitPatient} className="inline-form" style={{ gap: 6 }}>
                <input
                  placeholder="Imię"
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  disabled={!canManagePatients}
                />
                <input
                  placeholder="Notatki"
                  value={patientForm.notes}
                  onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })}
                  disabled={!canManagePatients}
                />
                <button type="submit" disabled={!canManagePatients}>Dodaj</button>
              </form>
              <button className="ghost" onClick={loadMockData}>Załaduj demo</button>
              <button className="ghost" onClick={refreshFromApi}>Odśwież z API</button>
            </div>
          </div>

          <Routes>
            <Route path={tabPaths.overview} element={renderOverview()} />
            <Route path={tabPaths.measurements} element={renderMeasurements()} />
            <Route path={tabPaths.symptoms} element={renderSymptoms()} />
            <Route path={tabPaths.triggers} element={renderTriggers()} />
            <Route path={tabPaths.medications} element={renderMedications()} />
            <Route path={tabPaths.profile} element={renderProfile()} />
            <Route path={tabPaths.security} element={renderSecurity()} />
            <Route path={tabPaths.reports} element={renderReports()} />
            <Route path="*" element={renderOverview()} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWithRouter />
    </Router>
  );
}
