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

        const color = capability.color || parentCapability?.color || "#2C3E50";        // Main header section
        content.push(`
            <div style="border-left: 4px solid ${color}; padding-left: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: black;">
                    ${capability.icon ? `<i class="fa ${capability.icon}" style="color: ${color};"></i> ` : ''}${title}
                </h2>
                ${capability.description ? 
                    `<p style="color: #666; margin: 8px 0;">${capability.description}</p>` : ''}
                ${capability.type ? 
                    `<div style="color: #666; font-size: 12px;">Type: ${capability.type}</div>` : ''}
            </div>
        `);

        // Systems section with enhanced details
        if (capability.systems) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Systems</h3>');
            capability.systems.forEach(system => {
                // Handle both object and string system representations
                const systemName = typeof system === 'string' ? system : system.name;
                const systemDetails = typeof system === 'object' ? system : null;
                
                // Create a more detailed systems card
                content.push(`
                    <div class="card mb-3">
                        <div class="card-header" style="background: ${color}22; color: ${color};">                            <strong>${systemName}</strong>
                            ${systemDetails?.status ? 
                                `<span class="badge ${getStatusBadgeClass(systemDetails.status)} float-end">${systemDetails.status}</span>` : ''}
                        </div>
                        <div class="card-body">
                            ${systemDetails?.description ? 
                                `<p class="card-text">${systemDetails.description}</p>` : ''}
                              ${systemDetails ? `
                                <div class="mt-3">
                                    <ul class="list-group list-group-flush">
                                        ${systemDetails.technology ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-code me-2"></i> <strong>Technology</strong></span>
                                            <span class="badge bg-light text-dark">${systemDetails.technology}</span>
                                        </li>` : ''}
                                        ${systemDetails.country ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-globe me-2"></i> <strong>Country</strong></span>
                                            <span class="badge bg-light text-dark"><span class="fi fi-${systemDetails.country}"></span> ${systemDetails.country.toUpperCase()}</span>
                                        </li>` : ''}
                                        ${systemDetails.criticality ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-exclamation-circle me-2"></i> <strong>Criticality</strong></span>
                                            <span class="badge ${getCriticalityBadgeClass(systemDetails.criticality)}">${systemDetails.criticality}</span>
                                        </li>` : ''}
                                        ${systemDetails.owner ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-user-tie me-2"></i> <strong>Owner</strong></span>
                                            <span class="badge bg-light text-dark">${systemDetails.owner}</span>
                                        </li>` : ''}
                                        ${systemDetails.supportLevel ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-headset me-2"></i> <strong>Support Level</strong></span>
                                            <span class="badge ${getSupportBadgeClass(systemDetails.supportLevel)}">${systemDetails.supportLevel}</span>
                                        </li>` : ''}
                                        ${systemDetails.deploymentType ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-cloud-upload-alt me-2"></i> <strong>Deployment</strong></span>
                                            <span class="badge bg-light text-dark">${systemDetails.deploymentType}</span>
                                        </li>` : ''}
                                        ${systemDetails.annualCost ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-money-bill me-2"></i> <strong>Annual Cost</strong></span>
                                            <span class="badge bg-light text-dark">${systemDetails.annualCost}</span>
                                        </li>` : ''}
                                        ${systemDetails.dataClassification ? `<li class="list-group-item d-flex justify-content-between align-items-center">
                                            <span><i class="fa fa-shield-alt me-2"></i> <strong>Data Classification</strong></span>
                                            <span class="badge ${getDataClassificationBadgeClass(systemDetails.dataClassification)}">${systemDetails.dataClassification}</span>
                                        </li>` : ''}
                                    </ul>
                                </div>
                            ` : ''}
                              ${systemDetails?.contractEndDate ? `
                                <div class="alert ${getContractAlertClass(systemDetails.contractEndDate)} mt-3" role="alert">
                                    <i class="fa fa-calendar"></i> <strong>Contract End:</strong> ${formatDate(systemDetails.contractEndDate)}
                                    ${getRemainingTimeText(systemDetails.contractEndDate)}
                                </div>
                            ` : ''}
                            
                            ${systemDetails?.integrates && systemDetails.integrates.length > 0 ? `
                                <div class="mt-3">
                                    <h6>Integrations:</h6>
                                    <div class="d-flex flex-wrap gap-1 mt-2">
                                        ${systemDetails.integrates.map(int => 
                                            `<span class="badge bg-light text-dark">${int}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            });
        }

        // Enhanced data models section
        if (capability.dataModels) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Data Models</h3>');
            capability.dataModels.forEach(model => {
                content.push(`
                    <div class="card mb-3">
                        <div class="card-header" style="background: ${color}22; color: ${color};">
                            ${model.icon ? `<i class="fa ${model.icon} me-2"></i>` : ''}<strong>${model.name}</strong>
                        </div>
                        <div class="card-body">
                            ${model.description ? `<p class="card-text">${model.description}</p>` : ''}
                            
                            ${model.entities && model.entities.length > 0 ? `
                                <div class="mt-3">
                                    <h6>Entities:</h6>
                                    <div class="d-flex flex-wrap gap-1 mt-2">
                                        ${model.entities.map(entity => 
                                            `<span class="badge bg-light text-dark">${entity}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${model.relationships && model.relationships.length > 0 ? `
                                <div class="mt-3">
                                    <h6>Relationships:</h6>
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${model.relationships.map(rel => `
                                                <tr>
                                                    <td>${rel.from}</td>
                                                    <td>${rel.to}</td>
                                                    <td><em>${rel.type}</em></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            });
        }

        // Enhanced children section
        if (capability.children && capability.children.length > 0) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Child Components</h3>');
            
            // Create a list of cards for child elements (one per line)
            content.push('<div class="list-group">');
            
            capability.children.forEach(child => {
                const childColor = child.color || color;
                
                content.push(`
                    <div class="list-group-item mb-2 p-0" style="border-left: 3px solid ${childColor}; border-radius: 6px;">
                        <div class="d-flex align-items-center justify-content-between p-3">
                            <div>
                                <h5 class="mb-1" style="color: ${childColor};">
                                    ${child.icon ? `<i class="fa ${child.icon}"></i> ` : ''}${child.name}
                                </h5>
                                ${child.type ? 
                                    `<div class="text-muted"><small>Type: ${child.type}</small></div>` : ''}
                            </div>
                            
                            <div class="d-flex align-items-center">
                                <!-- Show summary badges -->
                                <div class="d-flex me-3 gap-2">
                                    ${child.systems && child.systems.length > 0 ? 
                                        `<span class="badge bg-light text-dark">${child.systems.length} System${child.systems.length > 1 ? 's' : ''}</span>` : ''}
                                    ${child.dataModels && child.dataModels.length > 0 ? 
                                        `<span class="badge bg-light text-dark">${child.dataModels.length} Data Model${child.dataModels.length > 1 ? 's' : ''}</span>` : ''}
                                    ${child.children && child.children.length > 0 ? 
                                        `<span class="badge bg-light text-dark">${child.children.length} Child${child.children.length > 1 ? 's' : ''}</span>` : ''}
                                </div>
                                
                                <!-- Add click interaction -->
                                <a href="javascript:void(0)" class="btn btn-sm btn-outline-primary view-child-details" 
                                   data-parent-id="${capability.id}"
                                   data-child-name="${child.name}">
                                   Details <i class="fa fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                        ${child.description ? 
                            `<div class="ps-3 pe-3 pb-3 pt-0"><p class="m-0 text-muted">${child.description}</p></div>` : ''}
                    </div>
                `);
            });
            
            content.push('</div>');
        }

        detailsPanel.html(content.join(''));
        
        // Reset scroll position to top when showing new details
        document.getElementById('detail-content').scrollTop = 0;
        
        // Add event listeners for child detail buttons
        document.querySelectorAll('.view-child-details').forEach(button => {
            button.addEventListener('click', function() {
                const parentId = this.getAttribute('data-parent-id');
                const childName = this.getAttribute('data-child-name');
                
                // Find the parent capability
                const parentCapability = capabilities.find(cap => cap.id === parentId);
                if (!parentCapability) return;
                
                // Find the child component
                const childComponent = parentCapability.children.find(child => child.name === childName);
                if (!childComponent) return;
                
                // Show detailed view for this child
                showChildDetailedView(childComponent, parentCapability);
            });
        });
    }    // Function to show detailed view for a child component
    function showChildDetailedView(child, parentCapability) {
        const detailsPanel = d3.select('#detail-content');
        const content = [];
        const childColor = child.color || parentCapability.color || "#2C3E50";
        
        // Header with breadcrumb navigation
        content.push(`
            <nav aria-label="breadcrumb" class="mb-3">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">
                        <a href="javascript:void(0)" class="back-to-parent" data-parent-id="${parentCapability.id}">
                            <i class="fa fa-arrow-left"></i> ${parentCapability.name}
                        </a>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">${child.name}</li>
                </ol>
            </nav>
        `);
          // Main header section with all child information
        content.push(`
            <div style="border-left: 4px solid ${childColor}; padding-left: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: black;">
                    ${child.icon ? `<i class="fa ${child.icon}" style="color: ${childColor};"></i> ` : ''}${child.name}
                </h2>
                ${child.description ? `<p style="color: #666; margin: 8px 0;">${child.description}</p>` : ''}
                ${child.type ? `<div style="color: #666; font-size: 12px;">Type: ${child.type}</div>` : ''}
            </div>
        `);
        
        // Systems section with full details
        if (child.systems && child.systems.length > 0) {
            content.push('<h3 class="mt-4 mb-3">Systems</h3>');
            
            child.systems.forEach(system => {
                const systemName = typeof system === 'string' ? system : system.name;
                const systemDetails = typeof system === 'object' ? system : null;
                
                content.push(`
                    <div class="card mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center" style="background: ${childColor}22; color: ${childColor};">
                            <div>
                                <i class="fa fa-server me-1"></i>
                                <strong>${systemName}</strong>
                            </div>
                            ${systemDetails?.status ? 
                                `<span class="badge ${getStatusBadgeClass(systemDetails.status)}">${systemDetails.status}</span>` : ''}
                        </div>
                        <div class="card-body">
                            ${systemDetails?.description ? `<p class="card-text">${systemDetails.description}</p>` : ''}
                              ${systemDetails ? `
                                <div class="mt-3">
                                    <ul class="list-group list-group-flush">
                                        ${systemDetails.technology ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-code me-2"></i> Technology</span>
                                                <span class="badge bg-light text-dark">${systemDetails.technology}</span>
                                            </li>` : ''}
                                        ${systemDetails.country ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-globe me-2"></i> Country</span>
                                                <span class="badge bg-light text-dark">
                                                    <span class="fi fi-${systemDetails.country}"></span> ${systemDetails.country.toUpperCase()}
                                                </span>
                                            </li>` : ''}
                                        ${systemDetails.criticality ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-exclamation-circle me-2"></i> Criticality</span>
                                                <span class="badge ${getCriticalityBadgeClass(systemDetails.criticality)}">${systemDetails.criticality}</span>
                                            </li>` : ''}
                                        ${systemDetails.owner ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-user-tie me-2"></i> Owner</span>
                                                <span class="badge bg-light text-dark">${systemDetails.owner}</span>
                                            </li>` : ''}
                                        ${systemDetails.supportLevel ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-headset me-2"></i> Support Level</span>
                                                <span class="badge ${getSupportBadgeClass(systemDetails.supportLevel)}">${systemDetails.supportLevel}</span>
                                            </li>` : ''}
                                        ${systemDetails.deploymentType ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-cloud-upload-alt me-2"></i> Deployment</span>
                                                <span class="badge bg-light text-dark">${systemDetails.deploymentType}</span>
                                            </li>` : ''}
                                        ${systemDetails.annualCost ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-money-bill me-2"></i> Annual Cost</span>
                                                <span class="badge bg-light text-dark">${systemDetails.annualCost}</span>
                                            </li>` : ''}
                                        ${systemDetails.dataClassification ? `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i class="fa fa-shield-alt me-2"></i> Data Classification</span>
                                                <span class="badge ${getDataClassificationBadgeClass(systemDetails.dataClassification)}">${systemDetails.dataClassification}</span>
                                            </li>` : ''}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${systemDetails?.contractEndDate ? `
                                <div class="alert ${getContractAlertClass(systemDetails.contractEndDate)} mt-3" role="alert">
                                    <i class="fa fa-calendar"></i> <strong>Contract End:</strong> ${formatDate(systemDetails.contractEndDate)}
                                    ${getRemainingTimeText(systemDetails.contractEndDate)}
                                </div>
                            ` : ''}
                            
                            ${systemDetails?.integrates && systemDetails.integrates.length > 0 ? `
                                <div class="mt-3">
                                    <h6><i class="fa fa-plug me-1"></i> Integrations:</h6>
                                    <div class="d-flex flex-wrap gap-1 mt-2">
                                        ${systemDetails.integrates.map(int => 
                                            `<span class="badge bg-secondary">${int}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            });
        }
        
        // Data Models section with full details
        if (child.dataModels && child.dataModels.length > 0) {
            content.push('<h3 class="mt-4 mb-3">Data Models</h3>');
            
            child.dataModels.forEach(model => {
                content.push(`
                    <div class="card mb-3">
                        <div class="card-header" style="background: ${childColor}22; color: ${childColor};">
                            ${model.icon ? `<i class="fa ${model.icon} me-2"></i>` : ''}<strong>${model.name}</strong>
                        </div>
                        <div class="card-body">
                            ${model.description ? `<p class="card-text">${model.description}</p>` : ''}
                            
                            ${model.entities && model.entities.length > 0 ? `
                                <div class="mt-3">
                                    <h6><i class="fa fa-database me-1"></i> Entities:</h6>
                                    <div class="d-flex flex-wrap gap-1 mt-2">
                                        ${model.entities.map(entity => 
                                            `<span class="badge bg-light text-dark">${entity}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${model.relationships && model.relationships.length > 0 ? `
                                <div class="mt-3">
                                    <h6><i class="fa fa-project-diagram me-1"></i> Relationships:</h6>
                                    <table class="table table-sm table-bordered">
                                        <thead class="table-light">
                                            <tr>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${model.relationships.map(rel => `
                                                <tr>
                                                    <td>${rel.from}</td>
                                                    <td>${rel.to}</td>
                                                    <td><em>${rel.type}</em></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            });
        }
        
        // Sub-children section with expandable details
        if (child.children && child.children.length > 0) {
            content.push('<h3 class="mt-4 mb-3">Sub-Components</h3>');
            
            // Create accordion-style expandable cards
            content.push('<div class="accordion" id="childAccordion">');
            
            child.children.forEach((subChild, index) => {
                const subColor = subChild.color || childColor;
                const accordionId = `accordion-${index}`;
                
                content.push(`
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="heading-${accordionId}">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#collapse-${accordionId}" aria-expanded="false" aria-controls="collapse-${accordionId}"
                                style="color: ${subColor}">
                                ${subChild.icon ? `<i class="fa ${subChild.icon} me-2"></i>` : ''}${subChild.name}
                            </button>
                        </h2>
                        <div id="collapse-${accordionId}" class="accordion-collapse collapse" aria-labelledby="heading-${accordionId}" 
                             data-bs-parent="#childAccordion">
                            <div class="accordion-body">
                                ${subChild.description ? `<p class="mb-3">${subChild.description}</p>` : ''}
                                ${subChild.type ? `<div class="text-muted mb-3"><small>Type: ${subChild.type}</small></div>` : ''}
                                
                                <!-- Show summary counts for subchild -->
                                <div class="d-flex gap-2 flex-wrap mb-3">
                                    ${subChild.systems && subChild.systems.length > 0 ? 
                                        `<span class="badge bg-primary">${subChild.systems.length} System${subChild.systems.length > 1 ? 's' : ''}</span>` : ''}
                                    ${subChild.dataModels && subChild.dataModels.length > 0 ? 
                                        `<span class="badge bg-info text-dark">${subChild.dataModels.length} Data Model${subChild.dataModels.length > 1 ? 's' : ''}</span>` : ''}
                                    ${subChild.children && subChild.children.length > 0 ? 
                                        `<span class="badge bg-secondary">${subChild.children.length} Sub-Component${subChild.children.length > 1 ? 's' : ''}</span>` : ''}                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
            
            content.push('</div>');
        }
        
        // Check if there's no detailed information to display
        const hasContent = (child.systems && child.systems.length > 0) || 
                          (child.dataModels && child.dataModels.length > 0) || 
                          (child.children && child.children.length > 0);
        
        if (!hasContent) {
            content.push(`
                <div class="alert alert-info mt-4" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="fa fa-info-circle me-3 fa-2x"></i>
                        <div>
                            <h5 class="alert-heading mb-1">No Detailed Information Available</h5>
                            <p class="mb-0">There is no detailed information available for this component at this time.</p>
                        </div>
                    </div>
                </div>
            `);
        }
          detailsPanel.html(content.join(''));
        
        // Reset scroll position to top when showing new details
        document.getElementById('detail-content').scrollTop = 0;
        
        // Add event listener for back button
        document.querySelectorAll('.back-to-parent').forEach(button => {
            button.addEventListener('click', function() {
                const parentId = this.getAttribute('data-parent-id');
                const parentCap = capabilities.find(cap => cap.id === parentId);
                if (parentCap) {
                    showCapabilityDetails(parentCap);
                }
            });
        });
    }
    
    // Helper functions for badges and formatting
    function getStatusBadgeClass(status) {
        switch(status) {
            case 'Production': return 'bg-success';
            case 'Development': return 'bg-warning text-dark';
            case 'Planning': return 'bg-info text-dark';
            case 'Deprecated': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
    
    function getCriticalityBadgeClass(criticality) {
        switch(criticality) {
            case 'Critical': return 'bg-danger';
            case 'High': return 'bg-warning text-dark';
            case 'Medium': return 'bg-info text-dark';
            case 'Low': return 'bg-success';
            default: return 'bg-secondary';
        }
    }
    
    function getSupportBadgeClass(level) {
        switch(level) {
            case 'Platinum': return 'bg-primary';
            case 'Gold': return 'bg-warning text-dark';
            case 'Silver': return 'bg-secondary';
            case 'Bronze': return 'bg-dark';
            default: return 'bg-light text-dark';
        }
    }
    
    function getDataClassificationBadgeClass(classification) {
        switch(classification) {
            case 'Public': return 'bg-success';
            case 'Internal': return 'bg-info text-dark';
            case 'Confidential': return 'bg-warning text-dark';
            case 'Sensitive': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
      function getContractAlertClass(dateStr) {
        const contractDate = new Date(dateStr);
        const today = new Date();
        const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000; // approximate 6 months in milliseconds
        const twelveMonths = 12 * 30 * 24 * 60 * 60 * 1000; // approximate 12 months in milliseconds
        
        if (contractDate < today || (contractDate - today) <= sixMonths) {
            // Red: 6 months or less
            return 'alert-danger';
        } else if ((contractDate - today) <= twelveMonths) {
            // Amber: 6-12 months
            return 'alert-warning';
        } else {
            // Green: over 12 months
            return 'alert-success';
        }
    }
    
    function getRemainingTimeText(dateStr) {
        const contractDate = new Date(dateStr);
        const today = new Date();
        
        if (contractDate < today) {
            return `<strong>(Expired)</strong>`;
        }
        
        // Calculate difference in months
        const months = (contractDate.getFullYear() - today.getFullYear()) * 12 + 
                       (contractDate.getMonth() - today.getMonth());
        
        if (months < 1) {
            // Less than a month, show in days
            const days = Math.round((contractDate - today) / (24 * 60 * 60 * 1000));
            return `<strong>(${days} days remaining)</strong>`;
        } else if (months < 12) {
            return `<strong>(${months} months remaining)</strong>`;
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `<strong>(${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} remaining)</strong>`;
        }
    }
      function formatDate(dateStr) {
        const date = new Date(dateStr);
        // Format as DD MMM YYYY (e.g. "1 January 2025")
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
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
