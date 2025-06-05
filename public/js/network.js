function renderNetworkGraph(container, data) {
    // Set up dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Extract nodes (systems) and links (integrations)
    const nodes = new Map();
    const links = [];
    const groups = new Map();

    // Load saved positions
    const savedPositions = JSON.parse(localStorage.getItem('networkPositions') || '{}');

    // Process systems and their integrations
    function processSystem(system, groupName) {
        if (system.systems) {
            system.systems.forEach(sys => {
                // Add node if it doesn't exist
                if (!nodes.has(sys.name)) {
                    const savedPos = savedPositions[sys.name];
                    nodes.set(sys.name, {
                        id: sys.name,
                        group: groupName,
                        technology: sys.technology,
                        status: sys.status,
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
                                technology: '',
                                status: '',
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
    }

    // Process all capabilities
    Object.entries(data.capabilities).forEach(([key, capability]) => {
        groups.set(key, capability.name);
        if (capability.children) {
            capability.children.forEach(child => {
                processSystem(child, capability.name);
            });
        } else {
            processSystem(capability, capability.name);
        }
    });

    // Create color scale for groups
    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(Array.from(groups.keys()));

    // Create force simulation
    const simulation = d3.forceSimulation(Array.from(nodes.values()))
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(50));

    // Create container for graph
    const graph = svg.append("g");

    // Add zoom behavior
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            graph.attr("transform", event.transform);
        }));

    // Create links
    const link = graph.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2);

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
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // Save positions when drag ends
        const positions = {};
        nodes.forEach(node => {
            if (node.fx !== null && node.fy !== null) {
                positions[node.id] = {
                    x: node.fx,
                    y: node.fy
                };
            }
        });
        localStorage.setItem('networkPositions', JSON.stringify(positions));
    }

    // Create nodes with enhanced drag behavior
    const node = graph.append("g")
        .selectAll("g")
        .data(Array.from(nodes.values()))
        .join("g")
        .call(drag)
        .on("dblclick", (event, d) => {
            // Double click to release fixed position
            d.fx = null;
            d.fy = null;
            simulation.alpha(0.3).restart();
            // Update saved positions
            const positions = JSON.parse(localStorage.getItem('networkPositions') || '{}');
            delete positions[d.id];
            localStorage.setItem('networkPositions', JSON.stringify(positions));
        });

    // Add circles for nodes
    node.append("circle")
        .attr("r", 8)
        .attr("fill", d => color(d.group));

    // Add labels for nodes
    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(d => d.id)
        .style("font-size", "12px");

    // Add title for hover
    node.append("title")
        .text(d => `${d.id}\nGroup: ${d.group}\nTechnology: ${d.technology}\nStatus: ${d.status}`);

    // Handle node clicks
    node.on("click", (event, d) => {
        // Find connected nodes
        const connectedLinks = links.filter(l => 
            l.source.id === d.id || l.target.id === d.id);
        
        updateDetails({
            name: d.id,
            description: `Group: ${d.group}`,
            technology: d.technology,
            status: d.status,
            relationships: connectedLinks.map(l => ({
                from: l.source.id,
                to: l.target.id,
                type: "integrates with"
            }))
        });
    });

    // Update positions on each tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });
}
