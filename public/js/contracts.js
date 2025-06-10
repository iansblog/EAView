// JS for Contracts page visualizations
// Only code for contracts.html should go here

window.renderContractsGantt = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Gather all contracts from all systems
      const contracts = [];
      Object.entries(data.systems).forEach(([sysId, sys]) => {
        (sys.contracts || []).forEach(contract => {
          contracts.push({
            system: sys.name,
            criticality: sys.criticality,
            ...contract
          });
        });
      });
      // Parse dates
      contracts.forEach(c => {
        c.start = new Date(c.startDate);
        c.end = new Date(c.endDate);
      });
      // Sort by start date
      contracts.sort((a, b) => a.start - b.start);
      // D3 Gantt chart
      const container = d3.select('#contracts-gantt');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 900;
      const height = Math.max(contracts.length * 32 + 60, 200);
      const margin = { top: 40, right: 40, bottom: 40, left: 200 };
      const svg = container.append('svg').attr('width', width).attr('height', height);
      // X scale (time)
      const minDate = d3.min(contracts, d => d.start);
      const maxDate = d3.max(contracts, d => d.end);
      const x = d3.scaleTime().domain([minDate, maxDate]).range([margin.left, width - margin.right]);
      // Y scale (systems)
      const y = d3.scaleBand().domain(contracts.map(d => d.system)).range([margin.top, height - margin.bottom]).padding(0.2);
      // X axis
      svg.append('g')
        .attr('transform', `translate(0,${margin.top - 10})`)
        .call(d3.axisTop(x).ticks(width/120).tickFormat(d3.timeFormat('%b %Y')));
      // Y axis
      svg.append('g')
        .attr('transform', `translate(${margin.left - 10},0)`)
        .call(d3.axisLeft(y));
      // Today line (drawn above bars, black and more visible)
      const today = new Date();
      if (today >= minDate && today <= maxDate) {
        svg.append('line')
          .attr('x1', x(today))
          .attr('x2', x(today))
          .attr('y1', margin.top - 10)
          .attr('y2', height - margin.bottom)
          .attr('stroke', '#000')
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '6,4')
          .attr('pointer-events', 'none');
      }
      // Color by RAG status (relative to today)
      function ragColor(d) {
        const msInMonth = 30 * 24 * 60 * 60 * 1000;
        const monthsLeft = (d.end - today) / msInMonth;
        if (monthsLeft < 6) return '#C0392B'; // Red
        if (monthsLeft < 12) return '#F39C12'; // Amber
        return '#27AE60'; // Green
      }
      // When rendering each contract bar, use the GBP value if available, otherwise convert from USD
      function getContractAmount(contract) {
        // Prefer GBP if present
        if (contract.valueGBP) return Number(contract.valueGBP).toLocaleString();
        // Try to convert from USD if value is in $...
        if (contract.value && contract.value.startsWith('$')) {
          const usd = Number(contract.value.replace(/[^\d.]/g, ''));
          if (!isNaN(usd)) {
            const gbp = Math.round(usd * 0.8); // Example conversion rate
            return gbp.toLocaleString();
          }
        }
        // Try contractValue (supplierHistory)
        if (contract.contractValue && contract.contractValue.startsWith('$')) {
          const usd = Number(contract.contractValue.replace(/[^\d.]/g, ''));
          if (!isNaN(usd)) {
            const gbp = Math.round(usd * 0.8);
            return gbp.toLocaleString();
          }
        }
        // Fallback: show as-is, but strip any $ or £
        if (contract.value) return contract.value.replace(/[^\d.]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (contract.contractValue) return contract.contractValue.replace(/[^\d.]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return '';
      }
      // Bars
      svg.append('g')
        .selectAll('rect')
        .data(contracts)
        .join('rect')
        .attr('x', d => x(d.start))
        .attr('y', d => y(d.system))
        .attr('width', d => x(d.end) - x(d.start))
        .attr('height', y.bandwidth())
        .attr('fill', ragColor)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
          // Show contract and system info in a Bootstrap modal
          let modal = document.getElementById('contract-info-modal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'contract-info-modal';
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
              <div class="modal-dialog modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title"><i class='fa-solid fa-file-contract text-primary me-2'></i>Contract Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body" id="contract-info-modal-body"></div>
                </div>
              </div>`;
            document.body.appendChild(modal);
          }
          const body = modal.querySelector('#contract-info-modal-body');
          body.innerHTML = `
            <div><b>System:</b> ${d.system}</div>
            <div><b>Criticality:</b> ${d.criticality || ''}</div>
            <div><b>Contract Value:</b> ${getContractAmount(d) || ''}</div>
            <div><b>Start Date:</b> ${d.start.toLocaleDateString()}</div>
            <div><b>End Date:</b> ${d.end.toLocaleDateString()}</div>
            <div><b>Months Remaining:</b> ${Math.max(0, Math.round((d.end - today) / (30*24*60*60*1000)))}</div>
          `;
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        });
      // Tooltip
      svg.append('g')
        .selectAll('title')
        .data(contracts)
        .join('title')
        .text(d => `${d.system}\n${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}\nValue: ${getContractAmount(d)}\nCriticality: ${d.criticality}`);
      // Labels
      svg.append('g')
        .selectAll('text.label')
        .data(contracts)
        .join('text')
        .attr('class', 'label')
        .attr('x', d => x(d.start) + 4)
        .attr('y', d => y(d.system) + y.bandwidth()/2 + 5)
        .attr('font-size', 12)
        .attr('fill', '#fff')
        .text(d => getContractAmount(d));
      // Set today's date in the key (format: 9 June 2025)
      const todayDateSpan = document.getElementById('contracts-today-date-value');
      if (todayDateSpan) {
        const opts = { day: 'numeric', month: 'long', year: 'numeric' };
        todayDateSpan.textContent = today.toLocaleDateString('en-GB', opts);
      }
    });
};
