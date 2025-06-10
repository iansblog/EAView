// JS for Dependencies page visualizations
// ...existing code moved from visualizations.js...

document.addEventListener('DOMContentLoaded', function() {
  renderDependenciesHeatmap();
});

function renderDependenciesHeatmap() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Collect all unique data entities (case-insensitive, preserve original case for labels)
      const entitySet = new Map();
      Object.values(data.systems || {}).forEach(sys => {
        (sys.dataEntities || []).forEach(e => {
          const key = e.toLowerCase();
          if (!entitySet.has(key)) entitySet.set(key, e);
        });
      });
      const entities = Array.from(entitySet.values());
      // Build entity-to-entity co-occurrence matrix (count systems, not just 0/1)
      const matrix = entities.map((rowEntity, i) =>
        entities.map((colEntity, j) => {
          if (i === j) return 0; // No self-link
          // Count how many systems use both rowEntity and colEntity
          return Object.values(data.systems || {}).filter(sys => {
            const ents = (sys.dataEntities || []).map(e => e.toLowerCase());
            return ents.includes(rowEntity.toLowerCase()) && ents.includes(colEntity.toLowerCase());
          }).length;
        })
      );
      // Find max for color scale
      const maxCount = Math.max(1, ...matrix.flat());
      // D3 heatmap
      const container = d3.select('#dependencies-heatmap');
      container.selectAll('*').remove();
      const size = Math.max(24, Math.floor(600 / entities.length));
      const width = size * entities.length + 180;
      const height = size * entities.length + 80;
      const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
      // Color scale: 0=white, max=deep blue
      const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, maxCount]);
      // Draw cells
      const cellData = matrix.reduce((acc, row, i) => acc.concat(row.map((v, j) => ({ row: i, col: j, value: v }))), []);
      svg.append('g')
        .selectAll('rect')
        .data(cellData)
        .join('rect')
        .attr('x', d => d.col * size + 160)
        .attr('y', d => d.row * size + 40)
        .attr('width', size)
        .attr('height', size)
        .attr('fill', d => d.value === 0 ? '#f8f9fa' : color(d.value))
        .attr('stroke', '#fff')
        .style('cursor', d => d.value ? 'pointer' : 'default')
        .on('click', function(event, d) {
          if (!d.value) return;
          // Find systems that use both entities
          const entityA = entities[d.row];
          const entityB = entities[d.col];
          const systemsWithBoth = Object.values(data.systems || {}).filter(sys => {
            const ents = (sys.dataEntities || []).map(e => e.toLowerCase());
            return ents.includes(entityA.toLowerCase()) && ents.includes(entityB.toLowerCase());
          });
          // Show info in a Bootstrap row: left=text, right=visual
          const rowDiv = document.getElementById('dependency-info-row');
          const textDiv = document.getElementById('dependency-info-text');
          const visualDiv = document.getElementById('dependency-info-visual');
          if (rowDiv && textDiv && visualDiv) {
            rowDiv.style.display = '';
            if (systemsWithBoth.length === 0) {
              textDiv.innerHTML = `<b>No systems use both <span style='color:#375a9e'>${entityA}</span> and <span style='color:#375a9e'>${entityB}</span>.</b>`;
              visualDiv.innerHTML = '';
            } else {
              textDiv.innerHTML = `<b>Systems using both <span style='color:#375a9e'>${entityA}</span> and <span style='color:#375a9e'>${entityB}</span>:</b><ul style='margin-top:8px'>` +
                systemsWithBoth.map(sys => `<li><b>${sys.name}</b>: ${sys.description || ''}</li>`).join('') + '</ul>';
              // Mini visualization: show a simple D3 force-directed graph of the systems and the two entities
              visualDiv.innerHTML = '';
              const width = visualDiv.offsetWidth || 320;
              const height = 220;
              const visSvg = d3.select(visualDiv)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
              // Nodes: two entities + systems
              const nodes = [
                { id: entityA, type: 'entity' },
                { id: entityB, type: 'entity' },
                ...systemsWithBoth.map(sys => ({ id: sys.name, type: 'system' }))
              ];
              // Links: each system links to both entities
              const links = systemsWithBoth.flatMap(sys => [
                { source: sys.name, target: entityA },
                { source: sys.name, target: entityB }
              ]);
              const simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => d.id).distance(60))
                .force('charge', d3.forceManyBody().strength(-180))
                .force('center', d3.forceCenter(width / 2, height / 2));
              const link = visSvg.append('g')
                .attr('stroke', '#aaa')
                .selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke-width', 2);
              const node = visSvg.append('g')
                .selectAll('circle')
                .data(nodes)
                .join('circle')
                .attr('r', d => d.type === 'entity' ? 18 : 12)
                .attr('fill', d => d.type === 'entity' ? '#375a9e' : '#50C878')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
              const label = visSvg.append('g')
                .selectAll('text')
                .data(nodes)
                .join('text')
                .attr('font-size', 12)
                .attr('fill', '#222')
                .attr('text-anchor', 'middle')
                .attr('dy', 4)
                .text(d => d.id);
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
            rowDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .append('title')
        .text(d => d.value ? `${entities[d.row]} co-occurs with ${entities[d.col]} in ${d.value} system(s)` : '');
      // Row labels
      svg.append('g')
        .selectAll('text')
        .data(entities)
        .join('text')
        .attr('x', 150)
        .attr('y', (d, i) => i * size + 40 + size / 2)
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', 12)
        .text(d => d);
      // Column labels
      svg.append('g')
        .selectAll('text')
        .data(entities)
        .join('text')
        .attr('y', 30)
        .attr('x', (d, i) => i * size + 160 + size / 2)
        .attr('text-anchor', 'start')
        .attr('transform', (d, i) => `rotate(-45,${i * size + 160 + size / 2},30)`)
        .attr('font-size', 12)
        .text(d => d);
      // Title
      container.insert('h3', ':first-child')
        .text('Data Entity Co-occurrence Heatmap')
        .style('text-align', 'center');
    });
}
