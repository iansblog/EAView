// Main application logic - Shared utility functions for all views

// Update details panel
function updateDetails(data) {
    const detailContent = document.getElementById('detail-content');
    let html = '<div class="detail-content">';
    
    if (data.name) {
        html += `<h6>${data.name}</h6>`;
    }
    
    if (data.description) {
        html += `<p>${data.description}</p>`;
    }
    
    if (data.entities) {
        html += '<h6>Entities:</h6><ul>';
        data.entities.forEach(entity => {
            html += `<li>${entity}</li>`;
        });
        html += '</ul>';
    }
      if (data.relationships) {
        html += '<h6>Relationships:</h6><ul>';
        data.relationships.forEach(rel => {
            html += `<li>${rel.from} &rarr; ${rel.to} (${rel.type})</li>`;
        });
        html += '</ul>';
    }
      html += '</div>';
    detailContent.innerHTML = html;
}

// Enhanced update details function specifically for entity relationships
function updateEntityDetails(data) {
    const detailContent = document.getElementById('detail-content');
    let html = '<div class="entity-detail-content">';
    
    // Entity header with icon and color
    if (data.name) {
        html += `<div style="border-left: 4px solid ${data.color || '#333'}; padding-left: 10px; margin-bottom: 15px;">`;
        html += `<h5 style="color: ${data.color || '#333'}; margin: 0;">`;
        if (data.icon) {
            html += `<i class="fa ${data.icon}" style="margin-right: 8px;"></i>`;
        }
        html += `${data.name}</h5>`;
        if (data.description) {
            html += `<p style="margin: 5px 0; color: #666;">${data.description}</p>`;
        }
        html += '</div>';
    }
    
    // Attributes section
    if (data.attributes && data.attributes.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-list me-2"></i>Attributes:</h6>';
        html += '<div class="d-flex flex-wrap gap-1">';
        data.attributes.forEach(attr => {
            html += `<span class="badge bg-light text-dark">${attr}</span>`;
        });
        html += '</div></div>';
    }
    
    // Relationships section with proper arrows
    if (data.relationships && data.relationships.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-project-diagram me-2"></i>Relationships:</h6>';
        html += '<ul class="entity-relationships-list">';
        data.relationships.forEach(rel => {
            html += `<li><i class="fa fa-arrow-right me-2" style="color: ${data.color || '#333'};"></i>${rel.from}<span class="relationship-arrow">&rarr;</span>${rel.to} <em>(${rel.type})</em></li>`;
        });
        html += '</ul></div>';
    }
    
    // Using Systems section
    if (data.usingSystems && data.usingSystems.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-cogs me-2"></i>Used by Systems:</h6>';
        data.usingSystems.forEach(system => {
            html += `<div class="card mb-2" style="border-left: 3px solid ${data.color || '#333'};">`;
            html += '<div class="card-body p-2">';
            html += `<h6 class="card-title mb-1" style="font-size: 0.9rem;">${system.name}</h6>`;
            if (system.path) {
                html += `<p class="card-text mb-1" style="font-size: 0.8rem; color: #666;">${system.path}</p>`;
            }
            html += '<div class="d-flex gap-2">';
            if (system.technology) {
                html += `<span class="badge bg-info text-dark system-badge">${system.technology}</span>`;
            }
            if (system.status) {
                const statusClass = system.status === 'Production' ? 'bg-success' : 
                                  system.status === 'Development' ? 'bg-warning text-dark' : 'bg-secondary';
                html += `<span class="badge ${statusClass} system-badge">${system.status}</span>`;
            }
            html += '</div></div></div>';
        });
        html += '</div>';
    }
    
    // Using Capabilities section
    if (data.usingCapabilities && data.usingCapabilities.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-cubes me-2"></i>Related Capabilities:</h6>';
        html += '<div class="d-flex flex-wrap gap-1">';
        data.usingCapabilities.forEach(cap => {
            html += `<span class="badge" style="background-color: ${data.color || '#333'}; color: white;">${cap}</span>`;
        });
        html += '</div></div>';
    }
    
    // No information message if entity has minimal data
    if ((!data.usingSystems || data.usingSystems.length === 0) && 
        (!data.usingCapabilities || data.usingCapabilities.length === 0) && 
        (!data.relationships || data.relationships.length === 0)) {
        html += `<div class="alert alert-info mt-3" role="alert">`;
        html += `<div class="d-flex align-items-center">`;
        html += `<i class="fa fa-info-circle me-3"></i>`;
        html += `<div>`;
        html += `<h6 class="alert-heading mb-1">Limited Information Available</h6>`;
        html += `<p class="mb-0">This entity has basic definition but limited usage details in the current system architecture.</p>`;
        html += `</div></div></div>`;
    }
    
    html += '</div>';
    detailContent.innerHTML = html;
}

// Enhanced update details function specifically for data flow systems
function updateSystemDetails(data) {
    const detailContent = document.getElementById('detail-content');
    let html = '<div class="system-details-content">';
    
    // System header with technology and status
    if (data.name) {
        const statusColor = data.status === 'Production' ? '#28a745' : 
                           data.status === 'Development' ? '#ffc107' : '#6c757d';
        
        html += `<div style="border-left: 4px solid ${statusColor}; padding-left: 10px; margin-bottom: 15px;">`;
        html += `<h6 style="color: ${statusColor}; margin: 0; font-weight: bold;">`;
        html += `<i class="fa fa-server me-2"></i>${data.name}</h6>`;
        if (data.description) {
            html += `<p style="margin: 5px 0; color: #666; font-size: 0.9rem;">${data.description}</p>`;
        }
        html += '</div>';
    }
    
    // System properties
    if (data.technology || data.status || data.owner || data.criticality) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-cog me-2"></i>System Properties:</h6>';
        html += '<div class="row g-2">';
        
        if (data.technology) {
            html += `<div class="col-12"><span class="badge bg-info text-dark system-integration-badge">Tech: ${data.technology}</span></div>`;
        }
        if (data.status) {
            const statusClass = data.status === 'Production' ? 'bg-success' : 
                               data.status === 'Development' ? 'bg-warning text-dark' : 'bg-secondary';
            html += `<div class="col-12"><span class="badge ${statusClass} system-integration-badge">Status: ${data.status}</span></div>`;
        }
        if (data.owner) {
            html += `<div class="col-12"><span class="badge bg-dark system-integration-badge">Owner: ${data.owner}</span></div>`;
        }
        if (data.criticality) {
            const criticalityClass = data.criticality === 'Critical' ? 'bg-danger' : 
                                    data.criticality === 'High' ? 'bg-warning text-dark' : 'bg-secondary';
            html += `<div class="col-12"><span class="badge ${criticalityClass} system-integration-badge">Criticality: ${data.criticality}</span></div>`;
        }
        
        html += '</div></div>';
    }
    
    // Financial and operational details
    if (data.annualCost || data.contractEndDate || data.deploymentType) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-chart-line me-2"></i>Operational Details:</h6>';
        html += '<ul class="list-unstyled">';
        
        if (data.annualCost) {
            html += `<li><i class="fa fa-dollar-sign me-2"></i><strong>Annual Cost:</strong> ${data.annualCost}</li>`;
        }
        if (data.deploymentType) {
            html += `<li><i class="fa fa-cloud me-2"></i><strong>Deployment:</strong> ${data.deploymentType}</li>`;
        }
        if (data.contractEndDate) {
            html += `<li><i class="fa fa-calendar me-2"></i><strong>Contract Ends:</strong> ${data.contractEndDate}</li>`;
        }
        
        html += '</ul></div>';
    }
    
    // Integration relationships with proper arrows
    if (data.relationships && data.relationships.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-exchange-alt me-2"></i>Data Flow Connections:</h6>';
        html += '<div class="integration-list">';
        
        data.relationships.forEach(rel => {
            const isSource = rel.from === data.name;
            const direction = isSource ? 'outgoing' : 'incoming';
            const arrowIcon = isSource ? 'fa-arrow-right' : 'fa-arrow-left';
            const targetSystem = isSource ? rel.to : rel.from;
            
            html += `<div class="d-flex align-items-center mb-2 p-2" style="background-color: #f8f9fa; border-radius: 4px;">`;
            html += `<i class="fa ${arrowIcon} me-2" style="color: ${isSource ? '#28a745' : '#17a2b8'};"></i>`;
            html += `<span class="flex-grow-1">${targetSystem}</span>`;
            html += `<span class="badge ${isSource ? 'bg-success' : 'bg-info'} ms-2">${direction}</span>`;
            html += '</div>';
        });
        
        html += '</div></div>';
    }
    
    // Group/capability information
    if (data.group && data.group !== 'Integration Target') {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-layer-group me-2"></i>Business Capability:</h6>';
        html += `<span class="badge" style="background-color: #6c757d; color: white; padding: 0.5rem 1rem;">${data.group}</span>`;
        html += '</div>';
    }
    
    // Security and compliance
    if (data.dataClassification || data.supportLevel) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-shield-alt me-2"></i>Security & Support:</h6>';
        html += '<div class="d-flex gap-2 flex-wrap">';
        
        if (data.dataClassification) {
            const classificationClass = data.dataClassification === 'Sensitive' ? 'bg-danger' :
                                       data.dataClassification === 'Confidential' ? 'bg-warning text-dark' :
                                       data.dataClassification === 'Internal' ? 'bg-info text-dark' : 'bg-success';
            html += `<span class="badge ${classificationClass}">${data.dataClassification}</span>`;
        }
        if (data.supportLevel) {
            const supportClass = data.supportLevel === 'Platinum' ? 'bg-dark' :
                                data.supportLevel === 'Gold' ? 'bg-warning text-dark' :
                                data.supportLevel === 'Silver' ? 'bg-secondary' : 'bg-light text-dark';
            html += `<span class="badge ${supportClass}">${data.supportLevel} Support</span>`;
        }
        
        html += '</div></div>';
    }
    
    // No integration message if system has no connections
    if ((!data.relationships || data.relationships.length === 0)) {
        html += `<div class="alert alert-info mt-3" role="alert">`;
        html += `<div class="d-flex align-items-center">`;
        html += `<i class="fa fa-info-circle me-3"></i>`;
        html += `<div>`;
        html += `<h6 class="alert-heading mb-1">No Data Flow Connections</h6>`;
        html += `<p class="mb-0">This system currently has no documented data flow connections with other systems.</p>`;
        html += `</div></div></div>`;
    }
    
    html += '</div>';
    detailContent.innerHTML = html;
}

// Enhanced update details function specifically for system clusters
function updateClusterDetails(data) {
    const detailContent = document.getElementById('detail-content');
    let html = '<div class="system-details-content">';
    
    // Node header with type and color
    if (data.name) {
        const nodeTypeIcon = data.nodeType === 'Root' ? 'fa-server' : 
                            data.nodeType === 'Capability' ? 'fa-cubes' : 'fa-cog';
        const statusColor = data.color || (data.status === 'Production' ? '#28a745' : 
                           data.status === 'Development' ? '#ffc107' : '#6c757d');
        
        html += `<div style="border-left: 4px solid ${statusColor}; padding-left: 10px; margin-bottom: 15px;">`;
        html += `<h6 style="color: ${statusColor}; margin: 0; font-weight: bold;">`;
        html += `<i class="fa ${nodeTypeIcon} me-2"></i>${data.name}</h6>`;
        
        if (data.nodeType) {
            html += `<small class="text-muted">Node Type: ${data.nodeType}</small><br>`;
        }
        
        if (data.description) {
            html += `<p style="margin: 5px 0; color: #666; font-size: 0.9rem;">${data.description}</p>`;
        }
        html += '</div>';
    }
    
    // Node-specific information
    if (data.nodeType === 'Root' && data.childrenCount > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-sitemap me-2"></i>Organization Overview:</h6>';
        html += `<p class="mb-2">This is the root of the system architecture containing <strong>${data.childrenCount}</strong> major business capabilities.</p>`;
        html += '</div>';
    } else if (data.nodeType === 'Capability' && data.childrenCount > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-layer-group me-2"></i>Capability Overview:</h6>';
        html += `<p class="mb-2">This business capability contains <strong>${data.childrenCount}</strong> systems.</p>`;
        html += '</div>';
    }
    
    // System properties (for systems and capabilities)
    if (data.technology || data.status || data.owner || data.criticality) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-info-circle me-2"></i>Properties:</h6>';
        html += '<div class="row g-2">';
        
        if (data.technology) {
            html += `<div class="col-12"><span class="badge bg-info text-dark">Tech: ${data.technology}</span></div>`;
        }
        if (data.status) {
            const statusClass = data.status === 'Production' ? 'bg-success' : 
                               data.status === 'Development' ? 'bg-warning text-dark' : 'bg-secondary';
            html += `<div class="col-12"><span class="badge ${statusClass}">Status: ${data.status}</span></div>`;
        }
        if (data.owner) {
            html += `<div class="col-12"><span class="badge bg-dark">Owner: ${data.owner}</span></div>`;
        }
        if (data.criticality) {
            const criticalityClass = data.criticality === 'Critical' ? 'bg-danger' : 
                                    data.criticality === 'High' ? 'bg-warning text-dark' : 'bg-secondary';
            html += `<div class="col-12"><span class="badge ${criticalityClass}">Criticality: ${data.criticality}</span></div>`;
        }
        
        html += '</div></div>';
    }
    
    // Financial and operational details
    if (data.annualCost || data.contractEndDate || data.deploymentType) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-chart-line me-2"></i>Operational Details:</h6>';
        html += '<ul class="list-unstyled">';
        
        if (data.annualCost) {
            html += `<li><i class="fa fa-dollar-sign me-2"></i><strong>Annual Cost:</strong> ${data.annualCost}</li>`;
        }
        if (data.deploymentType) {
            html += `<li><i class="fa fa-cloud me-2"></i><strong>Deployment:</strong> ${data.deploymentType}</li>`;
        }
        if (data.contractEndDate) {
            html += `<li><i class="fa fa-calendar me-2"></i><strong>Contract Ends:</strong> ${data.contractEndDate}</li>`;
        }
        
        html += '</ul></div>';
    }
    
    // Integration relationships
    if (data.relationships && data.relationships.length > 0) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-exchange-alt me-2"></i>Integrations:</h6>';
        html += '<div class="integration-list">';
        
        data.relationships.forEach(rel => {
            html += `<div class="d-flex align-items-center mb-2 p-2" style="background-color: #f8f9fa; border-radius: 4px;">`;
            html += `<i class="fa fa-arrow-right me-2" style="color: #28a745;"></i>`;
            html += `<span class="flex-grow-1">${rel.to}</span>`;
            html += `<span class="badge bg-success ms-2">integration</span>`;
            html += '</div>';
        });
        
        html += '</div></div>';
    }
    
    // Security and support
    if (data.dataClassification || data.supportLevel) {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-shield-alt me-2"></i>Security & Support:</h6>';
        html += '<div class="d-flex gap-2 flex-wrap">';
        
        if (data.dataClassification) {
            const classificationClass = data.dataClassification === 'Sensitive' ? 'bg-danger' :
                                       data.dataClassification === 'Confidential' ? 'bg-warning text-dark' :
                                       data.dataClassification === 'Internal' ? 'bg-info text-dark' : 'bg-success';
            html += `<span class="badge ${classificationClass}">${data.dataClassification}</span>`;
        }
        if (data.supportLevel) {
            const supportClass = data.supportLevel === 'Platinum' ? 'bg-dark' :
                                data.supportLevel === 'Gold' ? 'bg-warning text-dark' :
                                data.supportLevel === 'Silver' ? 'bg-secondary' : 'bg-light text-dark';
            html += `<span class="badge ${supportClass}">${data.supportLevel} Support</span>`;
        }
        
        html += '</div></div>';
    }
    
    // Group/capability information
    if (data.group && data.group !== 'Integration Target') {
        html += '<div class="mb-3">';
        html += '<h6><i class="fa fa-layer-group me-2"></i>Business Capability:</h6>';
        html += `<span class="badge" style="background-color: ${data.color || '#6c757d'}; color: white; padding: 0.5rem 1rem;">${data.group}</span>`;
        html += '</div>';
    }
    
    // No integration message if applicable
    if (data.nodeType === 'System' && (!data.relationships || data.relationships.length === 0)) {
        html += `<div class="alert alert-info mt-3" role="alert">`;
        html += `<div class="d-flex align-items-center">`;
        html += `<i class="fa fa-info-circle me-3"></i>`;
        html += `<div>`;
        html += `<h6 class="alert-heading mb-1">No Integration Connections</h6>`;
        html += `<p class="mb-0">This system currently has no documented integration connections with other systems.</p>`;
        html += `</div></div></div>`;
    }
    
    html += '</div>';
    detailContent.innerHTML = html;
}

// Helper function to normalize data structure for compatibility across views
function normalizeCapabilityData(data) {
    // Add debug logging
    console.log('Normalizing data structure:', data);
    
    // Ensure both capabilities and businessCapabilities are available
    if (data.businessCapabilities && !data.capabilities) {
        data.capabilities = data.businessCapabilities;
        console.log('Added capabilities property');
    } else if (data.capabilities && !data.businessCapabilities) {
        data.businessCapabilities = data.capabilities;
        console.log('Added businessCapabilities property');
    }
    
    // If neither exists, create empty objects
    if (!data.capabilities) {
        data.capabilities = {};
        console.log('Created empty capabilities object');
    }
    
    if (!data.businessCapabilities) {
        data.businessCapabilities = {};
        console.log('Created empty businessCapabilities object');
    }
    
    return data;
}
