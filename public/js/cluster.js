function renderClusterDiagram(container, data) {
    // Process capabilities into hierarchical structure
    function processCapabilities(capabilities) {
        const root = {
            name: "Knight Frank Systems",
            children: []
        };
        
        Object.entries(capabilities).forEach(([key, value]) => {
            const node = {
                name: value.name,
                children: []
            };
            
            if (value.children) {
                value.children.forEach(child => {
                    const childNode = {
                        name: child.name,
                        children: []
                    };
                    
                    if (child.systems) {
                        child.systems.forEach(system => {
                            childNode.children.push({
                                name: system.name,
                                technology: system.technology,
                                status: system.status,
                                integrates: system.integrates
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
    
    const hierarchyData = processCapabilities(data.capabilities);
    
    // Set up dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = {top: 20, right: 120, bottom: 20, left: 120};
    
    // Create cluster layout
    const cluster = d3.cluster()
        .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    
    // Create hierarchy
    const root = d3.hierarchy(hierarchyData);
    cluster(root);
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add links
    svg.selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr("fill", "none")
        .attr("stroke", "#ccc");
    
    // Add nodes
    const node = svg.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // Add circles for nodes
    node.append("circle")
        .attr("r", 4)
        .attr("fill", d => d.children ? "#555" : "#999")
        .on("click", handleClick);
    
    // Add labels
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children ? -6 : 6)
        .attr("text-anchor", d => d.children ? "end" : "start")
        .text(d => d.data.name)
        .clone(true).lower()
        .attr("stroke", "white");
    
    // Event handlers
    function handleClick(event, d) {
        updateDetails({
            name: d.data.name,
            technology: d.data.technology,
            status: d.data.status,
            integrates: d.data.integrates
        });
    }
}
