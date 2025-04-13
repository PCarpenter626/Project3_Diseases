/**
 * Air Quality Dashboard - Main JavaScript
 * 
 * This script handles data fetching, visualization, and user interactions
 * for the Air Quality Dashboard application.
 */

// Global variables
let patientData = [];
let map = null;
let markers = [];

// DOM elements
const loadingIndicator = document.getElementById('loading-indicator');
const refreshButton = document.getElementById('refreshData');
const plotlyContainer = document.getElementById('plotly-graph');
const genderFilter = document.getElementById('genderFilter');

/**
 * Initialize the dashboard
 */
document.addEventListener("DOMContentLoaded", function() {
    // Debug the country dropdown
    console.log("DOM Content Loaded");
    const genderDropdown = document.getElementById('genderFilter');
    if (genderDropdown) {
        console.log("Gender dropdown found:", genderDropdown);
        console.log("Gender count:", genderDropdown.options.length);
        
        // Force a refresh of the dropdown
        for (let i = 0; i < genderDropdown.options.length; i++) {
            console.log(`Option ${i}:`, genderDropdown.options[i].text);
        }
        
        // Force a change event
        genderDropdown.dispatchEvent(new Event('change'));
    } else {
        console.error("Gender dropdown not found!");
    }
    
    // Initial data load
    fetchPatientData();
    
    // Event listeners
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchPatientData);
    }
    
    if (genderFilter) {
        genderFilter.addEventListener('change', function(e) {
            console.log("Gender changed to:", e.target.value);
            fetchPatientData();
        });
    }
    
    // Add city limit control if it exists
    const diseaseLimitSelect = document.getElementById('diseaseLimit');
    if (diseaseLimitSelect) {
        diseaseLimitSelect.addEventListener('change', () => {
            createPlotlyChart(patientData);
        });
    }
});

/**
 * Fetch air quality data from the API
 */
function fetchPatientData() {
    console.log("fetchPatientData called")
    showLoading(true);
    
    // Get selected country from filter
    const selectedGender = genderFilter ? genderFilter.value : 'All';
    
    fetch(`/api/patients?gender=${selectedGender}`)
        .then(response => {
            if (!response.ok) {
                console.log(`Network response was not ok: ${response.status}`)
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            patientData = data;
            console.log('Data loaded:', data);
            
            // Process and display data
            createPlotlyChart(data);
            
            // Initialize map if it hasn't been created yet
            if (map === null && document.getElementById('map-view')) {
                initializeMap();
            } else if (map !== null) {
                updateMapMarkers(data);
            }
            
            showLoading(false);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            showLoading(false);
            
            // Show error message to user
            alert(`Failed to load data: ${error.message}`);
        });
}

function countValueOccurrences(data) {
    const counts = {};
    for (const obj of data) {
      const value = obj.Disease;
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
}
  
/**
 * Create Plotly chart with air quality data
 */
function createPlotlyChart(data) {
    console.log("createPlotlyChart called")
    const diseases = countValueOccurrences(data)
    var sortedDiseases= Object.entries(diseases).sort((a,b) => b[1] - a[1])
    console.log(sortedDiseases)
   
    // Get disease limit from select element (default to 5)

    const diseaseLimitSelect = document.getElementById('diseaseLimit');
    const diseaseLimit = diseaseLimitSelect ? parseInt(diseaseLimitSelect.value, 10) : 5;
    
    // If there are more diseases than the limit, only show the first N
    if (sortedDiseases.length > diseaseLimit) {
        // Only take the first N diseases
        sortedDiseases = sortedDiseases.slice(0, diseaseLimit);
    }
    const dNames = sortedDiseases.map(d => d[0])
    const dValues = sortedDiseases.map(d => d[1])

    
    // Prepare data for chart
    const chartData = [];
    
    // Process data for PM2.5

    const pm25Data = {
        x: dNames,
        y: dValues,
        name: '',
        type: 'bar',
        marker: {
            color: 'rgb(49, 130, 189)'
        }
    };

    // Process data for PM10
    const pm10Data = {
        x: dNames,
        y: dValues,
        name: 'PM10',
        type: 'bar',
        marker: {
            color: 'rgb(204, 204, 0)'
        }
    };
    
    //chartData.push(pm25Data, pm10Data);
    chartData.push(pm25Data);

    // Chart layout
    const layout = {
        title: `Patient Diseases (Top ${sortedDiseases.length})`,
        barmode: 'group',
        xaxis: {
            title: 'Disease',
            tickangle: -45
        },
        yaxis: {
            title: 'Count'
        },
        legend: {
            x: 0,
            y: 1
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            l: 50,
            r: 50,
            b: 150, // Increased to accommodate angled labels
            t: 50,
            pad: 4
        }
    };
    
    // Create chart
    Plotly.newPlot('plotly-graph', chartData, layout, {responsive: true});
}


/**
 * Show or hide loading indicator
 */
function showLoading(isLoading) {
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
}
