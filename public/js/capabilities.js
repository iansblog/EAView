function renderCapabilitiesView(container, data) {
    // Clear container
    container.innerHTML = '';
    
    // Initial margins and spacing configuration
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const blockSpacing = 30;
    
    // Make container responsive
    const containerWidth = container.clientWidth;
    const initialSvgWidth = containerWidth;
    
    // Calculate usable width for blocks
    const width = containerWidth - margin.left - margin.right;
    const blockWidth = (width - blockSpacing * 3) / 2;

    // Process capabilities into hierarchy
    const capabilities = Object.entries(data.businessCapabilities).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description,
        children: value.children || []
    }));

    // Pre-calculate all block heights and positions
    const blockLayout = calculateBlockLayout(capabilities, blockWidth, blockSpacing);

    // Create SVG with dynamic height based on layout
    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", blockLayout.totalHeight + margin.top + margin.bottom)
        .style("min-height", "800px"); // Minimum height for empty or small content

    // Add resize handler
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const newWidth = entry.contentRect.width;
            updateLayout(newWidth);
        }
    });
    resizeObserver.observe(container);

    // Main group for all content with margins
    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create blocks using calculated layout
    capabilities.forEach((cap, i) => {
        const position = blockLayout.positions[i];
        createCapabilityBlock(mainGroup, cap, position, blockWidth);
    });

    // Function to calculate layout for all blocks
    function calculateBlockLayout(capabilities, blockWidth, spacing) {
        let positions = [];
        let currentY = 0;
        let currentRow = [];
        let maxY = 0;

        capabilities.forEach((cap, i) => {
            const height = calculateBlockHeight(cap);
            
            if (i % 2 === 0 && i > 0) {
                currentY += Math.max(...currentRow) + spacing;
                currentRow = [];
            }

            const position = {
                x: (i % 2) * (blockWidth + spacing),
                y: currentY,
                height: height
            };

            positions.push(position);
            currentRow.push(height);
            maxY = Math.max(maxY, currentY + height);
        });

        return {
            positions: positions,
            totalHeight: maxY + spacing
        };
    }

    // Function to calculate single block height
    function calculateBlockHeight(capability) {
        const headerHeight = 40;
        const descriptionHeight = capability.description ? 40 : 0;
        const childHeight = 90; // Height per child
        const padding = 40;
        const childrenHeight = (capability.children?.length || 0) * childHeight;
        
        return headerHeight + descriptionHeight + childrenHeight + padding;
    }

    // Function to create a capability block
    function createCapabilityBlock(parent, capability, position, width) {
        const block = parent.append("g")
            .attr("class", "capability-block")
            .attr("transform", `translate(${position.x},${position.y})`);

        // Block background
        block.append("rect")
            .attr("width", width)
            .attr("height", position.height)
            .attr("rx", 8)
            .attr("fill", "#ffffff")
            .attr("stroke", capability.color || "#2C3E50")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

        // Add header with icon and color from the data
        createBlockHeader(block, capability, width);

        // Add description and children
        let currentY = 40; // Start after header

        if (capability.description) {
            block.append("text")
                .attr("x", 20)
                .attr("y", currentY + 25)
                .attr("font-size", "14px")
                .attr("fill", "#666")
                .text(capability.description);
            currentY += 40;
        }

        // Add children
        if (capability.children?.length > 0) {
            capability.children.forEach((child, i) => {
                createChildBlock(block, child, capability, width, currentY + (i * 90));
            });
        }
    }

    // Function to create block header
    function createBlockHeader(block, capability, width) {
        const header = block.append("g")
            .attr("class", "block-header")
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(capability));

        // Header background with capability color
        header.append("rect")
            .attr("width", width)
            .attr("height", 40)
            .attr("rx", 8)
            .attr("fill", capability.color || "#2C3E50");

        // Add icon if available
        if (capability.icon) {
            header.append("text")
                .attr("class", "fa")
                .attr("x", 20)
                .attr("y", 25)
                .attr("font-family", "FontAwesome")
                .attr("fill", "#fff")
                .text(getIconUnicode(capability.icon));
        }

        // Add name
        header.append("text")
            .attr("x", capability.icon ? 50 : 20)
            .attr("y", 25)
            .attr("fill", "#fff")
            .attr("font-size", "16px")
            .attr("font-weight", "500")
            .text(capability.name);
    }

    // Function to create child block
    function createChildBlock(parent, child, parentCap, width, y) {
        const childGroup = parent.append("g")
            .attr("transform", `translate(10,${y})`)
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(child, parentCap));

        // Background with lighter version of parent color
        childGroup.append("rect")
            .attr("width", width - 20)
            .attr("height", 80)
            .attr("rx", 6)
            .attr("fill", child.color || "#f8f9fa")
            .attr("stroke", parentCap.color || "#2C3E50")
            .attr("stroke-width", 1);

        // Add icon if available
        if (child.icon) {
            childGroup.append("text")
                .attr("class", "fa")
                .attr("x", 15)
                .attr("y", 25)
                .attr("font-family", "FontAwesome")
                .attr("fill", "#fff")
                .style("filter", "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))")
                .text(getIconUnicode(child.icon));
        }

        // Name
        childGroup.append("text")
            .attr("x", child.icon ? 45 : 15)
            .attr("y", 25)
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .attr("fill", "#333")
            .text(child.name);

        // Description with word wrap
        const words = child.description.split(' ');
        let line = '';
        let lineNumber = 0;
        const lineHeight = 18;
        const maxWidth = width - 50;

        words.forEach(word => {
            const testLine = line + word + ' ';
            const testWidth = getTextWidth(testLine, "12px Arial");

            if (testWidth > maxWidth) {
                childGroup.append("text")
                    .attr("x", 15)
                    .attr("y", 45 + (lineNumber * lineHeight))
                    .attr("font-size", "12px")
                    .attr("fill", "#666")
                    .text(line.trim());
                line = word + ' ';
                lineNumber++;
            } else {
                line = testLine;
            }
        });

        if (line) {
            childGroup.append("text")
                .attr("x", 15)
                .attr("y", 45 + (lineNumber * lineHeight))
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text(line.trim());
        }

        // System count badge
        if (child.systems) {
            const badge = childGroup.append("g")
                .attr("transform", `translate(${width - 50}, 15)`);

            badge.append("rect")
                .attr("width", 30)
                .attr("height", 20)
                .attr("rx", 10)
                .attr("fill", parentCap.color || "#3498db");

            badge.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr("fill", "#fff")
                .attr("font-size", "12px")
                .text(child.systems.length);
        }
    }

    // Helper function to estimate text width
    function getTextWidth(text, font) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }

    // Function to update layout on resize
    function updateLayout(newWidth) {
        const usableWidth = newWidth - margin.left - margin.right;
        const newBlockWidth = (usableWidth - blockSpacing * 3) / 2;
        const newLayout = calculateBlockLayout(capabilities, newBlockWidth, blockSpacing);

        svg.attr("width", newWidth)
           .attr("height", newLayout.totalHeight + margin.top + margin.bottom);

        // Update all block positions
        mainGroup.selectAll(".capability-block")
            .data(capabilities)
            .attr("transform", (d, i) => {
                const pos = newLayout.positions[i];
                return `translate(${pos.x},${pos.y})`;
            });
    }

    // Function to show capability details
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
                <p style="color: #666; margin: 8px 0;">${capability.description}</p>
            </div>
        `);

        if (capability.systems) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Supporting Systems</h3>');
            capability.systems.forEach(systemName => {
                // Find system details in the main capabilities structure
                const systemDetails = findSystemByName(data.capabilities, systemName);
                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: ${color}11; border-left: 3px solid ${color}; border-radius: 6px;">
                        <strong>${systemName}</strong>
                        ${systemDetails?.technology ? 
                            `<div style="font-size: 13px; color: #666; margin-top: 5px;">Technology: ${systemDetails.technology}</div>` : 
                            ''}
                        ${systemDetails?.status ? 
                            `<div style="font-size: 13px; color: #666;">Status: <span style="color: ${systemDetails.status === 'Production' ? '#27AE60' : '#F39C12'}">${systemDetails.status}</span></div>` : 
                            ''}
                    </div>
                `);
            });
        }

        detailsPanel.html(content.join(''));
    }

    // Helper function to find system details in capabilities structure
    function findSystemByName(capabilities, systemName) {
        let result = null;
        Object.values(capabilities).forEach(capability => {
            if (capability.children) {
                capability.children.forEach(child => {
                    if (child.systems) {
                        child.systems.forEach(system => {
                            if (system.name === systemName) {
                                result = system;
                            }
                        });
                    }
                });
            }
        });
        return result;
    }
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
        'fa-user-tie': '\uf508',
        'fa-file-chart-line': '\uf659',
        'fa-binoculars': '\uf1e5',
        'fa-coins': '\uf51e',
        'fa-money-bill-transfer': '\uf53a',
        'fa-file-invoice-dollar': '\uf571',
        'fa-bullhorn': '\uf0a1',
        'fa-handshake': '\uf2b5'
    };
    return iconMap[iconClass] || '\uf013'; // Default to gear icon
}
