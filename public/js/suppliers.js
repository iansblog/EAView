// JS for Suppliers page visualizations
// Only code for suppliers.html should go here

window.renderSuppliersReport = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // SUPPLIERS
      const suppliers = data.suppliers || {};
      const systems = data.systems || {};
      // Build supplier contracts/costs table
      let supplierRows = [];
      Object.entries(suppliers).forEach(([sid, s]) => {
        // Find all systems/contracts for this supplier
        let contracts = [];
        Object.entries(systems).forEach(([sysId, sys]) => {
          if (sys.supplier && (sys.supplier.name === s.name)) {
            if (sys.contracts && sys.contracts.length) {
              // Find the latest contract by end date
              const latest = sys.contracts.reduce((a, b) => (new Date(a.endDate) > new Date(b.endDate) ? a : b));
              contracts.push({
                system: sys.name,
                value: latest.value || '',
                start: latest.startDate || '',
                end: latest.endDate || ''
              });
            }
          }
        });
        supplierRows.push({
          name: s.name,
          contact: s.contact,
          email: s.email,
          phone: s.phone,
          notes: s.notes,
          contracts
        });
      });
      // RESLLERS
      const resellers = data.resellers || {};
      let resellerRows = [];
      Object.entries(resellers).forEach(([rid, r]) => {
        // Find all systems/contracts for this reseller (via supplierHistory)
        let contracts = [];
        Object.entries(systems).forEach(([sysId, sys]) => {
          const histories = (sys.supplierHistory||[]).filter(hist => hist.resellerId === rid);
          if (histories.length) {
            // Find the latest contract by end date
            const latest = histories.reduce((a, b) => (new Date(a.endDate) > new Date(b.endDate) ? a : b));
            contracts.push({
              system: sys.name,
              value: latest.contractValue || '',
              start: latest.startDate || '',
              end: latest.endDate || ''
            });
          }
        });
        resellerRows.push({
          name: r.name,
          contact: r.contact,
          email: r.email,
          phone: r.phone,
          notes: r.notes,
          contracts
        });
      });
      // Render suppliers
      const sDiv = document.getElementById('suppliers-report');
      let sHtml = '<h2><i class="fa-solid fa-truck"></i> Suppliers</h2>';
      sHtml += '<div class="table-responsive"><table class="table table-bordered table-hover align-middle"><thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Notes</th><th>Contracts</th></tr></thead><tbody>';
      supplierRows.forEach(s => {
        sHtml += `<tr><td>${s.name}</td><td>${s.contact}</td><td>${s.email}</td><td>${s.phone}</td><td>${s.notes}</td><td>`;
        if (s.contracts.length) {
          sHtml += '<ul class="list-unstyled mb-0">';
          s.contracts.forEach(c => {
            sHtml += `<li><strong>${c.system}</strong><br>Value: ${c.value}<br>${c.start} - ${c.end}</li>`;
          });
          sHtml += '</ul>';
        } else {
          sHtml += '<span class="text-muted">None</span>';
        }
        sHtml += '</td></tr>';
      });
      sHtml += '</tbody></table></div>';
      sDiv.innerHTML = sHtml;
      // Render resellers
      const rDiv = document.getElementById('resellers-report');
      let rHtml = '<h2><i class="fa-solid fa-user-tie"></i> Resellers</h2>';
      rHtml += '<div class="table-responsive"><table class="table table-bordered table-hover align-middle"><thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Notes</th><th>Contracts</th></tr></thead><tbody>';
      resellerRows.forEach(r => {
        rHtml += `<tr><td>${r.name}</td><td>${r.contact}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.notes}</td><td>`;
        if (r.contracts.length) {
          rHtml += '<ul class="list-unstyled mb-0">';
          r.contracts.forEach(c => {
            rHtml += `<li><strong>${c.system}</strong><br>Value: ${c.value}<br>${c.start} - ${c.end}</li>`;
          });
          rHtml += '</ul>';
        } else {
          rHtml += '<span class="text-muted">None</span>';
        }
        rHtml += '</td></tr>';
      });
      rHtml += '</tbody></table></div>';
      rDiv.innerHTML = rHtml;
    });
};
