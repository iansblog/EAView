function renderCapabilityHexGrid(container, data) {
    // Clear container
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;

    // Create SVG with scrollable container
    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("min-height", "800px");

    // Add a scrollable group for all content
    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process capabilities into blocks
    const capabilities = Object.entries(data.capabilities).map(([key, value]) => ({
        id: key,
        name: value.name,
        icon: value.icon || 'fa-cube',
        color: value.color || '#2C3E50',
        description: value.description || '',
        children: processChildren(value.children || [])
    }));

    // Process children recursively to handle nested structures
    function processChildren(children) {
        return children.map(child => ({
            name: child.name,
            icon: child.icon,
            description: child.description || '',
            type: child.type,
            systems: child.systems || [],
            dataModels: child.dataModels || [],
            children: child.children ? processChildren(child.children) : [],
            color: child.color
        }));
    }

    // Layout blocks in a grid
    const blockSpacing = 30;
    const blockWidth = (width - blockSpacing * 3) / 2;
    let currentY = 0;
    let maxRowHeight = 0;
    let column = 0;

    // First pass: calculate heights and positions
    capabilities.forEach((cap, i) => {
        if (column >= 2) {
            currentY += maxRowHeight + blockSpacing;
            maxRowHeight = 0;
            column = 0;
        }

        const blockHeight = calculateBlockHeight(cap);
        maxRowHeight = Math.max(maxRowHeight, blockHeight);
        
        const x = column * (blockWidth + blockSpacing);
        const y = currentY;
        
        createCapabilityBlock(mainGroup, cap, { x, y }, blockWidth, blockHeight);
        
        column++;
    });

    // Update SVG height based on total content
    const totalHeight = currentY + maxRowHeight + margin.top + margin.bottom;
    svg.attr("height", totalHeight);    function calculateBlockHeight(capability) {
        const headerHeight = 40;
        const topPadding = 20;
        const bottomPadding = 20;
        const childSpacing = 10;
        const childHeight = 40;
        const minHeight = 150;
        
        // Start with header height plus top padding
        let totalHeight = headerHeight + topPadding;
        
        // Calculate total height needed for all children
        if (capability.children && capability.children.length > 0) {
            // Calculate space needed for all children including spacing between them
            const childrenTotalHeight = capability.children.length * childHeight;
            const spacingTotalHeight = Math.max(0, capability.children.length - 1) * childSpacing;
            
            // Add extra bottom padding for the last child
            totalHeight += childrenTotalHeight + spacingTotalHeight + bottomPadding;
        }

        // Return the maximum of calculated height or minimum height
        return Math.max(totalHeight, minHeight);
    }function createCapabilityBlock(parent, capability, position, width, height) {
        const block = parent.append("g")
            .attr("class", "capability-block")
            .attr("transform", `translate(${position.x},${position.y})`);

        // Block background
        block.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("rx", 8)
            .attr("fill", "#ffffff")
            .attr("stroke", capability.color)
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

        // Create header
        const header = block.append("g")
            .attr("class", "block-header")
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(capability));

        // Header background
        header.append("rect")
            .attr("width", width)
            .attr("height", 40)
            .attr("rx", 8)
            .attr("fill", capability.color);

        // Header icon
        if (capability.icon) {
            header.append("text")
                .attr("class", "fa")
                .attr("x", 20)
                .attr("y", 25)
                .attr("font-family", "FontAwesome")
                .attr("fill", "#fff")
                .text(getIconUnicode(capability.icon));
        }

        // Header text
        header.append("text")
            .attr("x", capability.icon ? 50 : 20)
            .attr("y", 25)
            .attr("fill", "#fff")
            .attr("font-size", "16px")
            .attr("font-weight", "500")
            .attr("dominant-baseline", "central")
            .text(capability.name);

    // Add children section starting right after header
    const childrenStartY = 50;    // Add children with improved positioning
    if (capability.children && capability.children.length > 0) {
        const childContainer = block.append("g")
            .attr("class", "children-container")
            .attr("transform", `translate(0,${childrenStartY})`);
        
        capability.children.forEach((child, i) => {
            createChildElement(childContainer, child, capability, i, width);
        });
    }
    }    function createChildElement(parent, child, parentCap, index, width) {
        const standardHeight = 40;
        const leftPadding = 20;
        const rightPadding = 40; // Space for badge
        const childSpacing = 10;
        
        // Calculate vertical position with proper spacing
        const yPos = index * (standardHeight + childSpacing);
        
        const childGroup = parent.append("g")
            .attr("transform", `translate(10,${yPos})`)
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(child, parentCap));

        // Calculate child width with margins
        const childWidth = width - 20; // 10px padding on each side
        
        // Background rectangle
        childGroup.append("rect")
            .attr("width", childWidth)
            .attr("height", standardHeight)
            .attr("rx", 6)
            .attr("fill", child.color || "#f8f9fa")
            .attr("stroke", parentCap.color)
            .attr("stroke-width", 1);

        // Icon with improved positioning
        if (child.icon) {
            childGroup.append("text")
                .attr("class", "fa")
                .attr("x", leftPadding)
                .attr("y", standardHeight/2)
                .attr("dominant-baseline", "central")
                .attr("font-family", "FontAwesome")
                .attr("fill", child.color ? "#fff" : parentCap.color)
                .text(getIconUnicode(child.icon));
        }

        // Name with consistent positioning and truncation if needed
        const nameText = childGroup.append("text")
            .attr("x", child.icon ? leftPadding + 30 : leftPadding)
            .attr("y", standardHeight/2)
            .attr("dominant-baseline", "central")
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .attr("fill", child.color ? "#fff" : "#333")
            .text(child.name);        // System/child count badge with improved positioning
        if (child.systems?.length > 0 || child.children?.length > 0) {
            const count = (child.systems?.length || 0) + (child.children?.length || 0);
            const badge = childGroup.append("g")
                .attr("transform", `translate(${childWidth - 34}, ${standardHeight/2})`);

            // Badge background with shadow
            badge.append("rect")
                .attr("width", 24)
                .attr("height", 16)
                .attr("rx", 8)
                .attr("transform", "translate(-12,-8)")
                .attr("fill", parentCap.color)
                .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");

            // Badge count
            badge.append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", "#fff")
                .attr("font-size", "11px")
                .text(count);
        }
        
        return standardHeight;
    }
    
    function calculateChildHeight(child, width) {
        return 40; // Fixed height for consistency
    }

    function showCapabilityDetails(capability, parentCapability) {
        const detailsPanel = d3.select('#detail-content');
        const content = [];

        const title = parentCapability ? 
            `${parentCapability.name} > ${capability.name}` :
            capability.name;

        const color = capability.color || parentCapability?.color || "#2C3E50";

        content.push(`
            <div style="border-left: 4px solid ${color}; padding-left: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: ${color};">
                    ${capability.icon ? `<i class="fa ${capability.icon}"></i> ` : ''}${title}
                </h2>
                ${capability.description ? 
                    `<p style="color: #666; margin: 8px 0;">${capability.description}</p>` : ''}
                ${capability.type ? 
                    `<div style="color: #666; font-size: 12px;">Type: ${capability.type}</div>` : ''}
            </div>
        `);

        if (capability.systems) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Systems</h3>');
            capability.systems.forEach(system => {
                // Handle both object and string system representations
                const systemName = typeof system === 'string' ? system : system.name;
                const systemDetails = typeof system === 'object' ? system : null;

                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: ${color}11; border-left: 3px solid ${color}; border-radius: 6px;">
                        <strong>${systemName}</strong>
                        ${systemDetails?.technology ? 
                            `<div style="font-size: 13px; color: #666; margin-top: 5px;">Technology: ${systemDetails.technology}</div>` : ''}
                        ${systemDetails?.status ? 
                            `<div style="font-size: 13px; color: #666;">Status: <span style="color: ${systemDetails.status === 'Production' ? '#27AE60' : '#F39C12'}">${systemDetails.status}</span></div>` : ''}
                        ${systemDetails?.integrates ? `
                            <div style="margin-top: 5px;">
                                <div style="font-size: 13px; color: #666;">Integrates with:</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;">
                                    ${systemDetails.integrates.map(int => 
                                        `<span style="background: ${color}22; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${int}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `);
            });
        }

        if (capability.dataModels) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Data Models</h3>');
            capability.dataModels.forEach(model => {
                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: ${color}11; border-left: 3px solid ${color}; border-radius: 6px;">
                        <strong>${model.name}</strong>
                        ${model.entities ? `
                            <div style="margin-top: 5px;">
                                <div style="font-size: 13px; color: #666;">Entities:</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;">
                                    ${model.entities.map(entity => 
                                        `<span style="background: ${color}22; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${entity}</span>`
                                    ).join('')}
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

        if (capability.children && capability.children.length > 0) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Child Elements</h3>');
            capability.children.forEach(child => {
                content.push(`
                    <div style="margin-bottom: 10px; padding: 10px; background: ${color}11; border-left: 3px solid ${color}; border-radius: 6px;">
                        <div style="display: flex; align-items: center;">
                            ${child.icon ? `<i class="fa ${child.icon}" style="margin-right: 10px; color: ${color};"></i>` : ''}
                            <strong>${child.name}</strong>
                        </div>
                        ${child.description ? 
                            `<p style="margin: 5px 0; color: #666; font-size: 13px;">${child.description}</p>` : ''}
                        ${child.type ? 
                            `<div style="font-size: 12px; color: #666;">Type: ${child.type}</div>` : ''}
                    </div>
                `);
            });
        }

        detailsPanel.html(content.join(''));
    }

    // Helper function for FontAwesome icons
    function getIconUnicode(iconClass) {
        const iconMap = {
            'fa-cube': '\uf1b2',
            'fa-cubes': '\uf1b3',
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
            'fa-plug': '\uf1e6',
            'fa-money-bill': '\uf0d6',
            'fa-coins': '\uf51e',
            'fa-user-tie': '\uf508',
            'fa-file-chart-line': '\uf659',
            'fa-money-bill-transfer': '\uf53a',
            'fa-file-invoice-dollar': '\uf571',
            'fa-bullhorn': '\uf0a1',
            'fa-handshake': '\uf2b5',
            'fa-binoculars': '\uf1e5'
        };
        return iconMap[iconClass] || '\uf013'; // Default to gear icon
    }

    function getTextWidth(text, font) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }
}
