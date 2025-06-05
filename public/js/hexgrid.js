function renderCapabilityHexGrid(container, data) {
    // Clear container
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", container.clientWidth)
        .attr("height", container.clientHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Process capabilities into blocks
    const capabilities = Object.entries(data.capabilities).map(([key, value]) => ({
        id: key,
        name: value.name,
        icon: value.icon || 'fa-cube',
        color: value.color || '#2C3E50',
        description: value.description || '',
        children: value.children || []
    }));

    // Layout blocks in a grid
    const blockSpacing = 30;
    const blockWidth = (width - blockSpacing * 3) / 2;
    const blockHeight = 300;
    const blocksPerRow = 2;

    // Create blocks for capabilities
    capabilities.forEach((cap, i) => {
        const col = i % blocksPerRow;
        const row = Math.floor(i / blocksPerRow);
        const x = col * (blockWidth + blockSpacing);
        const y = row * (blockHeight + blockSpacing);

        createCapabilityBlock(svg, cap, { x, y }, blockWidth, blockHeight);
    });

    function createCapabilityBlock(parent, capability, position, width, height) {
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

        // Header
        createBlockHeader(block, capability, width);

        // Add children
        if (capability.children?.length > 0) {
            const childrenGroup = block.append("g")
                .attr("transform", `translate(0,50)`);

            capability.children.forEach((child, i) => {
                createChildElement(childrenGroup, child, capability, i, width);
            });
        }
    }

    function createBlockHeader(block, capability, width) {
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

        // Icon
        header.append("text")
            .attr("class", "fa")
            .attr("x", 20)
            .attr("y", 25)
            .attr("font-family", "FontAwesome")
            .attr("fill", "#fff")
            .text(getIconUnicode(capability.icon));

        // Name
        header.append("text")
            .attr("x", 50)
            .attr("y", 25)
            .attr("fill", "#fff")
            .attr("font-size", "16px")
            .attr("font-weight", "500")
            .text(capability.name);
    }

    function createChildElement(parent, child, parentCap, index, width) {
        const childHeight = 80;
        const y = index * (childHeight + 10);
        const childGroup = parent.append("g")
            .attr("transform", `translate(10,${y})`)
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(child, parentCap));

        // Background
        childGroup.append("rect")
            .attr("width", width - 20)
            .attr("height", childHeight)
            .attr("rx", 6)
            .attr("fill", "#f8f9fa")
            .attr("stroke", parentCap.color)
            .attr("stroke-width", 1);

        // Icon
        if (child.icon) {
            childGroup.append("text")
                .attr("class", "fa")
                .attr("x", 15)
                .attr("y", 30)
                .attr("font-family", "FontAwesome")
                .attr("fill", parentCap.color)
                .text(getIconUnicode(child.icon));
        }

        // Name
        childGroup.append("text")
            .attr("x", child.icon ? 45 : 15)
            .attr("y", 30)
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .text(child.name);

        // Description
        if (child.description) {
            childGroup.append("text")
                .attr("x", 15)
                .attr("y", 50)
                .attr("font-size", "12px")
                .attr("fill", "#666")
                .text(child.description);
        }

        // System count badge
        if (child.systems) {
            const badge = childGroup.append("g")
                .attr("transform", `translate(${width - 50}, 15)`);

            badge.append("rect")
                .attr("width", 30)
                .attr("height", 20)
                .attr("rx", 10)
                .attr("fill", parentCap.color);

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
                ${capability.description ? `<p style="color: #666; margin: 8px 0;">${capability.description}</p>` : ''}
            </div>
        `);

        if (capability.systems) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Systems</h3>');
            capability.systems.forEach(system => {
                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: ${color}11; border-left: 3px solid ${color}; border-radius: 6px;">
                        <strong>${system.name}</strong>
                        ${system.technology ? 
                            `<div style="font-size: 13px; color: #666; margin-top: 5px;">Technology: ${system.technology}</div>` : 
                            ''}
                        ${system.status ? 
                            `<div style="font-size: 13px; color: #666;">Status: <span style="color: ${system.status === 'Production' ? '#27AE60' : '#F39C12'}">${system.status}</span></div>` : 
                            ''}
                        ${system.integrates ? `
                            <div style="margin-top: 5px;">
                                <div style="font-size: 13px; color: #666;">Integrates with:</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px;">
                                    ${system.integrates.map(int => 
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
            'fa-coins': '\uf51e'
        };
        return iconMap[iconClass] || '\uf013'; // Default to gear icon
    }
}
