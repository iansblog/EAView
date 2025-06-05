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
        const minHeight = 200;
        const childPadding = 15;
        const contentPadding = 25;
        const descriptionLineHeight = 20;
        const childLineHeight = 18;
        
        // Start with header height plus top padding
        let totalHeight = headerHeight + contentPadding;
        
        // Calculate description height with proper text wrapping
        if (capability.description) {
            const maxWidth = blockWidth - 50; // Increased padding for better readability
            const words = capability.description.split(' ');
            let currentLine = '';
            let lineCount = 0;

            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const testWidth = getTextWidth(testLine, "14px Arial");
                
                if (testWidth > maxWidth && currentLine) {
                    lineCount++;
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lineCount++;
            
            totalHeight += (lineCount * descriptionLineHeight) + 15; // Added extra spacing after description
        }

        // Calculate children height with improved spacing
        if (capability.children && capability.children.length > 0) {
            let childrenHeight = 0;
            
            capability.children.forEach(child => {
                const childWidth = blockWidth - 40; // Account for left and right padding
                let childHeight = 40; // Base height for name and type

                // Calculate description height with proper wrapping
                if (child.description) {
                    const maxWidth = childWidth - 40; // Increased padding for better readability
                    const words = child.description.split(' ');
                    let line = '';
                    let lineCount = 0;

                    words.forEach(word => {
                        const testLine = line + (line ? ' ' : '') + word;
                        const testWidth = getTextWidth(testLine, "12px Arial");
                        
                        if (testWidth > maxWidth && line) {
                            lineCount++;
                            line = word;
                        } else {
                            line = testLine;
                        }
                    });
                    if (line) lineCount++;
                    
                    childHeight += (lineCount * childLineHeight) + 10; // Added padding after description
                }

                // Add height for systems/children badge with proper spacing
                if (child.systems?.length > 0 || child.children?.length > 0) {
                    childHeight += 25; // Increased for better badge placement
                }

                childrenHeight += childHeight + childPadding;
            });

            totalHeight += childrenHeight;
        }

        // Add bottom padding and ensure minimum height
        return Math.max(totalHeight + contentPadding, minHeight);
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

        // Description
        let currentY = 50;
        if (capability.description) {
            const maxWidth = width - 40;
            const words = capability.description.split(' ');
            let line = '';
            let lineCount = 0;

            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                const testWidth = getTextWidth(testLine, "14px Arial");
                
                if (testWidth > maxWidth && line) {
                    block.append("text")
                        .attr("x", 20)
                        .attr("y", currentY)
                        .attr("font-size", "14px")
                        .attr("fill", "#666")
                        .text(line.trim());
                    line = word;
                    lineCount++;
                    currentY += 20;
                } else {
                    line = testLine;
                }
            });

            if (line) {
                block.append("text")
                    .attr("x", 20)
                    .attr("y", currentY)
                    .attr("font-size", "14px")
                    .attr("fill", "#666")
                    .text(line.trim());
                currentY += 30;
            }
        }

        // Add children
        if (capability.children && capability.children.length > 0) {
            const childContainer = block.append("g")
                .attr("class", "children-container");
            
            let yPos = currentY;
            capability.children.forEach((child, i) => {
                const childHeight = createChildElement(childContainer, child, capability, yPos, width);
                yPos += childHeight + 10;
            });
        }
    }    function createChildElement(parent, child, parentCap, index, width) {
        const childPadding = 15;
        const standardHeight = 40;
        const leftPadding = 20;
        
        const childGroup = parent.append("g")
            .attr("transform", `translate(10,${index})`)
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(child, parentCap));

        // Simple or complex child layout
        const isSimple = !child.description && !child.systems && (!child.children || child.children.length === 0);
        
        // Background
        const childWidth = width - 20;
        const childHeight = isSimple ? standardHeight : calculateChildHeight(child, childWidth);
        
        // Add a clip path to ensure content stays within bounds
        const clipPathId = `clip-${Math.random().toString(36).substr(2, 9)}`;
        childGroup.append("defs")
            .append("clipPath")
            .attr("id", clipPathId)
            .append("rect")
            .attr("width", childWidth)
            .attr("height", childHeight)
            .attr("rx", 6);

        // Background rectangle
        childGroup.append("rect")
            .attr("width", childWidth)
            .attr("height", childHeight)
            .attr("rx", 6)
            .attr("fill", child.color || "#f8f9fa")
            .attr("stroke", parentCap.color)
            .attr("stroke-width", 1);

        // Create a group for content with clipping
        const contentGroup = childGroup.append("g")
            .attr("clip-path", `url(#${clipPathId})`);

        // Icon with improved positioning
        if (child.icon) {
            contentGroup.append("text")
                .attr("class", "fa")
                .attr("x", leftPadding)
                .attr("y", standardHeight/2)
                .attr("dominant-baseline", "central")
                .attr("font-family", "FontAwesome")
                .attr("fill", child.color ? "#fff" : parentCap.color)
                .text(getIconUnicode(child.icon));
        }

        // Name with consistent positioning
        contentGroup.append("text")
            .attr("x", child.icon ? leftPadding + 30 : leftPadding)
            .attr("y", standardHeight/2)
            .attr("dominant-baseline", "central")
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .attr("fill", child.color ? "#fff" : "#333")
            .text(child.name);

        if (!isSimple) {
            let currentY = standardHeight + 5; // Added padding after header

            // Description with improved text wrapping
            if (child.description) {
                const maxWidth = childWidth - (leftPadding * 2);
                const words = child.description.split(' ');
                let line = '';
                let lines = [];

                words.forEach(word => {
                    const testLine = line + (line ? ' ' : '') + word;
                    const testWidth = getTextWidth(testLine, "12px Arial");
                    
                    if (testWidth > maxWidth && line) {
                        lines.push(line.trim());
                        line = word;
                    } else {
                        line = testLine;
                    }
                });
                if (line) lines.push(line.trim());

                lines.forEach(line => {
                    contentGroup.append("text")
                        .attr("x", leftPadding)
                        .attr("y", currentY)
                        .attr("font-size", "12px")
                        .attr("fill", child.color ? "#fff" : "#666")
                        .text(line);
                    currentY += 18;
                });
            }

            // System/child count badge with improved positioning
            if (child.systems?.length > 0 || child.children?.length > 0) {
                const count = (child.systems?.length || 0) + (child.children?.length || 0);
                const badge = childGroup.append("g")
                    .attr("transform", `translate(${childWidth - 45}, ${isSimple ? 10 : childHeight - 30})`);

                // Badge background with shadow
                badge.append("rect")
                    .attr("width", 30)
                    .attr("height", 20)
                    .attr("rx", 10)
                    .attr("fill", parentCap.color)
                    .style("filter", "drop-shadow(0 1px 2px rgba(0,0,0,0.1))");

                // Badge count
                badge.append("text")
                    .attr("x", 15)
                    .attr("y", 10)
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "central")
                    .attr("fill", "#fff")
                    .attr("font-size", "12px")
                    .text(count);
            }
        }

        return childHeight + childPadding;
    }

    function calculateChildHeight(child, width) {
        let height = 40; // Base height for name
        
        if (child.description) {
            const maxWidth = width - 30;
            const words = child.description.split(' ');
            let line = '';
            let lineCount = 0;

            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                const testWidth = getTextWidth(testLine, "12px Arial");
                
                if (testWidth > maxWidth && line) {
                    lineCount++;
                    line = word;
                } else {
                    line = testLine;
                }
            });
            if (line) lineCount++;
            
            height += lineCount * 18;
        }

        if (child.systems?.length > 0 || child.children?.length > 0) {
            height += 20;
        }

        return Math.max(height + 10, 40);
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
