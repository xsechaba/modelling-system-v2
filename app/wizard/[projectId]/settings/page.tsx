'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Settings, Save, RefreshCw, CheckCircle2, Info } from 'lucide-react';

interface TechnicalConfig {
  factPrefix: string;
  dimPrefix: string;
  keySuffix: string;
  surrogateKeyStrategy: 'integer' | 'uuid' | 'hash';
  naturalKeyInclude: boolean;
  columnNamingStyle: 'snake_case' | 'camelCase' | 'PascalCase';
  stripSourcePrefixes: boolean;
  scdType2Enabled: boolean;
}

const DEFAULT_CONFIG: TechnicalConfig = {
  factPrefix: 'fct_',
  dimPrefix: 'dim_',
  keySuffix: '_key',
  surrogateKeyStrategy: 'integer',
  naturalKeyInclude: true,
  columnNamingStyle: 'snake_case',
  stripSourcePrefixes: true,
  scdType2Enabled: false,
};

const PRESETS: { label: string; description: string; config: TechnicalConfig }[] = [
  {
    label: 'Kimball Standard',
    description: 'Classic Kimball conventions: fct_/dim_ prefixes, _key suffix, integer surrogates',
    config: { ...DEFAULT_CONFIG },
  },
  {
    label: 'Modern Analytics',
    description: 'No prefixes, _id suffix, snake_case. Common in dbt/analytics engineering',
    config: { ...DEFAULT_CONFIG, factPrefix: '', dimPrefix: '', keySuffix: '_id' },
  },
  {
    label: 'Enterprise DWH',
    description: 'FACT_/DIM_ uppercase prefixes, _SK suffix, integer surrogates, SCD2 enabled',
    config: { factPrefix: 'FACT_', dimPrefix: 'DIM_', keySuffix: '_SK', surrogateKeyStrategy: 'integer', naturalKeyInclude: true, columnNamingStyle: 'snake_case', stripSourcePrefixes: true, scdType2Enabled: true },
  },
];

export default function SettingsPage() {
  const { projectId } = useParams() as { projectId: string };

  const [config, setConfig] = useState<TechnicalConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('Kimball Standard');

  // Load existing config
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const stateData = data.stateData ? JSON.parse(data.stateData) : {};
          if (stateData.technicalConfig) {
            setConfig(stateData.technicalConfig);
            // Detect which preset matches
            const match = PRESETS.find(p => JSON.stringify(p.config) === JSON.stringify(stateData.technicalConfig));
            setActivePreset(match ? match.label : null);
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Read current state, merge config, save
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const stateData = data.stateData ? JSON.parse(data.stateData) : {};
      stateData.technicalConfig = config;

      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: data.currentStep || 'settings',
          completedSteps: JSON.parse(data.completedSteps || '[]'),
          stateData: JSON.stringify(stateData),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setConfig({ ...preset.config });
    setActivePreset(preset.label);
  };

  const updateConfig = (key: keyof TechnicalConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setActivePreset(null); // custom config, no preset
  };

  const previewFactName = `${config.factPrefix}order_items`;
  const previewDimName = `${config.dimPrefix}customer`;
  const previewSK = `order_items${config.keySuffix}`;
  const previewDimSK = `customer${config.keySuffix}`;

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-white-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Technical Configuration</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
            Define naming conventions, key strategies, and schema preferences used throughout generation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <Link href={`/wizard/${projectId}/profile`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Continue to Profiling <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {saved && (
        <div style={{ margin: '16px 32px 0', padding: '12px 16px', background: 'rgba(134,188,37,0.08)', border: '1px solid rgba(134,188,37,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-green)' }}>
          <CheckCircle2 size={16} /> Configuration saved successfully
        </div>
      )}

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Presets */}
          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} color="var(--color-green)" /> Quick Presets
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {PRESETS.map(preset => (
                <div
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  style={{
                    padding: '16px',
                    border: `1px solid ${activePreset === preset.label ? 'var(--color-green)' : 'var(--color-border)'}`,
                    background: activePreset === preset.label ? 'rgba(134,188,37,0.05)' : 'rgba(255,255,255,0.02)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.875rem' }}>{preset.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', lineHeight: 1.4 }}>{preset.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            {/* Table Naming */}
            <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Table Naming</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fact Table Prefix</label>
                  <input
                    type="text"
                    value={config.factPrefix}
                    onChange={e => updateConfig('factPrefix', e.target.value)}
                    placeholder="e.g. fct_, fact_, f_"
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dimension Table Prefix</label>
                  <input
                    type="text"
                    value={config.dimPrefix}
                    onChange={e => updateConfig('dimPrefix', e.target.value)}
                    placeholder="e.g. dim_, d_"
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Column Naming Style</label>
                  <select
                    value={config.columnNamingStyle}
                    onChange={e => updateConfig('columnNamingStyle', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}>
                    <option value="snake_case">snake_case</option>
                    <option value="camelCase">camelCase</option>
                    <option value="PascalCase">PascalCase</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={config.stripSourcePrefixes}
                    onChange={e => updateConfig('stripSourcePrefixes', e.target.checked)}
                    id="stripPrefixes"
                    style={{ accentColor: 'var(--color-green)' }}
                  />
                  <label htmlFor="stripPrefixes" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Strip source file prefixes from dimension columns
                  </label>
                </div>
              </div>
            </div>

            {/* Key Strategy */}
            <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px' }}>Key Strategy</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surrogate Key Suffix</label>
                  <input
                    type="text"
                    value={config.keySuffix}
                    onChange={e => updateConfig('keySuffix', e.target.value)}
                    placeholder="e.g. _key, _sk, _id"
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surrogate Key Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {(['integer', 'uuid', 'hash'] as const).map(strategy => (
                      <div
                        key={strategy}
                        onClick={() => updateConfig('surrogateKeyStrategy', strategy)}
                        style={{
                          padding: '10px',
                          border: `1px solid ${config.surrogateKeyStrategy === strategy ? 'var(--color-green)' : 'var(--color-border)'}`,
                          background: config.surrogateKeyStrategy === strategy ? 'rgba(134,188,37,0.05)' : 'transparent',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '0.8125rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontWeight: config.surrogateKeyStrategy === strategy ? 600 : 400,
                        }}>
                        {strategy}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={config.naturalKeyInclude}
                    onChange={e => updateConfig('naturalKeyInclude', e.target.checked)}
                    id="naturalKey"
                    style={{ accentColor: 'var(--color-green)' }}
                  />
                  <label htmlFor="naturalKey" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Always include natural/business key alongside surrogate key
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={config.scdType2Enabled}
                    onChange={e => updateConfig('scdType2Enabled', e.target.checked)}
                    id="scd2"
                    style={{ accentColor: 'var(--color-green)' }}
                  />
                  <label htmlFor="scd2" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Enable SCD Type 2 columns (effective_date, expiry_date, is_current)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--color-green)" /> Naming Preview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example Fact Table</div>
                <div style={{ padding: '16px', background: 'var(--bg-code)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.8 }}>
                  <div style={{ color: '#c586c0' }}>CREATE TABLE <span style={{ color: '#ce9178' }}>{previewFactName}</span> (</div>
                  <div style={{ paddingLeft: '16px' }}>
                    <span style={{ color: '#9cdcfe' }}>{previewSK}</span> <span style={{ color: '#4ec9b0' }}>{config.surrogateKeyStrategy === 'integer' ? 'INTEGER' : config.surrogateKeyStrategy === 'uuid' ? 'UUID' : 'VARCHAR(64)'}</span> <span style={{ color: '#c586c0' }}>PRIMARY KEY</span>,
                  </div>
                  <div style={{ paddingLeft: '16px' }}>
                    <span style={{ color: '#9cdcfe' }}>{previewDimSK}</span> <span style={{ color: '#4ec9b0' }}>INTEGER</span> <span style={{ color: '#608b4e' }}>-- FK → {previewDimName}</span>
                  </div>
                  {config.naturalKeyInclude && (
                    <div style={{ paddingLeft: '16px' }}>
                      <span style={{ color: '#9cdcfe' }}>order_id</span> <span style={{ color: '#4ec9b0' }}>VARCHAR(32)</span> <span style={{ color: '#608b4e' }}>-- natural key</span>
                    </div>
                  )}
                  <div style={{ paddingLeft: '16px' }}>
                    <span style={{ color: '#9cdcfe' }}>amount</span> <span style={{ color: '#4ec9b0' }}>DECIMAL(18,2)</span>
                  </div>
                  <div style={{ color: '#c586c0' }}>);</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example Dimension Table</div>
                <div style={{ padding: '16px', background: 'var(--bg-code)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.8 }}>
                  <div style={{ color: '#c586c0' }}>CREATE TABLE <span style={{ color: '#ce9178' }}>{previewDimName}</span> (</div>
                  <div style={{ paddingLeft: '16px' }}>
                    <span style={{ color: '#9cdcfe' }}>{previewDimSK}</span> <span style={{ color: '#4ec9b0' }}>{config.surrogateKeyStrategy === 'integer' ? 'INTEGER' : config.surrogateKeyStrategy === 'uuid' ? 'UUID' : 'VARCHAR(64)'}</span> <span style={{ color: '#c586c0' }}>PRIMARY KEY</span>,
                  </div>
                  {config.naturalKeyInclude && (
                    <div style={{ paddingLeft: '16px' }}>
                      <span style={{ color: '#9cdcfe' }}>customer_id</span> <span style={{ color: '#4ec9b0' }}>VARCHAR(32)</span> <span style={{ color: '#608b4e' }}>-- natural key</span>
                    </div>
                  )}
                  <div style={{ paddingLeft: '16px' }}>
                    <span style={{ color: '#9cdcfe' }}>name</span> <span style={{ color: '#4ec9b0' }}>VARCHAR(255)</span>
                  </div>
                  {config.scdType2Enabled && (
                    <>
                      <div style={{ paddingLeft: '16px' }}>
                        <span style={{ color: '#9cdcfe' }}>effective_date</span> <span style={{ color: '#4ec9b0' }}>DATE</span>
                      </div>
                      <div style={{ paddingLeft: '16px' }}>
                        <span style={{ color: '#9cdcfe' }}>expiry_date</span> <span style={{ color: '#4ec9b0' }}>DATE</span>
                      </div>
                      <div style={{ paddingLeft: '16px' }}>
                        <span style={{ color: '#9cdcfe' }}>is_current</span> <span style={{ color: '#4ec9b0' }}>BOOLEAN</span>
                      </div>
                    </>
                  )}
                  <div style={{ color: '#c586c0' }}>);</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
