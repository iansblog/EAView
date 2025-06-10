// JS for Platforms page visualizations
// ...existing code moved from visualizations.js...

document.addEventListener('DOMContentLoaded', function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Collect all unique platforms from systems
      const systems = data.systems || {};
      const platforms = {};
      Object.values(systems).forEach(sys => {
        if (sys.platformId) {
          // Use platform name if available, else fallback to ID
          const platformName = (data.platforms && data.platforms[sys.platformId] && data.platforms[sys.platformId].name) ? data.platforms[sys.platformId].name : sys.platformId;
          if (!platforms[sys.platformId]) platforms[sys.platformId] = { id: sys.platformId, name: platformName, systems: [] };
          platforms[sys.platformId].systems.push(sys);
        }
      });
      // Render platform list as clickable items
      const listDiv = document.getElementById('platforms-list');
      if (listDiv) {
        let html = '<ul class="list-group mb-4">';
        Object.values(platforms).forEach(p => {
          html += `<li class="list-group-item d-flex justify-content-between align-items-center platform-list-item" style="cursor:pointer;" data-platform-id="${p.id}">
            <span><strong>${p.name}</strong></span>
            <span class="badge bg-primary rounded-pill">${p.systems.length} systems</span>
          </li>`;
        });
        html += '</ul>';
        listDiv.innerHTML = html;
        // Add click handlers for drilldown
        const items = listDiv.querySelectorAll('.platform-list-item');
        items.forEach(item => {
          item.addEventListener('click', function() {
            items.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const pid = this.getAttribute('data-platform-id');
            showPlatformDetails(pid, platforms[pid]);
          });
        });
      }
      // Show first platform by default
      const firstPlatform = Object.values(platforms)[0];
      if (firstPlatform) {
        showPlatformDetails(firstPlatform.id, firstPlatform);
        const firstItem = listDiv.querySelector('.platform-list-item');
        if (firstItem) firstItem.classList.add('active');
      }
    });
});

function showPlatformDetails(platformId, platform) {
  const d3Div = document.getElementById('platforms-d3');
  d3Div.innerHTML = '';
  if (!platform || !platform.systems.length) {
    d3Div.innerHTML = '<div class="alert alert-warning">No systems found for this platform.</div>';
    return;
  }
  // Add the D3 visualization above the list
  let html = '<div id="platform-d3-graph"></div>';
  html += `<div class="mb-3">
    <h3><i class="fa-solid fa-layer-group text-primary me-2"></i>${platform.name}</h3>
    <ul class="list-group ms-4">`;
  platform.systems.forEach(sys => {
    html += `<li class="list-group-item d-flex justify-content-between align-items-center bg-light border-0 ps-4">
      <span><i class="fa-solid fa-server text-success me-2"></i>${sys.name}</span>
      <a href="#" class="btn btn-sm btn-outline-primary view-system-btn" data-sysid="${sys.name}"><i class="fa-solid fa-eye"></i> View System</a>
    </li>`;
  });
  html += '</ul></div>';
  d3Div.innerHTML = html;
  // Add click handlers for view system
  const viewBtns = d3Div.querySelectorAll('.view-system-btn');
  platform.systems.forEach(sys => {
    viewBtns.forEach(btn => {
      if (btn.getAttribute('data-sysid') === sys.name) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          showSystemDetailModal(sys);
        });
      }
    });
  });
  // Render D3 graph for this platform
  renderPlatformD3Graph(platform);
}

function renderPlatformD3Graph(platform) {
  const d3Div = document.getElementById('platform-d3-graph');
  d3Div.innerHTML = '';
  if (!platform || !platform.systems.length) return;
  const width = 700, height = 340;
  const svg = d3.select(d3Div).append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMin meet');
  const nodes = [{ id: platform.id, label: platform.name, group: 'platform', size: 36 }];
  const links = [];
  platform.systems.forEach(sys => {
    nodes.push({ id: sys.name, label: sys.name, group: 'system', size: 22, sys });
    links.push({ source: platform.id, target: sys.name });
  });
  platform.systems.forEach(sys => {
    if (Array.isArray(sys.dataEntities)) {
      sys.dataEntities.forEach(entity => {
        const nodeId = sys.name + '::' + entity;
        nodes.push({ id: nodeId, label: entity, group: 'entity', size: 12 });
        links.push({ source: sys.name, target: nodeId });
      });
    }
  });
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.group === 'entity' ? 60 : 120))
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(width/2, height/2));
  const link = svg.append('g')
    .attr('stroke', '#aaa')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 2);
  const node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', d => d.size)
    .attr('fill', d => d.group === 'platform' ? '#375a9e' : d.group === 'system' ? '#50C878' : '#FFD700')
    .attr('stroke', d => d.group === 'platform' ? '#233a5e' : 'none')
    .attr('stroke-width', d => d.group === 'platform' ? 3 : 0)
    .on('mouseover', function(event, d) {
      if (d.group === 'system' && d.sys) {
        showSystemTooltip(event, d.sys);
      }
    })
    .on('mouseout', function() {
      hideSystemTooltip();
    });
  const label = svg.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .attr('font-size', d => d.group === 'platform' ? 16 : d.group === 'system' ? 13 : 11)
    .attr('fill', '#222')
    .attr('text-anchor', 'middle')
    .attr('dy', d => d.group === 'entity' ? 18 : 4)
    .text(d => d.label);
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });
}

// Modal for system details
function showSystemDetailModal(sys) {
  let modal = document.getElementById('system-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'system-detail-modal';
    modal.className = 'modal fade';
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fa-solid fa-server text-success me-2"></i>System Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="system-detail-modal-body"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  // Fill modal body with all system info
  const body = modal.querySelector('#system-detail-modal-body');
  body.innerHTML = renderSystemDetailHtml(sys);
  // Show modal
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}

function renderSystemDetailHtml(sys) {
  let html = `<h4 class="mb-2"><i class="fa-solid fa-server text-success me-2"></i>${sys.name}</h4>`;
  html += `<div class="mb-2 text-muted">${sys.description || ''}</div>`;
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
  // Only show latest contract
  let latestContract = null;
  if (Array.isArray(sys.contracts) && sys.contracts.length) {
    latestContract = sys.contracts.reduce((latest, c) => {
      const latestDate = new Date(latest.endDate || latest.startDate || 0);
      const cDate = new Date(c.endDate || c.startDate || 0);
      return cDate > latestDate ? c : latest;
    }, sys.contracts[0]);
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
  html += '</div>';
  return html;
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

// Tooltip for system details
function showSystemTooltip(event, sys) {
  let tooltip = document.getElementById('platform-system-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'platform-system-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = 10000;
    tooltip.style.background = '#fff';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.borderRadius = '6px';
    tooltip.style.padding = '10px 16px';
    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    document.body.appendChild(tooltip);
  }
  tooltip.innerHTML = `<strong>${sys.name}</strong><br><span class='text-muted small'>${sys.description || ''}</span>`;
  tooltip.style.left = (event.clientX + 16) + 'px';
  tooltip.style.top = (event.clientY - 8) + 'px';
  tooltip.style.display = 'block';
}
function hideSystemTooltip() {
  const tooltip = document.getElementById('platform-system-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}
