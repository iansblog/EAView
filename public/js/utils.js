// Include HTML function
async function includeHTML() {
    const elements = document.querySelectorAll('[include-html]');
    
    // Process all includes
    for (let element of elements) {
        const file = element.getAttribute("include-html");
        if (file) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    element.innerHTML = await response.text();
                } else {
                    element.innerHTML = `<p>Error: Could not load ${file}</p>`;
                }
            } catch (error) {
                element.innerHTML = `<p>Error: ${error.message}</p>`;
            }
            
            // Remove the attribute to prevent future processing
            element.removeAttribute("include-html");
            
            // Execute any scripts in the included HTML
            const scripts = element.getElementsByTagName("script");
            for (let script of scripts) {
                const newScript = document.createElement("script");
                newScript.text = script.text;
                if (script.src) newScript.src = script.src;
                script.parentNode.replaceChild(newScript, script);
            }
        }
    }

    // Signal that all includes are finished loading
    window.includesLoadedDispatched = true;
    document.dispatchEvent(new Event('includesLoaded'));
    console.log('All HTML includes loaded successfully');
}

// Run includeHTML when the document is loaded
document.addEventListener("DOMContentLoaded", function() {
    includeHTML().catch(error => {
        console.error('Error loading HTML includes:', error);
        // Dispatch the event even on error, to prevent the site from hanging
        window.includesLoadedDispatched = true;
        document.dispatchEvent(new Event('includesLoaded'));
    });
});
