// EA Report Visualization Logic

// Main function to load and render the EA report
async function loadAndRenderEAReport() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`data/asis.json?_=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        renderMetadata(data.metadata);
        renderCapabilities(data.businessCapabilities);
        renderSystemsLandscape(data.systems);
        renderPlatformDistribution(data.platforms);
        renderDataRelationships(data.dataEntities);
        renderDeliveryTimeline(data.deliveryPrograms);    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelectorAll('.card-body').forEach(el => {
            // Show a more user-friendly error message
            let errorMessage = 'An error occurred while loading the data. ';
            if (error.message.includes('node not found')) {
                errorMessage += 'Some referenced data entities could not be found. This might be because the data is still being populated or there are missing relationships.';
            } else {
                errorMessage += error.message;
            }
            el.innerHTML = '<div class="alert alert-danger">' + errorMessage + '</div>';
        });
    }
}

// Render metadata section
function renderMetadata(metadata) {
    const container = document.getElementById('metadata-content');
    const html = `
        <div class="row">
            <div class="col-md-6">
                <h3 class="h6">Organisation</h3>
                <p><strong>${metadata.organisation.name}</strong><br>
                ${metadata.organisation.division}<br>
                Region: ${metadata.organisation.region}</p>
                
                <h3 class="h6">Contact</h3>
                <p>Team: ${metadata.contact.team}<br>
                Lead: ${metadata.contact.primaryArchitect}<br>
                Email: ${metadata.contact.email}</p>
            </div>
            <div class="col-md-6">
                <h3 class="h6">Governance</h3>
                <p>Review Cycle: ${metadata.governance.reviewCycle}<br>
                Next Review: ${new Date(metadata.governance.nextReviewDate).toLocaleDateString()}</p>
                
                <h3 class="h6">Framework</h3>
                <p>${metadata.framework.name} v${metadata.framework.version}</p>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Render business capabilities visualization
function renderCapabilities(capabilities) {
    const treeContainer = document.getElementById('capabilities-tree');
    const coverageContainer = document.getElementById('capabilities-coverage');
    
    // Create hierarchical tree visualization using D3.js
    const width = treeContainer.clientWidth;
    const height = 400;
    
    // Transform capabilities data into hierarchical structure
    const hierarchy = d3.hierarchy(transformCapabilitiesToHierarchy(capabilities));
    
    const treeLayout = d3.tree()
        .size([height, width - 100]);
    
    const root = treeLayout(hierarchy);
    
    const svg = d3.select('#capabilities-tree')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(50,0)');
    
    // Add links
    svg.selectAll('path.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
    
    // Add nodes
    const nodes = svg.selectAll('g.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    nodes.append('circle')
        .attr('r', 4);
    
    nodes.append('text')
        .attr('dx', d => d.children ? -8 : 8)
        .attr('dy', 3)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name);
}

// Helper function to transform capabilities into hierarchical structure
function transformCapabilitiesToHierarchy(capabilities) {
    if (!capabilities || Object.keys(capabilities).length === 0) {
        return {
            name: 'Enterprise',
            children: [{
                name: 'No capabilities defined',
                children: []
            }]
        };
    }

    const root = {
        name: 'Enterprise',
        children: []
    };
    
    // First pass: create nodes
    const nodes = {};
    Object.entries(capabilities).forEach(([id, cap]) => {
        nodes[id] = {
            name: cap.name || 'Unnamed Capability',
            children: []
        };
    });
    
    // Second pass: build hierarchy
    Object.entries(capabilities).forEach(([id, cap]) => {
        if (cap.parentId) {
            nodes[cap.parentId].children.push(nodes[id]);
        } else {
            root.children.push(nodes[id]);
        }
    });
    
    return root;
}

// Render systems landscape visualization
function renderSystemsLandscape(systems) {
    const container = document.getElementById('systems-landscape');
    const width = container.clientWidth;
    const height = 400;
    
    const svg = d3.select('#systems-landscape')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create force-directed graph
    const nodes = Object.entries(systems).map(([id, sys]) => ({
        id,
        name: sys.name,
        group: sys.platformId
    }));
    
    const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    node.append('circle')
        .attr('r', 20)
        .attr('fill', d => color(d.group));
    
    node.append('text')
        .text(d => d.name)
        .attr('x', 0)
        .attr('y', 30);
    
    simulation.on('tick', () => {
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
}

// Render platform distribution
function renderPlatformDistribution(platforms) {
    const container = document.getElementById('platform-distribution');
    const width = container.clientWidth;
    const height = 300;
    
    const data = Object.entries(platforms).map(([id, platform]) => ({
        name: platform.name,
        value: platform.systemIds.length
    }));
    
    const pie = d3.pie()
        .value(d => d.value);
    
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(Math.min(width, height) / 2 - 1);
    
    const svg = d3.select('#platform-distribution')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2},${height/2})`);
    
    const arcs = pie(data);
    
    svg.selectAll('path')
        .data(arcs)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => d3.schemeCategory10[i]);
    
    // Add labels
    svg.selectAll('text')
        .data(arcs)
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(d => d.data.name);
}

// Render data relationships
function renderDataRelationships(dataEntities) {
    const container = document.getElementById('data-relationships');
    const width = container.clientWidth;
    const height = 400;
      // Create nodes array with validation
    const nodes = Object.entries(dataEntities).map(([id, entity]) => ({
        id,
        name: entity.name,
        group: entity.groupId || 'default'
    }));
    
    // Create links array with validation
    const links = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    
    Object.entries(dataEntities).forEach(([id, entity]) => {
        if (entity.relationships) {
            entity.relationships.forEach(rel => {
                // Only add links where both source and target exist
                if (nodeIds.has(id) && nodeIds.has(rel.targetEntityId)) {
                    links.push({
                        source: id,
                        target: rel.targetEntityId,
                        type: rel.type
                    });
                }
            });
        }
    });
    
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));
    
    const svg = d3.select('#data-relationships')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.6);
    
    const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', 5)
        .attr('fill', d => color(d.group));
    
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    });
}

// Render delivery timeline
function renderDeliveryTimeline(programs) {
    const container = document.getElementById('delivery-timeline');
    const margin = {top: 20, right: 30, bottom: 30, left: 100};
    const width = container.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    
    const programData = Object.values(programs);
    
    const timeExtent = d3.extent([
        ...programData.map(p => new Date(p.startDate)),
        ...programData.map(p => new Date(p.endDate))
    ]);
    
    const x = d3.scaleTime()
        .domain(timeExtent)
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(programData.map(d => d.name))
        .range([0, height])
        .padding(0.1);
    
    const svg = d3.select('#delivery-timeline')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Add bars
    svg.selectAll('rect')
        .data(programData)
        .enter()
        .append('rect')
        .attr('y', d => y(d.name))
        .attr('x', d => x(new Date(d.startDate)))
        .attr('width', d => x(new Date(d.endDate)) - x(new Date(d.startDate)))
        .attr('height', y.bandwidth())
        .attr('fill', '#4A90E2');
}

// Color scale for visualizations
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Initialize the report when includes are loaded
document.addEventListener('includesLoaded', function() {
    loadAndRenderEAReport();
});

// Fallback initialization
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (!window.includesLoadedDispatched) {
            document.dispatchEvent(new Event('includesLoaded'));
        }
    }, 500);
});
