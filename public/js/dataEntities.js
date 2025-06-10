// JS for Data Entities page visualizations
// Only code for data-entities.html should go here

window.renderEntitiesChord = function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      // Prepare data
      const entities = Object.entries(data.dataEntities || {});
      const systems = Object.entries(data.systems || {});
      // Build matrix: entities x systems
      const entityIds = entities.map(([id]) => id);
      const systemIds = systems.map(([id]) => id);
      const matrix = entityIds.map(eid => systemIds.map(sid => (systems.find(([id])=>id===sid)[1].dataEntities||[]).includes(eid) ? 1 : 0));
      // D3 chord diagram
      const container = d3.select('#entities-chord');
      container.selectAll('*').remove();
      const width = container.node().clientWidth || 700;
      const height = 500;
      const innerRadius = Math.min(width, height) * 0.35;
      const outerRadius = innerRadius * 1.1;
      const svg = container.append('svg').attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${width/2},${height/2})`);
      const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
      const chords = chord(matrix);
      const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
      const ribbon = d3.ribbon().radius(innerRadius);
      // Color scale
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      // Draw entity arcs
      svg.append('g')
        .selectAll('path')
        .data(chords.groups)
        .join('path')
        .attr('d', arc)
        .attr('fill', d => color(d.index))
        .attr('stroke', '#fff')
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          // Show entity details card for this entity
          if (typeof showEntityDetails === 'function') {
            showEntityDetails(d.index, entities, systems, entityIds, systemIds, matrix);
          }
        })
        .append('title')
        .text(d => entityIds[d.index] ? `${entities[d.index][1].name}` : `${systemIds[d.index-entityIds.length]}`);
      // Draw ribbons
      svg.append('g')
        .selectAll('path')
        .data(chords)
        .join('path')
        .attr('d', ribbon)
        .attr('fill', d => color(d.source.index))
        .attr('stroke', '#fff')
        .append('title')
        .text(d => {
          const entity = entities[d.source.index][1];
          const system = systems[d.target.index][1];
          return `${entity.name} → ${system.name}`;
        });
      // Labels
      svg.append('g')
        .selectAll('text')
        .data(chords.groups)
        .join('text')
        .attr('transform', d => {
          const angle = (d.startAngle + d.endAngle) / 2;
          const rotate = angle * 180 / Math.PI - 90;
          return `rotate(${rotate}) translate(${outerRadius + 8})${angle > Math.PI ? ' rotate(180)' : ''}`;
        })
        .attr('dy', '0.32em')
        .attr('font-size', 12)
        .attr('text-anchor', d => ((d.startAngle + d.endAngle) / 2) > Math.PI ? 'end' : 'start')
        .text((d, i) => i < entityIds.length ? entities[i][1].name : systems[i-entityIds.length][1].name);
    });
};

document.addEventListener('DOMContentLoaded', function() {
  renderEntitiesPage();
});

function renderEntitiesPage() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      const entities = Object.entries(data.dataEntities || {});
      const systems = Object.entries(data.systems || {});
      // Layout: 2/3 for chord, 1/3 for entity details
      const container = document.getElementById('entities-chord');
      if (!container) return;
      container.innerHTML = `
        <div class="row">
          <div class="col-lg-8 col-md-7 mb-3" id="chord-vis-col"></div>
          <div class="col-lg-4 col-md-5" id="entity-details-col">
            <div id="entity-details-card" class="card shadow-sm p-3"></div>
          </div>
        </div>
      `;
      renderEntitiesChordInteractive(entities, systems);
    });
}

function renderEntitiesChordInteractive(entities, systems) {
  const entityIds = entities.map(([id]) => id);
  const systemIds = systems.map(([id]) => id);
  const matrix = entityIds.map(eid => systemIds.map(sid => (systems.find(([id])=>id===sid)[1].dataEntities||[]).includes(eid) ? 1 : 0));
  const container = d3.select('#chord-vis-col');
  container.selectAll('*').remove();
  const width = container.node().clientWidth || 700;
  const height = 500;
  const innerRadius = Math.min(width, height) * 0.35;
  const outerRadius = innerRadius * 1.1;
  const svg = container.append('svg').attr('width', width).attr('height', height)
    .append('g').attr('transform', `translate(${width/2},${height/2})`);
  const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
  const chords = chord(matrix);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const ribbon = d3.ribbon().radius(innerRadius);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  // Draw entity arcs (clickable)
  svg.append('g')
    .selectAll('path')
    .data(chords.groups)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => color(d.index))
    .attr('stroke', '#fff')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      showEntityDetails(d.index, entities, systems, entityIds, systemIds, matrix);
    })
    .append('title')
    .text(d => entities[d.index][1].name);
  // Draw ribbons
  svg.append('g')
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('d', ribbon)
    .attr('fill', d => color(d.source.index))
    .attr('stroke', '#fff')
    .append('title')
    .text(d => {
      const entity = entities[d.source.index][1];
      const system = systems[d.target.index][1];
      return `${entity.name} → ${system.name}`;
    });
  // Labels
  svg.append('g')
    .selectAll('text')
    .data(chords.groups)
    .join('text')
    .attr('transform', d => {
      const angle = (d.startAngle + d.endAngle) / 2;
      const rotate = angle * 180 / Math.PI - 90;
      return `rotate(${rotate}) translate(${outerRadius + 8})${angle > Math.PI ? ' rotate(180)' : ''}`;
    })
    .attr('dy', '0.32em')
    .attr('font-size', 12)
    .attr('text-anchor', d => ((d.startAngle + d.endAngle) / 2) > Math.PI ? 'end' : 'start')
    .text((d, i) => entities[i][1].name);
  // Show first entity details by default
  showEntityDetails(0, entities, systems, entityIds, systemIds, matrix);
}

function showEntityDetails(entityIdx, entities, systems, entityIds, systemIds, matrix) {
  const entity = entities[entityIdx][1];
  const entityId = entityIds[entityIdx];
  // Find systems using this entity
  const usedBy = [];
  systems.forEach(([sid, sys], j) => {
    if ((sys.dataEntities||[]).includes(entityId)) usedBy.push(sys);
  });
  // Find journeys (other entities used by these systems)
  let journeys = [];
  usedBy.forEach(sys => {
    (sys.dataEntities||[]).forEach(eid => {
      if (eid !== entityId && !journeys.includes(eid)) journeys.push(eid);
    });
  });
  // Find entity-to-entity links (shared systems)
  let entityLinks = [];
  journeys.forEach(otherEid => {
    // For each other entity, find systems that use both
    const sharedSystems = systems.filter(([sid, sys]) => {
      const ents = sys.dataEntities||[];
      return ents.includes(entityId) && ents.includes(otherEid);
    });
    if (sharedSystems.length) {
      entityLinks.push({
        from: entityId,
        to: otherEid,
        systems: sharedSystems.map(([sid, sys]) => sys.name)
      });
    }
  });
  // Render details card
  let html = `<h4><i class="fa-solid fa-database text-primary me-2"></i>${entity.name}</h4>`;
  html += `<div class="mb-2 text-muted">${entity.description || ''}</div>`;
  // Entity-to-Entity Links first
  if (entityLinks.length) {
    html += `<div class="mt-2"><strong>Entity-to-Entity Links (shared by systems):</strong><ul>`;
    entityLinks.forEach(link => {
      html += `<li><i class="fa-solid fa-link text-info me-1"></i>${entities.find(([id])=>id===link.to)?.[1]?.name || link.to} <span class='text-muted small'>(via: ${link.systems.join(', ')})</span></li>`;
    });
    html += '</ul></div>';
  }
  // Used by systems next
  html += `<div><strong>Used by systems:</strong></div><ul>`;
  usedBy.forEach(sys => {
    html += `<li><i class="fa-solid fa-server text-success me-1"></i>${sys.name}</li>`;
  });
  html += '</ul>';
  // Other data entities last
  if (journeys.length) {
    html += `<div class="mt-2"><strong>Other data entities in these systems:</strong><ul>`;
    journeys.forEach(eid => {
      html += `<li><i class="fa-solid fa-database text-warning me-1"></i>${entities.find(([id])=>id===eid)?.[1]?.name || eid}</li>`;
    });
    html += '</ul></div>';
  }
  document.getElementById('entity-details-card').innerHTML = html;
}
