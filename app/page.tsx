'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidUrl = url.trim().startsWith('https://');

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `framer-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      // Reset form
      setUrl('');
      setLoading(false);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="content">
        <h1>Clone Your Framer Website</h1>
        <p className="subtitle">
          Paste a Framer or Webflow URL and download your cloned site
        </p>

        <form onSubmit={handleExport}>
          <input
            type="url"
            placeholder="https://framer.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading || !isValidUrl}>
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </main>
  );
}
