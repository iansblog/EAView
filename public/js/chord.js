function renderChordDiagram(container, data) {
    // Extract entities and their relationships
    const entities = Object.keys(data.sharedEntities);
    const matrix = [];
    const relationships = new Set();
    
    // Initialize matrix
    entities.forEach(() => {
        matrix.push(new Array(entities.length).fill(0));
    });
    
    // Populate matrix with relationships
    function addRelationship(source, target) {
        const sourceIndex = entities.indexOf(source);
        const targetIndex = entities.indexOf(target);
        if (sourceIndex !== -1 && targetIndex !== -1) {
            matrix[sourceIndex][targetIndex] += 1;
            relationships.add(`${source}-${target}`);
        }
    }
    
    // Process relationships from shared entities
    entities.forEach(entity => {
        const entityData = data.sharedEntities[entity];
        entityData.relationships.forEach(rel => {
            addRelationship(entity, rel);
        });
    });
    
    // Set up dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) * 0.4;
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);
    
    // Create chord layout
    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);
    
    const chordData = chord(matrix);
    
    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(entities)
        .range(d3.schemeCategory10);
    
    // Create groups
    const group = svg.append("g")
        .selectAll("g")
        .data(chordData.groups)
        .join("g");
    
    // Add arcs
    group.append("path")
        .attr("fill", d => color(entities[d.index]))
        .attr("d", d3.arc()
            .innerRadius(radius - 20)
            .outerRadius(radius))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick);
    
    // Add labels
    group.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${radius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => entities[d.index]);
    
    // Add chords
    svg.append("g")
        .attr("fill-opacity", 0.67)
        .selectAll("path")
        .data(chordData)
        .join("path")
        .attr("d", d3.ribbon()
            .radius(radius - 20))
        .attr("fill", d => color(entities[d.source.index]))
        .attr("stroke", d => d3.rgb(color(entities[d.source.index])).darker());
    
    // Event handlers
    function handleMouseOver(event, d) {
        d3.select(this).attr("opacity", 0.8);
    }
    
    function handleMouseOut(event, d) {
        d3.select(this).attr("opacity", 1);
    }
      function handleClick(event, d) {
        const entityName = entities[d.index];
        const entityData = data.sharedEntities[entityName];
          // Find systems and capabilities that use this entity
        const usingSystems = [];
        const usingCapabilities = [];
        
        // Search through all capabilities and their children
        function searchForEntity(obj, path = []) {
            if (obj.systems) {
                obj.systems.forEach(system => {
                    // Check if system integrates with other systems that might use this entity
                    if (system.integrates && system.integrates.some(integration => 
                        integration.toLowerCase().includes(entityName.toLowerCase()))) {
                        usingSystems.push({
                            name: system.name,
                            path: path.join(' > '),
                            technology: system.technology,
                            status: system.status
                        });
                    }
                    
                    // Check if system name or description mentions the entity
                    if (system.name.toLowerCase().includes(entityName.toLowerCase()) ||
                        (system.description && system.description.toLowerCase().includes(entityName.toLowerCase()))) {
                        usingSystems.push({
                            name: system.name,
                            path: path.join(' > '),
                            technology: system.technology,
                            status: system.status
                        });
                    }
                });
            }
            
            if (obj.dataModels) {
                obj.dataModels.forEach(model => {
                    if (model.entities && model.entities.includes(entityName)) {
                        usingSystems.push({
                            name: model.name + ' (Data Model)',
                            path: path.join(' > '),
                            technology: 'Data Model',
                            status: 'Active'
                        });
                    }
                });
            }
            
            if (obj.children) {
                obj.children.forEach(child => {
                    searchForEntity(child, [...path, child.name]);
                });
            }
        }
        
        // Search through business capabilities
        if (data.businessCapabilities) {
            Object.entries(data.businessCapabilities).forEach(([key, capability]) => {
                usingCapabilities.push(capability.name);
                searchForEntity(capability, [capability.name]);
            });
        }
        
        // Search through EA capabilities
        if (data.capabilities) {
            Object.entries(data.capabilities).forEach(([key, capability]) => {
                if (!usingCapabilities.includes(capability.name)) {
                    usingCapabilities.push(capability.name);
                }
                searchForEntity(capability, [capability.name]);
            });
        }
        
        updateEntityDetails({
            name: entityName,
            description: entityData.description,
            icon: entityData.icon,
            color: entityData.color,
            attributes: entityData.attributes,
            relationships: entityData.relationships.map(rel => ({
                from: entityName,
                to: rel,
                type: "relates to"
            })),
            usingSystems: usingSystems,
            usingCapabilities: usingCapabilities.filter(cap => cap) // Remove undefined values
        });
    }
}
