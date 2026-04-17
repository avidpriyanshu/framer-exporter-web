class HiddenContentDetector {
  constructor(cheerioInstance) {
    this.$ = cheerioInstance;
  }

  findHiddenElements() {
    const hidden = [];

    this.$('[style*="display: none"], [style*="display:none"]').each((_, el) => {
      hidden.push({
        type: 'inline-hidden',
        element: el.name,
        id: this.$(el).attr('id') || 'unnamed',
        content: this.$(el).text().substring(0, 100),
      });
    });

    this.$('[style*="visibility: hidden"]').each((_, el) => {
      hidden.push({
        type: 'invisible',
        element: el.name,
        id: this.$(el).attr('id') || 'unnamed',
      });
    });

    return hidden;
  }

  findAccordions() {
    const accordions = [];

    this.$('button[aria-expanded="false"], [role="button"][aria-expanded="false"]').each((_, el) => {
      const controls = this.$(el).attr('aria-controls');
      accordions.push({
        type: 'accordion',
        trigger: this.$(el).text().substring(0, 50),
        controlId: controls || 'unnamed',
      });
    });

    return accordions;
  }

  findTabs() {
    const tabs = [];

    this.$('[role="tab"][aria-selected="false"]').each((_, el) => {
      const controls = this.$(el).attr('aria-controls');
      tabs.push({
        type: 'tab',
        label: this.$(el).text().substring(0, 50),
        panelId: controls || 'unnamed',
      });
    });

    return tabs;
  }

  findModals() {
    const modals = [];

    this.$('[role="dialog"], .modal, [data-modal]').each((_, el) => {
      const isHidden = this.$(el).css('display') === 'none' ||
        this.$(el).hasClass('hidden') ||
        this.$(el).attr('aria-hidden') === 'true';

      if (isHidden) {
        modals.push({
          type: 'modal',
          id: this.$(el).attr('id') || 'unnamed',
          title: this.$(el).find('[role="heading"], .modal-title').text().substring(0, 50),
        });
      }
    });

    return modals;
  }

  generateReport() {
    return {
      hiddenElements: this.findHiddenElements(),
      accordions: this.findAccordions(),
      tabs: this.findTabs(),
      modals: this.findModals(),
      summary: {
        totalHidden: this.findHiddenElements().length,
        totalAccordions: this.findAccordions().length,
        totalTabs: this.findTabs().length,
        totalModals: this.findModals().length,
      },
    };
  }
}

module.exports = { HiddenContentDetector };
