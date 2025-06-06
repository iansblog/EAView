function renderClusterDiagram(container, data) {
    // Clear container
    container.innerHTML = '';
    
    // Process capabilities into hierarchical structure with enhanced system information
    function processCapabilities(capabilities) {
        const root = {
            name: "Knight Frank Systems",
            children: []
        };
        
        Object.entries(capabilities).forEach(([key, value]) => {
            const node = {
                name: value.name,
                color: value.color || '#333',
                children: []
            };
            
            if (value.children) {
                value.children.forEach(child => {
                    const childNode = {
                        name: child.name,
                        color: child.color || value.color || '#333',
                        children: []
                    };
                    
                    if (child.systems) {
                        child.systems.forEach(system => {
                            childNode.children.push({
                                name: system.name,
                                technology: system.technology,
                                status: system.status,
                                integrates: system.integrates,
                                description: system.description,
                                owner: system.owner,
                                criticality: system.criticality,
                                annualCost: system.annualCost,
                                contractEndDate: system.contractEndDate,
                                deploymentType: system.deploymentType,
                                dataClassification: system.dataClassification,
                                supportLevel: system.supportLevel,
                                color: child.color || value.color || '#333',
                                group: child.name
                            });
                        });
                    }
                    
                    node.children.push(childNode);
                });
            }
            
            root.children.push(node);
        });
        
        return root;
    }

    const hierarchyData = processCapabilities(data.businessCapabilities);
    
    // Set up dimensions to fit container properly
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width > 0 ? containerRect.width : 800;
    const height = 580; // Fixed height to match container
    const margin = {top: 30, right: 150, bottom: 30, left: 150};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create cluster layout
    const cluster = d3.cluster()
        .size([innerHeight, innerWidth]);
    
    // Create hierarchy
    const root = d3.hierarchy(hierarchyData);
    cluster(root);
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#fafafa")
        .style("border-radius", "5px");
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add zoom and pan functionality
    const zoom = d3.zoom()
        .scaleExtent([0.3, 2])
        .on("zoom", (event) => {
            g.attr("transform", `translate(${margin.left + event.transform.x},${margin.top + event.transform.y}) scale(${event.transform.k})`);
        });
    
    svg.call(zoom);
    
    // Add links with improved styling
    g.selectAll("path.link")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr("fill", "none")
        .attr("stroke", d => d.target.data.color || "#666")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.7);
    
    // Add nodes
    const node = g.selectAll("g.node")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .style("cursor", "pointer");
    
    // Add circles for nodes with better styling
    node.append("circle")
        .attr("r", d => {
            if (d.depth === 0) return 8; // Root
            if (d.children) return 6; // Capabilities
            return 4; // Systems
        })
        .attr("fill", d => {
            if (d.depth === 0) return "#2c3e50"; // Root
            if (d.children) return d.data.color || "#3498db"; // Capabilities
            return d.data.color || "#95a5a6"; // Systems
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d.depth === 0 ? 10 : d.children ? 8 : 6);
            
            // Highlight connected paths
            g.selectAll("path.link")
                .attr("opacity", path => 
                    (path.source === d || path.target === d) ? 1 : 0.3);
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d.depth === 0 ? 8 : d.children ? 6 : 4);
            
            g.selectAll("path.link").attr("opacity", 0.7);
        })
        .on("click", handleClick);
    
    // Add labels with better positioning
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -12 : 12)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", d => {
            if (d.depth === 0) return "14px";
            if (d.children) return "12px";
            return "10px";
        })
        .style("font-weight", d => d.depth <= 1 ? "bold" : "normal")
        .style("fill", d => d.depth === 0 ? "#2c3e50" : "#333")
        .text(d => {
            // Smart text truncation
            const maxLength = d.depth === 0 ? 25 : d.children ? 18 : 15;
            return d.data.name.length > maxLength ? 
                   d.data.name.substring(0, maxLength) + "..." : 
                   d.data.name;
        })
        .clone(true).lower()
        .attr("stroke", "white")
        .attr("stroke-width", 3);
    
    // Add tooltips
    node.append("title")
        .text(d => {
            let tooltip = d.data.name;
            if (d.data.technology) tooltip += `\nTechnology: ${d.data.technology}`;
            if (d.data.status) tooltip += `\nStatus: ${d.data.status}`;
            if (d.data.owner) tooltip += `\nOwner: ${d.data.owner}`;
            if (d.children) tooltip += `\nChildren: ${d.children.length}`;
            return tooltip;
        });

    // Event handlers
    function handleClick(event, d) {
        // Create comprehensive system data for details panel
        const systemData = {
            name: d.data.name,
            description: d.data.description,
            technology: d.data.technology,
            status: d.data.status,
            owner: d.data.owner,
            criticality: d.data.criticality,
            annualCost: d.data.annualCost,
            contractEndDate: d.data.contractEndDate,
            deploymentType: d.data.deploymentType,
            dataClassification: d.data.dataClassification,
            supportLevel: d.data.supportLevel,
            group: d.data.group,
            color: d.data.color,
            integrates: d.data.integrates,
            nodeType: d.depth === 0 ? 'Root' : d.children ? 'Capability' : 'System',
            childrenCount: d.children ? d.children.length : 0,
            relationships: d.data.integrates ? d.data.integrates.map(target => ({
                from: d.data.name,
                to: target,
                type: 'integration'
            })) : []
        };
          // Use the enhanced cluster details function
        updateClusterDetails(systemData);
    }
}
