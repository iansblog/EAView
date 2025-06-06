function renderNetworkGraph(container, data) {
    console.log('renderNetworkGraph called with:', { container, data });
    
    // Clear container first to prevent multiple SVGs
    container.innerHTML = '';
      // Set up dimensions
    const width = container.clientWidth || 800;
    const height = Math.max(container.clientHeight, 600); // Ensure minimum height
    
    console.log('Container dimensions:', { width, height });
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);// Extract nodes (systems) and links (integrations)
    const nodes = new Map();
    const links = [];
    const groups = new Map();
    
    // Load saved positions
    const savedPositions = JSON.parse(localStorage.getItem('networkPositions') || '{}');
    console.log('Loaded saved positions:', savedPositions);    // Process systems and their integrations
    function processSystem(system, groupName, groupColor) {
        console.log('processSystem called with:', { system: system.name, groupName, systemsCount: system.systems?.length });
        
        if (system.systems) {
            system.systems.forEach(sys => {
                console.log('Processing system:', sys.name, 'integrates with:', sys.integrates);
                // Add node if it doesn't exist
                if (!nodes.has(sys.name)) {
                    const savedPos = savedPositions[sys.name];
                    nodes.set(sys.name, {
                        id: sys.name,
                        group: groupName,
                        groupColor: groupColor,
                        technology: sys.technology || '',
                        status: sys.status || '',
                        description: sys.description || '',
                        owner: sys.owner || '',
                        criticality: sys.criticality || '',
                        annualCost: sys.annualCost || '',
                        contractEndDate: sys.contractEndDate || '',
                        deploymentType: sys.deploymentType || '',
                        dataClassification: sys.dataClassification || '',
                        supportLevel: sys.supportLevel || '',
                        country: sys.country || '',
                        // Restore saved position if available
                        x: savedPos ? savedPos.x : null,
                        y: savedPos ? savedPos.y : null,
                        fx: savedPos ? savedPos.x : null,
                        fy: savedPos ? savedPos.y : null
                    });
                }

                if (sys.integrates) {
                    sys.integrates.forEach(target => {
                        // Add target node if it doesn't exist
                        if (!nodes.has(target)) {
                            const savedPos = savedPositions[target];
                            nodes.set(target, {
                                id: target,
                                group: 'Integration Target',
                                groupColor: '#999999',
                                technology: '',
                                status: '',
                                description: 'External integration target',
                                // Restore saved position if available
                                x: savedPos ? savedPos.x : null,
                                y: savedPos ? savedPos.y : null,
                                fx: savedPos ? savedPos.x : null,
                                fy: savedPos ? savedPos.y : null
                            });
                        }

                        // Add link
                        links.push({
                            source: sys.name,
                            target: target,
                            value: 1
                        });
                    });
                }
            });
        }
    }    // Process all capabilities from both businessCapabilities and capabilities
    console.log('Processing data structure:', data);
      if (data.businessCapabilities) {
        console.log('Found businessCapabilities:', Object.keys(data.businessCapabilities));
        Object.entries(data.businessCapabilities).forEach(([key, capability]) => {
            groups.set(key, capability.name);
            if (capability.children) {
                capability.children.forEach(child => {
                    console.log('Processing child:', child.name, 'with systems:', child.systems?.length || 0);
                    processSystem(child, capability.name, capability.color || '#6c757d');
                });
            } else {
                console.log('Processing capability directly:', capability.name);
                processSystem(capability, capability.name, capability.color || '#6c757d');
            }
        });
    }
    
    if (data.capabilities) {
        console.log('Found capabilities:', Object.keys(data.capabilities));
        Object.entries(data.capabilities).forEach(([key, capability]) => {
            if (!groups.has(key)) {
                groups.set(key, capability.name);
            }
            if (capability.children) {
                capability.children.forEach(child => {
                    processSystem(child, capability.name, capability.color || '#4A90E2');
                });
            } else {
                processSystem(capability, capability.name, capability.color || '#4A90E2');
            }
        });
    }
      console.log('Final nodes count:', nodes.size);
    console.log('Final links count:', links.length);
    
    // If no nodes, show error
    if (nodes.size === 0) {
        container.innerHTML = '<div class="alert alert-warning">No systems found in the data structure</div>';
        return;
    }

    // Create color scale for groups
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(Array.from(groups.keys()));    // Create force simulation
    const simulation = d3.forceSimulation(Array.from(nodes.values()))
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(50));    // Function to save positions (defined early so it can be used in drag functions)
    function savePositions() {
        const positions = {};
        nodes.forEach(node => {
            if (node.x !== undefined && node.y !== undefined) {
                positions[node.id] = {
                    x: node.x,
                    y: node.y
                };
            }
        });
        localStorage.setItem('networkPositions', JSON.stringify(positions));
        console.log('Saved positions:', positions);
        
        // Show visual indicator if available
        if (window.showPositionSaved) {
            window.showPositionSaved();
        }
        
        return positions;
    }

    // Create container for graph
    const graph = svg.append("g");

    // Add zoom behavior
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            graph.attr("transform", event.transform);
        }));    // Create links
    const link = graph.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .attr("class", "network-link");

    // Create nodes with drag behavior
    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // Fix the node position after drag
        d.fx = d.x;
        d.fy = d.y;
        // Save positions when drag ends
        savePositions();
    }

    // Create nodes with enhanced drag behavior
    const node = graph.append("g")
        .selectAll("g")
        .data(Array.from(nodes.values()))
        .join("g")
        .call(drag)        .on("dblclick", (event, d) => {
            // Double click to release fixed position
            d.fx = null;
            d.fy = null;
            simulation.alpha(0.3).restart();
            // Update saved positions by removing this node
            const positions = JSON.parse(localStorage.getItem('networkPositions') || '{}');
            delete positions[d.id];
            localStorage.setItem('networkPositions', JSON.stringify(positions));
            console.log('Released position for:', d.id);
        });// Add circles for nodes with group colors
    node.append("circle")
        .attr("r", 8)
        .attr("fill", d => d.groupColor || color(d.group))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("class", "network-node");

    // Add labels for nodes
    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(d => d.id)
        .style("font-size", "12px");

    // Add title for hover
    node.append("title")
        .text(d => `${d.id}\nGroup: ${d.group}\nTechnology: ${d.technology}\nStatus: ${d.status}`);    // Handle node clicks
    node.on("click", (event, d) => {
        // Find connected nodes
        const connectedLinks = links.filter(l => 
            l.source.id === d.id || l.target.id === d.id);
        
        updateSystemDetails({
            name: d.id,
            description: d.description,
            group: d.group,
            technology: d.technology,
            status: d.status,
            owner: d.owner,
            criticality: d.criticality,
            annualCost: d.annualCost,
            contractEndDate: d.contractEndDate,
            deploymentType: d.deploymentType,
            dataClassification: d.dataClassification,
            supportLevel: d.supportLevel,
            country: d.country,
            relationships: connectedLinks.map(l => ({
                from: l.source.id,
                to: l.target.id,
                type: "integrates with"
            }))
        });
    });    // Update positions on each tick and handle auto-save
    let lastSaveTime = 0;
    simulation.on("tick", () => {
        // Update link positions
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Update node positions
        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
            
        // Auto-save positions periodically (every 5 seconds when positions change)
        const now = Date.now();
        if (now - lastSaveTime > 5000) { // Save every 5 seconds
            const hasFixedNodes = Array.from(nodes.values()).some(n => n.fx !== null && n.fy !== null);
            if (hasFixedNodes) {
                savePositions();
                lastSaveTime = now;
            }
        }
    });
    
    // Restore positions after initial simulation stabilizes
    simulation.on("end", () => {
        // Apply saved positions and fix nodes that have saved positions
        nodes.forEach(node => {
            const savedPos = savedPositions[node.id];
            if (savedPos) {
                node.x = savedPos.x;
                node.y = savedPos.y;
                node.fx = savedPos.x;
                node.fy = savedPos.y;
            }
        });
        // Restart simulation briefly to apply positions
        simulation.alpha(0.1).restart();    });
    
    // Save positions when the page is about to unload
    window.addEventListener('beforeunload', function() {
        savePositions();
    });
    
    // Expose save function globally
    window.saveNetworkPositions = savePositions;
}
