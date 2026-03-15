const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.activeTool = "BUILD";
window.segmentType = "NORMAL";
window.pathMode = "STRAIGHT";

const btnMode = document.getElementById("btn-mode");
const btnPathMode = document.getElementById("btn-path-mode");
const btnShowSegments = document.getElementById("btn-show-segments");
const selectorPanel = document.getElementById("selector");

btnMode.addEventListener("click", () => {
    if (window.activeTool === "BUILD") {
        window.activeTool = "MOVE";
        btnMode.innerText = "Mode: MOVE";
        btnMode.className = "btn btn-red";
        selectorPanel.classList.add("hidden");
    } else {
        window.activeTool = "BUILD";
        btnMode.innerText = "Mode: BUILD";
        btnMode.className = "btn btn-blue";
        selectorPanel.classList.remove("hidden");
    }
});

btnPathMode.addEventListener("click", () => {
    if (window.pathMode === "STRAIGHT") {
        window.pathMode = "SPLINE";
        btnPathMode.innerText = "Path: SPLINE";
        btnPathMode.className = "btn btn-green";
    } else {
        window.pathMode = "STRAIGHT";
        btnPathMode.innerText = "Path: STRAIGHT";
        btnPathMode.className = "btn btn-orange";
    }
});

window.showSegments = false;
btnShowSegments.addEventListener("click", () => {
    window.showSegments = !window.showSegments;
    if (window.showSegments) {
        btnShowSegments.innerText = "Show Segments: ON";
    } else {
        btnShowSegments.innerText = "Show Segments: OFF";
    }
});

// Build Menu Data
const buildMenuData = [
    {
        category: 'Traffic',
        object: [
            {
                category: 'Roads',
                object: [
                    { name: 'Normal Road', type: 'NORMAL', imageSrc: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop' },
                    { name: 'Highway', type: 'HIGHWAY', imageSrc: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=100&h=100&fit=crop' },
                    { name: 'One Way Road', type: 'ONE_WAY_ROAD', imageSrc: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=100&h=100&fit=crop' },
                    { name: '4 Lane Road', type: 'FOUR_LANE_ROAD', imageSrc: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=100&h=100&fit=crop' },
                    { name: 'Two Way Highway', type: 'TWO_WAY_HIGHWAY', imageSrc: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'Public Transport',
                object: [
                    { name: 'Train Track', type: 'TRAIN', imageSrc: 'https://images.unsplash.com/photo-1558487661-9d4f01e2ad64?w=100&h=100&fit=crop' },
                    { name: 'Metro Line', type: 'METRO', imageSrc: 'https://images.unsplash.com/photo-1581093588401-12f1c0f0fce3?w=100&h=100&fit=crop' },
                    { name: 'Bus Stop', type: 'BUS_STOP', imageSrc: 'https://images.unsplash.com/photo-1563720223523-491a2c4b3b02?w=100&h=100&fit=crop' }
                ]
            }
        ]
    },

    {
        category: 'Residential',
        object: [
            {
                category: 'Low Density',
                object: [
                    { name: 'Small House', type: 'HOUSE_SMALL', imageSrc: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&h=100&fit=crop' },
                    { name: 'Family House', type: 'HOUSE_FAMILY', imageSrc: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'High Density',
                object: [
                    { name: 'Apartment', type: 'APARTMENT', imageSrc: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop' },
                    { name: 'Residential Tower', type: 'RES_TOWER', imageSrc: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=100&h=100&fit=crop' }
                ]
            }
        ]
    },

    {
        category: 'Commercial',
        object: [
            {
                category: 'Shops',
                object: [
                    { name: 'Retail Shop', type: 'SHOP', imageSrc: 'https://images.unsplash.com/photo-1515169067865-5387ec356754?w=100&h=100&fit=crop' },
                    { name: 'Mall', type: 'MALL', imageSrc: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'Offices',
                object: [
                    { name: 'Office Building', type: 'OFFICE', imageSrc: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop' },
                    { name: 'Corporate Tower', type: 'CORP_TOWER', imageSrc: 'https://images.unsplash.com/photo-1486308510493-aa64833637b8?w=100&h=100&fit=crop' }
                ]
            }
        ]
    },

    {
        category: 'Industry',
        object: [
            {
                category: 'Factories',
                object: [
                    { name: 'Small Factory', type: 'FACTORY_SMALL', imageSrc: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=100&h=100&fit=crop' },
                    { name: 'Large Factory', type: 'FACTORY_LARGE', imageSrc: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'Energy',
                object: [
                    { name: 'Power Plant', type: 'POWER_PLANT', imageSrc: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=100&h=100&fit=crop' },
                    { name: 'Wind Turbine', type: 'WIND_TURBINE', imageSrc: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=100&h=100&fit=crop' }
                ]
            }
        ]
    },

    {
        category: 'Services',
        object: [
            {
                category: 'Health',
                object: [
                    { name: 'Hospital', type: 'HOSPITAL', imageSrc: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=100&h=100&fit=crop' },
                    { name: 'Clinic', type: 'CLINIC', imageSrc: 'https://images.unsplash.com/photo-1580281657527-47b3b1d5b8d6?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'Education',
                object: [
                    { name: 'School', type: 'SCHOOL', imageSrc: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&h=100&fit=crop' },
                    { name: 'University', type: 'UNIVERSITY', imageSrc: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop' }
                ]
            }
        ]
    },

    {
        category: 'Parks',
        object: [
            {
                category: 'Nature',
                object: [
                    { name: 'Small Park', type: 'PARK_SMALL', imageSrc: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100&h=100&fit=crop' },
                    { name: 'City Park', type: 'PARK_CITY', imageSrc: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=100&h=100&fit=crop' }
                ]
            },
            {
                category: 'Entertainment',
                object: [
                    { name: 'Playground', type: 'PLAYGROUND', imageSrc: 'https://images.unsplash.com/photo-1564869734812-9c7c8f2fef10?w=100&h=100&fit=crop' },
                    { name: 'Stadium', type: 'STADIUM', imageSrc: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop' }
                ]
            }
        ]
    }
];

let activeCategoryIndex = 0;
let activeSubcategoryIndex = 0;

function renderBuildMenu() {
    const mainOptionDiv = document.getElementById('main-option');
    const optionDiv = document.getElementById('option');
    const objDiv = document.getElementById('obj');

    mainOptionDiv.innerHTML = '';
    buildMenuData.forEach((mainCat, index) => {
        const div = document.createElement('div');
        div.innerText = mainCat.category;
        if (index === activeCategoryIndex) div.classList.add('active');
        div.addEventListener('click', () => {
            activeCategoryIndex = index;
            activeSubcategoryIndex = 0;
            renderBuildMenu();
        });
        mainOptionDiv.appendChild(div);
    });

    optionDiv.innerHTML = '';
    const subCategories = buildMenuData[activeCategoryIndex]?.object || [];
    subCategories.forEach((subCat, index) => {
        const div = document.createElement('div');
        div.innerText = subCat.category;
        if (index === activeSubcategoryIndex) div.classList.add('active');
        div.addEventListener('click', () => {
            activeSubcategoryIndex = index;
            renderBuildMenu();
        });
        optionDiv.appendChild(div);
    });

    objDiv.innerHTML = '';
    const items = subCategories[activeSubcategoryIndex]?.object || [];
    items.forEach((item) => {
        const div = document.createElement('div');
        div.innerText = item.name;
        div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${item.imageSrc})`;
        if (window.segmentType === item.type) div.style.border = '2px solid #f1c40f'; // Highlight selected object
        div.addEventListener('click', () => {
            window.segmentType = item.type;
            renderBuildMenu(); // re-render to highlight the new active item
        });
        objDiv.appendChild(div);
    });
}

renderBuildMenu();

const btnSpawnCar = document.createElement("button");
btnSpawnCar.innerText = "Spawn Car";
btnSpawnCar.className = "btn btn-purple";
document.getElementById("mode-toggle").appendChild(document.createElement("br"));
document.getElementById("mode-toggle").appendChild(btnSpawnCar);

btnSpawnCar.addEventListener("click", () => {
    const startId = parseInt(prompt("Enter Start Segment ID:"));
    const endId = parseInt(prompt("Enter End Segment ID:"));

    if (isNaN(startId) || isNaN(endId)) {
        alert("Invalid segment IDs provided.");
        return;
    }

    const path = trip.getShortestPath(startId, endId);

    if (path && path.length > 0) {
        const newCar = new Car(world, path);
        world.cars.push(newCar);
    } else {
        alert("No valid path exists between those segments!");
    }
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const camera = new Camera(canvas);
const world = new World(canvas, camera);
const trip = new Trip(world);

// Keep a global list of active cars
world.cars = [];

function animation() {
    camera.restore(ctx);
    world.draw(ctx);
    requestAnimationFrame(animation);
}
animation();
