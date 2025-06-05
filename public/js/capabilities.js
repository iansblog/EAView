function renderCapabilitiesView(container, data) {
    // Clear container
    container.innerHTML = '';
    
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    let height = Math.max(container.clientHeight, 800) - margin.top - margin.bottom;

    // Process capabilities into hierarchy
    const capabilities = Object.entries(data.businessCapabilities).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description,
        children: value.children || []
    }));

    // Calculate total height needed
    const blockSpacing = 30;
    const blockWidth = (width - blockSpacing * 3) / 2;
    const headerHeight = 40;

    // Calculate block heights and total height needed
    function calculateBlockHeight(capability) {
        const minHeight = 150;
        const childHeight = 80;
        const totalChildrenHeight = (capability.children?.length || 0) * childHeight;
        return Math.max(minHeight, headerHeight + totalChildrenHeight + 40);
    }

    // Calculate total height needed for all blocks
    const rows = Math.ceil(capabilities.length / 2);
    const totalHeight = rows * (calculateBlockHeight(capabilities[0]) + blockSpacing);
    height = Math.max(height, totalHeight);

    // Create SVG with calculated height
    const svg = d3.select(container)
        .append("svg")
        .attr("width", container.clientWidth)
        .attr("height", height + margin.top + margin.bottom);

    // Main group for all content
    const mainGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create blocks for capabilities
    capabilities.forEach((cap, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col * (blockWidth + blockSpacing);
        const y = row * (calculateBlockHeight(cap) + blockSpacing);

        // Create block container
        const block = mainGroup.append("g")
            .attr("class", "capability-block")
            .attr("transform", `translate(${x},${y})`);

        // Add block background
        const blockHeight = calculateBlockHeight(cap);
        block.append("rect")
            .attr("width", blockWidth)
            .attr("height", blockHeight)
            .attr("rx", 8)
            .attr("fill", "#ffffff")
            .attr("stroke", "#2C3E50")
            .attr("stroke-width", 2)
            .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

        // Add block header
        const header = block.append("g")
            .attr("class", "block-header")
            .style("cursor", "pointer")
            .on("click", () => showCapabilityDetails(cap));

        // Header background
        header.append("rect")
            .attr("width", blockWidth)
            .attr("height", headerHeight)
            .attr("rx", 8)
            .attr("fill", "#2C3E50");

        // Header text
        header.append("text")
            .attr("x", 20)
            .attr("y", headerHeight / 2)
            .attr("fill", "#fff")
            .attr("dominant-baseline", "central")
            .attr("font-size", "16px")
            .attr("font-weight", "500")
            .text(cap.name);

        // Add children
        if (cap.children && cap.children.length > 0) {
            cap.children.forEach((child, j) => {
                const childGroup = block.append("g")
                    .attr("transform", `translate(10,${headerHeight + 20 + j * 80})`)
                    .style("cursor", "pointer")
                    .on("click", () => showCapabilityDetails(child, cap));

                // Child background
                childGroup.append("rect")
                    .attr("width", blockWidth - 20)
                    .attr("height", 70)
                    .attr("rx", 6)
                    .attr("fill", "#f8f9fa")
                    .attr("stroke", "#2C3E50")
                    .attr("stroke-width", 1);

                // Child name
                childGroup.append("text")
                    .attr("x", 15)
                    .attr("y", 25)
                    .attr("font-size", "14px")
                    .attr("font-weight", "500")
                    .text(child.name);

                // Child description
                childGroup.append("text")
                    .attr("x", 15)
                    .attr("y", 45)
                    .attr("font-size", "12px")
                    .attr("fill", "#666")
                    .text(child.description);

                // System count badge
                if (child.systems) {
                    const badge = childGroup.append("g")
                        .attr("transform", `translate(${blockWidth - 50}, 15)`);

                    badge.append("rect")
                        .attr("width", 30)
                        .attr("height", 20)
                        .attr("rx", 10)
                        .attr("fill", "#3498db");

                    badge.append("text")
                        .attr("x", 15)
                        .attr("y", 10)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "central")
                        .attr("fill", "#fff")
                        .attr("font-size", "12px")
                        .text(child.systems.length);
                }
            });
        }
    });

    // Function to show capability details
    function showCapabilityDetails(capability, parentCapability) {
        const detailsPanel = d3.select('#detail-content');
        const content = [];

        const title = parentCapability ? 
            `${parentCapability.name} > ${capability.name}` :
            capability.name;

        content.push(`
            <div style="border-left: 4px solid #2C3E50; padding-left: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #2C3E50;">${title}</h2>
                <p style="color: #666; margin: 8px 0;">${capability.description}</p>
            </div>
        `);

        if (capability.systems) {
            content.push('<h3 style="margin: 20px 0 10px 0;">Supporting Systems</h3>');
            capability.systems.forEach(systemName => {
                // Find system details in the main capabilities structure
                const systemDetails = findSystemByName(data.capabilities, systemName);
                content.push(`
                    <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                        <strong>${systemName}</strong>
                        ${systemDetails?.technology ? 
                            `<div style="font-size: 13px; color: #666; margin-top: 5px;">Technology: ${systemDetails.technology}</div>` : 
                            ''}
                        ${systemDetails?.status ? 
                            `<div style="font-size: 13px; color: #666;">Status: ${systemDetails.status}</div>` : 
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
