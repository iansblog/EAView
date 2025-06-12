// D3.js visualizations for Knight Frank EA
// This file provides stub functions for each visualization page.

window.renderCapabilitiesTree = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Convert businessCapabilities to a D3 hierarchy
      const capabilities = data.businessCapabilities;
      // Find root nodes (no parentId)
      const roots = Object.entries(capabilities)
        .filter(([id, cap]) => !cap.parentId)
        .map(([id, cap]) => ({ id, ...cap }));

      // Recursively build tree
      function buildNode(node) {
        const children = node.childrenIds ? node.childrenIds.map(cid => {
          const child = capabilities[cid];
          return child ? buildNode({ id: cid, ...child }) : null;
        }).filter(Boolean) : [];
        return { ...node, children };
      }
      const treeData = roots.map(buildNode);

      // D3 rendering
      const container = d3.select('#capabilities-tree');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 800;
      const dx = 24, dy = 220;
      const margin = { top: 20, right: 90, bottom: 30, left: 90 };
      const svg = container.append('svg')
        .attr('width', width)
        .attr('height', 600)
        .attr('viewBox', [0, 0, width, 600]);

      // For each root, render a tree
      treeData.forEach((rootData, i) => {
        const root = d3.hierarchy(rootData);
        const treeLayout = d3.tree().nodeSize([dx, dy]);
        treeLayout(root);
        let x0 = Infinity, x1 = -x0;
        root.each(d => {
          if (d.x < x0) x0 = d.x;
          if (d.x > x1) x1 = d.x;
        });
        const g = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top + i * 250})`);
        // Links
        g.append('g')
          .selectAll('path')
          .data(root.links())
          .join('path')
          .attr('fill', 'none')
          .attr('stroke', '#ccc')
          .attr('stroke-width', 2)
          .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
        // Nodes
        const node = g.append('g')
          .selectAll('g')
          .data(root.descendants())
          .join('g')
          .attr('transform', d => `translate(${d.y},${d.x})`);
        node.append('circle')
          .attr('r', 10)
          .attr('fill', d => d.data.color || '#2980B9');
        node.append('text')
          .attr('dy', '0.32em')
          .attr('x', d => d.children ? -16 : 16)
          .attr('text-anchor', d => d.children ? 'end' : 'start')
          .attr('font-size', 15)
          .attr('font-family', 'inherit')
          .text(d => d.data.name)
          .style('fill', d => d.data.color || '#222');
        // Tooltip
        node.append('title').text(d => d.data.description || d.data.name);
      });
    });
};

window.renderSystemsMatrix = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Prepare systems and capabilities
      const systems = data.systems;
      const capabilities = data.businessCapabilities;
      // Build a map of capability id to name
      const capMap = Object.fromEntries(Object.entries(capabilities).map(([id, cap]) => [id, cap.name]));
      // Build a flat array of systems with their capabilities
      const systemArr = Object.entries(systems).map(([id, sys]) => ({ id, ...sys }));
      // Get all unique capabilities referenced by systems
      const allCaps = Array.from(new Set(systemArr.flatMap(s => s.businessCapabilities || [])));
      // Render as a table
      const container = d3.select('#systems-matrix');
      container.selectAll('*').remove();
      const table = container.append('table').attr('class', 'table table-bordered table-hover align-middle');
      const thead = table.append('thead').append('tr');
      thead.append('th').text('System');
      allCaps.forEach(cid => thead.append('th').text(capMap[cid] || cid));
      const tbody = table.append('tbody');
      systemArr.forEach(sys => {
        const row = tbody.append('tr');
        row.append('td').html(`<strong>${sys.name}</strong><br><span class='text-muted small'>${sys.description || ''}</span>`);
        allCaps.forEach(cid => {
          row.append('td').html((sys.businessCapabilities||[]).includes(cid) ? '<i class="fa-solid fa-check text-success"></i>' : '');
        });
      });
    });
};

window.renderCostsChart = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Prepare data
      const systems = Object.entries(data.systems).map(([id, sys]) => ({ id, ...sys }));
      // Parse annualCost as number
      systems.forEach(s => {
        const cost = s.costs && s.costs.annualCost ? s.costs.annualCost.replace(/[^\d.]/g, '') : '0';
        s.annualCostNum = parseFloat(cost) || 0;
      });
      // Set up SVG
      const container = d3.select('#costs-chart');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 800;
      const height = 500;
      const svg = container.append('svg').attr('width', width).attr('height', height);
      // Bubble pack layout
      const root = d3.hierarchy({ children: systems }).sum(d => d.annualCostNum);
      const pack = d3.pack().size([width, height]).padding(8);
      pack(root);
      // Color by status
      const statusColor = {
        'Production': '#50C878',
        'Planning': '#FFD700',
        'Development': '#3498DB',
        'Testing': '#F39C12',
        'Retired': '#B2BABB'
      };
      // Draw bubbles
      const node = svg.selectAll('g')
        .data(root.leaves())
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);
      node.append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => statusColor[d.data.status] || '#ccc')
        .attr('stroke', '#333')
        .attr('stroke-width', 1);
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', d => Math.min(18, d.r/2))
        .text(d => d.data.name.length > 15 ? d.data.name.slice(0, 13) + '…' : d.data.name);
      // Tooltip
      node.append('title').text(d => `${d.data.name}\nAnnual Cost: $${d.data.annualCostNum.toLocaleString()}\nStatus: ${d.data.status}`);
    });
};

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
      // Color by criticality
      const critColor = { 'Critical': '#C0392B', 'High': '#F39C12', 'Medium': '#2980B9', 'Low': '#7DCEA0' };
      // Bars
      svg.append('g')
        .selectAll('rect')
        .data(contracts)
        .join('rect')
        .attr('x', d => x(d.start))
        .attr('y', d => y(d.system))
        .attr('width', d => x(d.end) - x(d.start))
        .attr('height', y.bandwidth())
        .attr('fill', d => critColor[d.criticality] || '#bbb');
      // Tooltip
      svg.append('g')
        .selectAll('title')
        .data(contracts)
        .join('title')
        .text(d => `${d.system}\n${d.start.toLocaleDateString()} - ${d.end.toLocaleDateString()}\nValue: ${d.value || ''}\nCriticality: ${d.criticality}`);
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
        .text(d => d.value ? `$${d.value.replace(/[^\d.]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : '');
    });
};

window.renderUsageMap = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Aggregate userCount by country
      const usage = {};
      Object.values(data.systems).forEach(sys => {
        (sys.usage || []).forEach(u => {
          if (!usage[u.country]) usage[u.country] = 0;
          usage[u.country] += u.userCount || 0;
        });
      });
      // D3 map setup
      const container = d3.select('#usage-map');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 900;
      const height = 500;
      const svg = container.append('svg').attr('width', width).attr('height', height);
      // Load world map (TopoJSON)
      d3.json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json').then(world => {
        const countries = topojson.feature(world, world.objects.countries).features;
        // Color scale
        const maxUsers = d3.max(Object.values(usage));
        const color = d3.scaleSequential(d3.interpolateBlues).domain([0, maxUsers || 1]);
        // Projection
        const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' });
        const path = d3.geoPath(projection);
        // Draw countries
        svg.append('g')
          .selectAll('path')
          .data(countries)
          .join('path')
          .attr('d', path)
          .attr('fill', d => {
            // Use ISO_A2 country code if available
            const iso = d.id;
            return color(usage[iso] || 0);
          })
          .attr('stroke', '#888')
          .append('title')
          .text(d => `${d.properties.name}: ${usage[d.id] || 0} users`);
        // Legend
        const legendWidth = 200;
        const legendHeight = 12;
        const legendSvg = svg.append('g').attr('transform', `translate(${width-legendWidth-30},${height-40})`);
        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient').attr('id', 'legend-gradient');
        linearGradient.selectAll('stop')
          .data(d3.range(0, 1.01, 0.01))
          .join('stop')
          .attr('offset', d => `${d*100}%`)
          .attr('stop-color', d => color(d*maxUsers));
        legendSvg.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#legend-gradient)');
        legendSvg.append('text')
          .attr('x', 0)
          .attr('y', -4)
          .attr('font-size', 12)
          .text('User Count');
        legendSvg.append('text')
          .attr('x', 0)
          .attr('y', legendHeight+14)
          .attr('font-size', 12)
          .text('0');
        legendSvg.append('text')
          .attr('x', legendWidth)
          .attr('y', legendHeight+14)
          .attr('font-size', 12)
          .attr('text-anchor', 'end')
          .text(maxUsers);
      });
    });
};

window.renderPlatformsGraph = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Prepare nodes and links for force-directed graph
      const platforms = data.platforms || {};
      const systems = data.systems || {};
      const capabilities = data.businessCapabilities || {};
      const nodes = [];
      const links = [];
      // Add platform nodes
      Object.entries(platforms).forEach(([pid, p]) => {
        nodes.push({ id: pid, name: p.name, type: 'platform', deploymentType: p.category, icon: 'fa-layer-group' });
        // Link to systems
        const sysIds = (p.systemIds || (p.components && p.components.systems) || []);
        sysIds.forEach(sid => {
          if (systems[sid]) {
            nodes.push({ id: sid, name: systems[sid].name, type: 'system', deploymentType: systems[sid].deploymentType, icon: 'fa-server' });
            links.push({ source: pid, target: sid });
            // Link to business capabilities
            (systems[sid].businessCapabilities||[]).forEach(cid => {
              if (capabilities[cid]) {
                nodes.push({ id: cid, name: capabilities[cid].name, type: 'capability', icon: capabilities[cid].icon||'fa-cube' });
                links.push({ source: sid, target: cid });
              }
            });
          }
        });
      });
      // Remove duplicate nodes
      const nodeMap = {};
      nodes.forEach(n => { nodeMap[n.id] = n; });
      const uniqueNodes = Object.values(nodeMap);
      // D3 force-directed graph
      const container = d3.select('#platforms-graph');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 900;
      const height = 500;
      const svg = container.append('svg').attr('width', width).attr('height', height);
      const colorMap = { 'Cloud': '#2980B9', 'SaaS': '#50C878', 'Hybrid': '#FFD700', 'ApplicationPlatform': '#9B59B6', 'DataPlatform': '#F39C12', 'IntegrationPlatform': '#34495E', 'InfrastructurePlatform': '#E74C3C' };
      const simulation = d3.forceSimulation(uniqueNodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width/2, height/2));
      const link = svg.append('g').attr('stroke', '#bbb').selectAll('line')
        .data(links).join('line').attr('stroke-width', 2);
      const node = svg.append('g').selectAll('g')
        .data(uniqueNodes).join('g').call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));
      node.append('circle')
        .attr('r', d => d.type === 'platform' ? 22 : d.type === 'system' ? 16 : 10)
        .attr('fill', d => colorMap[d.deploymentType] || '#ccc');
      node.append('text')
        .attr('x', 0)
        .attr('y', d => d.type === 'platform' ? -28 : d.type === 'system' ? -20 : -14)
        .attr('text-anchor', 'middle')
        .attr('font-size', 13)
        .text(d => d.name.length > 18 ? d.name.slice(0,16)+'…' : d.name);
      node.append('title').text(d => d.name);
      simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
      function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
      function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
      function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
      // Bootstrap accordion for platform details
      const acc = d3.select('#platforms-accordion');
      acc.selectAll('*').remove();
      Object.entries(platforms).forEach(([pid, p], i) => {
        acc.append('div').attr('class', 'accordion-item').html(`
          <h2 class='accordion-header' id='heading${i}'>
            <button class='accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#collapse${i}' aria-expanded='false' aria-controls='collapse${i}'>
              <i class='fa-solid fa-layer-group me-2'></i>${p.name}
            </button>
          </h2>
          <div id='collapse${i}' class='accordion-collapse collapse' aria-labelledby='heading${i}' data-bs-parent='#platforms-accordion'>
            <div class='accordion-body'>
              <strong>Description:</strong> ${p.description || ''}<br>
              <strong>Category:</strong> ${p.category || ''}<br>
              <strong>Vendor:</strong> ${p.vendor || ''}<br>
              <strong>Systems:</strong> ${(p.systemIds || (p.components && p.components.systems) || []).map(sid => systems[sid]?.name).filter(Boolean).join(', ')}
            </div>
          </div>
        `);
      });
    });
};

// window.renderEntitiesChord has been moved to dataEntities.js

window.renderDependenciesHeatmap = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Heatmap: systems vs. business capabilities
      const systems = Object.entries(data.systems || {});
      const capabilities = Object.entries(data.businessCapabilities || {});
      const sysIds = systems.map(([id]) => id);
      const capIds = capabilities.map(([id]) => id);
      // Build matrix: systems x capabilities
      var matrix = [];
      for (let i = 0; i < sysIds.length; i++) {
        let row = [];
        for (let j = 0; j < capIds.length; j++) {
          const sys = systems[i][1];
          row.push((sys.businessCapabilities||[]).includes(capIds[j]) ? 1 : 0);
        }
        matrix.push(row);
      }
      // D3 heatmap
      const container = d3.select('#dependencies-heatmap');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 900;
      const cellSize = 22;
      const height = Math.max(120, cellSize * sysIds.length + 60);
      const svg = container.append('svg').attr('width', width).attr('height', height);
      // Color scale
      const color = d3.scaleLinear().domain([0, 1]).range(['#fff', '#2980B9']);
      // Draw cells
      let cellData = [];
      for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
          cellData.push({ x: j, y: i, v: matrix[i][j] });
        }
      }
      svg.append('g')
        .selectAll('rect')
        .data(cellData)
        .join('rect')
        .attr('x', d => 120 + d.x * cellSize)
        .attr('y', d => 40 + d.y * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', d => color(d.v))
        .attr('stroke', '#ccc')
        .append('title')
        .text(d => d.v ? `${systems[d.y][1].name} ↔ ${capabilities[d.x][1].name}` : '');
      // System labels
      svg.append('g')
        .selectAll('text')
        .data(systems)
        .join('text')
        .attr('x', 115)
        .attr('y', (d, i) => 40 + i * cellSize + cellSize/1.5)
        .attr('text-anchor', 'end')
        .attr('font-size', 12)
        .text(d => d[1].name);
      // Capability labels
      svg.append('g')
        .selectAll('text')
        .data(capabilities)
        .join('text')
        .attr('x', (d, i) => 120 + i * cellSize + cellSize/2)
        .attr('y', 32)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('transform', (d, i) => `rotate(-45,${120 + i * cellSize + cellSize/2},32)`)
        .text(d => d[1].name);
    });
};

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
            (sys.contracts||[]).forEach(contract => {
              contracts.push({
                system: sys.name,
                value: contract.value || '',
                start: contract.startDate || '',
                end: contract.endDate || ''
              });
            });
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
          (sys.supplierHistory||[]).forEach(hist => {
            if (hist.resellerId === rid) {
              contracts.push({
                system: sys.name,
                value: hist.contractValue || '',
                start: hist.startDate || '',
                end: hist.endDate || ''
              });
            }
          });
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

window.renderCapabilitiesCards = function() {
  // Debug: Indicate function is called
  console.log('[CapabilitiesCards] Function called');
  fetch('/data/asis.json')
    .then(r => {
      if (!r.ok) throw new Error('Failed to load asis.json: ' + r.status);
      return r.json();
    })
    .then(data => {
      if (!data) {
        console.error('[CapabilitiesCards] No data loaded');
        return;
      }
      const capabilities = data.businessCapabilities || {};
      const systems = data.systems || {};
      // Find parent capabilities (no parentId)
      const parents = Object.entries(capabilities).filter(([id, cap]) => !cap.parentId);
      // For each capability, count how many systems deliver it
      const capabilitySystemCount = {};
      Object.keys(capabilities).forEach(cid => {
        capabilitySystemCount[cid] = 0;
      });
      Object.values(systems).forEach(sys => {
        (sys.businessCapabilities || []).forEach(cid => {
          if (capabilitySystemCount[cid] !== undefined) capabilitySystemCount[cid]++;
        });
      });
      // For each parent, compute unique system count for all children
      const parentUniqueSystemCount = {};
      parents.forEach(([pid, parent]) => {
        // Find children
        let children = [];
        if (Array.isArray(parent.childrenIds) && parent.childrenIds.length > 0) {
          children = parent.childrenIds.map(cid => ({ id: cid, ...capabilities[cid] }));
        } else if (Array.isArray(parent.children) && parent.children.length > 0) {
          children = parent.children.map(child => {
            if (child.id) return child;
            const found = Object.values(capabilities).find(c => c.name === child.name && c.parentId === parent.id);
            return found ? { id: found.id, ...found } : child;
          });
        } else {
          children = Object.entries(capabilities)
            .filter(([id, c]) => c.parentId === parent.id)
            .map(([id, c]) => ({ id, ...c }));
        }
        // Collect all unique systems delivering any child capability
        let allSystems = [];
        children.forEach(child => {
          const systemsForChild = Object.values(systems).filter(sys => (sys.businessCapabilities || []).includes(child.id));
          allSystems = allSystems.concat(systemsForChild);
        });
        // Remove duplicates by system id
        const uniqueSystems = Object.values(allSystems.reduce((acc, sys) => { acc[sys.id] = sys; return acc; }, {}));
        parentUniqueSystemCount[pid] = uniqueSystems.length;
      });
      // Render cards
      const container = document.getElementById('capabilities-cards');
      if (!container) {
        console.error('[CapabilitiesCards] Container #capabilities-cards not found');
        return;
      }
      container.innerHTML = '';
      // Helper: get systems for a capability id
      function getSystemsForCapability(capId) {
        return Object.values(systems).filter(sys => (sys.businessCapabilities || []).includes(capId));
      }
      // Helper: show details in sidebar
      function showCapabilityDetailsPanel(cap, parent, isChild, systemsForCap) {
        const body = document.getElementById('capability-details-body');
        if (!body) {
          console.error('[Capabilities] Sidebar element #capability-details-body not found');
          return;
        }
        let html = '';
        if (!cap) {
          body.innerHTML = '<div class="alert alert-warning">No details available.</div>';
          return;
        }
        html += `<div class="alert alert-info">You clicked the item: <strong>${cap.name}</strong>${cap.id ? ` (ID: ${cap.id})` : ''}</div>`;
        html += `<div class="mb-3">
          <h4>${isChild ? parent.name + ' &gt; ' : ''}${cap.name}</h4>
          <div class="text-muted mb-2">${cap.description || ''}</div>
          ${cap.type ? `<div class="mb-2"><span class="badge bg-secondary">${cap.type}</span></div>` : ''}
        </div>`;
        // Systems
        if (systemsForCap.length > 0) {
          html += `<div class="mb-3">
            <h6>Systems Delivering This Capability</h6>
            <ul class="list-group list-group-flush">`;
          systemsForCap.forEach(sys => {
            // Data entities summary
            let dataEntitiesSummary = '';
            if (Array.isArray(sys.dataEntities) && sys.dataEntities.length > 0 && data.dataEntities) {
              const entityNames = sys.dataEntities.map(eid => data.dataEntities[eid]?.name || eid).filter(Boolean);
              dataEntitiesSummary = `<div class='small text-muted mt-1'><i class='fa fa-database me-1'></i>Data Entities: ${entityNames.join(', ')}</div>`;
            }
            // Contract summary with formatted dates
            let contractSummary = '';
            function formatDate(dateStr) {
              if (!dateStr) return '';
              const d = new Date(dateStr);
              if (isNaN(d)) return dateStr;
              const day = d.getDate();
              const month = d.toLocaleString('en-GB', { month: 'long' });
              const year = d.getFullYear();
              return `${day} ${month} ${year}`;
            }
            if (Array.isArray(sys.contracts) && sys.contracts.length > 0) {
              contractSummary = `<div class='small text-muted mt-1'><i class='fa fa-file-contract me-1'></i>Contracts:`;
              contractSummary += `<ul class='mb-0 ps-3'>`;
              sys.contracts.forEach(contract => {
                // Supplier and reseller display
                let supplier = contract.supplier || sys.supplier?.name || '';
                let reseller = contract.reseller || (contract.resellerName || (sys.reseller?.name || ''));
                let parties = '';
                if (reseller && reseller !== supplier) {
                  parties = `<strong>Supplier:</strong> ${supplier}<br><strong>Reseller:</strong> ${reseller}`;
                } else if (supplier) {
                  parties = `<strong>Supplier:</strong> ${supplier}`;
                }
                // Value (remove any non-breaking space, degree, percent, or currency symbols except £, $, €)
                let value = contract.value ? `Value: ${String(contract.value).replace(/[\u00A0°%¢¥₹₽₩₺₴₦₱฿₡₲₵₸₺₻₼₽₾₿₠₢₣₤₥₦₧₨₩₪₫₭₮₯₰₱₲₳₴₵₸₺₻₼₽₾₿]/g, '').replace(/\s+/g, ' ').trim()}` : '';
                let start = contract.startDate ? formatDate(contract.startDate) : '';
                let end = contract.endDate ? formatDate(contract.endDate) : '';
                let dateStr = (start || end) ? `<br>${start}${start && end ? ' - ' : ''}${end}` : '';
                contractSummary += `<li>
                  ${parties ? parties + '<br>' : ''}
                  ${value ? `${value}` : ''}
                  ${dateStr}
                </li>`;
              });
              contractSummary += `</ul></div>`;
            }
            // Add more system info if available
            let moreInfo = '';
            if (sys.status) moreInfo += `<div class='small text-muted'><i class='fa fa-circle me-1'></i>Status: ${sys.status}</div>`;
            if (sys.owner) moreInfo += `<div class='small text-muted'><i class='fa fa-user me-1'></i>Owner: ${sys.owner}</div>`;
            if (sys.criticality) moreInfo += `<div class='small text-muted'><i class='fa fa-exclamation-triangle me-1'></i>Criticality: ${sys.criticality}</div>`;
            html += `<li class="list-group-item">
              <strong>${sys.name}</strong>
              <span class="badge rounded-pill bg-light text-dark float-end">${sys.deploymentType || ''}</span>
              ${moreInfo}
              ${dataEntitiesSummary}
              ${contractSummary}
            </li>`;
          });
          html += `</ul></div>`;
        } else {
          html += `<div class="alert alert-warning">No systems deliver this capability.</div>`;
        }
        body.innerHTML = html;
      }
      // Render parent and child cards with click handlers
      parents.forEach(([pid, parent]) => {
        // Find children
        const children = (parent.childrenIds || []).map(cid => ({ id: cid, ...capabilities[cid] }));
        // Parent card
        let parentHtml = `<div class="col-md-6 col-lg-4">
          <div class="card h-100 shadow-sm capability-parent" data-id="${parent.id}" style="cursor:pointer;">
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <i class="fa-solid ${parent.icon || 'fa-cube'} fa-2x me-2" style="color:${parent.color||'#2980B9'}"></i>
                <h5 class="card-title mb-0">${parent.name}</h5>
              </div>
              <p class="card-text small text-muted">${parent.description||''}</p>
              <div class="mt-3">
                <h6 class="fw-bold">Children</h6>
                <ul class="list-group list-group-flush">`;
        if (children.length) {
          children.forEach(child => {
            parentHtml += `<li class="list-group-item d-flex align-items-center capability-child" data-id="${child.id}" data-parent-id="${parent.id}" style="cursor:pointer;">
              <i class="fa-solid ${child.icon || 'fa-cube'} me-2" style="color:${child.color||'#888'}"></i>
              <span>${child.name}</span>
              <span class="ms-auto badge rounded-pill bg-secondary system-count-badge" data-id="${child.id}" style="cursor:pointer;">${capabilitySystemCount[child.id]}</span>
            </li>`;
          });
        } else {
          parentHtml += `<li class="list-group-item text-muted">No children</li>`;
        }
        parentHtml += `</ul></div></div></div></div>`;
        container.innerHTML += parentHtml;
      });
      // Attach click handler to parent and child cards and badges
      container.querySelectorAll('.capability-parent').forEach(card => {
        card.addEventListener('click', function(e) {
          const capId = card.getAttribute('data-id');
          const cap = capabilities[capId];
          const parent = cap;
          // Robustly find children
          let children = [];
          if (Array.isArray(cap.childrenIds) && cap.childrenIds.length > 0) {
            children = cap.childrenIds.map(cid => ({ id: cid, ...capabilities[cid] }));
          } else if (Array.isArray(cap.children) && cap.children.length > 0) {
            children = cap.children.map(child => {
              if (child.id) return child;
              // Try to find by name and parentId
              const found = Object.values(capabilities).find(c => c.name === child.name && c.parentId === cap.id);
              return found ? { id: found.id, ...found } : child;
            });
          } else {
            // Fallback: find all capabilities with parentId === cap.id
            children = Object.entries(capabilities)
              .filter(([id, c]) => c.parentId === cap.id)
              .map(([id, c]) => ({ id, ...c }));
          }
          if (children.length > 0) {
            const body = document.getElementById('capability-details-body');
            // Collect all unique systems delivering any child capability
            let allSystems = [];
            children.forEach(child => {
              const systemsForChild = getSystemsForCapability(child.id);
              allSystems = allSystems.concat(systemsForChild);
            });
            // Remove duplicates by system id
            const uniqueSystems = Object.values(allSystems.reduce((acc, sys) => { acc[sys.id] = sys; return acc; }, {}));
            let html = `<div class="alert alert-info">You clicked the parent: <strong>${cap.name}</strong> (ID: ${cap.id})</div>`;
            html += `<div class="mb-3">
              <h4>${cap.name}</h4>
              <div class="text-muted mb-2">${cap.description || ''}</div>
            </div>`;
            html += `<div class="mb-3">
              <h6>All Systems Delivering Any Child Capability</h6>`;
            if (uniqueSystems.length > 0) {
              html += `<ul class="list-group list-group-flush mb-2">`;
              uniqueSystems.forEach(sys => {
                html += `<li class="list-group-item py-1 px-2">
                  <span class="me-2"><i class="fa fa-server text-primary"></i></span>
                  <strong>${sys.name}</strong>
                  <span class="badge rounded-pill bg-light text-dark float-end">${sys.deploymentType || ''}</span>
                </li>`;
              });
              html += `</ul>`;
            } else {
              html += `<div class="alert alert-warning py-1 px-2 mb-2">No systems deliver any child capability.</div>`;
            }
            html += `</div>`;
            // Also show breakdown by child
            html += `<div class="mb-3"><h6>Child Capabilities &amp; Their Systems</h6>`;
            children.forEach(child => {
              const systemsForChild = getSystemsForCapability(child.id);
              html += `<div class="mb-2 ps-2 border-start">
                <strong>${child.name}</strong>
                <div class="text-muted small mb-1">${child.description || ''}</div>`;
              if (systemsForChild.length > 0) {
                html += `<ul class="list-group list-group-flush mb-2">`;
                systemsForChild.forEach(sys => {
                  html += `<li class="list-group-item py-1 px-2">
                    <span class="me-2"><i class="fa fa-server text-primary"></i></span>
                    <strong>${sys.name}</strong>
                    <span class="badge rounded-pill bg-light text-dark float-end">${sys.deploymentType || ''}</span>
                  </li>`;
                });
                html += `</ul>`;
              } else {
                html += `<div class="alert alert-warning py-1 px-2 mb-2">No systems deliver this capability.</div>`;
              }
              html += `</div>`;
            });
            html += `</div>`;
            body.innerHTML = html;
          } else {
            // No children: fallback to original behavior
            const systemsForCap = getSystemsForCapability(capId);
            showCapabilityDetailsPanel(cap, parent, false, systemsForCap);
          }
        });
        // Also handle badge click
        card.querySelectorAll('.system-count-badge').forEach(badge => {
          badge.addEventListener('click', function(e) {
            e.stopPropagation();
            const capId = badge.getAttribute('data-id');
            const cap = capabilities[capId];
            const parent = cap;
            const systemsForCap = getSystemsForCapability(capId);
            showCapabilityDetailsPanel(cap, parent, false, systemsForCap);
          });
        });
      });
      container.querySelectorAll('.capability-child').forEach(childItem => {
        childItem.addEventListener('click', function(e) {
          const capId = childItem.getAttribute('data-id');
          const cap = capabilities[capId];
          const parentId = childItem.getAttribute('data-parent-id');
          const parent = capabilities[parentId];
          const systemsForCap = getSystemsForCapability(capId);
          showCapabilityDetailsPanel(cap, parent, true, systemsForCap);
        });
        // Also handle badge click
        childItem.querySelectorAll('.system-count-badge').forEach(badge => {
          badge.addEventListener('click', function(e) {
            e.stopPropagation();
            const capId = badge.getAttribute('data-id');
            const cap = capabilities[capId];
            const parentId = childItem.getAttribute('data-parent-id');
            const parent = capabilities[parentId];
            const systemsForCap = getSystemsForCapability(capId);
            showCapabilityDetailsPanel(cap, parent, true, systemsForCap);
          });
        });
      });
    })
    .catch(err => {
      console.error('[CapabilitiesCards] Error:', err);
      const container = document.getElementById('capabilities-cards');
      if (container) {
        container.innerHTML = `<div class='alert alert-danger'>Failed to load capabilities: ${err.message}</div>`;
      }
    });
};
