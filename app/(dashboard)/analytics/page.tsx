"use client";
import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Mail, RefreshCw, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = subDays(new Date(), 7).toISOString();
      const end = new Date().toISOString();
      const res = await fetch(`/api/metrics?startDate=${start}&endDate=${end}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data = await res.json();
      setMetrics(data.metrics || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const totalDelivered = metrics.reduce((acc, curr) => acc + (curr.metrics.delivered || 0), 0);
  const totalSent = metrics.reduce((acc, curr) => acc + (curr.metrics.sent || 0), 0);
  const totalBounced = metrics.reduce((acc, curr) => acc + (curr.metrics.bounced || 0), 0);
  const totalReceived = metrics.reduce((acc, curr) => acc + (curr.metrics.received || 0), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Analytics (Last 7 Days)</h1>
        <button 
          onClick={fetchMetrics}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)' }}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {loading && metrics.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading metrics...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <Send size={16} /> Total Sent
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalSent}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <CheckCircle size={16} color="var(--success)" /> Delivered
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalDelivered}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <AlertTriangle size={16} color="var(--danger)" /> Bounced
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalBounced}</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <Mail size={16} color="var(--primary)" /> Received
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalReceived}</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Daily Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {metrics.map((day, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 500 }}>{format(new Date(day.timestamp), 'MMM d, yyyy')}</div>
                  <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ width: '80px', textAlign: 'right' }}><span style={{color:'var(--text-primary)'}}>{day.metrics.sent || 0}</span> Sent</div>
                    <div style={{ width: '80px', textAlign: 'right' }}><span style={{color:'var(--success)'}}>{day.metrics.delivered || 0}</span> Deliv.</div>
                    <div style={{ width: '80px', textAlign: 'right' }}><span style={{color:'var(--danger)'}}>{day.metrics.bounced || 0}</span> Bnc.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
