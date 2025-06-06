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
            html += `<li>${rel.from} → ${rel.to} (${rel.type})</li>`;
        });
        html += '</ul>';
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
