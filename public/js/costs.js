// JS for Costs page visualizations
// Only code for costs.html should go here

window.renderCostsTable = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      let systems = Object.entries(data.systems || {});
      // Prepare system data with latest contract cost
      systems = systems.map(([id, sys]) => {
        let latestContract = null;
        if (Array.isArray(sys.contracts) && sys.contracts.length > 0) {
          latestContract = sys.contracts.reduce((a, b) => {
            const aEnd = new Date(a.endDate || a.end_date || 0);
            const bEnd = new Date(b.endDate || b.end_date || 0);
            return bEnd > aEnd ? b : a;
          });
        }
        let cost = '';
        if (latestContract && latestContract.value) {
          cost = latestContract.value.replace(/[^\d.]/g, '');
        }
        return {
          sys,
          name: sys.name,
          cost: cost ? parseFloat(cost) : 0,
          idx: id
        };
      });
      // State for sorting/filtering
      let sortCol = 'name', sortAsc = true, filterName = '', filterMin = '', filterMax = '';
      function renderTable() {
        let filtered = systems.filter(row => {
          const nameMatch = row.name.toLowerCase().includes(filterName.toLowerCase());
          const minOk = !filterMin || row.cost >= parseFloat(filterMin);
          const maxOk = !filterMax || row.cost <= parseFloat(filterMax);
          return nameMatch && minOk && maxOk;
        });
        filtered.sort((a, b) => {
          if (sortCol === 'name') {
            return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          } else {
            return sortAsc ? a.cost - b.cost : b.cost - a.cost;
          }
        });
        const rows = filtered.map((row, idx) =>
          `<tr class='costs-system-row' data-idx='${row.idx}' style='cursor:pointer'><td>${row.name}</td><td class='text-end'>${row.cost ? row.cost.toLocaleString() : ''}</td></tr>`
        );
        const container = document.getElementById('costs-chart');
        container.innerHTML = `
          <div class="mb-2 row g-2 align-items-end">
            <div class="col-md-4">
              <label class="form-label mb-0">Filter by Name</label>
              <input type="text" id="costs-filter-name" class="form-control form-control-sm" placeholder="System name" value="${filterName}">
            </div>
            <div class="col-md-3">
              <label class="form-label mb-0">Min Cost</label>
              <input type="number" id="costs-filter-min" class="form-control form-control-sm" placeholder="Min" value="${filterMin}">
            </div>
            <div class="col-md-3">
              <label class="form-label mb-0">Max Cost</label>
              <input type="number" id="costs-filter-max" class="form-control form-control-sm" placeholder="Max" value="${filterMax}">
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-striped table-bordered align-middle">
              <thead>
                <tr>
                  <th style="cursor:pointer" id="costs-sort-name">System Name <i class="fa fa-sort${sortCol==='name'?(sortAsc?'-up':'-down'):''}"></i></th>
                  <th style="cursor:pointer" id="costs-sort-cost">Current Contract Cost <i class="fa fa-sort${sortCol==='cost'?(sortAsc?'-up':'-down'):''}"></i></th>
                </tr>
              </thead>
              <tbody>
                ${rows.join('')}
              </tbody>
            </table>
          </div>
        `;
        // Add click handler for each row
        container.querySelectorAll('.costs-system-row').forEach(row => {
          row.addEventListener('click', function() {
            const sys = systems.find(s => s.idx === this.getAttribute('data-idx')).sys;
            // Build details card
            let html = `<h5 class='card-title'><i class='fa-solid fa-server text-primary me-2'></i>${sys.name}</h5>`;
            html += sys.description ? `<div class='mb-2 text-muted'>${sys.description}</div>` : '';
            html += `<div class='mb-2'><b>Status:</b> ${sys.status || ''}</div>`;
            html += `<div class='mb-2'><b>Owner:</b> ${sys.owner || ''}</div>`;
            html += `<div class='mb-2'><b>Platform:</b> ${sys.platformId ? (data.platforms && data.platforms[sys.platformId] ? data.platforms[sys.platformId].name : sys.platformId) : ''}</div>`;
            html += `<div class='mb-2'><b>Criticality:</b> ${sys.criticality || ''}</div>`;
            html += `<div class='mb-2'><b>Technology:</b> ${sys.technology || ''}</div>`;
            html += `<div class='mb-2'><b>Deployment Type:</b> ${sys.deploymentType || ''}</div>`;
            html += `<div class='mb-2'><b>Support Level:</b> ${sys.supportLevel || ''}</div>`;
            html += `<div class='mb-2'><b>Data Classification:</b> ${sys.dataClassification || ''}</div>`;
            // Usage
            if (Array.isArray(sys.usage) && sys.usage.length > 0) {
              html += `<div class='mb-2'><b>Usage:</b><ul class='mb-1'>`;
              sys.usage.forEach(u => {
                html += `<li>${u.country ? `<b>Country:</b> ${u.country}` : ''} ${u.userCount ? `- <b>Users:</b> ${u.userCount}` : ''}</li>`;
              });
              html += `</ul></div>`;
            }
            // Costs
            if (sys.costs) {
              html += `<div class='mb-2'><b>Annual Cost:</b> ${sys.costs.annualCost || ''}</div>`;
              if (sys.costs.costBreakdown) {
                html += `<div class='mb-2'><b>Cost Breakdown:</b><ul class='mb-1'>`;
                Object.entries(sys.costs.costBreakdown).forEach(([k, v]) => {
                  html += `<li>${k}: £${v.toLocaleString()}</li>`;
                });
                html += `</ul></div>`;
              }
            }
            // Business Capabilities
            if (Array.isArray(sys.businessCapabilities) && sys.businessCapabilities.length > 0) {
              html += `<div class='mb-2'><b>Business Capabilities:</b> `;
              html += sys.businessCapabilities.map(bc => data.businessCapabilities && data.businessCapabilities[bc] ? data.businessCapabilities[bc].name : bc).join(', ');
              html += `</div>`;
            }
            // Data Entities
            if (Array.isArray(sys.dataEntities) && sys.dataEntities.length > 0) {
              html += `<div class='mb-2'><b>Data Entities:</b> `;
              html += sys.dataEntities.map(de => data.dataEntities && data.dataEntities[de] ? data.dataEntities[de].name : de).join(', ');
              html += `</div>`;
            }
            // Delivery Program
            if (sys.deliveryProgramId) {
              html += `<div class='mb-2'><b>Delivery Program:</b> `;
              html += data.deliveryPrograms && data.deliveryPrograms[sys.deliveryProgramId] ? data.deliveryPrograms[sys.deliveryProgramId].name : sys.deliveryProgramId;
              html += `</div>`;
            }
            // Supplier
            if (sys.supplier) {
              html += `<div class='mb-2'><b>Supplier:</b> ${sys.supplier.name || ''}`;
              if (sys.supplier.contactDetails) {
                html += `<ul class='mb-1'>`;
                Object.entries(sys.supplier.contactDetails).forEach(([k, v]) => {
                  html += `<li>${k}: ${v}</li>`;
                });
                html += `</ul>`;
              }
              html += `</div>`;
            }
            // Current contract (most recent by end date)
            if (Array.isArray(sys.contracts) && sys.contracts.length > 0) {
              let latestContract = sys.contracts.reduce((a, b) => {
                const aEnd = new Date(a.endDate || a.end_date || 0);
                const bEnd = new Date(b.endDate || b.end_date || 0);
                return bEnd > aEnd ? b : a;
              });
              html += `<div class='mt-3'><b>Current Contract:</b><ul class='list-group mb-2'>`;
              html += `<li class='list-group-item'>`;
              html += `<div><b>Start:</b> ${latestContract.startDate ? new Date(latestContract.startDate).toLocaleDateString() : ''}</div>`;
              html += `<div><b>End:</b> ${latestContract.endDate ? new Date(latestContract.endDate).toLocaleDateString() : ''}</div>`;
              html += `<div><b>Value:</b> ${latestContract.value ? latestContract.value.replace(/[^ -9.,£$€]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ''}</div>`;
              if (latestContract.supplier) html += `<div><b>Supplier:</b> ${latestContract.supplier}</div>`;
              if (latestContract.reseller) html += `<div><b>Reseller:</b> ${latestContract.reseller}</div>`;
              if (latestContract.notes) html += `<div><b>Notes:</b> ${latestContract.notes}</div>`;
              html += `</li></ul></div>`;
            } else {
              html += `<div class='mt-3 text-muted'>No contract history available.</div>`;
            }
            // Supplier history
            if (Array.isArray(sys.supplierHistory) && sys.supplierHistory.length > 0) {
              html += `<div class='mt-3'><b>Supplier History:</b><ul class='list-group mb-2'>`;
              sys.supplierHistory.forEach(hist => {
                html += `<li class='list-group-item'>`;
                if (hist.supplierId && data.suppliers && data.suppliers[hist.supplierId]) {
                  html += `<div><b>Supplier:</b> ${data.suppliers[hist.supplierId].name}</div>`;
                  html += `<div><b>Contact:</b> ${data.suppliers[hist.supplierId].contact || ''}</div>`;
                  html += `<div><b>Email:</b> ${data.suppliers[hist.supplierId].email || ''}</div>`;
                  html += `<div><b>Phone:</b> ${data.suppliers[hist.supplierId].phone || ''}</div>`;
                } else if (hist.supplierId) {
                  html += `<div><b>Supplier:</b> ${hist.supplierId}</div>`;
                }
                if (hist.resellerId && data.resellers && data.resellers[hist.resellerId]) {
                  html += `<div><b>Reseller:</b> ${data.resellers[hist.resellerId].name}</div>`;
                  html += `<div><b>Contact:</b> ${data.resellers[hist.resellerId].contact || ''}</div>`;
                  html += `<div><b>Email:</b> ${data.resellers[hist.resellerId].email || ''}</div>`;
                  html += `<div><b>Phone:</b> ${data.resellers[hist.resellerId].phone || ''}</div>`;
                } else if (hist.resellerId) {
                  html += `<div><b>Reseller:</b> ${hist.resellerId}</div>`;
                }
                html += `<div><b>Contract Value:</b> ${hist.contractValue ? hist.contractValue.replace(/[^ -9.,£$€]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ''}</div>`;
                html += `<div><b>Start:</b> ${hist.startDate ? new Date(hist.startDate).toLocaleDateString() : ''}</div>`;
                html += `<div><b>End:</b> ${hist.endDate ? new Date(hist.endDate).toLocaleDateString() : ''}</div>`;
                if (hist.notes) html += `<div><b>Notes:</b> ${hist.notes}</div>`;
                html += `</li>`;
              });
              html += '</ul>';
            }
            document.getElementById('costs-details-content').innerHTML = html;
          });
        });
        // Sorting
        document.getElementById('costs-sort-name').onclick = function() {
          if (sortCol === 'name') sortAsc = !sortAsc; else { sortCol = 'name'; sortAsc = true; }
          renderTable();
        };
        document.getElementById('costs-sort-cost').onclick = function() {
          if (sortCol === 'cost') sortAsc = !sortAsc; else { sortCol = 'cost'; sortAsc = true; }
          renderTable();
        };
        // Filtering (debounced to avoid focus loss)
        let filterTimeout;
        document.getElementById('costs-filter-name').addEventListener('input', function() {
          clearTimeout(filterTimeout);
          filterTimeout = setTimeout(() => {
            filterName = this.value;
            renderTable();
            // Restore focus and caret position
            const input = document.getElementById('costs-filter-name');
            if (input) {
              input.focus();
              const val = input.value;
              input.setSelectionRange(val.length, val.length);
            }
          }, 200);
        });
        document.getElementById('costs-filter-min').addEventListener('input', function() {
          clearTimeout(filterTimeout);
          filterTimeout = setTimeout(() => {
            filterMin = this.value;
            renderTable();
            const input = document.getElementById('costs-filter-min');
            if (input) {
              input.focus();
              const val = input.value;
              input.setSelectionRange(val.length, val.length);
            }
          }, 200);
        });
        document.getElementById('costs-filter-max').addEventListener('input', function() {
          clearTimeout(filterTimeout);
          filterTimeout = setTimeout(() => {
            filterMax = this.value;
            renderTable();
            const input = document.getElementById('costs-filter-max');
            if (input) {
              input.focus();
              const val = input.value;
              input.setSelectionRange(val.length, val.length);
            }
          }, 200);
        });
      }
      renderTable();
    });
};

document.addEventListener('DOMContentLoaded', function() {
  window.renderCostsTable();
});
