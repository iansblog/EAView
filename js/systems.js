// JS for Systems page visualizations
// ...existing code moved from visualizations.js...

// When rendering tables, ensure they are wrapped in a responsive container and use Bootstrap's table-responsive and table classes.
// Example usage for any table rendering:
// const tableHtml = `<div class="table-responsive"><table class="table table-striped table-bordered w-100"> ... </table></div>`;

document.addEventListener('DOMContentLoaded', function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      const systems = data.systems || {};
      const tableContainer = document.getElementById('systems-table-container');
      const detailsContainer = document.getElementById('system-details-container');
      if (!tableContainer) return;
      let html = '<div class="table-responsive"><table class="table table-striped table-bordered w-100">';
      html += '<thead><tr>' +
        '<th>Name</th>' +
        '<th>Description</th>' +
        '<th>Status</th>' +
        '</tr></thead><tbody>';
      Object.entries(systems).forEach(([sysId, sys]) => {
        html += `<tr data-sysid="${sysId}" style="cursor:pointer;">` +
          `<td>${sys.name || ''}</td>` +
          `<td>${sys.description || ''}</td>` +
          `<td>${sys.status || ''}</td>` +
          '</tr>';
      });
      html += '</tbody></table></div>';
      tableContainer.innerHTML = html;
      // Add click event to show details
      const rows = tableContainer.querySelectorAll('tr[data-sysid]');
      rows.forEach(row => {
        row.addEventListener('click', function() {
          rows.forEach(r => r.classList.remove('table-active'));
          this.classList.add('table-active');
          const sysId = this.getAttribute('data-sysid');
          showSystemDetails(systems[sysId]);
        });
      });
      // Show first system by default
      if (rows[0]) {
        rows[0].classList.add('table-active');
        const firstId = rows[0].getAttribute('data-sysid');
        showSystemDetails(systems[firstId]);
      }
    });
});

function showSystemDetails(sys) {
  const detailsContainer = document.getElementById('system-details-container');
  if (!detailsContainer || !sys) return;
  // Find latest contract (by endDate, fallback to startDate)
  let latestContract = null;
  if (Array.isArray(sys.contracts) && sys.contracts.length) {
    latestContract = sys.contracts.reduce((latest, c) => {
      const latestDate = new Date(latest.endDate || latest.startDate || 0);
      const cDate = new Date(c.endDate || c.startDate || 0);
      return cDate > latestDate ? c : latest;
    }, sys.contracts[0]);
  }
  let html = `<div class="card shadow-sm"><div class="card-body">
    <h4 class="mb-2">${sys.name || ''}</h4>
    <div class="mb-2 text-muted">${sys.description || ''}</div>`;
  html += `<div><strong>Status:</strong> ${sys.status || 'N/A'}</div>`;
  if (sys.technology) html += `<div><strong>Technology:</strong> ${sys.technology}</div>`;
  if (sys.criticality) html += `<div><strong>Criticality:</strong> ${sys.criticality}</div>`;
  if (sys.owner) html += `<div><strong>Owner:</strong> ${sys.owner}</div>`;
  if (sys.supportLevel) html += `<div><strong>Support Level:</strong> ${sys.supportLevel}</div>`;
  if (sys.deploymentType) html += `<div><strong>Deployment Type:</strong> ${sys.deploymentType}</div>`;
  if (sys.platformId) html += `<div><strong>Platform ID:</strong> ${sys.platformId}</div>`;
  if (sys.deliveryProgramId) html += `<div><strong>Delivery Program ID:</strong> ${sys.deliveryProgramId}</div>`;
  if (sys.supplier && sys.supplier.name) html += `<div><strong>Supplier:</strong> ${sys.supplier.name}</div>`;
  if (sys.supplier && sys.supplier.contactDetails) {
    const c = sys.supplier.contactDetails;
    if (c.supportEmail) html += `<div><strong>Support Email:</strong> <a href='mailto:${c.supportEmail}'>${c.supportEmail}</a></div>`;
    if (c.accountManager) html += `<div><strong>Account Manager:</strong> ${c.accountManager}</div>`;
    if (c.supportPhone) html += `<div><strong>Support Phone:</strong> ${c.supportPhone}</div>`;
  }
  if (sys.costs) {
    html += `<div class='mt-2'><strong>Costs:</strong><ul class='mb-1'>`;
    if (sys.costs.annualCost) html += `<li>Annual Cost: ${sys.costs.annualCost}</li>`;
    if (sys.costs.fundingCountry) html += `<li>Funding Country: ${sys.costs.fundingCountry}</li>`;
    if (typeof sys.costs.isCentralised !== 'undefined') html += `<li>Centralised: ${sys.costs.isCentralised ? 'Yes' : 'No'}</li>`;
    if (sys.costs.costBreakdown) {
      html += `<li>Cost Breakdown:<ul>`;
      Object.entries(sys.costs.costBreakdown).forEach(([k, v]) => {
        html += `<li>${k}: ${typeof v === 'number' ? '£' + v.toLocaleString() : v}</li>`;
      });
      html += `</ul></li>`;
    }
    html += `</ul></div>`;
  }
  if (Array.isArray(sys.usage) && sys.usage.length) {
    html += `<div class='mt-2'><strong>Usage:</strong><ul class='mb-1'>`;
    sys.usage.forEach(u => {
      html += `<li>${u.country}: ${u.userCount} users</li>`;
    });
    html += `</ul></div>`;
  }
  if (Array.isArray(sys.dataEntities) && sys.dataEntities.length) {
    html += `<div><strong>Data Entities:</strong> ${sys.dataEntities.join(', ')}</div>`;
  }
  if (Array.isArray(sys.businessCapabilities) && sys.businessCapabilities.length) {
    html += `<div><strong>Business Capabilities:</strong> ${sys.businessCapabilities.join(', ')}</div>`;
  }
  if (latestContract) {
    html += `<div class='mt-2'><strong>Latest Contract:</strong><ul class='mb-1'>`;
    if (latestContract.startDate) html += `<li>Start: ${formatDate(latestContract.startDate)}</li>`;
    if (latestContract.endDate) html += `<li>End: ${formatDate(latestContract.endDate)}</li>`;
    if (latestContract.value) html += `<li>Value: ${latestContract.value}</li>`;
    html += `</ul></div>`;
  }
  if (Array.isArray(sys.supplierHistory) && sys.supplierHistory.length) {
    html += `<div class='mt-2'><strong>Supplier History:</strong><ul class='mb-1'>`;
    sys.supplierHistory.forEach(h => {
      html += `<li>${h.supplierId || ''} (${h.contractId || ''}): ${h.contractValue ? '£' + Number(h.contractValue).toLocaleString() : ''}`;
      if (h.startDate) html += `, ${formatDate(h.startDate)}`;
      if (h.endDate) html += ` - ${formatDate(h.endDate)}`;
      html += `</li>`;
    });
    html += `</ul></div>`;
  }
  html += '</div></div>';
  detailsContainer.innerHTML = html;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// ...existing code...
