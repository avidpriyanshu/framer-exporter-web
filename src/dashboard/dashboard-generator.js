class DashboardGenerator {
  constructor(report) {
    this.report = report;
  }

  generate() {
    const totalAssets = this.getTotalAssets();
    const exportSize = (this.report.validation.totalSize / 1024).toFixed(1);
    const brokenCount = this.report.validation.brokenLinks.length;
    const totalTime = this.report.timing.totalTime.toFixed(2);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export Dashboard - ${this.report.siteTitle || 'Unknown'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #1a1a2e;
      color: #e4e4e7;
      line-height: 1.6;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 40px;
      border-bottom: 2px solid #27272a;
      padding-bottom: 20px;
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #fff;
    }

    .header-meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
      color: #a1a1a6;
    }

    .status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      background: #27ae60;
      color: #fff;
      font-weight: 500;
      font-size: 12px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .card {
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }

    .card-value {
      font-size: 32px;
      font-weight: bold;
      color: #4a90e2;
      margin-bottom: 8px;
    }

    .card-label {
      font-size: 13px;
      color: #a1a1a6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section {
      background: #27272a;
      border: 1px solid #3f3f46;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #4a90e2;
    }

    .breakdown {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .breakdown-item {
      background: #3f3f46;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }

    .breakdown-count {
      font-size: 20px;
      font-weight: bold;
      color: #4a90e2;
      margin-bottom: 4px;
    }

    .breakdown-label {
      font-size: 12px;
      color: #a1a1a6;
    }

    .bar {
      background: #3f3f46;
      height: 4px;
      border-radius: 2px;
      margin-top: 8px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #4a90e2;
      border-radius: 2px;
    }

    .list {
      display: grid;
      gap: 8px;
    }

    .list-item {
      background: #3f3f46;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .list-item-tag {
      background: #4a90e2;
      color: #fff;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }

    .warning {
      background: #f39c12;
      color: #fff;
    }

    .error {
      background: #e74c3c;
      color: #fff;
    }

    .success {
      background: #27ae60;
      color: #fff;
    }

    .pill {
      display: inline-block;
      background: #3f3f46;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin: 4px 4px 4px 0;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #3f3f46;
      font-size: 13px;
    }

    .metric:last-child {
      border-bottom: none;
    }

    .metric-label {
      color: #a1a1a6;
    }

    .metric-value {
      color: #4a90e2;
      font-weight: 500;
    }

    .empty-state {
      color: #a1a1a6;
      text-align: center;
      padding: 20px;
      font-size: 13px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }

      .header h1 {
        font-size: 24px;
      }

      .cards {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Export Dashboard</h1>
      <div class="header-meta">
        <span><strong>${this.escapeHtml(this.report.siteTitle || 'Unknown Site')}</strong></span>
        <span>Exported ${new Date(this.report.exportedAt).toLocaleDateString()}</span>
        <span class="status">✓ Ready</span>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="cards">
      <div class="card">
        <div class="card-value">${totalAssets}</div>
        <div class="card-label">Assets Found</div>
      </div>
      <div class="card">
        <div class="card-value">${exportSize}</div>
        <div class="card-label">Export Size (KB)</div>
      </div>
      <div class="card">
        <div class="card-value">${brokenCount}</div>
        <div class="card-label">Broken Links</div>
      </div>
      <div class="card">
        <div class="card-value">${totalTime}s</div>
        <div class="card-label">Total Time</div>
      </div>
    </div>

    <!-- Asset Breakdown -->
    <div class="section">
      <div class="section-title">Asset Breakdown</div>
      <div class="breakdown">
        <div class="breakdown-item">
          <div class="breakdown-count">${this.report.assets.images.length}</div>
          <div class="breakdown-label">Images</div>
          <div class="bar">
            <div class="bar-fill" style="width: ${(this.report.assets.images.length / Math.max(...Object.values(this.report.assets).map(a => a.length)) * 100).toFixed(0)}%"></div>
          </div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-count">${this.report.assets.scripts.length}</div>
          <div class="breakdown-label">Scripts</div>
          <div class="bar">
            <div class="bar-fill" style="width: ${(this.report.assets.scripts.length / Math.max(...Object.values(this.report.assets).map(a => a.length)) * 100).toFixed(0)}%"></div>
          </div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-count">${this.report.assets.fonts.length}</div>
          <div class="breakdown-label">Fonts</div>
          <div class="bar">
            <div class="bar-fill" style="width: ${(this.report.assets.fonts.length / Math.max(...Object.values(this.report.assets).map(a => a.length)) * 100).toFixed(0)}%"></div>
          </div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-count">${this.report.assets.stylesheets.length}</div>
          <div class="breakdown-label">Stylesheets</div>
          <div class="bar">
            <div class="bar-fill" style="width: ${(this.report.assets.stylesheets.length / Math.max(...Object.values(this.report.assets).map(a => a.length)) * 100).toFixed(0)}%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Components -->
    ${this.report.framerInfo && this.report.framerInfo.namedLayers.length > 0 ? `
    <div class="section">
      <div class="section-title">Components (${this.report.framerInfo.namedLayers.length} found)</div>
      <div class="list">
        ${this.report.framerInfo.namedLayers.map(layer => `
          <div class="list-item">
            <span>${this.escapeHtml(layer)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Libraries & Dependencies -->
    <div class="section">
      <div class="section-title">Libraries & Dependencies</div>
      ${this.report.framerInfo ? `
        ${this.report.framerInfo.generatorVersion ? `
          <div class="metric">
            <span class="metric-label">Framework</span>
            <span class="metric-value">Framer (${this.escapeHtml(this.report.framerInfo.generatorVersion)})</span>
          </div>
        ` : ''}
        ${this.report.framerInfo.publishDate ? `
          <div class="metric">
            <span class="metric-label">Published</span>
            <span class="metric-value">${this.escapeHtml(this.report.framerInfo.publishDate)}</span>
          </div>
        ` : ''}
      ` : ''}

      ${this.report.framerInfo && this.report.framerInfo.fonts.length > 0 ? `
        <div class="metric">
          <span class="metric-label">Fonts Used</span>
          <span>
            ${this.report.framerInfo.fonts.map(f => `<span class="pill">${this.escapeHtml(f)}</span>`).join('')}
          </span>
        </div>
      ` : ''}

      ${this.report.framerInfo && this.report.framerInfo.externalServices.length > 0 ? `
        <div class="metric">
          <span class="metric-label">External Services</span>
          <span>
            ${this.report.framerInfo.externalServices.slice(0, 5).map(s => `<span class="pill">${this.escapeHtml(s)}</span>`).join('')}
            ${this.report.framerInfo.externalServices.length > 5 ? `<span class="pill">+${this.report.framerInfo.externalServices.length - 5} more</span>` : ''}
          </span>
        </div>
      ` : ''}

      ${this.report.framerInfo && this.report.framerInfo.hasAnalytics ? `
        <div class="metric">
          <span class="metric-label">Analytics</span>
          <span class="metric-value">${this.escapeHtml(this.report.framerInfo.analyticsId || 'Enabled')}</span>
        </div>
      ` : ''}
    </div>

    <!-- Issues -->
    ${this.report.validation.brokenLinks.length > 0 || this.report.validation.warnings.length > 0 ? `
    <div class="section">
      <div class="section-title">Issues (${this.report.validation.brokenLinks.length + this.report.validation.warnings.length})</div>
      <div class="list">
        ${this.report.validation.brokenLinks.slice(0, 10).map(link => `
          <div class="list-item">
            <span>❌ ${this.escapeHtml(link)}</span>
            <span class="list-item-tag error">Broken Link</span>
          </div>
        `).join('')}
        ${this.report.validation.warnings.map(w => `
          <div class="list-item">
            <span>⚠️ ${this.escapeHtml(w)}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Hidden Content -->
    ${this.report.hidden && this.report.hidden.summary && this.report.hidden.summary.totalModals > 0 ? `
    <div class="section">
      <div class="section-title">Hidden Content (${this.report.hidden.summary.totalModals} modals detected)</div>
      <div class="list">
        ${this.report.hidden.modals.map(m => `
          <div class="list-item">
            <span>👁 ${this.escapeHtml(m.title || m.id)}</span>
            <span class="list-item-tag warning">Modal</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Performance Metrics -->
    <div class="section">
      <div class="section-title">Performance Metrics</div>
      <div class="metric">
        <span class="metric-label">Crawl</span>
        <span class="metric-value">${this.report.timing.crawlTime.toFixed(2)}s</span>
      </div>
      <div class="metric">
        <span class="metric-label">Extract Assets</span>
        <span class="metric-value">${this.report.timing.extractTime.toFixed(2)}s</span>
      </div>
      <div class="metric">
        <span class="metric-label">Rewrite URLs</span>
        <span class="metric-value">${this.report.timing.rewriteTime.toFixed(2)}s</span>
      </div>
      <div class="metric">
        <span class="metric-label">Validate</span>
        <span class="metric-value">${this.report.timing.validateTime.toFixed(2)}s</span>
      </div>
      <div class="metric">
        <span class="metric-label">Create ZIP</span>
        <span class="metric-value">${this.report.timing.zipTime.toFixed(2)}s</span>
      </div>
      <div class="metric" style="border-bottom: 2px solid #4a90e2; padding-top: 16px; padding-bottom: 0;">
        <span class="metric-label" style="font-weight: 600; color: #fff;">Total Time</span>
        <span class="metric-value" style="font-size: 16px;">${this.report.timing.totalTime.toFixed(2)}s</span>
      </div>
    </div>

    <div style="text-align: center; color: #a1a1a6; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #3f3f46;">
      Generated on ${new Date(this.report.exportedAt).toLocaleString()} • Framer Exporter Dashboard
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  getTotalAssets() {
    const assets = this.report.assets;
    return (
      (assets.images?.length || 0) +
      (assets.scripts?.length || 0) +
      (assets.stylesheets?.length || 0) +
      (assets.fonts?.length || 0) +
      (assets.backgrounds?.length || 0)
    );
  }

  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = { DashboardGenerator };
