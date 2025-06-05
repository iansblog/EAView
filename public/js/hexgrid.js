function renderCapabilityHexGrid(container, data) {
    // Clear container
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    // Define EA layers
    const layers = {
        strategic: { 
            name: "Strategic Layer", 
            color: "#34495E"
        },
        business: { 
            name: "Business Layer", 
            color: "#E74C3C"
        },
        application: { 
            name: "Application Layer", 
            color: "#3498DB"
        },
        technology: { 
            name: "Technology Layer", 
            color: "#27AE60"
        }
    };

    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", container.clientWidth)
        .attr("height", container.clientHeight);

    // Main group for all content
    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process capabilities into blocks
    const capabilities = Object.entries(data.capabilities).map(([key, value]) => ({
        id: key,
        name: value.name,
        icon: value.icon || 'fa-cube',
        description: value.description || '',
        children: value.children || [],
        layer: key === 'systemOfSystems' ? 'strategic' :
               key === 'userInterfaces' ? 'application' :
               key === 'integration' ? 'technology' :
               'business'
    }));

    // Layout blocks in two columns
    const blockSpacing = 30;
    const blockWidth = (width - blockSpacing) / 2;
    const blocksPerRow = 2;
    const blockHeight = 300; // Fixed height for blocks

    // Create blocks for capabilities
    capabilities.forEach((cap, i) => {
        const col = i % blocksPerRow;
        const row = Math.floor(i / blocksPerRow);
        const x = col * (blockWidth + blockSpacing);
        const y = row * (blockHeight + blockSpacing);

        // Create block container
        const block = mainGroup.append("g")
            .attr("class", "capability-block")
            .attr("transform", `translate(${x},${y})`);

        // Add block background
        block.append("rect")
            .attr("width", blockWidth)
            .attr("height", blockHeight)
            .attr("rx", 8)
            .attr("fill", "#ffffff")
            .attr("stroke", layers[cap.layer].color)
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

        // Add block header
        const headerHeight = 40;
        const header = block.append("g")
            .attr("class", "block-header");

        header.append("rect")
            .attr("width", blockWidth)
            .attr("height", headerHeight)
            .attr("rx", 8)
            .attr("fill", layers[cap.layer].color);

        // Add header icon
        header.append("text")
            .attr("class", "fa")
            .attr("x", 20)
            .attr("y", headerHeight / 2)
            .attr("dominant-baseline", "central")
            .attr("font-family", "FontAwesome")
            .attr("font-size", "16px")
            .attr("fill", "#fff")
            .text(getIconUnicode(cap.icon));

        // Add header text
        header.append("text")
            .attr("x", 50)
            .attr("y", headerHeight / 2)
            .attr("dominant-baseline", "central")
            .attr("fill", "#fff")
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .text(cap.name);

        // Add hexagons for children
        const hexRadius = 30;
        const hexPadding = 15;
        const hexWidth = hexRadius * Math.sqrt(3);
        const hexHeight = hexRadius * 2;
        const contentArea = block.append("g")
            .attr("transform", `translate(0,${headerHeight})`);

        // Function to create hexagon points
        function hexPoints(radius) {
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                points.push([
                    radius * Math.sin(angle),
                    -radius * Math.cos(angle)
                ]);
            }
            return points.map(p => p.join(',')).join(' ');
        }

        // Layout children in a grid
        const hexesPerRow = Math.floor((blockWidth - hexPadding * 2) / (hexWidth + hexPadding));
        
        cap.children.forEach((child, j) => {
            const row = Math.floor(j / hexesPerRow);
            const col = j % hexesPerRow;
            const x = hexPadding + col * (hexWidth + hexPadding) + hexWidth/2 + (row % 2 ? hexWidth/2 : 0);
            const y = hexPadding + row * (hexHeight * 0.75) + hexHeight/2;

            const hexGroup = contentArea.append("g")
                .attr("transform", `translate(${x},${y})`);

            // Add hexagon
            hexGroup.append("polygon")
                .attr("points", hexPoints(hexRadius))
                .attr("fill", d3.rgb(layers[cap.layer].color).brighter(0.7))
                .attr("stroke", layers[cap.layer].color)
                .attr("stroke-width", 2)
                .style("cursor", "pointer")
                .on("mouseover", function() {
                    d3.select(this)
                        .attr("stroke-width", 3)
                        .style("filter", "drop-shadow(2px 2px 3px rgba(0,0,0,0.2))");
                    showTooltip(child, d3.event);
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr("stroke-width", 2)
                        .style("filter", "none");
                    hideTooltip();
                })
                .on("click", () => showCapabilityDetails(child));

            // Add icon
            hexGroup.append("text")
                .attr("class", "fa")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("y", -10)
                .attr("font-family", "FontAwesome")
                .attr("font-size", "20px")
                .attr("fill", "#fff")
                .style("filter", "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))")
                .text(getIconUnicode(child.icon || getMicrosoftIcon(child) || getDefaultIcon(child)));

            // Add label with better contrast
            const label = hexGroup.append("text")
                .attr("text-anchor", "middle")
                .attr("y", 15)
                .attr("fill", "#fff")
                .attr("font-size", "12px")
                .attr("font-weight", "500")
                .style("filter", "drop-shadow(1px 1px 2px rgba(0,0,0,0.7))");

            // Split label into multiple lines if needed
            const words = child.name.split(' ');
            if (words.length > 2) {
                label.append("tspan")
                    .attr("x", 0)
                    .text(words.slice(0, 2).join(' '));
                label.append("tspan")
                    .attr("x", 0)
                    .attr("dy", "1.2em")
                    .text(words.slice(2).join(' '));
            } else {
                label.text(child.name);
            }
        });
    });

    // Get Microsoft-specific icon
    function getMicrosoftIcon(child) {
        if (child.systems && child.systems.length > 0) {
            const system = child.systems[0];
            if (system.technology && system.technology.toLowerCase().includes('microsoft')) {
                const name = system.name.toLowerCase();
                if (name.includes('teams')) return 'fa-comments';
                if (name.includes('sharepoint')) return 'fa-share-alt';
                if (name.includes('dynamics')) return 'fa-chart-line';
                if (name.includes('office')) return 'fa-windows';
                if (name.includes('power bi')) return 'fa-chart-bar';
            }
        }
        return null;
    }

    // Get default icon based on name
    function getDefaultIcon(child) {
        const name = child.name.toLowerCase();
        if (name.includes('sales')) return 'fa-handshake';
        if (name.includes('marketing')) return 'fa-bullhorn';
        if (name.includes('financial')) return 'fa-money-bill-alt';
        if (name.includes('report')) return 'fa-file-alt';
        if (name.includes('dashboard')) return 'fa-tachometer-alt';
        if (name.includes('data')) return 'fa-database';
        if (name.includes('system')) return 'fa-cogs';
        if (name.includes('service')) return 'fa-concierge-bell';
        if (name.includes('portal')) return 'fa-window-restore';
        if (name.includes('platform')) return 'fa-layer-group';
        return 'fa-cube';
    }

    // Helper function for FontAwesome icons
    function getIconUnicode(iconClass) {
        const iconMap = {
            'fa-cube': '\uf1b2',
            'fa-cogs': '\uf085',
            'fa-database': '\uf1c0',
            'fa-users': '\uf0c0',
            'fa-chart-bar': '\uf080',
            'fa-server': '\uf233',
            'fa-network-wired': '\uf6ff',
            'fa-desktop': '\uf108',
            'fa-globe': '\uf0ac',
            'fa-toolbox': '\uf552',
            'fa-comments': '\uf086',
            'fa-share-alt': '\uf1e0',
            'fa-folder-open': '\uf07c',
            'fa-file-word': '\uf1c2',
            'fa-window-restore': '\uf2d2',
            'fa-puzzle-piece': '\uf12e',
            'fa-chart-line': '\uf201',
            'fa-address-book': '\uf2b9',
            'fa-exchange-alt': '\uf362',
            'fa-building': '\uf1ad',
            'fa-user-circle': '\uf2bd',
            'fa-layer-group': '\uf5fd',
            'fa-star': '\uf005',
            'fa-windows': '\uf17a',
            'fa-handshake': '\uf2b5',
            'fa-bullhorn': '\uf0a1',
            'fa-money-bill-alt': '\uf3d1',
            'fa-file-alt': '\uf15c',
            'fa-tachometer-alt': '\uf3fd',
            'fa-concierge-bell': '\uf562'
        };
        return iconMap[iconClass] || '\uf013'; // Default to gear icon
    }

    // Enhanced capability details display
    function showCapabilityDetails(capability) {
        // Find all connected relationships
        const relatedCaps = relationships
            .filter(rel => rel.source === capability || rel.target === capability)
            .map(rel => ({
                name: rel.source === capability ? rel.target.name : rel.source.name,
                type: rel.type,
                direction: rel.source === capability ? "outbound" : "inbound"
            }));

        // Find all systems under this capability
        const systems = [];
        if (capability.children) {
            capability.children.forEach(child => {
                if (child.systems) {
                    child.systems.forEach(sys => {
                        systems.push({
                            name: sys.name,
                            type: sys.type || 'System',
                            description: sys.description || '',
                            integrations: sys.integrates || []
                        });
                    });
                }
            });
        }

        // Create or update details panel
        let detailsPanel = d3.select('#capability-details');
        if (detailsPanel.empty()) {
            detailsPanel = d3.select(container)
                .append('div')
                .attr('id', 'capability-details')
                .style('position', 'absolute')
                .style('right', '20px')
                .style('top', '80px')
                .style('width', '250px')
                .style('background', 'white')
                .style('border-radius', '8px')
                .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
                .style('padding', '20px')
                .style('z-index', '1000');
        }

        // Update details content with enhanced styling
        detailsPanel.html(`
            <div style="border-left: 4px solid ${layers[capability.layer].color}; padding-left: 10px;">
                <h3 style="margin: 0; color: ${layers[capability.layer].color};">
                    <i class="fa ${capability.icon}"></i> ${capability.name}
                </h3>
                <p style="color: #666; margin: 8px 0;">${capability.description || 'No description available'}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #444;">Layer</h4>
                <p style="margin: 0; color: #666;">${layers[capability.layer].name}</p>
            </div>

            ${systems.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #444;">Systems</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${systems.map(sys => `
                            <div style="margin-bottom: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
                                <div style="font-weight: 500;">${sys.name}</div>
                                <div style="font-size: 12px; color: #666;">${sys.description}</div>
                                ${sys.integrations.length > 0 ? `
                                    <div style="font-size: 12px; margin-top: 5px;">
                                        <span style="color: #888;">Integrates with: </span>
                                        ${sys.integrations.join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${relatedCaps.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #444;">Related Capabilities</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${relatedCaps.map(rel => `
                            <div style="margin-bottom: 8px; display: flex; align-items: center;">
                                <i class="fa fa-${rel.direction === 'outbound' ? 'arrow-right' : 'arrow-left'}" 
                                   style="color: #999; margin-right: 8px;"></i>
                                <span>${rel.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `);

        // Add close button
        detailsPanel.append('div')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('cursor', 'pointer')
            .style('color', '#999')
            .html('<i class="fa fa-times"></i>')
            .on('click', () => detailsPanel.remove());

        // Show child capabilities if they exist
        if (capability.children && capability.children.length > 0) {
            showChildCapabilities(capability, hexGroup);
        }
    }

    // Function to visualize child capabilities
    function showChildCapabilities(parentCap, hexGroup) {
        const childRadius = hexRadius * 0.6;
        const parentX = parentCap.x;
        const parentY = parentCap.y;

        // Remove any existing child visualizations
        hexGroup.selectAll('.child-capability').remove();

        // Create child hexagons in a circular pattern around the parent
        parentCap.children.forEach((child, i) => {
            const angle = (i * (2 * Math.PI)) / parentCap.children.length;
            const distance = hexRadius * 2;
            const x = parentX + distance * Math.cos(angle);
            const y = parentY + distance * Math.sin(angle);

            const childGroup = hexGroup.append('g')
                .attr('class', 'child-capability')
                .attr('transform', `translate(${x},${y})`)
                .style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 1);

            // Add child hexagon
            childGroup.append('polygon')
                .attr('points', hexPoints(childRadius))
                .attr('fill', d3.rgb(layers[parentCap.layer].color).brighter(0.3))
                .attr('stroke', layers[parentCap.layer].color)
                .attr('stroke-width', 1.5)
                .style('cursor', 'pointer')
                .on("mouseover", function() {
                    d3.select(this)
                        .attr('stroke-width', 2)
                        .style('filter', 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))');
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .attr('stroke-width', 1.5)
                        .style('filter', 'none');
                });

            // Add child label
            childGroup.append('text')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('fill', '#fff')
                .attr('font-size', '10px')
                .text(child.name);

            // Add connecting line to parent
            hexGroup.append('line')
                .attr('class', 'child-capability')
                .attr('x1', parentX)
                .attr('y1', parentY)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', layers[parentCap.layer].color)
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '3,3')
                .style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 0.5);
        });
    }

    // Helper function to convert FontAwesome class to unicode
    function getIconUnicode(iconClass) {
        // Add more icons as needed
        const iconMap = {
            'fa-cube': '\uf1b2',
            'fa-cogs': '\uf085',
            'fa-database': '\uf1c0',
            'fa-users': '\uf0c0',
            'fa-chart-bar': '\uf080',
            'fa-server': '\uf233',
            'fa-network-wired': '\uf6ff'
        };
        return iconMap[iconClass] || '\uf013'; // Default to gear icon
    }
}
