// EA Catalog Report Logic

async function loadAndRenderCatalogReport() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`data/asis.json?_=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        renderMetadataSummary(data.metadata);
        renderBusinessCapabilities(data.businessCapabilities);
        renderSystems(data.systems);
        renderDataEntities(data.dataEntities);
        renderPlatforms(data.platforms);
        renderDeliveryPrograms(data.deliveryPrograms);
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelectorAll('.card-body').forEach(el => {
            el.innerHTML = '<div class="alert alert-danger">Error loading data: ' + error.message + '</div>';
        });
    }
}

function renderMetadataSummary(metadata) {
    const container = document.getElementById('metadata-summary');
    const lastUpdate = new Date(metadata.lastUpdated).toLocaleDateString();
    const nextReview = new Date(metadata.governance.nextReviewDate).toLocaleDateString();
    
    container.innerHTML = `
        <p class="mb-1"><strong>Catalog Version:</strong> ${metadata.version} (Last Updated: ${lastUpdate})</p>
        <p class="mb-1"><strong>Organisation:</strong> ${metadata.organisation.name} - ${metadata.organisation.division}</p>
        <p class="mb-1"><strong>Framework:</strong> ${metadata.framework.name} v${metadata.framework.version}</p>
        <p class="mb-0"><strong>Next Review:</strong> ${nextReview} (${metadata.governance.reviewCycle} cycle)</p>
    `;
}

function renderBusinessCapabilities(capabilities) {
    const container = document.getElementById('capabilities-content');
    let html = '<div class="capability-tree">';
    
    // First pass to identify root capabilities
    const rootCaps = Object.entries(capabilities).filter(([_, cap]) => !cap.parentId);
    
    // Render capability hierarchy
    function renderCapability(id, cap, level = 0) {
        const padding = level * 20;
        const children = Object.entries(capabilities).filter(([_, c]) => c.parentId === id);
        
        html += `
            <div class="capability-item mb-3" style="margin-left: ${padding}px">
                <div class="d-flex align-items-center">
                    <i class="fas ${cap.icon} me-2" style="color: ${cap.color}"></i>
                    <h3 class="h6 mb-0">${cap.name}</h3>
                </div>
                <p class="text-muted small mb-1">${cap.description}</p>
                ${cap.systemIds && cap.systemIds.length ? `
                    <p class="small mb-0"><strong>Systems:</strong> ${cap.systemIds.join(', ')}</p>
                ` : ''}
            </div>
        `;
        
        children.forEach(([childId, childCap]) => {
            renderCapability(childId, childCap, level + 1);
        });
    }
    
    rootCaps.forEach(([id, cap]) => renderCapability(id, cap));
    html += '</div>';
    container.innerHTML = html;
}

function renderSystems(systems) {    const container = document.getElementById('systems-content');
    
    // Add filter controls
    container.innerHTML = `
        <div class="mb-3 row">
            <div class="col-md-4">
                <input type="text" class="form-control" id="system-search" placeholder="Search systems...">
            </div>
            <div class="col-md-4">
                <select class="form-select" id="status-filter">
                    <option value="">All Statuses</option>
                    <option value="Planning">Planning</option>
                    <option value="Development">Development</option>
                    <option value="Production">Production</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Support">Support</option>
                </select>
            </div>
            <div class="col-md-4">
                <select class="form-select" id="criticality-filter">
                    <option value="">All Criticality Levels</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </div>
        </div>
    `;
    
    let html = '<div class="row" id="systems-grid">';
    
    Object.entries(systems).forEach(([id, sys]) => {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h4 class="h6 mb-0">${sys.name}</h4>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">${sys.description}</p>
                        <div class="mb-2">
                            <span class="badge bg-${getStatusColor(sys.status)}">${sys.status}</span>
                            <span class="badge bg-${getCriticalityColor(sys.criticality)}">${sys.criticality}</span>
                        </div>
                        <dl class="row mb-0">
                            <dt class="col-sm-4">Technology</dt>
                            <dd class="col-sm-8">${sys.technology}</dd>
                            <dt class="col-sm-4">Owner</dt>
                            <dd class="col-sm-8">${sys.owner}</dd>
                            <dt class="col-sm-4">Support</dt>
                            <dd class="col-sm-8">${sys.supportLevel}</dd>
                            <dt class="col-sm-4">Annual Cost</dt>
                            <dd class="col-sm-8">${sys.costs.annualCost}</dd>
                            <dt class="col-sm-4">Data Entities</dt>
                            <dd class="col-sm-8">${sys.dataEntities.join(', ')}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        `;
    });
      html += '</div>';
    container.innerHTML += html;
    
    // Add filter functionality
    const systemSearch = document.getElementById('system-search');
    const statusFilter = document.getElementById('status-filter');
    const criticalityFilter = document.getElementById('criticality-filter');
    const systemsGrid = document.getElementById('systems-grid');
    
    function filterSystems() {
        const searchTerm = systemSearch.value.toLowerCase();
        const status = statusFilter.value;
        const criticality = criticalityFilter.value;
        
        Array.from(systemsGrid.children).forEach(card => {
            const cardBody = card.querySelector('.card-body');
            const name = card.querySelector('.card-header').textContent.toLowerCase();
            const description = cardBody.querySelector('p').textContent.toLowerCase();
            const systemStatus = cardBody.querySelector('.badge').textContent;
            const systemCriticality = cardBody.querySelector('.badge:nth-child(2)').textContent;
            
            const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
            const matchesStatus = !status || systemStatus === status;
            const matchesCriticality = !criticality || systemCriticality === criticality;
            
            card.style.display = matchesSearch && matchesStatus && matchesCriticality ? '' : 'none';
        });
    }
    
    systemSearch.addEventListener('input', filterSystems);
    statusFilter.addEventListener('change', filterSystems);
    criticalityFilter.addEventListener('change', filterSystems);
}

function renderDataEntities(entities) {const container = document.getElementById('entities-content');
    // Add search and filter controls
    container.innerHTML = `
        <div class="mb-3">
            <input type="text" class="form-control" id="entity-search" placeholder="Search entities...">
        </div>
    `;
    let html = '<div class="table-responsive"><table class="table table-hover" id="entities-table">';
    html += `
        <thead>
            <tr>
                <th>Entity</th>
                <th>Description</th>
                <th>Classification</th>
                <th>Relationships</th>
                <th>Attributes</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    Object.entries(entities).forEach(([id, entity]) => {
        html += `
            <tr>
                <td><strong>${entity.name}</strong></td>
                <td>${entity.description}</td>
                <td><span class="badge bg-${getClassificationColor(entity.classification)}">${entity.classification}</span></td>
                <td>
                    ${entity.relationships.map(rel => 
                        `<div class="small">${rel.type} → ${rel.targetEntityId}</div>`
                    ).join('')}
                </td>
                <td>
                    ${entity.attributes.map(attr => 
                        `<div class="small"><strong>${attr.name}</strong>: ${attr.type}</div>`
                    ).join('')}
                </td>
            </tr>
        `;
    });
      html += '</tbody></table></div>';
    container.innerHTML += html;
    
    // Add sorting functionality
    const table = document.getElementById('entities-table');
    const headers = table.getElementsByTagName('th');
    
    Array.from(headers).forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => sortTable(table, index));
    });
    
    // Add search functionality
    const searchInput = document.getElementById('entity-search');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

function renderPlatforms(platforms) {
    const container = document.getElementById('platforms-content');
    
    // Add filter controls
    container.innerHTML = `
        <div class="mb-3 row">
            <div class="col-md-6">
                <input type="text" class="form-control" id="platform-search" placeholder="Search platforms...">
            </div>
            <div class="col-md-6">
                <select class="form-select" id="category-filter">
                    <option value="">All Categories</option>
                </select>
            </div>
        </div>
    `;
    
    // Get unique categories for the filter
    const categories = [...new Set(Object.values(platforms).map(p => p.category))].sort();
    const categoryFilter = document.getElementById('category-filter');
    categories.forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
    
    let html = '<div class="row" id="platforms-grid">';
    
    Object.entries(platforms).forEach(([id, platform]) => {
        html += `
            <div class="col-md-6 mb-4">
                <div class="card h-100">
                    <div class="card-header">
                        <h4 class="h6 mb-0">${platform.name}</h4>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">${platform.description}</p>
                        <dl class="row mb-0">
                            <dt class="col-sm-4">Category</dt>
                            <dd class="col-sm-8">${platform.category}</dd>
                            <dt class="col-sm-4">Vendor</dt>
                            <dd class="col-sm-8">${platform.vendor}</dd>
                            <dt class="col-sm-4">Systems</dt>
                            <dd class="col-sm-8">${platform.systemIds.join(', ')}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML += html;
    
    // Add filter functionality
    const platformSearch = document.getElementById('platform-search');
    const platformsGrid = document.getElementById('platforms-grid');
    
    function filterPlatforms() {
        const searchTerm = platformSearch.value.toLowerCase();
        const category = categoryFilter.value;
        
        Array.from(platformsGrid.children).forEach(card => {
            const cardBody = card.querySelector('.card-body');
            const name = card.querySelector('.card-header').textContent.toLowerCase();
            const description = cardBody.querySelector('p').textContent.toLowerCase();
            const platformCategory = cardBody.querySelector('dd').textContent;
            
            const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
            const matchesCategory = !category || platformCategory === category;
            
            card.style.display = matchesSearch && matchesCategory ? '' : 'none';
        });
    }
    
    platformSearch.addEventListener('input', filterPlatforms);
    categoryFilter.addEventListener('change', filterPlatforms);
}

function renderDeliveryPrograms(programs) {
    const container = document.getElementById('programs-content');
    
    Object.entries(programs).forEach(([id, program]) => {
        const startDate = new Date(program.startDate).toLocaleDateString();
        const endDate = new Date(program.endDate).toLocaleDateString();
        
        container.innerHTML += `
            <div class="card mb-4">
                <div class="card-header">
                    <h4 class="h6 mb-0">${program.name}</h4>
                </div>
                <div class="card-body">
                    <p class="small text-muted">${program.description}</p>
                    <div class="row">
                        <div class="col-md-6">
                            <dl class="row">
                                <dt class="col-sm-4">Status</dt>
                                <dd class="col-sm-8"><span class="badge bg-${getStatusColor(program.status)}">${program.status}</span></dd>
                                <dt class="col-sm-4">Timeline</dt>
                                <dd class="col-sm-8">${startDate} - ${endDate}</dd>
                                <dt class="col-sm-4">Budget</dt>
                                <dd class="col-sm-8">${program.budget}</dd>
                                <dt class="col-sm-4">Sponsor</dt>
                                <dd class="col-sm-8">${program.sponsor}</dd>
                                <dt class="col-sm-4">Systems</dt>
                                <dd class="col-sm-8">${program.systemIds.join(', ')}</dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <h5 class="h6">Milestones</h5>
                            <ul class="list-unstyled">
                                ${program.milestones.map(m => `
                                    <li class="mb-2">
                                        <strong>${m.name}</strong> (${new Date(m.date).toLocaleDateString()})
                                        <br><small class="text-muted">${m.description}</small>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Sorting function for tables
function sortTable(table, columnIndex) {
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    const direction = table.getAttribute('data-sort-dir') === 'asc' ? -1 : 1;
    
    rows.sort((a, b) => {
        const aText = a.getElementsByTagName('td')[columnIndex].textContent;
        const bText = b.getElementsByTagName('td')[columnIndex].textContent;
        return direction * aText.localeCompare(bText);
    });
    
    rows.forEach(row => tbody.appendChild(row));
    table.setAttribute('data-sort-dir', direction === 1 ? 'asc' : 'desc');
}

// Helper functions for styling
function getStatusColor(status) {
    const colors = {
        'Planning': 'primary',
        'Development': 'info',
        'Production': 'success',
        'Retirement': 'secondary',
        'Support': 'warning'
    };
    return colors[status] || 'secondary';
}

function getCriticalityColor(criticality) {
    const colors = {
        'Critical': 'danger',
        'High': 'warning',
        'Medium': 'info',
        'Low': 'secondary'
    };
    return colors[criticality] || 'secondary';
}

function getClassificationColor(classification) {
    const colors = {
        'Public': 'success',
        'Internal': 'info',
        'Confidential': 'warning',
        'Sensitive': 'danger'
    };
    return colors[classification] || 'secondary';
}

// Initialize the report when includes are loaded
document.addEventListener('includesLoaded', function() {
    loadAndRenderCatalogReport();
});

// Fallback initialization
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (!window.includesLoadedDispatched) {
            document.dispatchEvent(new Event('includesLoaded'));
        }
    }, 500);
});
