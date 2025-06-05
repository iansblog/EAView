// Main application logic
let currentView = 'hexgrid';
let capData = null;

// Load data
async function loadData() {
    try {
        const response = await fetch('cap.json');
        capData = await response.json();
        renderCurrentView();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Handle navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        currentView = e.target.dataset.view;
        renderCurrentView();
    });
});

// Render the current view
function renderCurrentView() {
    if (!capData) return;
    
    const viz = document.getElementById('visualization');
    viz.innerHTML = '';    switch(currentView) {
        case 'hexgrid':
            renderCapabilityHexGrid(viz, capData);
            break;
        case 'capabilities':
            renderCapabilitiesView(viz, capData);
            break;
        case 'chord':
            renderChordDiagram(viz, capData);
            break;
        case 'network':
            renderNetworkGraph(viz, capData);
            break;
        case 'cluster':
            renderClusterDiagram(viz, capData);
            break;
    }
}

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

// Initialize
loadData();
