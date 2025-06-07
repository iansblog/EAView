// Function to extract systems data from the business capabilities JSON
function extractSystemsData(data) {
    const systems = [];
    
    function traverseCapabilities(node) {
        if (node.systems) {
            node.systems.forEach(system => {
                if (system.contractStartDate && system.contractEndDate) {
                    systems.push({
                        ...system,
                        parent: node.name
                    });
                }
            });
        }
        if (node.children) {
            node.children.forEach(child => traverseCapabilities(child));
        }
    }
    
    Object.values(data.businessCapabilities).forEach(capability => {
        traverseCapabilities(capability);
    });
    
    return systems;
}

// Function to determine status color based on remaining time
function getStatusColor(startDate, endDate) {
    const today = new Date('2025-06-06'); // Current date from context
    const contractEnd = new Date(endDate);
    const monthsRemaining = (contractEnd - today) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsRemaining <= 6) {
        return '#dc3545'; // Red - 6 months or less
    } else if (monthsRemaining <= 12) {
        return '#ffc107'; // Amber - 6-12 months
    } else {
        return '#28a745'; // Green - more than 12 months
    }
}

// Global variables for filtered data
let allSystems = [];
let filteredSystems = [];

// Filter functions
function filterSystems() {
    const statusFilter = document.getElementById('statusFilter').value;
    const criticalityFilter = document.getElementById('criticalityFilter').value;
    const contractFilter = document.getElementById('contractFilter').value;
    const searchText = document.getElementById('searchFilter').value.toLowerCase();
    const today = new Date('2025-06-06');

    filteredSystems = allSystems.filter(system => {
        const matchesStatus = statusFilter === 'all' || system.status === statusFilter;
        const matchesCriticality = criticalityFilter === 'all' || system.criticality === criticalityFilter;
        const matchesSearch = searchText === '' || 
            system.name.toLowerCase().includes(searchText) ||
            (system.description && system.description.toLowerCase().includes(searchText));
        
        // Contract status filtering
        const endDate = new Date(system.contractEndDate);
        const monthsUntilEnd = (endDate - today) / (1000 * 60 * 60 * 24 * 30);
        
        const matchesContract = contractFilter === 'all' ||
            (contractFilter === 'ending-6' && monthsUntilEnd <= 6) ||
            (contractFilter === 'ending-12' && monthsUntilEnd <= 12) ||
            (contractFilter === 'active' && new Date(system.contractEndDate) > today);

        return matchesStatus && matchesCriticality && matchesSearch && matchesContract;
    });

    // Re-render the chart with filtered data
    const viz = document.getElementById('visualization');
    viz.innerHTML = '';
    renderGanttChart(viz, filteredSystems);
}

// Function to render the Gantt chart
function renderGanttChart(container, systems) {
    // Store all systems on first render
    if (allSystems.length === 0) {
        allSystems = [...systems];
        filteredSystems = [...systems];
        
        // Add filter event listeners
        document.getElementById('statusFilter').addEventListener('change', filterSystems);
        document.getElementById('criticalityFilter').addEventListener('change', filterSystems);
        document.getElementById('contractFilter').addEventListener('change', filterSystems);
        document.getElementById('searchFilter').addEventListener('input', filterSystems);
    }

    // Sort systems by start date
    systems.sort((a, b) => new Date(a.contractStartDate) - new Date(b.contractStartDate));
    
    // Set up dimensions
    const margin = {top: 40, right: 40, bottom: 60, left: 200};
    const width = container.clientWidth - margin.left - margin.right;
    const barHeight = 30;
    const height = systems.length * (barHeight + 10) + margin.top + margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height);
    
    // Create tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'tooltip');
    
    // Set up scales
    const timeScale = d3.scaleTime()
        .domain([
            d3.min(systems, d => new Date(d.contractStartDate)),
            d3.max(systems, d => new Date(d.contractEndDate))
        ])
        .range([0, width]);
    
    const yScale = d3.scaleBand()
        .domain(systems.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);
    
    // Create chart group
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},0)`);
    
    // Add grid lines
    g.append('g')
        .attr('class', 'gantt-grid')
        .attr('transform', `translate(0,${margin.top})`)
        .call(d3.axisBottom(timeScale)
            .ticks(d3.timeMonth.every(3))
            .tickSize(height - margin.top - margin.bottom)
            .tickFormat('')
        );
    
    // Add x-axis
    g.append('g')
        .attr('class', 'gantt-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(timeScale)
            .ticks(d3.timeMonth.every(3))
            .tickFormat(d3.timeFormat('%b %Y')))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    // Add y-axis
    g.append('g')
        .attr('class', 'gantt-axis')
        .call(d3.axisLeft(yScale));
      // Add today line
    const today = new Date('2025-06-06');
    if (today >= timeScale.domain()[0] && today <= timeScale.domain()[1]) {
        g.append('line')
            .attr('class', 'today-line')
            .attr('x1', timeScale(today))
            .attr('x2', timeScale(today))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', '#ff0000')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');
        
        // Add "Today" label
        g.append('text')
            .attr('class', 'today-label')
            .attr('x', timeScale(today))
            .attr('y', margin.top - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ff0000')
            .text('Today');
    }

    // Add bars
    g.selectAll('.gantt-bar')
        .data(systems)
        .enter()
        .append('rect')
        .attr('class', 'gantt-bar')
        .attr('x', d => timeScale(new Date(d.contractStartDate)))
        .attr('y', d => yScale(d.name))
        .attr('width', d => timeScale(new Date(d.contractEndDate)) - timeScale(new Date(d.contractStartDate)))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => getStatusColor(d.contractStartDate, d.contractEndDate))
        .on('mouseover', function(event, d) {
            tooltip.style('display', 'block')
                .html(`
                    <strong>${d.name}</strong><br>
                    Start: ${d.contractStartDate}<br>
                    End: ${d.contractEndDate}<br>
                    Status: ${d.status}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            tooltip.style('display', 'none');
        })
        .on('click', function(event, d) {
            updateSystemDetails(d);
        });
}

// Function to update system details panel
function updateSystemDetails(system) {
    const detailContent = document.getElementById('detail-content');
    
    const statusClass = system.status === 'Production' ? 'bg-success' : 
                       system.status === 'Development' ? 'bg-warning text-dark' : 'bg-secondary';
    
    const criticalityClass = system.criticality === 'Critical' ? 'bg-danger' : 
                            system.criticality === 'High' ? 'bg-warning text-dark' : 'bg-secondary';
    
    detailContent.innerHTML = `
        <h6 class="mb-3">${system.name}</h6>
        <p class="text-muted">${system.description || 'No description available'}</p>
        
        <div class="mb-3">
            <span class="badge ${statusClass} me-2">${system.status}</span>
            <span class="badge ${criticalityClass}">${system.criticality}</span>
        </div>
        
        <div class="mb-3">
            <p class="mb-1"><strong>Technology:</strong> ${system.technology}</p>
            <p class="mb-1"><strong>Owner:</strong> ${system.owner}</p>
            <p class="mb-1"><strong>Support Level:</strong> ${system.supportLevel}</p>
            <p class="mb-1"><strong>Annual Cost:</strong> ${system.annualCost}</p>
        </div>
        
        <div class="alert alert-info">
            <strong>Contract Period:</strong><br>
            ${system.contractStartDate} to ${system.contractEndDate}
        </div>
        
        ${system.integrates ? `
            <div class="mt-3">
                <h6 class="mb-2">Integrations:</h6>
                <div class="d-flex flex-wrap gap-1">
                    ${system.integrates.map(int => 
                        `<span class="badge bg-secondary">${int}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Add window resize handler
window.addEventListener('resize', function() {
    // Debounce the resize event
    if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(function() {
        const viz = document.getElementById('visualization');
        viz.innerHTML = '';
        loadAndRenderGantt();
    }, 250);
});
