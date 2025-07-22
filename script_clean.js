// Enhanced script for displaying all villages with proper polygon shapes and name correction

// Global variables
let map;
let districtLayer;
let ssLayer;
let villageLayer;
let villageLabelsLayer;
let currentSelection = {
    district: null,
    ss: null,
    village: null
};

// Data storage
let geoData = {
    districts: null,
    ss: null,
    villages: null
};

// Village display settings
let showVillageLabels = true;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadShapefiles();
});

// Initialize Leaflet map with better settings for villages
function initializeMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([22.2, 88.8], 9); // Better center for Sundarban
    
    // Add multiple base map options
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 18
    });
    
    // Add default layer
    osmLayer.addTo(map);
    
    // Layer control
    const baseMaps = {
        "OpenStreetMap": osmLayer,
        "Satellite": satelliteLayer
    };
    
    L.control.layers(baseMaps).addTo(map);
    
    // Add scale control
    L.control.scale({
        position: 'bottomleft'
    }).addTo(map);
}

// Enhanced event listeners
function setupEventListeners() {
    // District selection
    document.getElementById('district-select').addEventListener('change', function() {
        const selectedDistrict = this.value;
        handleDistrictSelection(selectedDistrict);
    });
    
    // SS selection
    document.getElementById('ss-select').addEventListener('change', function() {
        const selectedSS = this.value;
        handleSSSelection(selectedSS);
    });
    
    // Village selection
    document.getElementById('village-select').addEventListener('change', function() {
        const selectedVillage = this.value;
        handleVillageSelection(selectedVillage);
    });
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', resetSelection);
    
    // Zoom button
    document.getElementById('zoom-btn').addEventListener('click', zoomToSelection);
    
    // Layer toggle
    document.getElementById('layer-toggle').addEventListener('click', toggleLayers);
    
    // Add search functionality
    addSearchControl();
}

// Add search control for villages
function addSearchControl() {
    const searchControl = L.control({ position: 'topright' });
    
    searchControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'search-control');
        div.innerHTML = `
            <input type="text" id="village-search" placeholder="Search villages..." 
                   style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 200px;">
            <button id="search-btn" style="padding: 8px 12px; margin-left: 5px; background: #2c5530; color: white; border: none; border-radius: 4px;">Search</button>
        `;
        
        // Prevent map events when interacting with search
        L.DomEvent.disableClickPropagation(div);
        
        return div;
    };
    
    searchControl.addTo(map);
    
    // Search functionality
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'search-btn') {
            searchVillages();
        }
    });
    
    document.addEventListener('keypress', function(e) {
        if (e.target && e.target.id === 'village-search' && e.key === 'Enter') {
            searchVillages();
        }
    });
}

// Search villages function
function searchVillages() {
    const searchTerm = document.getElementById('village-search').value.toLowerCase().trim();
    
    if (!searchTerm || !geoData.villages) {
        return;
    }
    
    const villageProp = getVillagePropertyName();
    const matchingVillages = geoData.villages.features.filter(feature => {
        const villageName = feature.properties[villageProp] || '';
        const cleanName = feature.properties.village_clean || villageName;
        return villageName.toLowerCase().includes(searchTerm) || 
               cleanName.toLowerCase().includes(searchTerm);
    });
    
    if (matchingVillages.length > 0) {
        // Highlight matching villages
        highlightSearchResults(matchingVillages);
        
        // Show results count
        alert(`Found ${matchingVillages.length} villages matching "${searchTerm}"`);
        
        // Zoom to first result
        if (matchingVillages.length === 1) {
            const feature = matchingVillages[0];
            selectVillageFromFeature(feature);
        }
    } else {
        alert(`No villages found matching "${searchTerm}"`);
    }
}

// Load shapefiles with enhanced village handling
async function loadShapefiles() {
    showLoading(true);
    
    try {
        await loadActualData();
        populateDropdowns();
        showLoading(false);
        
        // Show village count
        if (geoData.villages) {
            console.log(`Loaded ${geoData.villages.features.length} villages`);
            updateVillageCount();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        await loadSampleData();
        populateDropdowns();
        showLoading(false);
    }
}

// Load actual GeoJSON data
async function loadActualData() {
    try {
        // Load all three GeoJSON files
        const responses = await Promise.allSettled([
            fetch('data/districts.geojson'),
            fetch('data/ss.geojson'),
            fetch('data/villages.geojson')
        ]);
        
        // Check districts
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
            geoData.districts = await responses[0].value.json();
        }
        
        // Check SS areas
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
            geoData.ss = await responses[1].value.json();
        }
        
        // Check villages
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
            geoData.villages = await responses[2].value.json();
        }
        
        // If any failed, use sample data
        if (!geoData.districts || !geoData.ss || !geoData.villages) {
            console.log('Some GeoJSON files not found, using sample data...');
            await loadSampleData();
        } else {
            console.log('Loaded actual data:');
            console.log('Districts:', geoData.districts.features.length);
            console.log('SS areas:', geoData.ss.features.length);
            console.log('Villages:', geoData.villages.features.length);
        }
        
        addLayersToMap();
        
    } catch (error) {
        console.error('Error loading GeoJSON data:', error);
        await loadSampleData();
    }
}

// Load sample data (fallback if GeoJSON files are not available)
async function loadSampleData() {
    console.log('Loading sample/fallback data...');
    
    // Simple sample data for demonstration
    geoData.districts = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    district: "24 Paraganas South"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[88.5, 21.5], [89.5, 21.5], [89.5, 22.5], [88.5, 22.5], [88.5, 21.5]]]
                }
            }
        ]
    };
    
    geoData.ss = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    subdistric: "Basanti",
                    district: "24 Paraganas South"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[88.5, 21.5], [89.0, 21.5], [89.0, 22.0], [88.5, 22.0], [88.5, 21.5]]]
                }
            },
            {
                type: "Feature",
                properties: {
                    subdistric: "Gosaba",
                    district: "24 Paraganas South"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[89.0, 21.5], [89.5, 21.5], [89.5, 22.0], [89.0, 22.0], [89.0, 21.5]]]
                }
            }
        ]
    };
    
    geoData.villages = {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    village: "Satjelia",
                    village_clean: "Satjelia",
                    subdistric_name: "Basanti",
                    district_name: "24 Paraganas South",
                    area_km2: 2.5
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[88.5, 21.5], [88.75, 21.5], [88.75, 21.75], [88.5, 21.75], [88.5, 21.5]]]
                }
            },
            {
                type: "Feature",
                properties: {
                    village: "Kumirmari",
                    village_clean: "Kumirmari",
                    subdistric_name: "Basanti", 
                    district_name: "24 Paraganas South",
                    area_km2: 1.8
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[88.75, 21.5], [89.0, 21.5], [89.0, 21.75], [88.75, 21.75], [88.75, 21.5]]]
                }
            },
            {
                type: "Feature",
                properties: {
                    village: "Lahiripur",
                    village_clean: "Lahiripur",
                    subdistric_name: "Gosaba",
                    district_name: "24 Paraganas South",
                    area_km2: 3.2
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[[89.0, 21.5], [89.25, 21.5], [89.25, 21.75], [89.0, 21.75], [89.0, 21.5]]]
                }
            }
        ]
    };
    
    addLayersToMap();
}

// Add all layers to map with enhanced village display
function addLayersToMap() {
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    // District layer
    if (geoData.districts) {
        districtLayer = L.geoJSON(geoData.districts, {
            style: {
                color: '#ff6347',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.1,
                dashArray: '5, 5'
            },
            onEachFeature: function(feature, layer) {
                const districtName = feature.properties[districtProp] || 'Unknown District';
                layer.bindPopup(`<strong>District:</strong> ${districtName}`);
                layer.on('click', function() {
                    document.getElementById('district-select').value = districtName;
                    handleDistrictSelection(districtName);
                });
            }
        }).addTo(map);
    }
    
    // SS layer
    if (geoData.ss) {
        ssLayer = L.geoJSON(geoData.ss, {
            style: {
                color: '#36a2eb',
                weight: 2,
                opacity: 0.7,
                fillOpacity: 0.2
            },
            onEachFeature: function(feature, layer) {
                const ssName = feature.properties[ssProp] || 'Unknown SS';
                const districtName = feature.properties[districtProp] || 'Unknown District';
                layer.bindPopup(`<strong>SS:</strong> ${ssName}<br><strong>District:</strong> ${districtName}`);
                layer.on('click', function() {
                    if (currentSelection.district !== districtName) {
                        document.getElementById('district-select').value = districtName;
                        handleDistrictSelection(districtName);
                    }
                    document.getElementById('ss-select').value = ssName;
                    handleSSSelection(ssName);
                });
            }
        }).addTo(map);
    }
    
    // Village layer with proper polygon display
    if (geoData.villages) {
        villageLayer = L.geoJSON(geoData.villages, {
            style: function(feature) {
                return {
                    color: '#4bc0c0',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.3,
                    fillColor: getVillageColor(feature)
                };
            },
            onEachFeature: function(feature, layer) {
                const villageName = feature.properties[villageProp] || 'Unknown Village';
                const cleanName = feature.properties.village_clean || villageName;
                const ssName = feature.properties[ssProp] || feature.properties.subdistric_name || 'Unknown SS';
                const districtName = feature.properties[districtProp] || feature.properties.district_name || 'Unknown District';
                const area = feature.properties.area_km2 ? ` (${feature.properties.area_km2.toFixed(2)} km²)` : '';
                
                const popupContent = `
                    <div style="min-width: 200px;">
                        <strong>Village:</strong> ${cleanName}<br>
                        <strong>Original:</strong> ${villageName}<br>
                        <strong>SS:</strong> ${ssName}<br>
                        <strong>District:</strong> ${districtName}${area}
                    </div>
                `;
                
                layer.bindPopup(popupContent);
                
                // Add hover effects
                layer.on('mouseover', function(e) {
                    this.setStyle({
                        weight: 2,
                        fillOpacity: 0.6
                    });
                    
                    const tooltip = L.tooltip({
                        permanent: false,
                        direction: 'center',
                        className: 'village-tooltip'
                    }).setContent(cleanName);
                    
                    this.bindTooltip(tooltip).openTooltip();
                });
                
                layer.on('mouseout', function(e) {
                    this.setStyle({
                        weight: 1,
                        fillOpacity: 0.3
                    });
                    this.closeTooltip();
                });
                
                layer.on('click', function() {
                    selectVillageFromFeature(feature);
                });
            }
        }).addTo(map);
    }
    
    // Fit map to show all data
    if (geoData.villages && geoData.villages.features.length > 0) {
        const group = new L.featureGroup([villageLayer]);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
}

// Get village color based on properties
function getVillageColor(feature) {
    const districtName = feature.properties.district_name || feature.properties.district || '';
    
    // Color villages by district
    const districtColors = {
        '24 Paraganas South': '#4bc0c0',
        'South 24 Parganas': '#4bc0c0',
        '24 Paraganas North': '#ff9f40',
        'North 24 Parganas': '#ff9f40',
        'Korea': '#9966ff',
        'Devbhumi Dwarka': '#ff6384',
        'Kachchh': '#36a2eb',
        'default': '#4bc0c0'
    };
    
    return districtColors[districtName] || districtColors.default;
}

// Highlight search results
function highlightSearchResults(villages) {
    // Clear previous highlights
    if (villageLayer) {
        villageLayer.eachLayer(layer => {
            layer.getElement()?.classList.remove('search-highlight');
        });
    }
    
    // Add highlights to matching villages
    villages.forEach(village => {
        if (villageLayer) {
            villageLayer.eachLayer(layer => {
                if (layer.feature === village) {
                    layer.getElement()?.classList.add('search-highlight');
                }
            });
        }
    });
}

// Select village from feature
function selectVillageFromFeature(feature) {
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    const districtName = feature.properties[districtProp] || feature.properties.district_name || '';
    const ssName = feature.properties[ssProp] || feature.properties.subdistric_name || '';
    const villageName = feature.properties[villageProp] || '';
    
    // Auto-select hierarchy
    if (currentSelection.district !== districtName) {
        document.getElementById('district-select').value = districtName;
        handleDistrictSelection(districtName);
    }
    if (currentSelection.ss !== ssName) {
        document.getElementById('ss-select').value = ssName;
        handleSSSelection(ssName);
    }
    document.getElementById('village-select').value = villageName;
    handleVillageSelection(villageName);
}

// Update village count display
function updateVillageCount() {
    const infoPanel = document.getElementById('selection-info');
    const currentInfo = infoPanel.innerHTML;
    
    if (geoData.villages) {
        const totalVillages = geoData.villages.features.length;
        const countInfo = `<p><strong>Total Villages:</strong> ${totalVillages}</p>`;
        
        if (currentInfo.includes('No selection made yet')) {
            infoPanel.innerHTML = countInfo;
        } else {
            infoPanel.innerHTML = currentInfo + countInfo;
        }
    }
}

// Enhanced property name detection
function getDistrictPropertyName() {
    if (!geoData.districts || !geoData.districts.features.length) return 'DISTRICT';
    
    const props = geoData.districts.features[0].properties;
    const possibleNames = ['district', 'District', 'DISTRICT', 'district_name', 'DIST_NAME', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name) && props[name]) {
            return name;
        }
    }
    
    return Object.keys(props)[0] || 'DISTRICT';
}

function getSSPropertyName() {
    if (!geoData.ss || !geoData.ss.features.length) return 'SS_NAME';
    
    const props = geoData.ss.features[0].properties;
    const possibleNames = ['subdistric', 'SS_NAME', 'SS', 'ss', 'subdistric_name', 'SUB_DIST', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name) && props[name]) {
            return name;
        }
    }
    
    return Object.keys(props).find(key => key !== getDistrictPropertyName()) || 'SS_NAME';
}

function getVillagePropertyName() {
    if (!geoData.villages || !geoData.villages.features.length) return 'village';
    
    const props = geoData.villages.features[0].properties;
    const possibleNames = ['village_clean', 'village', 'Village', 'VILLAGE', 'VILL_NAME', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name) && props[name]) {
            return name;
        }
    }
    
    return 'village';
}

// Enhanced selection handlers
function populateDropdowns() {
    populateDistrictDropdown();
}

function populateDistrictDropdown() {
    const districtSelect = document.getElementById('district-select');
    const districtProp = getDistrictPropertyName();
    
    if (!geoData.districts) return;
    
    const districts = [...new Set(geoData.districts.features.map(f => f.properties[districtProp]))];
    
    districts.forEach(district => {
        if (district) {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        }
    });
}

function handleDistrictSelection(district) {
    currentSelection.district = district;
    currentSelection.ss = null;
    currentSelection.village = null;
    
    const ssSelect = document.getElementById('ss-select');
    const villageSelect = document.getElementById('village-select');
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    
    villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
    villageSelect.disabled = true;
    
    if (district && geoData.ss) {
        ssSelect.innerHTML = '<option value="">-- Choose SS --</option>';
        const ssOptions = [...new Set(geoData.ss.features
            .filter(f => f.properties[districtProp] === district)
            .map(f => f.properties[ssProp])
            .filter(ss => ss))];
        
        ssOptions.forEach(ss => {
            const option = document.createElement('option');
            option.value = ss;
            option.textContent = ss;
            ssSelect.appendChild(option);
        });
        
        ssSelect.disabled = false;
    } else {
        ssSelect.innerHTML = '<option value="">-- Choose SS --</option>';
        ssSelect.disabled = true;
    }
    
    updateSelectionInfo();
    highlightFeatures();
}

function handleSSSelection(ss) {
    currentSelection.ss = ss;
    currentSelection.village = null;
    
    const villageSelect = document.getElementById('village-select');
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    if (ss && currentSelection.district && geoData.villages) {
        villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
        
        // Get villages for this SS and district
        const villages = geoData.villages.features
            .filter(f => {
                const featureDistrict = f.properties[districtProp] || f.properties.district_name || '';
                const featureSS = f.properties[ssProp] || f.properties.subdistric_name || '';
                return featureDistrict === currentSelection.district && featureSS === ss;
            })
            .map(f => ({
                original: f.properties[villageProp] || '',
                clean: f.properties.village_clean || f.properties[villageProp] || ''
            }))
            .filter(v => v.original)
            .sort((a, b) => a.clean.localeCompare(b.clean));
        
        villages.forEach(village => {
            const option = document.createElement('option');
            option.value = village.original;
            option.textContent = village.clean !== village.original ? 
                `${village.clean} (${village.original})` : village.clean;
            villageSelect.appendChild(option);
        });
        
        villageSelect.disabled = false;
        
        // Update info with village count
        const infoDiv = document.getElementById('selection-info');
        const currentInfo = infoDiv.innerHTML;
        infoDiv.innerHTML = currentInfo + `<p><strong>Villages in ${ss}:</strong> ${villages.length}</p>`;
    } else {
        villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
        villageSelect.disabled = true;
    }
    
    updateSelectionInfo();
    highlightFeatures();
}

function handleVillageSelection(village) {
    currentSelection.village = village;
    updateSelectionInfo();
    highlightFeatures();
    
    document.getElementById('zoom-btn').disabled = false;
}

function updateSelectionInfo() {
    const infoDiv = document.getElementById('selection-info');
    let html = '';
    
    if (currentSelection.district) {
        html += `<p><strong>District:</strong> ${currentSelection.district}</p>`;
    }
    if (currentSelection.ss) {
        html += `<p><strong>SS:</strong> ${currentSelection.ss}</p>`;
    }
    if (currentSelection.village) {
        html += `<p><strong>Village:</strong> ${currentSelection.village}</p>`;
        
        // Add village details if available
        const villageProp = getVillagePropertyName();
        const villageFeature = geoData.villages?.features.find(f => 
            f.properties[villageProp] === currentSelection.village);
        
        if (villageFeature) {
            const area = villageFeature.properties.area_km2;
            if (area) {
                html += `<p><strong>Area:</strong> ${area.toFixed(2)} km²</p>`;
            }
        }
    }
    
    if (!html) {
        html = '<p>No selection made yet</p>';
    }
    
    infoDiv.innerHTML = html;
    
    if (geoData.villages) {
        html += `<p><strong>Total Villages:</strong> ${geoData.villages.features.length}</p>`;
        infoDiv.innerHTML = html;
    }
}

function highlightFeatures() {
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    // Remove previous highlighting
    [districtLayer, ssLayer, villageLayer].forEach(layer => {
        if (layer) {
            layer.eachLayer(sublayer => {
                const element = sublayer.getElement();
                if (element) {
                    element.classList.remove('highlighted');
                }
            });
        }
    });
    
    // Highlight selected features
    if (currentSelection.district && districtLayer) {
        districtLayer.eachLayer(layer => {
            if (layer.feature.properties[districtProp] === currentSelection.district) {
                layer.getElement()?.classList.add('highlighted');
            }
        });
    }
    
    if (currentSelection.ss && ssLayer) {
        ssLayer.eachLayer(layer => {
            const featureSS = layer.feature.properties[ssProp] || layer.feature.properties.subdistric_name;
            if (featureSS === currentSelection.ss) {
                layer.getElement()?.classList.add('highlighted');
            }
        });
    }
    
    if (currentSelection.village && villageLayer) {
        villageLayer.eachLayer(layer => {
            if (layer.feature.properties[villageProp] === currentSelection.village) {
                layer.getElement()?.classList.add('highlighted');
            }
        });
    }
}

function resetSelection() {
    currentSelection = { district: null, ss: null, village: null };
    
    document.getElementById('district-select').value = '';
    document.getElementById('ss-select').innerHTML = '<option value="">-- Choose SS --</option>';
    document.getElementById('ss-select').disabled = true;
    document.getElementById('village-select').innerHTML = '<option value="">-- Choose Village --</option>';
    document.getElementById('village-select').disabled = true;
    document.getElementById('zoom-btn').disabled = true;
    
    // Clear search
    const searchInput = document.getElementById('village-search');
    if (searchInput) searchInput.value = '';
    
    updateSelectionInfo();
    highlightFeatures();
    
    // Reset map view
    if (geoData.villages && geoData.villages.features.length > 0) {
        const group = new L.featureGroup([villageLayer]);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
}

function zoomToSelection() {
    let targetLayer = null;
    const villageProp = getVillagePropertyName();
    const ssProp = getSSPropertyName();
    const districtProp = getDistrictPropertyName();
    
    if (currentSelection.village && villageLayer) {
        villageLayer.eachLayer(layer => {
            if (layer.feature.properties[villageProp] === currentSelection.village) {
                targetLayer = layer;
            }
        });
    } else if (currentSelection.ss && ssLayer) {
        ssLayer.eachLayer(layer => {
            const featureSS = layer.feature.properties[ssProp] || layer.feature.properties.subdistric_name;
            if (featureSS === currentSelection.ss) {
                targetLayer = layer;
            }
        });
    } else if (currentSelection.district && districtLayer) {
        districtLayer.eachLayer(layer => {
            if (layer.feature.properties[districtProp] === currentSelection.district) {
                targetLayer = layer;
            }
        });
    }
    
    if (targetLayer) {
        map.fitBounds(targetLayer.getBounds(), { padding: [20, 20] });
    }
}

function toggleLayers() {
    const districtVisible = map.hasLayer(districtLayer);
    const ssVisible = map.hasLayer(ssLayer);
    const villageVisible = map.hasLayer(villageLayer);
    
    if (districtVisible || ssVisible || villageVisible) {
        if (districtVisible) map.removeLayer(districtLayer);
        if (ssVisible) map.removeLayer(ssLayer);
        if (villageVisible) map.removeLayer(villageLayer);
        document.getElementById('layer-toggle').textContent = 'Show Layers';
    } else {
        if (districtLayer) map.addLayer(districtLayer);
        if (ssLayer) map.addLayer(ssLayer);
        if (villageLayer) map.addLayer(villageLayer);
        document.getElementById('layer-toggle').textContent = 'Hide Layers';
    }
}

function showLoading(show) {
    let loadingDiv = document.querySelector('.loading');
    
    if (show) {
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.innerHTML = `
                <div class="spinner"></div>
                <p>Loading ${geoData.villages ? geoData.villages.features.length : ''} villages...</p>
            `;
            document.body.appendChild(loadingDiv);
        }
    } else {
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

function showError(message) {
    alert(`Error: ${message}`);
}

// Export functions
window.SundarbanApp = {
    resetSelection,
    zoomToSelection,
    toggleLayers,
    searchVillages,
    getCurrentSelection: () => currentSelection,
    getVillageCount: () => geoData.villages ? geoData.villages.features.length : 0
};
