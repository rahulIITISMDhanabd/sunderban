// Updated script to load actual GeoJSON data from converted shapefiles
// Replace the loadSampleData function in script.js with this version

// Load actual GeoJSON data from converted shapefiles
async function loadActualData() {
    try {
        // Load all three GeoJSON files
        const [districtsResponse, ssResponse, villagesResponse] = await Promise.all([
            fetch('data/districts.geojson'),
            fetch('data/ss.geojson'),
            fetch('data/villages.geojson')
        ]);
        
        // Check if all requests were successful
        if (!districtsResponse.ok || !ssResponse.ok || !villagesResponse.ok) {
            throw new Error('Failed to load one or more GeoJSON files');
        }
        
        // Parse JSON responses
        geoData.districts = await districtsResponse.json();
        geoData.ss = await ssResponse.json();
        geoData.villages = await villagesResponse.json();
        
        console.log('Loaded districts:', geoData.districts.features.length);
        console.log('Loaded SS areas:', geoData.ss.features.length);
        console.log('Loaded villages:', geoData.villages.features.length);
        
        // Add layers to map
        addLayersToMap();
        
    } catch (error) {
        console.error('Error loading GeoJSON data:', error);
        // Fallback to sample data if actual data fails to load
        await loadSampleData();
    }
}

// Updated layer creation with better property handling
function addLayersToMap() {
    // Determine property names from the actual data
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    console.log('Using property names:', { districtProp, ssProp, villageProp });
    
    // District layer
    districtLayer = L.geoJSON(geoData.districts, {
        style: {
            color: '#ff6347',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.3
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
    
    // SS layer
    ssLayer = L.geoJSON(geoData.ss, {
        style: {
            color: '#36a2eb',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.3
        },
        onEachFeature: function(feature, layer) {
            const ssName = feature.properties[ssProp] || 'Unknown SS';
            const districtName = feature.properties[districtProp] || 'Unknown District';
            layer.bindPopup(`<strong>SS:</strong> ${ssName}<br><strong>District:</strong> ${districtName}`);
            layer.on('click', function() {
                // Auto-select district if not already selected
                if (currentSelection.district !== districtName) {
                    document.getElementById('district-select').value = districtName;
                    handleDistrictSelection(districtName);
                }
                document.getElementById('ss-select').value = ssName;
                handleSSSelection(ssName);
            });
        }
    }).addTo(map);
    
    // Village layer
    villageLayer = L.geoJSON(geoData.villages, {
        style: {
            color: '#4bc0c0',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.3
        },
        onEachFeature: function(feature, layer) {
            const villageName = feature.properties[villageProp] || 'Unknown Village';
            const ssName = feature.properties[ssProp] || 'Unknown SS';
            const districtName = feature.properties[districtProp] || 'Unknown District';
            layer.bindPopup(`<strong>Village:</strong> ${villageName}<br><strong>SS:</strong> ${ssName}<br><strong>District:</strong> ${districtName}`);
            layer.on('click', function() {
                // Auto-select hierarchy if not already selected
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
            });
        }
    }).addTo(map);
    
    // Fit map to show all data
    if (geoData.districts && geoData.districts.features.length > 0) {
        const group = new L.featureGroup([districtLayer, ssLayer, villageLayer]);
        map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
}

// Helper functions to determine property names from actual data
function getDistrictPropertyName() {
    if (!geoData.districts || !geoData.districts.features.length) return 'DISTRICT';
    
    const props = geoData.districts.features[0].properties;
    const possibleNames = ['DISTRICT', 'District', 'district', 'DIST_NAME', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name)) {
            return name;
        }
    }
    
    // If no match found, return the first string property
    for (let prop in props) {
        if (typeof props[prop] === 'string') {
            return prop;
        }
    }
    
    return 'DISTRICT'; // fallback
}

function getSSPropertyName() {
    if (!geoData.ss || !geoData.ss.features.length) return 'SS_NAME';
    
    const props = geoData.ss.features[0].properties;
    const possibleNames = ['SS_NAME', 'SS', 'ss', 'SS_name', 'SUB_DIST', 'SUBDIST', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name)) {
            return name;
        }
    }
    
    // If no match found, return the first string property that's not district
    const districtProp = getDistrictPropertyName();
    for (let prop in props) {
        if (typeof props[prop] === 'string' && prop !== districtProp) {
            return prop;
        }
    }
    
    return 'SS_NAME'; // fallback
}

function getVillagePropertyName() {
    if (!geoData.villages || !geoData.villages.features.length) return 'VILLAGE';
    
    const props = geoData.villages.features[0].properties;
    const possibleNames = ['VILLAGE', 'Village', 'village', 'VILL_NAME', 'NAME', 'name'];
    
    for (let name of possibleNames) {
        if (props.hasOwnProperty(name)) {
            return name;
        }
    }
    
    // If no match found, return the first string property that's not district or SS
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    for (let prop in props) {
        if (typeof props[prop] === 'string' && prop !== districtProp && prop !== ssProp) {
            return prop;
        }
    }
    
    return 'VILLAGE'; // fallback
}

// Updated populate district dropdown function
function populateDistrictDropdown() {
    const districtSelect = document.getElementById('district-select');
    const districtProp = getDistrictPropertyName();
    const districts = [...new Set(geoData.districts.features.map(f => f.properties[districtProp]))];
    
    districts.forEach(district => {
        if (district) { // Only add non-null/undefined values
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        }
    });
}

// Updated handle district selection
function handleDistrictSelection(district) {
    currentSelection.district = district;
    currentSelection.ss = null;
    currentSelection.village = null;
    
    const ssSelect = document.getElementById('ss-select');
    const villageSelect = document.getElementById('village-select');
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    
    // Clear and disable village dropdown
    villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
    villageSelect.disabled = true;
    
    if (district) {
        // Populate SS dropdown
        ssSelect.innerHTML = '<option value="">-- Choose SS --</option>';
        const ssOptions = [...new Set(geoData.ss.features
            .filter(f => f.properties[districtProp] === district)
            .map(f => f.properties[ssProp])
            .filter(ss => ss))]; // Filter out null/undefined values
        
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

// Updated handle SS selection
function handleSSSelection(ss) {
    currentSelection.ss = ss;
    currentSelection.village = null;
    
    const villageSelect = document.getElementById('village-select');
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    if (ss && currentSelection.district) {
        // Populate village dropdown
        villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
        const villageOptions = [...new Set(geoData.villages.features
            .filter(f => f.properties[ssProp] === ss && f.properties[districtProp] === currentSelection.district)
            .map(f => f.properties[villageProp])
            .filter(village => village))]; // Filter out null/undefined values
        
        villageOptions.forEach(village => {
            const option = document.createElement('option');
            option.value = village;
            option.textContent = village;
            villageSelect.appendChild(option);
        });
        
        villageSelect.disabled = false;
    } else {
        villageSelect.innerHTML = '<option value="">-- Choose Village --</option>';
        villageSelect.disabled = true;
    }
    
    updateSelectionInfo();
    highlightFeatures();
}

// Updated highlight features function
function highlightFeatures() {
    const districtProp = getDistrictPropertyName();
    const ssProp = getSSPropertyName();
    const villageProp = getVillagePropertyName();
    
    // Remove previous highlighting
    [districtLayer, ssLayer, villageLayer].forEach(layer => {
        if (layer) {
            layer.eachLayer(sublayer => {
                sublayer.getElement()?.classList.remove('highlighted');
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
            if (layer.feature.properties[ssProp] === currentSelection.ss) {
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

// Update the main loadShapefiles function
async function loadShapefiles() {
    showLoading(true);
    
    try {
        // Try to load actual data first
        await loadActualData();
        populateDistrictDropdown();
        showLoading(false);
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load geographic data. Please ensure GeoJSON files are available.');
        showLoading(false);
    }
}
