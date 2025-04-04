let lineChart;
let barChart;

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Babylon.js scene
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const customLoadingScreen = document.getElementById("customLoadingScreen");

    // Get the containers for info, state, and graph
    const infoContainer = document.getElementById("title-info-container");
    const stateContainer = document.getElementById("state-info-container");
    const graphPanel = document.getElementById("graph-panel");

 // Initialize charts using the correct function names
    initializeCharts();


    function toggleDropdown(container) {
        const content = container.querySelector('.info-content');
        const caret = container.querySelector('.caret');
        const header = container.querySelector('.header');

        if (!content || !caret || !header) return;

        header.addEventListener('click', () => {
            const isExpanded = container.classList.contains('expanded');

            if (isExpanded) {
                content.style.display = 'none';
                caret.classList.remove('open');
                container.classList.remove('expanded');
                container.style.maxHeight = '70px'; // Collapsed height
            } else {
                content.style.display = 'block';
                caret.classList.add('open');
                container.classList.add('expanded');
                container.style.maxHeight = `${content.scrollHeight + 100}px`; // Expand based on content
            }
        });
    }

    // Apply dropdown functionality to both containers
    if (infoContainer) toggleDropdown(infoContainer);
    if (stateContainer) toggleDropdown(stateContainer);

// Apply dropdown functionality to the Disappeared Bees container
const disappearedBeesContainer = document.getElementById("disappeared-bees-container");
if (disappearedBeesContainer) toggleDropdown(disappearedBeesContainer);

    // Define the default year and selected state
    let selectedYear = 2019;
    let selectedState = null;
    let newMeshes = [];
    let registeredColoniesData = null;
    const hoverColor = new BABYLON.Color3(0.92, 0.62, 0.24); // #E26928 for hover
    const originalColor = new BABYLON.Color3(1, 0.843, 0); // Gold color for default

    // Define the state codes and corresponding state names
    const stateNames = {
    "Alabama_Cube.033": "ALABAMA",
    "Alaska_Plane": "ALASKA",
    "Arizona_Cube.005": "ARIZONA",
    "Arkansas_Cube.027": "ARKANSAS",
    "California_Cube.006": "CALIFORNIA",
    "Colorado_Cube.002": "COLORADO",
    "Connecticut_Cube.048": "CONNECTICUT",
    "Delaware_Cube.041": "DELAWARE",
    "Florida_Cube.028": "FLORIDA",
    "Georgia_Cube.036": "GEORGIA",
    "Hawaii_Plane.001": "HAWAII",
    "Idaho_Cube.011": "IDAHO",
    "Illinois_Cube.022": "ILLINOIS",
    "Indiana_Cube.025": "INDIANA",
    "Iowa_Cube.019": "IOWA",
    "Kansas_Cube.016": "KANSAS",
    "Kentucky_Cube.030": "KENTUCKY",
    "Louisiana_Cube.031": "LOUISIANA",
    "Maine_Cube.017": "MAINE",
    "Maryland_Cube.040": "MARYLAND",
    "Massachusetts_Cube.047": "MASSACHUSETTS",
    "Michigan_Cube.024": "MICHIGAN",
    "Minnesota_Cube.018": "MINNESOTA",
    "Mississippi_Cube.032": "MISSISSIPPI",
    "Missouri_Cube.021": "MISSOURI",
    "Montana_Cube.012": "MONTANA",
    "Nebraska_Cube.015": "NEBRASKA",
    "Nevada_Cube.004": "NEVADA",
    "New_Hampshire_Cube.044": "NEW HAMPSHIRE",
    "New_Jersey_Cube.043": "NEW JERSEY",
    "New_Mexico_Cube.001": "NEW MEXICO",
    "New_York_Cube": "NEW YORK",
    "North_Carolina_Cube.038": "NORTH CAROLINA",
    "North_Dakota_Cube.013": "NORTH DAKOTA",
    "Ohio_Cube.029": "OHIO",
    "Oklahoma_Cube.020": "OKLAHOMA",
    "Oregon_Cube.010": "OREGON",
    "Pennsylvania_Cube.042": "PENNSYLVANIA",
    "Rhode_Island_Cube.046": "RHODE ISLAND",
    "South_Carolina_Cube.037": "SOUTH CAROLINA",
    "South_Dakota_Cube.014": "SOUTH DAKOTA",
    "Tennessee_Cube.034": "TENNESSEE",
    "Texas_Cube.026": "TEXAS",
    "Utah_Cube.003": "UTAH",
    "Vermont_Cube.045": "VERMONT",
    "Virginia_Cube.039": "VIRGINIA",
    "Washington_Cube.009": "WASHINGTON",
    "West_Virginia_Cube.035": "WEST VIRGINIA",
    "Wisconsin_Cube.023": "WISCONSIN",
    "Wyoming_Cube.007": "WYOMING"
    };

    // Populate the dropdown menu with state names
const stateDropdown = document.getElementById("state-dropdown");

if (stateDropdown) {
    Object.values(stateNames).forEach(stateName => {
        const option = document.createElement("option");
        option.value = stateName;
        option.textContent = stateName;
        stateDropdown.appendChild(option);
    });
}

    // Logging function for debugging
    function logDetail(message, data = null) {
        console.log(`[DEBUG] ${message}`);
        if (data) {
            console.log(data);
        }
    }

    // Display the loading UI
    BABYLON.Engine.prototype.displayLoadingUI = function() {
        if (customLoadingScreen) {
            customLoadingScreen.style.display = "flex";
            customLoadingScreen.style.opacity = "1";
        }
        if (infoContainer) infoContainer.style.display = "none";
        if (stateContainer) stateContainer.style.display = "none";
        if (graphPanel) graphPanel.style.display = "none";
    };

    // Hide the loading UI once the scene is ready
    BABYLON.Engine.prototype.hideLoadingUI = function() {
        if (customLoadingScreen) {
            customLoadingScreen.style.opacity = "0";
            setTimeout(() => {
                customLoadingScreen.style.display = "none";
            }, 500);
        }
        if (infoContainer) infoContainer.style.display = "flex";
        if (stateContainer) stateContainer.style.display = "flex";
        if (graphPanel) graphPanel.style.display = "flex";
    };

    // Ensure info, state, and graph containers are visible when the page loads
    window.addEventListener("load", function() {
        if (infoContainer) {
            infoContainer.style.display = "flex";
        }
        if (stateContainer) {
            stateContainer.style.display = "flex";
        }
        if (graphPanel) {
            graphPanel.style.display = "flex";
        }
    });

    console.log("[INFO] DOM content loaded and script initialized.");

// Function to convert a string to title case (e.g., "new york" -> "New York")
function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Function to fetch registered colonies data
async function fetchRegisteredColoniesData() {
    try {
        const response = await fetch('/registered_colonies.json');
        if (response.ok) {
            const data = await response.json();
            logDetail('[DEBUG] Registered colonies data loaded successfully.', data);
            return data;
        } else {
            logDetail('[ERROR] Error loading registered colonies data:', response.statusText);
            alert('Failed to load registered colonies data. Some features may not work properly.');
            return null;
        }
    } catch (error) {
        logDetail('[ERROR] Error fetching registered colonies data:', error);
        alert('An error occurred while loading registered colonies data.');
        return null;
    }
}

// Function to fetch monthly colony loss data
async function fetchMonthlyColonyData(year) {
    try {
        const response = await fetch(`/api/monthly/${year}`);
        if (response.ok) {
            const data = await response.json();
            logDetail(`[DEBUG] Data for ${year} received:`, data);
            return data;
        } else {
            logDetail(`[ERROR] Error fetching data: Status ${response.status}`);
            return null;
        }
    } catch (error) {
        logDetail('[ERROR] Error fetching monthly colony data:', error);
        return null;
    }
}

// Function to calculate percentage loss
function calculatePercentageLoss(totalLoss, coloniesRegistered) {
    if (coloniesRegistered && coloniesRegistered > 0) {
        return ((totalLoss / coloniesRegistered) * 100).toFixed(2);
    }
    return null;
}

// Function to initialize both charts
function initializeCharts() {
    console.log("[INFO] Initializing charts");
    initializeEmptyLineChart(); // Call the empty line chart initialization
    initializeEmptyBarChart(); // Call the empty bar chart initialization
}

// Function to initialize an empty line chart
function initializeEmptyLineChart() {
    const canvas = document.getElementById('line-chart');
    if (!canvas) {
        console.error("[ERROR] Canvas element with ID 'line-chart' not found.");
        return;
    }

    // If the lineChart already exists, destroy it first
    if (lineChart) {
        lineChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Empty labels for the empty chart
            datasets: [{
                label: 'Total Loss per Year',
                data: [], // Empty data for the empty chart
                borderColor: 'rgba(255, 186, 59, 1)',
                backgroundColor: 'rgba(255, 186, 59, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Total Loss'
                    }
                }
            }
        }
    });

    console.log("[INFO] Empty line chart initialized");
}

// Function to initialize an empty bar chart
function initializeEmptyBarChart() {
    const canvas = document.getElementById('bar-chart');
    if (!canvas) {
        console.error("[ERROR] Canvas element with ID 'bar-chart' not found.");
        return;
    }

    // If the barChart already exists, destroy it first
    if (barChart) {
        barChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [], // Empty labels for the empty chart
            datasets: [{
                label: 'Total Loss per Quarter',
                data: [], // Empty data for the empty chart
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Quarter'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Total Loss'
                    }
                }
            }
        }
    });

    console.log("[INFO] Empty bar chart initialized");
}

// Function to update the line chart with annual totals for the selected state
async function updateLineChart(state) {
    try {
        console.log(`[INFO] Updating line chart for state: ${state}`);
        showOverlay('line'); // Show loading overlay

        const years = [2019, 2020, 2021, 2022, 2023];
        const annualTotals = [];

        for (const year of years) {
            const colonyLossData = await fetchMonthlyColonyData(year);
            if (colonyLossData) {
                const stateData = colonyLossData.filter(
                    record => record.state.toUpperCase() === state.toUpperCase()
                );
                const totalLossForYear = stateData.reduce((acc, record) => acc + (record.coloniesLost || 0), 0);
                annualTotals.push(totalLossForYear);
            } else {
                console.warn(`[WARN] No data found for state: ${state} in year: ${year}`);
                annualTotals.push(0);
            }
        }

        lineChart.data.labels = years;
        lineChart.data.datasets[0].data = annualTotals;
        lineChart.update();
        console.log("[INFO] Line chart updated with annual totals.");
    } catch (error) {
        console.error(`[ERROR] Error updating line chart for state: ${state}`, error);
    } finally {
        hideOverlay('line'); // Hide loading overlay
    }
}

// Example usage in updateBarChart
async function updateBarChart(state, year) {
    try {
        console.log(`[INFO] Updating bar chart for state: ${state}, year: ${year}`);
        showOverlay('bar'); // Show loading overlay

        const colonyLossData = await fetchMonthlyColonyData(year);
        if (colonyLossData) {
            const stateData = colonyLossData.filter(
                record => record.state.toUpperCase() === state.toUpperCase()
            );
            const quarterlyData = [
                stateData.find(record => record.month === 'JAN THRU MAR')?.coloniesLost || 0,
                stateData.find(record => record.month === 'APR THRU JUN')?.coloniesLost || 0,
                stateData.find(record => record.month === 'JUL THRU SEP')?.coloniesLost || 0,
                stateData.find(record => record.month === 'OCT THRU DEC')?.coloniesLost || 0
            ];

            barChart.data.labels = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
            barChart.data.datasets[0].data = quarterlyData;
            barChart.update();
            console.log("[INFO] Bar chart updated with quarterly totals.");
        } else {
            console.warn(`[WARN] No data found for state: ${state} in year: ${year}`);
        }
    } catch (error) {
        console.error(`[ERROR] Error updating bar chart for state: ${state}, year: ${year}`, error);
    } finally {
        hideOverlay('bar'); // Hide loading overlay
    }
}

// Function to assign data to states
async function assignDataToStates(stateMeshes, year) {
    const registeredColoniesData = await fetchRegisteredColoniesData();
    if (!registeredColoniesData) {
        logDetail('[ERROR] Registered colonies data could not be fetched.');
        return;
    }

    const colonyLossData = await fetchMonthlyColonyData(year);
    if (!colonyLossData) {
        logDetail(`[ERROR] No colony loss data available for the year ${year}.`);
        return;
    }

    for (let mesh of stateMeshes) {
        if (mesh.metadata && mesh.metadata.stateName) {
            const stateName = toTitleCase(mesh.metadata.stateName);
            const coloniesRegistered = registeredColoniesData?.[year]?.[stateName]?.value || null;

            const stateLossData = colonyLossData.filter(record => toTitleCase(record.state) === stateName);
            const totalLoss = stateLossData.reduce((acc, record) => acc + (record.coloniesLost || 0), 0);
            const percentageChange = calculatePercentageLoss(totalLoss, coloniesRegistered);

            mesh.metadata.colonyCollapse = {
                totalLoss: totalLoss || 0, 
                coloniesRegistered: coloniesRegistered || 'Data not available',
                percentageChange: percentageChange || 'N/A',
                Q1: stateLossData.find(record => record.month === 'JAN THRU MAR')?.coloniesLost || 0,
                Q2: stateLossData.find(record => record.month === 'APR THRU JUN')?.coloniesLost || 0,
                Q3: stateLossData.find(record => record.month === 'JUL THRU SEP')?.coloniesLost || 0,
                Q4: stateLossData.find(record => record.month === 'OCT THRU DEC')?.coloniesLost || 0
            };

            logDetail(`[DEBUG] Assigned data to ${stateName}: Total Loss = ${totalLoss}`);
        }
    }
}


// Ensure the state click event is calling the chart update functions
async function handleStateSelection(state) {
    console.log(`[INFO] State selected: ${state}`);

    // Fetch data for the selected year and update charts
    await updateBarChart(state, selectedYear);
    const years = [2019, 2020, 2021, 2022, 2023];
    await updateLineChart(state, years);
    console.log("[INFO] Charts updated for state selection.");
}

// Utility function for logging details
function logDetail(message, data = null) {
    console.log(message);
    if (data) {
        console.log(data);
    }
}

function showOverlay(chartType) {
    const overlay = document.getElementById(`${chartType}-chart-overlay`);
    if (overlay) {
        overlay.style.display = 'flex'; // Show the overlay
    }
}

// Function to hide the overlay for the specified chart type
function hideOverlay(chartType) {
    const overlay = document.getElementById(`${chartType}-chart-overlay`);
    if (overlay) {
        overlay.style.display = 'none'; // Hide the overlay
    }
}

    // Function to update the state information container
const updateStateInfoContainer = (mesh, metadata) => {
    const yearElement = document.getElementById("year-selected");
    const stateNameElement = document.getElementById("state-name");
    const totalLossElement = document.getElementById("total-loss");
    const registeredColoniesElement = document.getElementById("registered-colonies");
    const percentageLossElement = document.getElementById("percentage-loss");

    // Update the state name and year in the container
    yearElement.textContent = selectedYear;
    stateNameElement.textContent = metadata.stateName || 'N/A';

    if (metadata.colonyCollapse) {
        const { totalLoss, coloniesRegistered, percentageChange } = metadata.colonyCollapse;

        // Update the container elements with the data
        totalLossElement.textContent = totalLoss !== null ? `${totalLoss} colonies` : 'Data not available';
        registeredColoniesElement.textContent = coloniesRegistered !== null ? coloniesRegistered : 'Data not available';
        percentageLossElement.textContent = percentageChange !== null ? `${percentageChange}%` : 'N/A';

        // Update the disappeared bees count
        updateDisappearedBeesCount(totalLoss); // Update the new dropdown with the disappeared bees count

    } else {
        // Clear the data if no colony collapse information is available
        totalLossElement.textContent = 'No data available';
        registeredColoniesElement.textContent = 'No data available';
        percentageLossElement.textContent = 'N/A';
    }
};

// Function to update the disappeared bees count
const updateDisappearedBeesCount = (totalLoss) => {
    const disappearedBeesValue = document.getElementById("disappeared-bees-value");
    const beeCount = totalLoss * 20000; // 20000 bees for each colony loss
    disappearedBeesValue.textContent = `${beeCount.toLocaleString()} bees`; // Update the text content
};




    // Function to handle pointer over event and change color to hoverColor
    function handlePointerOver(mesh) {
        mesh.material.diffuseColor = hoverColor;
    }

    // Function to handle pointer out event and revert to original color
    function handlePointerOut(mesh) {
        mesh.material.diffuseColor = originalColor;
    }

    
    // Function to handle pointer click event
async function handlePointerClick(mesh) {
    if (mesh.metadata && mesh.metadata.stateName) {
        selectedState = mesh.metadata.stateName;
        updateStateInfoContainer(mesh, mesh.metadata);
        logDetail(`User clicked on ${selectedState}.`);

        // Fetch the total loss from the mesh metadata
        const totalLoss = mesh.metadata.colonyCollapse?.totalLoss || 0; // Get the total loss from the metadata
        
        // Create the bee swarm particle system
        createBeeParticleSystem(mesh, totalLoss); // Emit particles from the clicked state mesh

        // Initialize the charts based on the selected state
        await handleStateSelection(selectedState); // Update the graphs with the selected state
    } else {
        logDetail(`[ERROR] No metadata available for clicked mesh.`);
    }
}


// Function to create and configure the bee particle system
function createBeeParticleSystem(emitter, totalLoss) {
    // Calculate the number of bees to emit (1,000 particles for each colony loss)
const beeCount = totalLoss ? totalLoss * 50 : 0;


    const beeParticleSystem = new BABYLON.ParticleSystem("beeParticles", beeCount, scene); // Use the calculated bee count
    beeParticleSystem.particleTexture = new BABYLON.Texture("/assets/honeybee.png", scene); 

    // Set mipmaps and filtering
    beeParticleSystem.particleTexture.generateMipMaps = true; // Enable mipmaps
    beeParticleSystem.particleTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE); // Set filtering

    beeParticleSystem.emitter = emitter;  

    // Particle system settings
    beeParticleSystem.minEmitPower = 1;
    beeParticleSystem.maxEmitPower = 3;
    beeParticleSystem.updateSpeed = 0.01;

// Set particle size
    beeParticleSystem.minSize = 2; // Make particles larger
    beeParticleSystem.maxSize = 3; // Make particles larger

// Set color for visibility
    beeParticleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1); // Bright yellow for live particles
    beeParticleSystem.color2 = new BABYLON.Color4(1, 1, 0, 1); // Same bright yellow for the second color
    beeParticleSystem.colorDead = new BABYLON.Color4(1, 0.8, 0, 1); // Slightly darker yellow for dead particles

    // Set the start direction function
    beeParticleSystem.startDirectionFunction = function (particle) {
        const angle = Math.random() * Math.PI * 2; // Random angle for circular motion
        particle.direction = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle)); // Circular direction
    };

    beeParticleSystem.emitRate = beeCount; // Set the emission rate based on the calculated bee count
    beeParticleSystem.minLifeTime = 2;
    beeParticleSystem.maxLifeTime = 5;

    // Only start the particle system if there are bees to emit
    if (beeCount > 0) {
        beeParticleSystem.start();
        console.log(`[INFO] Bee particle system started with ${beeCount} particles.`);
        
        // Set the velocity to make the particles fly out of the cube
        beeParticleSystem.direction1 = new BABYLON.Vector3(0, 1, 1); // Upwards
        beeParticleSystem.direction2 = new BABYLON.Vector3(0, 1, 1); // Upwards

        // Particle exit logic (particles exit the cube)
        beeParticleSystem.minEmitBox = new BABYLON.Vector3(-10, 0, -10); // Starting position
        beeParticleSystem.maxEmitBox = new BABYLON.Vector3(10, 0, 10); // Ending position

        // Stop and reset the particle system after some time
        setTimeout(() => {
            beeParticleSystem.stop();
            beeParticleSystem.reset();
        }, 10000); // Adjust the time for the simulation duration
    } else {
        console.log("[INFO] No bees to emit (totalLoss is zero or undefined).");
    }
}


    // Function to create the Babylon.js scene
function createScene() {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 400, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    // Add a hemispheric light for ambient lighting
    const hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 0.6; // Adjust intensity as needed
    console.log("[INFO] Hemispheric light added with intensity: 0.6");

    // Add a directional light for additional lighting effects
    const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -2, -1), scene);
    directionalLight.position = new BABYLON.Vector3(100, 200, 100);
    directionalLight.intensity = 1.0; // Adjust intensity as needed
    console.log("[INFO] Directional light added with intensity: 1.0");

    const honeycombTexture = new BABYLON.Texture("./textures/yellow-honeycomb2-texture.jpg", scene);
    const honeycombMaterial = new BABYLON.StandardMaterial("honeycombMaterial", scene);
    honeycombMaterial.diffuseTexture = honeycombTexture;
    honeycombMaterial.backFaceCulling = false;

    const backgroundCube = BABYLON.MeshBuilder.CreateBox("backgroundCube", { size: 1000 }, scene);
    backgroundCube.material = honeycombMaterial;

    logDetail("Loading U.S. map...");
    BABYLON.SceneLoader.ImportMesh("", "/models/", "united_states.obj", scene, function (loadedMeshes) {
        newMeshes = loadedMeshes;
        newMeshes.forEach(mesh => {
            mesh.scaling = new BABYLON.Vector3(60, 60, 60);
            mesh.rotation.x = Math.PI / 2;

            const goldMaterial = new BABYLON.StandardMaterial("goldMaterial", scene);
            goldMaterial.diffuseColor = originalColor;
            mesh.material = goldMaterial;

            mesh.metadata = {
                stateName: stateNames[mesh.name] || null,
                colonyCollapse: null
            };

            if (mesh.metadata.stateName) {
                mesh.actionManager = new BABYLON.ActionManager(scene);
                mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPointerOverTrigger,
                    () => handlePointerOver(mesh)
                ));
                mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPointerOutTrigger,
                    () => handlePointerOut(mesh)
                ));
                mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => handlePointerClick(mesh)
                ));
            }
        });

        assignDataToStates(newMeshes, selectedYear);
    });

    return scene;
}

        // Make this function async
async function handleStateSelection(state) {
    // Fetch data for the selected year
    await updateBarChart(state, selectedYear);
    const years = [2019, 2020, 2021, 2022, 2023];
    await updateLineChart(state, years);
}

    // Initialize empty charts on page load
    initializeEmptyLineChart();
    initializeEmptyBarChart();

    const yearSelector = document.getElementById('year-selector');
    const yearSelect = document.getElementById('year-select');

    function toggleYearSelector(container) {
        const content = container.querySelector('.info-content');
        const caret = container.querySelector('.caret');
        const header = container.querySelector('.header');

        if (!content || !caret || !header) return;

        header.addEventListener('click', () => {
            const isExpanded = container.classList.contains('expanded');

            if (isExpanded) {
                content.style.display = 'none';
                caret.classList.remove('open');
                container.classList.remove('expanded');
                container.style.maxHeight = '50px'; // Collapsed height
            } else {
                content.style.display = 'block';
                caret.classList.add('open');
                container.classList.add('expanded');
                container.style.maxHeight = '200px'; // Expand height
            }
        });
    }

    // Apply dropdown functionality to the year selector
    if (yearSelector) toggleYearSelector(yearSelector);

    yearSelect.addEventListener('change', (event) => {
    selectedYear = event.target.value;
    console.log(`Year selected: ${selectedYear}`);
    if (selectedState) {
        updateBarChart(selectedState, selectedYear);
    }
});

if (stateDropdown) {
    stateDropdown.addEventListener("change", async (event) => {
        const selectedStateName = event.target.value;

        if (selectedStateName) {
            // Find the mesh corresponding to the selected state
            const selectedMesh = newMeshes.find(
                mesh => mesh.metadata && mesh.metadata.stateName === selectedStateName
            );

            if (selectedMesh) {
                // Trigger the bee particle visualization immediately
                const totalLoss = selectedMesh.metadata.colonyCollapse?.totalLoss || 0;
                createBeeParticleSystem(selectedMesh, totalLoss);

                // Update state information and charts asynchronously
                updateStateInfoContainer(selectedMesh, selectedMesh.metadata);
                console.log(`[INFO] Dropdown selection: ${selectedStateName}`);
                await handleStateSelection(selectedStateName); // Update charts
            } else {
                console.error(`[ERROR] No mesh found for state: ${selectedStateName}`);
            }
        }
    });
}




    // Create and render the scene
    const scene = createScene();
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Resize the engine on window resize
    window.addEventListener('resize', () => {
        engine.resize();
    });

    // Ensure the loading screen hides once everything is loaded
    scene.executeWhenReady(() => {
        engine.hideLoadingUI();
        console.log("[DEBUG] Scene is fully loaded and ready.");
    });
});
