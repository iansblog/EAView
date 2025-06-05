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
            .attr("class", "block-header")
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(cap));

        // Add clickable header background
        header.append("rect")
            .attr("width", blockWidth)
            .attr("height", headerHeight)
            .attr("rx", 8)
            .attr("fill", layers[cap.layer].color)
            .attr("class", "header-bg");

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
                .attr("class", "child-capability")
                .attr("transform", `translate(${x},${y})`)
                .style("cursor", "pointer");

            // Add hexagon with click handler
            hexGroup.append("polygon")
                .attr("points", hexPoints(hexRadius))
                .attr("fill", d3.rgb(layers[cap.layer].color).brighter(0.7))
                .attr("stroke", layers[cap.layer].color)
                .attr("stroke-width", 2)
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
                .on("click", (event) => {
                    event.stopPropagation(); // Prevent triggering parent block's click
                    showCapabilityDetails(child, cap);
                });

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
    function showCapabilityDetails(item, parentCapability) {
        // Create or get details panel
        let detailsPanel = d3.select('#capability-details');
        if (detailsPanel.empty()) {
            detailsPanel = d3.select('body').append('div')
                .attr('id', 'capability-details')
                .style('position', 'fixed')
                .style('right', '20px')
                .style('top', '80px')
                .style('width', '350px')
                .style('max-height', '80vh')
                .style('background', 'white')
                .style('border-radius', '8px')
                .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
                .style('padding', '20px')
                .style('overflow-y', 'auto')
                .style('z-index', '1000');
        }

        // Determine if this is a block-level or hexagon-level detail view
        const isBlock = !parentCapability;
        const content = [];

        if (isBlock) {
            // Block-level details
            const blockColor = layers[item.layer].color;
            content.push(`
                <div style="border-left: 4px solid ${blockColor}; padding-left: 10px; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: ${blockColor};">
                        <i class="fa ${item.icon}"></i> ${item.name}
                    </h2>
                    ${item.description ? `<p style="color: #666; margin: 8px 0;">${item.description}</p>` : ''}
                    <div style="color: #666; font-size: 12px;">${layers[item.layer].name}</div>
                </div>
                <h3 style="margin: 20px 0 10px 0;">Capabilities</h3>
            `);

            // List all children in this block
            item.children.forEach(child => {
                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <i class="fa ${child.icon || getDefaultIcon(child)}" style="margin-right: 10px; color: ${blockColor};"></i>
                            <strong>${child.name}</strong>
                        </div>
                        ${child.description ? `<p style="margin: 5px 0; color: #666; font-size: 13px;">${child.description}</p>` : ''}
                        ${child.type ? `<div style="font-size: 12px; color: #666;">Type: ${child.type}</div>` : ''}
                    </div>
                `);
            });
        } else {
            // Hexagon-level details
            const blockColor = layers[parentCapability.layer].color;
            content.push(`
                <div style="border-left: 4px solid ${blockColor}; padding-left: 10px; margin-bottom: 20px;">
                    <div style="color: #666; font-size: 12px; margin-bottom: 5px;">${parentCapability.name}</div>
                    <h2 style="margin: 0; color: ${blockColor};">
                        <i class="fa ${item.icon || getDefaultIcon(item)}"></i> ${item.name}
                    </h2>
                    ${item.description ? `<p style="color: #666; margin: 8px 0;">${item.description}</p>` : ''}
                    ${item.type ? `<div style="color: #666; font-size: 12px;">Type: ${item.type}</div>` : ''}
                </div>
            `);

            // Systems information
            if (item.systems && item.systems.length > 0) {
                content.push('<h3 style="margin: 20px 0 10px 0;">Systems</h3>');
                item.systems.forEach(system => {
                    content.push(`
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                            <strong>${system.name}</strong>
                            <div style="font-size: 13px; color: #666; margin-top: 5px;">
                                ${system.technology ? `<div>Technology: ${system.technology}</div>` : ''}
                                ${system.status ? `<div>Status: <span style="color: ${system.status === 'Production' ? '#27AE60' : '#F39C12'}">${system.status}</span></div>` : ''}
                                ${system.integrates ? `
                                    <div style="margin-top: 5px;">
                                        <div>Integrates with:</div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;">
                                            ${system.integrates.map(int => `
                                                <span style="background: #e9ecef; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${int}</span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `);
                });
            }

            // Data Models information
            if (item.dataModels && item.dataModels.length > 0) {
                content.push('<h3 style="margin: 20px 0 10px 0;">Data Models</h3>');
                item.dataModels.forEach(model => {
                    content.push(`
                        <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                            <strong>${model.name}</strong>
                            ${model.entities ? `
                                <div style="margin-top: 5px;">
                                    <div style="font-size: 13px; color: #666;">Entities:</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;">
                                        ${model.entities.map(entity => `
                                            <span style="background: #e9ecef; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${entity}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            ${model.relationships ? `
                                <div style="margin-top: 10px;">
                                    <div style="font-size: 13px; color: #666;">Relationships:</div>
                                    ${model.relationships.map(rel => `
                                        <div style="font-size: 12px; margin-top: 3px;">
                                            ${rel.from} <i class="fa fa-arrow-right" style="margin: 0 5px;"></i> ${rel.to} (${rel.type})
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `);
                });
            }

            // Child capabilities if any
            if (item.children && item.children.length > 0) {
                content.push('<h3 style="margin: 20px 0 10px 0;">Child Capabilities</h3>');
                item.children.forEach(child => {
                    content.push(`
                        <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                            <div style="display: flex; align-items: center;">
                                <i class="fa ${child.icon || getDefaultIcon(child)}" style="margin-right: 10px; color: ${blockColor};"></i>
                                <strong>${child.name}</strong>
                            </div>
                            ${child.description ? `<p style="margin: 5px 0; color: #666; font-size: 13px;">${child.description}</p>` : ''}
                        </div>
                    `);
                });
            }
        }

        // Add close button
        content.push(`
            <div style="position: absolute; top: 10px; right: 10px; cursor: pointer; color: #999;"
                 onclick="document.getElementById('capability-details').remove();">
                <i class="fa fa-times"></i>
            </div>
        `);

        // Update panel content
        detailsPanel.html(content.join(''));
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
