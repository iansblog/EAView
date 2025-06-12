// JS for Delivery Programs page visualizations
// Only code for deliveryPrograms.html should go here

document.addEventListener('DOMContentLoaded', function() {
  fetch('/data/asis.json')
    .then(r => r.json())
    .then(data => {
      const programs = data.deliveryPrograms || {};
      const systems = data.systems || {};
      const programListDiv = document.getElementById('delivery-programs-list');
      if (!programListDiv) return;
      // Render all programs with projects as cards
      let html = '<div class="row g-4">';
      Object.entries(programs).forEach(([pid, prog], idx) => {
        const projects = prog.projects ? Object.values(prog.projects) : [];
        if (!projects.length) return; // Only show programs with projects
        html += `<div class="col-12 mb-4">
          <div class="card shadow-sm">
            <div class="card-body">
              <h3 class="mb-2">${prog.name}</h3>
              <div class="mb-2 text-muted">${prog.description || ''}</div>`;
        if (prog.sponsor) html += `<div><strong>Sponsor:</strong> ${prog.sponsor}</div>`;
        if (prog.owner) html += `<div><strong>Owner:</strong> ${prog.owner}</div>`;
        html += `<div><strong>Status:</strong> ${prog.status || 'N/A'}</div>`;
        if (prog.startDate) html += `<div><strong>Start:</strong> ${formatDate(prog.startDate)}</div>`;
        if (prog.endDate) html += `<div><strong>End:</strong> ${formatDate(prog.endDate)}</div>`;
        if (prog.budget) html += `<div><strong>Budget:</strong> £${Number(prog.budget).toLocaleString()}</div>`;
        if (prog.milestones && prog.milestones.length) {
          html += `<div class="mt-2"><strong>Milestones:</strong><ul class="mb-1">`;
          prog.milestones.forEach(m => {
            html += `<li>${m.name || ''} ${m.date ? '(' + formatDate(m.date) + ')' : ''}</li>`;
          });
          html += `</ul></div>`;
        }
        // Gantt chart for this program's projects
        html += `<div id="program-gantt-chart-${pid}" class="program-gantt-chart mt-4"></div>`;
        html += '</div></div></div>';
      });
      html += '</div>';
      programListDiv.innerHTML = html;
      // Render Gantt charts for each program
      Object.entries(programs).forEach(([pid, prog]) => {
        const projects = prog.projects ? Object.values(prog.projects) : [];
        if (!projects.length) return;
        renderProgramGanttChartForId(projects, `program-gantt-chart-${pid}`);
      });
    });
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function renderProgramGanttChartForId(projects, ganttDivId) {
  const ganttDiv = document.getElementById(ganttDivId);
  if (!ganttDiv) return;
  ganttDiv.innerHTML = '';
  if (!projects.length) {
    ganttDiv.innerHTML = '<div class="alert alert-warning">No projects found for this program.</div>';
    return;
  }
  // Split projects into those with and without end dates
  const withEnd = [], inPlanning = [];
  projects.forEach(proj => {
    if (proj.endDate) withEnd.push(proj);
    else inPlanning.push(proj);
  });  // Prepare data for Gantt (only those with valid start and end dates)
  const bars = withEnd
    .map((proj, index) => {
      const start = proj.startDate ? new Date(proj.startDate) : null;
      const end = proj.endDate ? new Date(proj.endDate) : null;
      if (!start || isNaN(start) || !end || isNaN(end)) return null;
      
      // Debug info on project data structure
      console.log(`Project ${index}:`, {
        name: proj.name,
        status: proj.status,
        startDate: proj.startDate,
        endDate: proj.endDate,
        id: proj.id || `project-${index}`
      });
      // Create a new object with all original properties
      // We need to handle the possibility of duplicate names
      const barData = {
        ...proj,  // First copy all original properties
        id: proj.id || `project-${index}`, // Keep unique ID for internal use
        start: start,  // Add formatted date objects
        end: end,
        // Add display name if needed (for future use)
        displayName: proj.name
      };
      
      return barData;
    })
    .filter(Boolean);
  console.log('Gantt bars:', bars);
  // Responsive width: use parent card's width, max 100%
  const card = ganttDiv.closest('.card');
  let width = 700;
  if (card) {
    width = card.clientWidth - 32; // account for card padding
    if (width < 400) width = 400;
  } else {
    width = ganttDiv.clientWidth || 700;
  }
  const height = Math.max(bars.length * 32 + 60, 200);
  const margin = { top: 80, right: 40, bottom: 40, left: 180 };

  // Color by status (updated to include all possible statuses)
  const statusColor = {
    'Planning': '#FFD700',
    'InProgress': '#3498DB',
    'Completed': '#50C878',
    'OnHold': '#F39C12',
    'Cancelled': '#B2BABB'
  };

  // Add color key above chart (updated for all statuses)
  let keyHtml = `<div class='d-flex align-items-center gap-3 mb-2' style='flex-wrap:wrap;'>`;
  Object.entries(statusColor).forEach(([status, color]) => {
    keyHtml += `<span class='d-flex align-items-center me-3'><span style='display:inline-block;width:18px;height:18px;background:${color};border-radius:3px;border:1px solid #ccc;margin-right:6px;'></span><span style='font-size:0.95em;'>${status}</span></span>`;
  });
  keyHtml += `</div>`;
  ganttDiv.insertAdjacentHTML('beforeend', keyHtml);

  const svg = d3.select(ganttDiv).append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMin meet');
  // X scale (time)
  const minDate = d3.min(bars, d => d.start);
  const maxDate = d3.max(bars, d => d.end);
  const x = d3.scaleTime().domain([minDate, maxDate]).range([margin.left, width - margin.right]);  // Y scale (projects) - always use name for display but id for positioning
  // Use names for y-axis display but keep unique IDs for positioning
  const yDomain = bars.map(d => d.name);
  // Debug Y domain to see if there are duplicates
  console.log('Y domain:', yDomain);
  const y = d3.scaleBand().domain(yDomain).range([margin.top, height - margin.bottom]).padding(0.2);
  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${margin.top - 10})`)
    .call(d3.axisTop(x).ticks(width/120).tickFormat(d3.timeFormat('%b %Y')));
  // Y axis
  svg.append('g')
    .attr('transform', `translate(${margin.left - 10},0)`)
    .call(d3.axisLeft(y));  // Bars - create a group for each bar with text and rect
  const barGroups = svg.selectAll('.bar-group')
    .data(bars)
    .join('g')
    .attr('class', d => `bar-group bar-${d.status}`)
    .on('click', function(event, d) {
      console.log('Bar group clicked:', d.name, d.status);
      showProjectDetails(d);
    });
      // Add the rectangle bars
  barGroups.append('rect')
    .attr('x', d => x(d.start))
    .attr('y', d => y(d.name))
    .attr('width', d => {
      const w = x(d.end) - x(d.start);
      // Ensure minimum width of 20px for better clickability
      return Math.max(w, 20); 
    })
    .attr('height', y.bandwidth())
    .attr('fill', d => statusColor[d.status] || '#bbb')
    .attr('stroke', '#444')
    .attr('stroke-width', 0.5)
    .attr('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Highlight on hover to see which bars are interactive
      d3.select(this).attr('stroke-width', 2).attr('stroke', '#000');
      console.log('Bar hovered:', d.name, d.status);
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#444');
    });
      // Add transparent click overlay to ensure clickability
  barGroups.append('rect')
    .attr('x', d => x(d.start))
    .attr('y', d => y(d.name))
    .attr('width', d => {
      const w = x(d.end) - x(d.start);
      // Ensure minimum width of 20px for clickable area
      return Math.max(w, 20); 
    })
    .attr('height', y.bandwidth())
    .attr('fill', 'transparent')
    .attr('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this.parentNode).select('rect').attr('stroke-width', 2).attr('stroke', '#000');
    })
    .on('mouseout', function() {
      d3.select(this.parentNode).select('rect').attr('stroke-width', 0.5).attr('stroke', '#444');
    });  // Labels - add to bar groups
  barGroups.append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.start) + 4)
    .attr('y', d => y(d.name) + y.bandwidth()/2 + 5)
    .attr('font-size', 12)
    .attr('fill', '#fff')
    .attr('pointer-events', 'none') // Ensure text doesn't interfere with clicks
    .text(d => d.name);
  // Add subtle border and background to Gantt chart
  d3.select(ganttDiv).select('svg')
    .style('background', '#f8f9fa')
    .style('border-radius', '0.5rem')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.04)');
  // Add 'In Planning' section below the Gantt chart for projects without end dates
  if (inPlanning.length) {
    const planningHtml = `
      <div class="mt-3">
        <div class="alert alert-warning mb-2"><strong>In Planning:</strong> The following projects do not have a delivery window.</div>
        <ul class="list-group">
          ${inPlanning.map(p => `<li class='list-group-item d-flex justify-content-between align-items-center' style='background:#fffbe6;'>
            <span><strong>${p.name}</strong> <span class='text-muted small'>${p.description || ''}</span></span>
            <span class='badge bg-warning text-dark'>No Delivery Window</span>
          </li>`).join('')}
        </ul>
      </div>
    `;
    ganttDiv.insertAdjacentHTML('beforeend', planningHtml);
  }
}

function showProjectDetails(project) {
  const sidebar = document.getElementById('project-details');
  if (!sidebar) return;
  
  // For debugging
  console.log('Project clicked:', project);
  
  let html = `<div class="card shadow-sm"><div class="card-body">
    <h4>${project.name}</h4>`;
  html += `<div class="mb-2 text-muted">${project.description || ''}</div>`;
  html += `<div><strong>Owner:</strong> ${project.owner || 'N/A'}</div>`;
  html += `<div><strong>Status:</strong> ${project.status || 'N/A'}</div>`;
  html += `<div><strong>Criticality:</strong> ${project.criticality || 'N/A'}</div>`;
    // Use either start/end or startDate/endDate properties (whichever is available)
  // Print all date-related properties to debug
  console.log('Date properties:', {
    start: project.start,
    end: project.end,
    startDate: project.startDate,
    endDate: project.endDate
  });
  
  const startDate = project.start || project.startDate;
  const endDate = project.end || project.endDate;
  
  html += `<div><strong>Start:</strong> ${startDate ? formatDate(startDate instanceof Date ? startDate.toISOString() : startDate) : 'N/A'}</div>`;
  html += `<div><strong>End:</strong> ${endDate ? formatDate(endDate instanceof Date ? endDate.toISOString() : endDate) : 'N/A'}</div>`;
  
  if (project.cost) html += `<div><strong>Cost:</strong> £${Number(project.cost).toLocaleString()}</div>`;
  html += '</div></div>';
  sidebar.innerHTML = html;
}

// Add style for active program highlight
const style = document.createElement('style');
style.innerHTML = `.program-list-item.active-program { background: #e3e9f7 !important; border-left: 4px solid #375a9e; font-weight: 600; }`;
document.head.appendChild(style);
