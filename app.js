// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 50; // Account for toolbar
    if (typeof redraw === 'function') redraw();
}
window.addEventListener('resize', resizeCanvas);
// Will call resizeCanvas() after functions are defined

// State
let elements = [];
let history = [];
let historyStep = -1;
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let selectedElement = null;
let selectedElements = []; // For multi-select
let isRectangleSelecting = false;
let selectionRect = null;
let dragMode = null; // 'move' or 'resize'
let resizeHandle = null;
let lastCreatedShape = null; // Track last created shape for 'M' key duplication
let duplicationDirection = null; // Track direction for consistent duplication chain ('vertical' or 'horizontal')
let thingCounter = 1; // Auto-incrementing counter for "Thing N"
let isConnectMode = false; // For connecting selected elements
let nextElementId = 1; // Unique ID for elements

// Canvas mode ('infinite' or 'storybook')
let canvasMode = 'infinite'; // Default to infinite canvas

// Storybook mode state
let pages = []; // Array of pages, each contains {elements, backgroundColor}
let currentPageIndex = 0; // Current page being viewed
let isPlayingPages = false; // Slideshow play state
let playPagesInterval = null; // Interval timer for slideshow
const SLIDESHOW_DELAY = 2000; // 2 seconds between pages

// Pan/Scroll state
let panOffsetX = 0;
let panOffsetY = 0;
let zoomLevel = 1;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let spacePressed = false;

// Stroke and fill settings
const strokeColorInput = document.getElementById('strokeColor');
const fillColorInput = document.getElementById('fillColor');
const fillEnabledInput = document.getElementById('fillEnabled');
const fontBtn = document.getElementById('fontBtn');
const fontBtnText = document.getElementById('fontBtnText');
const fontDropdown = document.getElementById('fontDropdown');
let selectedFont = 'Comic Sans MS, cursive'; // Default font
const fontSizeSelect = document.getElementById('fontSizeSelect');
const textColorInput = document.getElementById('textColor');
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
let isBold = false;
let isItalic = false;
const bgColorInput = document.getElementById('bgColor');
let currentLineStyle = 'solid';
let currentLineRouting = 'straight';
let currentLineThickness = 2;

// Grid and snapping
let showGrid = false;
let snapToGrid = false;
const gridSize = 20;

// Clipboard for copy/paste
let clipboard = [];

const rectangleBtn = document.getElementById('rectangleBtn');
const rectangleDropdown = document.getElementById('rectangleDropdown');
const circleBtn = document.getElementById('circleBtn');
const circleDropdown = document.getElementById('circleDropdown');

// Style presets - tasteful, muted color combinations
const stylePresets = {
    slate: { stroke: '#2C3E50', fill: '#ECF0F1' },      // Dark blue-grey border, light grey fill
    sage: { stroke: '#556B2F', fill: '#D8E4BC' },       // Dark olive border, light sage fill
    terracotta: { stroke: '#A0522D', fill: '#F4DCC4' }, // Sienna border, light peach fill
    ocean: { stroke: '#2C5F7F', fill: '#B8D4E8' },      // Deep teal border, light blue fill
    plum: { stroke: '#6B4C7A', fill: '#E6D9ED' },       // Deep purple border, light lavender fill
    charcoal: { stroke: '#3D3D3D', fill: '#E8E6E3' },   // Dark grey border, warm light grey fill
    forest: { stroke: '#2D5016', fill: '#C8E6C9' },     // Deep forest green border, light mint fill
    burgundy: { stroke: '#6B2737', fill: '#F8E1E7' },   // Deep wine red border, light pink fill
    navy: { stroke: '#1A3A52', fill: '#D1E7F0' },       // Navy blue border, light sky blue fill
    copper: { stroke: '#8B4513', fill: '#F5DEB3' },     // Dark copper border, wheat fill
    moss: { stroke: '#4A5D23', fill: '#E3EAC2' },       // Dark olive-green border, light yellow-green fill
    ink: { stroke: '#1C2833', fill: '#F4F6F7' },        // Very dark blue-black border, off-white fill
    clay: { stroke: '#8B4726', fill: '#DEB887' },       // Brown-red border, burlywood fill
    storm: { stroke: '#34495E', fill: '#D5DBDB' },      // Dark slate blue border, light blue-grey fill
    mauve: { stroke: '#7D6B7D', fill: '#F0E6EF' }       // Muted purple border, light rose fill
};

// Background color state
let backgroundColor = '#FFFEF9';

// AWS Icon Loading System
const awsIconCache = {};
const awsIconURLs = {
    // Compute
    ec2: 'aws-icons/ec2.svg',
    lambda: 'aws-icons/lambda.svg',
    fargate: 'aws-icons/fargate.svg',
    batch: 'aws-icons/batch.svg',
    ecs: 'aws-icons/ecs.svg',
    eks: 'aws-icons/eks.svg',
    // Storage
    s3: 'aws-icons/s3.svg',
    ebs: 'aws-icons/ebs.svg',
    efs: 'aws-icons/efs.svg',
    glacier: 'aws-icons/glacier.svg',
    // Database
    rds: 'aws-icons/rds.svg',
    dynamodb: 'aws-icons/dynamodb.svg',
    aurora: 'aws-icons/aurora.svg',
    elasticache: 'aws-icons/elasticache.svg',
    neptune: 'aws-icons/neptune.svg',
    documentdb: 'aws-icons/documentdb.svg',
    // Networking
    vpc: 'aws-icons/vpc.svg',
    cloudfront: 'aws-icons/cloudfront.svg',
    route53: 'aws-icons/route53.svg',
    apiGateway: 'aws-icons/apigateway.svg',
    elb: 'aws-icons/elb.svg',
    directconnect: 'aws-icons/directconnect.svg',
    transitgateway: 'aws-icons/transitgateway.svg',
    natgateway: 'aws-icons/natgateway.svg',
    // Security
    iam: 'aws-icons/iam.svg',
    cognito: 'aws-icons/cognito.svg',
    secretsmanager: 'aws-icons/secretsmanager.svg',
    waf: 'aws-icons/waf.svg',
    // Developer Tools
    codepipeline: 'aws-icons/codepipeline.svg',
    codebuild: 'aws-icons/codebuild.svg',
    codedeploy: 'aws-icons/codedeploy.svg',
    codecommit: 'aws-icons/codecommit.svg',
    // Integration
    sqs: 'aws-icons/sqs.svg',
    sns: 'aws-icons/sns.svg',
    eventbridge: 'aws-icons/eventbridge.svg',
    stepfunctions: 'aws-icons/stepfunctions.svg',
    appsync: 'aws-icons/appsync.svg',
    // Analytics & ML
    athena: 'aws-icons/athena.svg',
    redshift: 'aws-icons/redshift.svg',
    kinesis: 'aws-icons/kinesis.svg',
    emr: 'aws-icons/emr.svg',
    sagemaker: 'aws-icons/sagemaker.svg',
    glue: 'aws-icons/glue.svg',
    // Management
    cloudwatch: 'aws-icons/cloudwatch.svg'
};

// Preload AWS icons
function loadAWSIcon(serviceName, url) {
    if (awsIconCache[serviceName]) {
        return awsIconCache[serviceName];
    }

    const img = new Image();
    img.src = url;

    awsIconCache[serviceName] = {
        image: img,
        loaded: false,
        error: false
    };

    img.onload = () => {
        awsIconCache[serviceName].loaded = true;
        redraw();
    };

    img.onerror = () => {
        awsIconCache[serviceName].error = true;
        console.warn(`Failed to load AWS icon: ${serviceName}`);
    };

    return awsIconCache[serviceName];
}

// Preload all AWS icons on startup
Object.keys(awsIconURLs).forEach(service => {
    loadAWSIcon(service, awsIconURLs[service]);
});

// Ensure all elements have IDs
function ensureElementIds() {
    let fixed = 0;
    elements.forEach(el => {
        if (!el.id) {
            el.id = nextElementId++;
            fixed++;
        }
    });
}

// Template definitions
const templates = {
    // Flowchart
    process: { type: 'rectangle', width: 120, height: 60 },
    decision: { type: 'diamond', width: 100, height: 100 },
    data: { type: 'parallelogram', width: 120, height: 60 },
    terminator: { type: 'roundRect', width: 120, height: 50 },
    document: { type: 'document', width: 120, height: 100 },
    // UML
    class: { type: 'umlClass', width: 140, height: 120 },
    actor: { type: 'stickFigure', width: 60, height: 80 },
    package: { type: 'umlPackage', width: 140, height: 100 },
    // Cloud/AWS
    server: { type: 'server', width: 100, height: 120 },
    database: { type: 'database', width: 100, height: 80 },
    cloud: { type: 'cloud', width: 140, height: 80 },
    lambda: { type: 'lambda', width: 100, height: 80 },
    storage: { type: 'storage', width: 100, height: 80 },
    queue: { type: 'queue', width: 120, height: 60 },
    // Shapes
    hexagon: { type: 'hexagon', width: 100, height: 100 },
    triangle: { type: 'triangle', width: 100, height: 100 },
    star: { type: 'star', width: 100, height: 100 },
    note: { type: 'note', width: 120, height: 100 },
    cylinder: { type: 'cylinder', width: 100, height: 80 },
    // Network
    router: { type: 'router', width: 100, height: 80 },
    firewall: { type: 'firewall', width: 100, height: 100 },
    switch: { type: 'switch', width: 120, height: 60 },
    // AWS Compute
    ec2: { type: 'ec2', width: 100, height: 100 },
    lambda: { type: 'lambda', width: 100, height: 100 },
    fargate: { type: 'fargate', width: 100, height: 100 },
    batch: { type: 'batch', width: 100, height: 100 },
    ecs: { type: 'ecs', width: 100, height: 100 },
    eks: { type: 'eks', width: 100, height: 100 },
    // AWS Storage
    s3: { type: 's3', width: 100, height: 100 },
    ebs: { type: 'ebs', width: 100, height: 100 },
    efs: { type: 'efs', width: 100, height: 100 },
    glacier: { type: 'glacier', width: 100, height: 100 },
    // AWS Database
    rds: { type: 'rds', width: 100, height: 100 },
    dynamodb: { type: 'dynamodb', width: 100, height: 100 },
    aurora: { type: 'aurora', width: 100, height: 100 },
    elasticache: { type: 'elasticache', width: 100, height: 100 },
    neptune: { type: 'neptune', width: 100, height: 100 },
    documentdb: { type: 'documentdb', width: 100, height: 100 },
    // AWS Networking
    vpc: { type: 'vpc', width: 100, height: 100 },
    cloudfront: { type: 'cloudfront', width: 100, height: 100 },
    route53: { type: 'route53', width: 100, height: 100 },
    'api-gateway': { type: 'apiGateway', width: 100, height: 100 },
    elb: { type: 'elb', width: 100, height: 100 },
    directconnect: { type: 'directconnect', width: 100, height: 100 },
    transitgateway: { type: 'transitgateway', width: 100, height: 100 },
    natgateway: { type: 'natgateway', width: 100, height: 100 },
    // AWS Security
    iam: { type: 'iam', width: 100, height: 100 },
    cognito: { type: 'cognito', width: 100, height: 100 },
    secretsmanager: { type: 'secretsmanager', width: 100, height: 100 },
    waf: { type: 'waf', width: 100, height: 100 },
    // AWS Developer Tools
    codepipeline: { type: 'codepipeline', width: 100, height: 100 },
    codebuild: { type: 'codebuild', width: 100, height: 100 },
    codedeploy: { type: 'codedeploy', width: 100, height: 100 },
    codecommit: { type: 'codecommit', width: 100, height: 100 },
    // AWS Integration
    sqs: { type: 'sqs', width: 100, height: 100 },
    sns: { type: 'sns', width: 100, height: 100 },
    eventbridge: { type: 'eventbridge', width: 100, height: 100 },
    stepfunctions: { type: 'stepfunctions', width: 100, height: 100 },
    appsync: { type: 'appsync', width: 100, height: 100 },
    // AWS Analytics & ML
    athena: { type: 'athena', width: 100, height: 100 },
    redshift: { type: 'redshift', width: 100, height: 100 },
    kinesis: { type: 'kinesis', width: 100, height: 100 },
    emr: { type: 'emr', width: 100, height: 100 },
    sagemaker: { type: 'sagemaker', width: 100, height: 100 },
    glue: { type: 'glue', width: 100, height: 100 },
    // AWS Management
    cloudwatch: { type: 'cloudwatch', width: 100, height: 100 },

    // Azure
    'azure-vm': { type: 'rectangle', width: 100, height: 80 },
    'azure-functions': { type: 'rectangle', width: 100, height: 80 },
    'azure-storage': { type: 'cylinder', width: 80, height: 100 },
    'azure-sql': { type: 'cylinder', width: 80, height: 100 },
    'azure-vnet': { type: 'cloud', width: 120, height: 80 },

    // GCP
    'gcp-computeengine': { type: 'rectangle', width: 100, height: 80 },
    'gcp-cloudfunctions': { type: 'rectangle', width: 100, height: 80 },
    'gcp-storage': { type: 'cylinder', width: 80, height: 100 },
    'gcp-cloudsql': { type: 'cylinder', width: 80, height: 100 },
    'gcp-vpc': { type: 'cloud', width: 120, height: 80 },

    // Business
    user: { type: 'user', width: 60, height: 80 },
    users: { type: 'users', width: 100, height: 80 },
    folder: { type: 'folder', width: 100, height: 80 },
    file: { type: 'file', width: 70, height: 90 },
    envelope: { type: 'envelope', width: 100, height: 70 },
    calendar: { type: 'calendar', width: 90, height: 90 },
    // Devices
    desktop: { type: 'desktop', width: 100, height: 80 },
    laptop: { type: 'laptop', width: 100, height: 70 },
    mobile: { type: 'mobile', width: 50, height: 90 },
    tablet: { type: 'tablet', width: 70, height: 90 },
    // Symbols
    gear: { type: 'gear', width: 80, height: 80 },
    lock: { type: 'lock', width: 70, height: 90 },
    shield: { type: 'shield', width: 80, height: 90 },
    key: { type: 'key', width: 90, height: 50 },
    bell: { type: 'bell', width: 70, height: 80 },
    check: { type: 'check', width: 80, height: 80 },
    warning: { type: 'warning', width: 80, height: 80 },
    clock: { type: 'clock', width: 80, height: 80 }
};

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Only handle as tool selection if button has data-tool attribute
        if (!btn.dataset.tool) return;

        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        if (currentTool === 'select') {
            canvas.style.cursor = 'default';
        } else if (currentTool === 'hand') {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
        selectedElement = null;
        selectedElements = [];
        redraw();
    });
});

// Helper function to calculate contrasting text color
function getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Update color label backgrounds and text colors
function updateColorLabel(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (!input || !label) return;
    const color = input.value;
    label.style.backgroundColor = color;
    label.style.color = getContrastColor(color);
}

function updateColorIcons() {
    const strokeIcon = document.getElementById('strokeIcon');
    const fillIcon = document.getElementById('fillIcon');
    const textColorIcon = document.getElementById('textColorIcon');

    if (strokeIcon && strokeColorInput) {
        strokeIcon.style.borderColor = strokeColorInput.value;
    }
    if (fillIcon && fillColorInput) {
        fillIcon.style.backgroundColor = fillColorInput.value;
    }
    if (textColorIcon && textColorInput) {
        textColorIcon.style.color = textColorInput.value;
    }
}

// Initialize color labels and icons (only for elements that exist)
updateColorLabel('bgColor', 'bgLabel');
updateColorIcons();

// Background color change
bgColorInput.addEventListener('input', (e) => {
    backgroundColor = e.target.value;
    updateColorLabel('bgColor', 'bgLabel');
    redraw();
});

// Shape dropdown toggle for rectangle
rectangleBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Toggle dropdown open/close
    const isOpen = rectangleDropdown.classList.contains('active');
    rectangleDropdown.classList.toggle('active');
    circleDropdown.classList.remove('active');

    // If we just opened the dropdown, don't activate the tool
    if (isOpen) {
        // Dropdown was open, now closed - activate rectangle tool with current colors
        currentTool = 'rectangle';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        rectangleBtn.classList.add('active');
        canvas.style.cursor = 'crosshair';
        selectedElement = null;
        selectedElements = [];
        redraw();
    }
});

// Shape dropdown toggle for circle
circleBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Toggle dropdown open/close
    const isOpen = circleDropdown.classList.contains('active');
    circleDropdown.classList.toggle('active');
    rectangleDropdown.classList.remove('active');

    // If we just opened the dropdown, don't activate the tool
    if (isOpen) {
        // Dropdown was open, now closed - activate circle tool with current colors
        currentTool = 'circle';
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        circleBtn.classList.add('active');
        canvas.style.cursor = 'crosshair';
        selectedElement = null;
        selectedElements = [];
        redraw();
    }
});

// Font dropdown toggle
fontBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fontDropdown.classList.toggle('active');
    rectangleDropdown.classList.remove('active');
    circleDropdown.classList.remove('active');
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const logoBtn = document.getElementById('logoBtn');
    const logoDropdown = document.getElementById('logoDropdown');
    const lineOptionsBtn = document.getElementById('lineOptionsBtn');
    const lineOptionsDropdown = document.getElementById('lineOptionsDropdown');
    const alignBtn = document.getElementById('alignBtn');
    const alignDropdown = document.getElementById('alignDropdown');
    const zoomBtn = document.getElementById('zoomBtn');
    const zoomDropdown = document.getElementById('zoomDropdown');
    const selectionBtn = document.getElementById('selectionBtn');
    const selectionDropdown = document.getElementById('selectionDropdown');

    if (!rectangleBtn.contains(e.target) && !rectangleDropdown.contains(e.target)) {
        rectangleDropdown.classList.remove('active');
    }
    if (!circleBtn.contains(e.target) && !circleDropdown.contains(e.target)) {
        circleDropdown.classList.remove('active');
    }
    if (!fontBtn.contains(e.target) && !fontDropdown.contains(e.target)) {
        fontDropdown.classList.remove('active');
    }
    if (logoBtn && logoDropdown && !logoBtn.contains(e.target) && !logoDropdown.contains(e.target)) {
        logoDropdown.classList.remove('active');
    }
    if (lineOptionsBtn && lineOptionsDropdown && !lineOptionsBtn.contains(e.target) && !lineOptionsDropdown.contains(e.target)) {
        lineOptionsDropdown.classList.remove('active');
    }
    if (alignBtn && alignDropdown && !alignBtn.contains(e.target) && !alignDropdown.contains(e.target)) {
        alignDropdown.classList.remove('active');
    }
    if (zoomBtn && zoomDropdown && !zoomBtn.contains(e.target) && !zoomDropdown.contains(e.target)) {
        zoomDropdown.classList.remove('active');
    }
    if (selectionBtn && selectionDropdown && !selectionBtn.contains(e.target) && !selectionDropdown.contains(e.target)) {
        selectionDropdown.classList.remove('active');
    }
});

// Shape selection with preset styling
document.querySelectorAll('.shape-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const shape = e.currentTarget.dataset.shape;
        const preset = e.currentTarget.dataset.preset;

        if (shape && preset && stylePresets[preset]) {
            // Set colors from preset
            strokeColorInput.value = stylePresets[preset].stroke;
            fillColorInput.value = stylePresets[preset].fill;
            fillEnabledInput.checked = true;

            // Update color icons
            updateColorIcons();

            // If there are selected elements, apply the preset to them
            if (selectedElements.length > 0) {
                selectedElements.forEach(el => {
                    el.strokeColor = stylePresets[preset].stroke;
                    el.fillColor = stylePresets[preset].fill;
                });
                saveHistory();
            } else if (selectedElement) {
                selectedElement.strokeColor = stylePresets[preset].stroke;
                selectedElement.fillColor = stylePresets[preset].fill;
                saveHistory();
            } else {
                // No selection - set the tool for drawing new shapes
                currentTool = shape;

                // Update tool button active state
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                if (shape === 'rectangle') {
                    rectangleBtn.classList.add('active');
                } else if (shape === 'circle') {
                    circleBtn.classList.add('active');
                }

                // Set cursor
                canvas.style.cursor = 'crosshair';

                // Clear selection
                selectedElement = null;
                selectedElements = [];
            }

            // Close dropdowns
            rectangleDropdown.classList.remove('active');
            circleDropdown.classList.remove('active');

            redraw();
        }
    });
});

// Font selection
document.querySelectorAll('.font-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const font = e.currentTarget.dataset.font;
        const name = e.currentTarget.dataset.name;

        if (font) {
            selectedFont = font;
            fontBtnText.textContent = name;
            fontDropdown.classList.remove('active');

            // Apply to selected text elements and child text elements of selected shapes
            const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
            if (elementsToUpdate.length > 0) {
                elementsToUpdate.forEach(el => {
                    if (el.type === 'text') {
                        el.fontFamily = font;
                    }
                    // Also update child text elements
                    elements.forEach(child => {
                        if (child.type === 'text' && child.parentId === el.id) {
                            child.fontFamily = font;
                        }
                    });
                });
                saveHistory();
                redraw();
            }
        }
    });
});

// Fill color change - update selected element
fillColorInput.addEventListener('input', (e) => {
    updateColorIcons();
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0 && fillEnabledInput.checked) {
        elementsToUpdate.forEach(el => {
            if (el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen') {
                el.fillColor = e.target.value;
            }
        });
        saveHistory();
        redraw();
    }
});

// Stroke color change - update selected element
strokeColorInput.addEventListener('input', (e) => {
    updateColorIcons();
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            el.strokeColor = e.target.value;
        });
        saveHistory();
        redraw();
    }
});

// Fill enabled toggle - update selected element
fillEnabledInput.addEventListener('change', (e) => {
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen') {
                el.fillColor = e.target.checked ? fillColorInput.value : null;
            }
        });
        saveHistory();
        redraw();
    }
});

// Text color change - update selected text elements
textColorInput.addEventListener('input', (e) => {
    updateColorIcons();
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type === 'text') {
                el.textColor = e.target.value;
            }
            // Also update child text elements
            elements.forEach(child => {
                if (child.type === 'text' && child.parentId === el.id) {
                    child.textColor = e.target.value;
                }
            });
        });
        saveHistory();
        redraw();
    }
});

// Bold button toggle
boldBtn.addEventListener('click', () => {
    isBold = !isBold;
    boldBtn.classList.toggle('active', isBold);

    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type === 'text') {
                el.bold = isBold;
            }
            // Also update child text elements
            elements.forEach(child => {
                if (child.type === 'text' && child.parentId === el.id) {
                    child.bold = isBold;
                }
            });
        });
        saveHistory();
        redraw();
    }
});

// Italic button toggle
italicBtn.addEventListener('click', () => {
    isItalic = !isItalic;
    italicBtn.classList.toggle('active', isItalic);

    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type === 'text') {
                el.italic = isItalic;
            }
            // Also update child text elements
            elements.forEach(child => {
                if (child.type === 'text' && child.parentId === el.id) {
                    child.italic = isItalic;
                }
            });
        });
        saveHistory();
        redraw();
    }
});

// Font size change - update selected text elements
fontSizeSelect.addEventListener('change', (e) => {
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type === 'text') {
                el.fontSize = parseInt(e.target.value);
            }
            // Also update child text elements
            elements.forEach(child => {
                if (child.type === 'text' && child.parentId === el.id) {
                    child.fontSize = parseInt(e.target.value);
                }
            });
        });
        saveHistory();
        redraw();
    }
});

// Line options dropdown (combined style + routing)
const lineOptionsBtn = document.getElementById('lineOptionsBtn');
const lineOptionsDropdown = document.getElementById('lineOptionsDropdown');

lineOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    lineOptionsDropdown.classList.toggle('active');

    // Close other dropdowns
    rectangleDropdown.classList.remove('active');
    circleDropdown.classList.remove('active');
    fontDropdown.classList.remove('active');
    const logoDropdown = document.getElementById('logoDropdown');
    if (logoDropdown) logoDropdown.classList.remove('active');
});

// Update line options button icon
function updateLineOptionsButtonIcon(style, routing, thickness = 2) {
    const btnSvg = lineOptionsBtn.querySelector('svg');
    if (!btnSvg) return;

    let dashArray = '';
    if (style === 'dashed') {
        dashArray = thickness <= 2 ? 'stroke-dasharray="4,3"' : `stroke-dasharray="${thickness * 2},${thickness + 1}"`;
    } else if (style === 'dotted') {
        dashArray = thickness <= 2 ? 'stroke-dasharray="1,3"' : `stroke-dasharray="1,${thickness + 1}"`;
    }

    if (routing === 'straight') {
        btnSvg.innerHTML = `<line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="${thickness}" ${dashArray}/>`;
    } else {
        btnSvg.innerHTML = `<path d="M 2 14 L 8 14 L 8 6 L 18 6" stroke="currentColor" stroke-width="${thickness}" fill="none" ${dashArray}/>`;
    }
}

// Line option button handlers
// Integrated line combo button handlers (style + routing + thickness)
document.querySelectorAll('.line-combo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const style = btn.dataset.style;
        const routing = btn.dataset.routing;
        const thickness = parseInt(btn.dataset.thickness);

        // Update button states
        document.querySelectorAll('.line-combo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update current state
        currentLineStyle = style;
        currentLineRouting = routing;
        currentLineThickness = thickness;

        // Update the button icon
        updateLineOptionsButtonIcon(style, routing, thickness);

        // Update selected elements
        const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
        if (elementsToUpdate.length > 0) {
            elementsToUpdate.forEach(el => {
                if (el.type === 'line' || el.type === 'arrow' || el.type === 'pen' || el.type === 'rectangle' || el.type === 'circle') {
                    el.lineStyle = style;
                    el.lineThickness = thickness;
                }
                if (el.type === 'line' || el.type === 'arrow') {
                    el.lineRouting = routing;
                }
            });
            saveHistory();
            redraw();
        }

        // Close dropdown
        lineOptionsDropdown.classList.remove('active');
    });
});

// Alignment and distribution dropdown
const alignBtn = document.getElementById('alignBtn');
const alignDropdown = document.getElementById('alignDropdown');

if (alignBtn && alignDropdown) {
    alignBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        alignDropdown.classList.toggle('active');

        // Close other dropdowns
        rectangleDropdown.classList.remove('active');
        circleDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
        lineOptionsDropdown.classList.remove('active');
        const logoDropdown = document.getElementById('logoDropdown');
        if (logoDropdown) logoDropdown.classList.remove('active');
    });

    // Helper function to update child text positions when parent moves
    function updateChildTextPositions(element, dx, dy) {
        if (!element.id) return;

        // Find all text elements that are children of this element
        elements.forEach(el => {
            if (el.type === 'text' && el.parentId === element.id) {
                el.x += dx;
                el.y += dy;
            }
        });
    }

    // Alignment functions
    function alignLeft() {
        if (selectedElements.length < 2) return;

        // Build a set of selected element IDs that are shapes (non-text)
        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        // Filter out text elements that have a parent shape in the selection
        // This allows standalone text to be aligned, but child text moves with parents
        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false; // Skip child text - it will move with parent
            }
            return true; // Include shapes and standalone text
        });

        if (elementsToAlign.length < 2) return;

        const minX = Math.min(...elementsToAlign.map(el => el.x));
        elementsToAlign.forEach(el => {
            const oldX = el.x;
            el.x = minX;
            updateChildTextPositions(el, el.x - oldX, 0);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function alignCenter() {
        if (selectedElements.length < 2) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToAlign.length < 2) return;

        const centerX = elementsToAlign.reduce((sum, el) => sum + (el.x + (el.width || 0) / 2), 0) / elementsToAlign.length;
        elementsToAlign.forEach(el => {
            const oldX = el.x;
            el.x = centerX - (el.width || 0) / 2;
            updateChildTextPositions(el, el.x - oldX, 0);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function alignRight() {
        if (selectedElements.length < 2) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToAlign.length < 2) return;

        const maxX = Math.max(...elementsToAlign.map(el => el.x + (el.width || 0)));
        elementsToAlign.forEach(el => {
            const oldX = el.x;
            el.x = maxX - (el.width || 0);
            updateChildTextPositions(el, el.x - oldX, 0);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function alignTop() {
        if (selectedElements.length < 2) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToAlign.length < 2) return;

        const minY = Math.min(...elementsToAlign.map(el => el.y));
        elementsToAlign.forEach(el => {
            const oldY = el.y;
            el.y = minY;
            updateChildTextPositions(el, 0, el.y - oldY);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function alignMiddle() {
        if (selectedElements.length < 2) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToAlign.length < 2) return;

        const centerY = elementsToAlign.reduce((sum, el) => sum + (el.y + (el.height || 0) / 2), 0) / elementsToAlign.length;
        elementsToAlign.forEach(el => {
            const oldY = el.y;
            el.y = centerY - (el.height || 0) / 2;
            updateChildTextPositions(el, 0, el.y - oldY);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function alignBottom() {
        if (selectedElements.length < 2) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToAlign = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToAlign.length < 2) return;

        const maxY = Math.max(...elementsToAlign.map(el => el.y + (el.height || 0)));
        elementsToAlign.forEach(el => {
            const oldY = el.y;
            el.y = maxY - (el.height || 0);
            updateChildTextPositions(el, 0, el.y - oldY);
        });
        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function distributeHorizontally() {
        if (selectedElements.length < 3) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToDistribute = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToDistribute.length < 3) return;

        // Build a map of shapes to their child text for this operation
        const shapeToText = new Map();
        elementsToDistribute.forEach(shape => {
            if (shape.id) {
                const childText = elements.find(el => el.type === 'text' && el.parentId === shape.id);
                if (childText) {
                    shapeToText.set(shape.id, childText);
                }
            }
        });

        // Sort by x position
        const sorted = [...elementsToDistribute].sort((a, b) => a.x - b.x);
        const leftmost = sorted[0].x;
        const rightmost = sorted[sorted.length - 1].x + (sorted[sorted.length - 1].width || 0);
        const totalWidth = rightmost - leftmost;
        const totalElementWidth = sorted.reduce((sum, el) => sum + (el.width || 0), 0);
        const gap = (totalWidth - totalElementWidth) / (sorted.length - 1);

        let currentX = leftmost;
        sorted.forEach(el => {
            const dx = currentX - el.x;
            el.x = currentX;

            // Move child text by the same delta
            if (el.id && shapeToText.has(el.id)) {
                const childText = shapeToText.get(el.id);
                childText.x += dx;
            }

            currentX += (el.width || 0) + gap;
        });

        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    function distributeVertically() {
        if (selectedElements.length < 3) return;

        const selectedShapeIds = new Set(
            selectedElements.filter(el => el.type !== 'text' && el.id).map(el => el.id)
        );

        const elementsToDistribute = selectedElements.filter(el => {
            if (el.type === 'text' && el.parentId && selectedShapeIds.has(el.parentId)) {
                return false;
            }
            return true;
        });

        if (elementsToDistribute.length < 3) return;

        // Build a map of shapes to their child text for this operation
        const shapeToText = new Map();
        elementsToDistribute.forEach(shape => {
            if (shape.id) {
                const childText = elements.find(el => el.type === 'text' && el.parentId === shape.id);
                if (childText) {
                    shapeToText.set(shape.id, childText);
                }
            }
        });

        // Sort by y position
        const sorted = [...elementsToDistribute].sort((a, b) => a.y - b.y);
        const topmost = sorted[0].y;
        const bottommost = sorted[sorted.length - 1].y + (sorted[sorted.length - 1].height || 0);
        const totalHeight = bottommost - topmost;
        const totalElementHeight = sorted.reduce((sum, el) => sum + (el.height || 0), 0);
        const gap = (totalHeight - totalElementHeight) / (sorted.length - 1);

        let currentY = topmost;
        sorted.forEach(el => {
            const dy = currentY - el.y;
            el.y = currentY;

            // Move child text by the same delta
            if (el.id && shapeToText.has(el.id)) {
                const childText = shapeToText.get(el.id);
                childText.y += dy;
            }

            currentY += (el.height || 0) + gap;
        });

        saveHistory();
        redraw();
        alignDropdown.classList.remove('active');
    }

    // Event listeners for alignment buttons
    document.getElementById('alignLeft')?.addEventListener('click', alignLeft);
    document.getElementById('alignCenter')?.addEventListener('click', alignCenter);
    document.getElementById('alignRight')?.addEventListener('click', alignRight);
    document.getElementById('alignTop')?.addEventListener('click', alignTop);
    document.getElementById('alignMiddle')?.addEventListener('click', alignMiddle);
    document.getElementById('alignBottom')?.addEventListener('click', alignBottom);
    document.getElementById('distributeH')?.addEventListener('click', distributeHorizontally);
    document.getElementById('distributeV')?.addEventListener('click', distributeVertically);
}

// Update zoom indicator display (global function)
function updateZoomIndicator() {
    const zoomPercentage = document.getElementById('zoomPercentage');
    if (zoomPercentage) {
        zoomPercentage.textContent = Math.round(zoomLevel * 100) + '%';
    }
}

// Zoom controls dropdown
const zoomBtn = document.getElementById('zoomBtn');
const zoomDropdown = document.getElementById('zoomDropdown');

if (zoomBtn && zoomDropdown) {
    zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        zoomDropdown.classList.toggle('active');

        // Close other dropdowns
        rectangleDropdown.classList.remove('active');
        circleDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
        lineOptionsDropdown.classList.remove('active');
        const logoDropdown = document.getElementById('logoDropdown');
        if (logoDropdown) logoDropdown.classList.remove('active');
        const alignDropdown = document.getElementById('alignDropdown');
        if (alignDropdown) alignDropdown.classList.remove('active');
    });

    // Zoom to fit all elements
    function zoomToFit() {
        if (elements.length === 0) {
            zoomLevel = 1;
            panOffsetX = 0;
            panOffsetY = 0;
            updateZoomIndicator();
            redraw();
            zoomDropdown.classList.remove('active');
            return;
        }

        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        elements.forEach(el => {
            if (el.type === 'text') {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + 100);
                maxY = Math.max(maxY, el.y + 20);
            } else if (el.type === 'line' || el.type === 'arrow') {
                minX = Math.min(minX, el.x1, el.x2);
                minY = Math.min(minY, el.y1, el.y2);
                maxX = Math.max(maxX, el.x1, el.x2);
                maxY = Math.max(maxY, el.y1, el.y2);
            } else if (el.type === 'pen') {
                el.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            } else {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + (el.width || 0));
                maxY = Math.max(maxY, el.y + (el.height || 0));
            }
        });

        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        const scaleX = canvas.width / contentWidth;
        const scaleY = canvas.height / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom

        zoomLevel = newZoom;
        panOffsetX = -(minX - padding) * zoomLevel;
        panOffsetY = -(minY - padding) * zoomLevel;

        updateZoomIndicator();
        redraw();
        zoomDropdown.classList.remove('active');
    }

    // Reset zoom to 100%
    function resetZoom() {
        zoomLevel = 1;
        panOffsetX = 0;
        panOffsetY = 0;
        updateZoomIndicator();
        redraw();
        zoomDropdown.classList.remove('active');
    }

    // Set zoom to specific percentage
    function setZoom(percentage) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const worldX = (centerX - panOffsetX) / zoomLevel;
        const worldY = (centerY - panOffsetY) / zoomLevel;

        zoomLevel = percentage / 100;

        panOffsetX = centerX - worldX * zoomLevel;
        panOffsetY = centerY - worldY * zoomLevel;

        updateZoomIndicator();
        redraw();
        zoomDropdown.classList.remove('active');
    }

    // Event listeners for zoom buttons
    document.getElementById('zoomFit')?.addEventListener('click', zoomToFit);
    document.getElementById('zoomReset')?.addEventListener('click', resetZoom);
    document.getElementById('zoom50')?.addEventListener('click', () => setZoom(50));
    document.getElementById('zoom100')?.addEventListener('click', () => setZoom(100));
    document.getElementById('zoom150')?.addEventListener('click', () => setZoom(150));
    document.getElementById('zoom200')?.addEventListener('click', () => setZoom(200));
}

// Selection controls dropdown
const selectionBtn = document.getElementById('selectionBtn');
const selectionDropdown = document.getElementById('selectionDropdown');

if (selectionBtn && selectionDropdown) {
    selectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectionDropdown.classList.toggle('active');

        // Close other dropdowns
        rectangleDropdown.classList.remove('active');
        circleDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
        lineOptionsDropdown.classList.remove('active');
        const logoDropdown = document.getElementById('logoDropdown');
        if (logoDropdown) logoDropdown.classList.remove('active');
        const alignDropdown = document.getElementById('alignDropdown');
        if (alignDropdown) alignDropdown.classList.remove('active');
        const zoomDropdown = document.getElementById('zoomDropdown');
        if (zoomDropdown) zoomDropdown.classList.remove('active');
    });

    // Event listeners for selection buttons
    document.getElementById('selectAllBtn')?.addEventListener('click', () => {
        selectAll();
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('lockSelectionBtn')?.addEventListener('click', () => {
        toggleLockSelection();
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('selectRectangles')?.addEventListener('click', () => {
        selectByType('rectangle');
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('selectCircles')?.addEventListener('click', () => {
        selectByType('circle');
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('selectLines')?.addEventListener('click', () => {
        selectByType('line');
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('selectArrows')?.addEventListener('click', () => {
        selectByType('arrow');
        selectionDropdown.classList.remove('active');
    });

    document.getElementById('selectText')?.addEventListener('click', () => {
        selectByType('text');
        selectionDropdown.classList.remove('active');
    });
}

// Template category collapse/expand
document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
        const items = header.nextElementSibling;
        const isActive = items.classList.contains('active');

        if (isActive) {
            items.classList.remove('active');
            header.classList.add('collapsed');
        } else {
            items.classList.add('active');
            header.classList.remove('collapsed');
        }

        // Redraw and reposition any active text inputs after template panel size changes
        setTimeout(() => {
            // Remove any active text inputs - they'll be recreated if user clicks again
            document.querySelectorAll('.text-input').forEach(input => {
                input.remove();
            });
            redraw();
        }, 300); // Match CSS transition time
    });
});

// Template subcategory collapse/expand
document.querySelectorAll('.subcategory-header').forEach(header => {
    header.addEventListener('click', () => {
        const items = header.nextElementSibling;
        const isActive = items.classList.contains('active');

        if (isActive) {
            items.classList.remove('active');
            header.classList.add('collapsed');
        } else {
            items.classList.add('active');
            header.classList.remove('collapsed');
        }

        // Redraw and reposition any active text inputs after template panel size changes
        setTimeout(() => {
            // Remove any active text inputs - they'll be recreated if user clicks again
            document.querySelectorAll('.text-input').forEach(input => {
                input.remove();
            });
            redraw();
        }, 300); // Match CSS transition time
    });
});

// Template selection
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const templateName = btn.dataset.template;
        const template = templates[templateName];
        if (template) {
            // Calculate center in world coordinates (accounting for pan and zoom)
            const viewportCenterWorldX = (canvas.width / 2 - panOffsetX) / zoomLevel;
            const viewportCenterWorldY = (canvas.height / 2 - panOffsetY) / zoomLevel;
            const rawCenterX = viewportCenterWorldX - template.width / 2;
            const rawCenterY = viewportCenterWorldY - template.height / 2;

            // Apply grid snapping
            const centerX = snapToGridValue(rawCenterX);
            const centerY = snapToGridValue(rawCenterY);

            const element = {
                ...template,
                id: nextElementId++,
                x: centerX,
                y: centerY,
                strokeColor: strokeColorInput.value,
                fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                lineStyle: currentLineStyle,
                lineThickness: currentLineThickness
            };
            elements.push(element);
            lastCreatedShape = element; // Track for 'M' key duplication
            duplicationDirection = null; // Reset direction for new shape
            saveHistory();
            redraw();

            // Auto-create text input for container template shapes
            const containerTemplates = ['process', 'decision', 'data', 'terminator', 'document',
                                       'class', 'package', 'server', 'database', 'cloud', 'lambda',
                                       'storage', 'queue', 'hexagon', 'note', 'cylinder',
                                       'router', 'firewall', 'switch'];
            const awsTemplates = ['ec2', 'lambda', 'fargate', 'batch', 'ecs', 'eks',
                                 's3', 'ebs', 'efs', 'glacier',
                                 'rds', 'dynamodb', 'aurora', 'elasticache', 'neptune', 'documentdb',
                                 'vpc', 'cloudfront', 'route53', 'api-gateway', 'elb',
                                 'directconnect', 'transitgateway', 'natgateway',
                                 'iam', 'cognito', 'secretsmanager', 'waf',
                                 'codepipeline', 'codebuild', 'codedeploy', 'codecommit',
                                 'sqs', 'sns', 'eventbridge', 'stepfunctions', 'appsync',
                                 'athena', 'redshift', 'kinesis', 'emr', 'sagemaker', 'glue',
                                 'cloudwatch'];

            if (containerTemplates.includes(templateName)) {
                const shapeCenterX = centerX + template.width / 2;
                const shapeCenterY = centerY + template.height / 2;

                setTimeout(() => {
                    createTextInputForShape(shapeCenterX, shapeCenterY, element);
                }, 10);
            } else if (awsTemplates.includes(templateName)) {
                // For AWS templates, position text below the icon
                const shapeCenterX = centerX + template.width / 2;
                const shapeBottomY = centerY + template.height + 20; // 20px below the box

                setTimeout(() => {
                    createTextInputBelowShape(shapeCenterX, shapeBottomY, element);
                }, 10);
            }
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore keyboard shortcuts when typing in text input
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
    }

    const key = e.key.toLowerCase();

    // '?' key toggles help panel
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        toggleHelpPanel();
        e.preventDefault();
        return;
    }

    // Escape key closes help panel, changelog panel, and modals
    if (e.key === 'Escape') {
        const helpPanel = document.getElementById('helpPanel');
        if (helpPanel.classList.contains('active')) {
            helpPanel.classList.remove('active');
            e.preventDefault();
            return;
        }

        const changelogPanel = document.getElementById('changelogPanel');
        if (changelogPanel.classList.contains('active')) {
            changelogPanel.classList.remove('active');
            e.preventDefault();
            return;
        }

        const exportModal = document.getElementById('exportModal');
        if (exportModal.classList.contains('active')) {
            exportModal.classList.remove('active');
            e.preventDefault();
            return;
        }
    }

    // 'c' key enters connect mode for drawing arrows between selected elements
    if (key === 'c' && !e.ctrlKey && !e.metaKey) {
        isConnectMode = true;
        currentTool = 'select';
        isRectangleSelecting = false;
        selectionRect = null;
        canvas.style.cursor = 'crosshair';
        redraw();
        return;
    }

    // 'g' key toggles grid, Shift+G toggles snap
    if (key === 'g' && !e.ctrlKey && !e.metaKey) {
        if (e.shiftKey) {
            // Shift+G toggles snap
            document.getElementById('snapToggleBtn').click();
        } else {
            // G toggles grid
            document.getElementById('gridToggleBtn').click();
        }
        e.preventDefault();
        return;
    }

    const toolMap = {
        'v': 'select', 'r': 'rectangle',
        'l': 'line', 'a': 'arrow', 'p': 'pen', 't': 'text', 'h': 'hand'
    };
    if (toolMap[key] && !e.ctrlKey && !e.metaKey) {
        // Handle rectangle dropdown button
        if (key === 'r') {
            rectangleBtn.click();
        } else {
            const btn = document.querySelector(`[data-tool="${toolMap[key]}"]`);
            if (btn) btn.click();
        }
    }
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
        undo();
        e.preventDefault();
    }

    // Copy (Cmd/Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && key === 'c' && !isConnectMode) {
        copySelection();
        e.preventDefault();
        return;
    }

    // Paste (Cmd/Ctrl+V)
    if ((e.ctrlKey || e.metaKey) && key === 'v') {
        pasteSelection();
        e.preventDefault();
        return;
    }

    // Duplicate (Cmd/Ctrl+D)
    if ((e.ctrlKey || e.metaKey) && key === 'd') {
        duplicateSelection();
        e.preventDefault();
        return;
    }

    // Select All (Cmd/Ctrl+A)
    if ((e.ctrlKey || e.metaKey) && key === 'a') {
        selectAll();
        e.preventDefault();
        return;
    }

    // Lock/Unlock selection (Cmd/Ctrl+L)
    if ((e.ctrlKey || e.metaKey) && key === 'l') {
        toggleLockSelection();
        e.preventDefault();
        return;
    }

    // 'M' key duplicates the last created shape
    if (key === 'm' && lastCreatedShape) {
        duplicateLastShape();
        e.preventDefault();
        return;
    }

    // Arrow keys for fine-grained positioning
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        const elementsToMove = selectedElements.length > 0
            ? selectedElements
            : (selectedElement ? [selectedElement] : []);

        if (elementsToMove.length === 0) return;

        const moveDistance = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;

        switch (key) {
            case 'arrowup':
                dy = -moveDistance;
                break;
            case 'arrowdown':
                dy = moveDistance;
                break;
            case 'arrowleft':
                dx = -moveDistance;
                break;
            case 'arrowright':
                dx = moveDistance;
                break;
        }

        // Build a set of selected element IDs and their child text IDs
        const selectedIds = new Set(elementsToMove.map(el => el.id).filter(id => id));
        const childTextIds = new Set();

        elementsToMove.forEach(el => {
            if (el.type !== 'text' && el.id) {
                elements.forEach(child => {
                    if (child.type === 'text' && child.parentId === el.id) {
                        childTextIds.add(child.id);
                    }
                });
            }
        });

        // Move elements (but skip child text - they'll move with their parents)
        elementsToMove.forEach(el => {
            // Skip this element if it's a child text of a selected parent
            if (el.type === 'text' && el.parentId && selectedIds.has(el.parentId)) {
                return;
            }

            if (el.type === 'pen') {
                el.points = el.points.map(p => ({x: p.x + dx, y: p.y + dy}));
            } else {
                el.x += dx;
                el.y += dy;
            }

            // Update child text positions if this is a shape
            if (el.type !== 'text' && el.id) {
                elements.forEach(child => {
                    if (child.type === 'text' && child.parentId === el.id) {
                        child.x += dx;
                        child.y += dy;
                    }
                });

                // Update connected arrows/lines
                elements.forEach(connector => {
                    if (connector.type === 'arrow' || connector.type === 'line') {
                        const connectedToStart = connector.startShapeId === el.id;
                        const connectedToEnd = connector.endShapeId === el.id;

                        if (connectedToStart || connectedToEnd) {
                            const startShape = connector.startShapeId ? elements.find(e => e.id === connector.startShapeId) : null;
                            const endShape = connector.endShapeId ? elements.find(e => e.id === connector.endShapeId) : null;

                            if (startShape && endShape) {
                                const startBounds = getElementBounds(startShape);
                                const endBounds = getElementBounds(endShape);

                                const centerToCenter = {
                                    dx: (endBounds.x + endBounds.width / 2) - (startBounds.x + startBounds.width / 2),
                                    dy: (endBounds.y + endBounds.height / 2) - (startBounds.y + startBounds.height / 2)
                                };
                                const isHorizontal = Math.abs(centerToCenter.dx) > Math.abs(centerToCenter.dy);

                                const connectionPoints = getDirectionalConnection(
                                    startBounds, startShape.type,
                                    endBounds, endShape.type,
                                    isHorizontal
                                );

                                if (connectionPoints) {
                                    connector.x = connectionPoints.from.x;
                                    connector.y = connectionPoints.from.y;
                                    connector.width = connectionPoints.to.x - connectionPoints.from.x;
                                    connector.height = connectionPoints.to.y - connectionPoints.from.y;
                                }
                            }
                        }
                    }
                });
            }
        });

        saveHistory();
        redraw();
        e.preventDefault();
        return;
    }

    if (key === 'delete' || key === 'backspace') {
        if (selectedElements.length > 0) {
            // Delete all selected elements
            elements = elements.filter(el => !selectedElements.includes(el));
            selectedElements = [];
            selectedElement = null;
            saveHistory();
            redraw();
            e.preventDefault();
        } else if (selectedElement) {
            // Delete single selected element
            elements = elements.filter(el => el !== selectedElement);
            selectedElement = null;
            saveHistory();
            redraw();
            e.preventDefault();
        }
    }
});

// Function to duplicate the last created shape
// Copy selected elements to clipboard
function copySelection() {
    const elementsToCopy = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    if (elementsToCopy.length === 0) return;

    clipboard = elementsToCopy.map(el => ({...el}));
}

// Paste elements from clipboard
function pasteSelection() {
    if (clipboard.length === 0) return;

    const pasteOffset = snapToGrid ? gridSize : 20;
    const idMap = new Map(); // Maps old IDs to new IDs for parent references
    const pastedElements = [];

    clipboard.forEach(el => {
        const newElement = {
            ...el,
            id: nextElementId++,
            x: el.x + pasteOffset,
            y: el.y + pasteOffset
        };

        // Store ID mapping for text parent references
        if (el.id) {
            idMap.set(el.id, newElement.id);
        }

        pastedElements.push(newElement);
    });

    // Update parent IDs for text elements
    pastedElements.forEach(el => {
        if (el.type === 'text' && el.parentId && idMap.has(el.parentId)) {
            el.parentId = idMap.get(el.parentId);
        }
    });

    elements.push(...pastedElements);

    // Select the pasted elements
    selectedElements = pastedElements;
    selectedElement = null;

    saveHistory();
    redraw();
}

// Duplicate selected elements in place
function duplicateSelection() {
    const elementsToDuplicate = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    if (elementsToDuplicate.length === 0) return;

    const duplicateOffset = snapToGrid ? gridSize : 20;
    const idMap = new Map();
    const duplicatedElements = [];

    elementsToDuplicate.forEach(el => {
        const newElement = {
            ...el,
            id: nextElementId++,
            x: el.x + duplicateOffset,
            y: el.y + duplicateOffset
        };

        // Store ID mapping
        if (el.id) {
            idMap.set(el.id, newElement.id);
        }

        duplicatedElements.push(newElement);
    });

    // Update parent IDs for text elements
    duplicatedElements.forEach(el => {
        if (el.type === 'text' && el.parentId && idMap.has(el.parentId)) {
            el.parentId = idMap.get(el.parentId);
        }
    });

    elements.push(...duplicatedElements);

    // Select the duplicated elements
    selectedElements = duplicatedElements;
    selectedElement = null;

    saveHistory();
    redraw();
}

// Select all elements
function selectAll() {
    selectedElements = elements.filter(el => !el.locked);
    selectedElement = null;
    currentTool = 'select';
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.click();
    redraw();
}

// Select elements by type
function selectByType(type) {
    selectedElements = elements.filter(el => el.type === type && !el.locked);
    selectedElement = null;
    currentTool = 'select';
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.click();
    redraw();
}

// Toggle lock on selected elements
function toggleLockSelection() {
    const elementsToLock = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    if (elementsToLock.length === 0) return;

    const allLocked = elementsToLock.every(el => el.locked);
    elementsToLock.forEach(el => {
        el.locked = !allLocked;
    });

    // Clear selection after locking (locked elements can't be selected)
    // Keep selection after unlocking
    if (!allLocked) {
        selectedElements = [];
        selectedElement = null;
    }

    saveHistory();
    redraw();
}

function duplicateLastShape() {
    if (!lastCreatedShape) return;

    // Find any text element associated with the last created shape
    const associatedText = elements.find(el =>
        el.type === 'text' && el.parentId === lastCreatedShape.id
    );

    // Determine direction only on first duplication, then keep consistent
    if (!duplicationDirection) {
        // Determine if shape is centered horizontally and near top
        const shapeCenterX = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 0) / 2;
        const isCentered = Math.abs(shapeCenterX - canvas.width / 2) < canvas.width * 0.15; // Within 15% of center
        const isNearTop = lastCreatedShape.y < canvas.height * 0.3; // In top 30%

        duplicationDirection = (isCentered && isNearTop) ? 'vertical' : 'horizontal';
    }

    const shouldPlaceVertically = duplicationDirection === 'vertical';

    // Calculate spacing based on shape size
    const spacing = 20;

    // Create duplicate shape
    const newShape = {
        ...lastCreatedShape,
        id: nextElementId++
    };

    if (shouldPlaceVertically) {
        // Place below
        newShape.y = lastCreatedShape.y + Math.abs(lastCreatedShape.height || 100) + spacing;
    } else {
        // Place to the right
        newShape.x = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 100) + spacing;
    }

    elements.push(newShape);

    // If there was associated text, duplicate it too
    if (associatedText) {
        const deltaX = newShape.x - lastCreatedShape.x;
        const deltaY = newShape.y - lastCreatedShape.y;

        const newText = {
            ...associatedText,
            id: nextElementId++,
            parentId: newShape.id,
            x: associatedText.x + deltaX,
            y: associatedText.y + deltaY,
            text: `Thing ${thingCounter++}` // Auto-increment text
        };

        elements.push(newText);
    }

    lastCreatedShape = newShape; // Update to new shape for chaining
    saveHistory();
    redraw();
}

// Keyboard events for panning
document.addEventListener('keydown', (e) => {
    // Ignore spacebar panning when typing in text input
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
    }

    if (e.code === 'Space' && !e.repeat) {
        spacePressed = true;
        if (!isDrawing) {
            canvas.style.cursor = 'grab';
        }
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    // Ignore spacebar panning when typing in text input
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
    }

    if (e.code === 'Space') {
        spacePressed = false;
        isPanning = false;
        if (currentTool === 'select') {
            canvas.style.cursor = 'default';
        } else if (currentTool === 'hand') {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
});

// Mouse events
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('dblclick', handleDoubleClick);
canvas.addEventListener('wheel', handleWheel, { passive: false });
canvas.addEventListener('contextmenu', handleContextMenu);

// Context menu handling
function handleContextMenu(e) {
    e.preventDefault();

    const contextMenu = document.getElementById('contextMenu');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffsetX) / zoomLevel;
    const y = (e.clientY - rect.top - panOffsetY) / zoomLevel;

    // Check if right-clicked on an element
    const clickedElement = getElementAtPoint(x, y);

    // If clicked on an unselected element, select it
    if (clickedElement && !selectedElements.includes(clickedElement) && clickedElement !== selectedElement) {
        selectedElement = clickedElement;
        selectedElements = [];
        redraw();
    }

    // Show/hide menu items based on context
    const hasSelection = clickedElement || selectedElements.length > 0 || selectedElement;

    document.getElementById('contextCopy').style.display = hasSelection ? 'flex' : 'none';
    document.getElementById('contextDuplicate').style.display = hasSelection ? 'flex' : 'none';
    document.getElementById('contextDelete').style.display = hasSelection ? 'flex' : 'none';
    document.getElementById('contextBringFront').style.display = hasSelection ? 'flex' : 'none';
    document.getElementById('contextSendBack').style.display = hasSelection ? 'flex' : 'none';
    document.getElementById('contextLock').style.display = hasSelection ? 'flex' : 'none';

    // Hide dividers if there's no selection
    const dividers = contextMenu.querySelectorAll('.context-menu-divider');
    dividers.forEach(div => div.style.display = hasSelection ? 'block' : 'none');

    // Position and show context menu
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.classList.add('active');
}

// Hide context menu on click elsewhere
document.addEventListener('click', () => {
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.classList.remove('active');
});

// Context menu actions
document.getElementById('contextCopy')?.addEventListener('click', () => {
    copySelection();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextPaste')?.addEventListener('click', () => {
    pasteSelection();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextDuplicate')?.addEventListener('click', () => {
    duplicateSelection();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextDelete')?.addEventListener('click', () => {
    if (selectedElements.length > 0) {
        elements = elements.filter(el => !selectedElements.includes(el));
        selectedElements = [];
        selectedElement = null;
    } else if (selectedElement) {
        elements = elements.filter(el => el !== selectedElement);
        selectedElement = null;
    }
    saveHistory();
    redraw();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextBringFront')?.addEventListener('click', () => {
    const elementsToMove = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    elementsToMove.forEach(el => {
        const index = elements.indexOf(el);
        if (index > -1) {
            elements.splice(index, 1);
            elements.push(el);
        }
    });
    saveHistory();
    redraw();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextSendBack')?.addEventListener('click', () => {
    const elementsToMove = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    elementsToMove.forEach(el => {
        const index = elements.indexOf(el);
        if (index > -1) {
            elements.splice(index, 1);
            elements.unshift(el);
        }
    });
    saveHistory();
    redraw();
    document.getElementById('contextMenu').classList.remove('active');
});

document.getElementById('contextLock')?.addEventListener('click', () => {
    toggleLockSelection();
    document.getElementById('contextMenu').classList.remove('active');
});

function handleDoubleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffsetX) / zoomLevel;
    const y = (e.clientY - rect.top - panOffsetY) / zoomLevel;

    // Check if double-clicked on a text element first
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (element.type === 'text') {
            const bounds = getElementBounds(element);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                // Found text element - make it editable
                editTextElement(element);
                return;
            }
        }
    }

    // Check if double-clicked on a shape
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (element.type !== 'text' && element.type !== 'line' && element.type !== 'arrow' && element.type !== 'pen') {
            const bounds = getElementBounds(element);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                // Found a shape - check if it has child text
                const childText = elements.find(el => el.type === 'text' && el.parentId === element.id);

                if (childText) {
                    // Edit existing child text
                    editTextElement(childText);
                } else {
                    // Create new centered text for this shape
                    const centerX = element.x + (element.width || 0) / 2;
                    const centerY = element.y + (element.height || 0) / 2;
                    createTextInputForShape(centerX, centerY, element);
                }
                return;
            }
        }
    }

    // If we got here, user double-clicked on empty canvas - create a rectangle
    const rectWidth = 120;
    const rectHeight = 60;
    const newRect = {
        id: nextElementId++,
        type: 'rectangle',
        x: x - rectWidth / 2, // Center on click point
        y: y - rectHeight / 2,
        width: rectWidth,
        height: rectHeight,
        strokeColor: strokeColorInput.value,
        fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
        lineStyle: currentLineStyle,
        lineThickness: currentLineThickness
    };
    elements.push(newRect);
    lastCreatedShape = newRect;
    saveHistory();
    redraw();

    // Automatically add centered text to the new shape
    const centerX = newRect.x + rectWidth / 2;
    const centerY = newRect.y + rectHeight / 2;
    setTimeout(() => {
        createTextInputForShape(centerX, centerY, newRect);
    }, 10);
}

function editTextElement(textElement) {
    // Create input at text element position
    const input = document.createElement('textarea');
    input.className = 'text-input';
    const rect = canvas.getBoundingClientRect();
    input.style.left = (rect.left + panOffsetX + textElement.x * zoomLevel) + 'px';
    input.style.top = (rect.top + panOffsetY + textElement.y * zoomLevel) + 'px';
    input.style.fontFamily = textElement.fontFamily || 'Comic Sans MS, cursive';
    input.style.fontSize = (textElement.fontSize || 16) + 'px';
    input.style.fontWeight = textElement.bold ? 'bold' : 'normal';
    input.style.fontStyle = textElement.italic ? 'italic' : 'normal';
    input.style.color = textElement.textColor || textElement.strokeColor;
    input.value = textElement.text;
    input.rows = 1;
    input.style.minWidth = '200px';
    input.style.resize = 'both';
    document.body.appendChild(input);

    // Focus and select all text
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);

    const finishEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            // Update existing element
            textElement.text = newText;
            saveHistory();
            redraw();
        } else {
            // Remove element if text is empty
            const index = elements.indexOf(textElement);
            if (index > -1) {
                elements.splice(index, 1);
                saveHistory();
                redraw();
            }
        }
        input.remove();
    };

    // Add blur listener
    setTimeout(() => {
        input.addEventListener('blur', finishEdit);
    }, 100);

    // Add Enter key listener
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            input.blur();
        }
    });
}

function handleWheel(e) {
    // Disable zoom in storybook mode
    if (canvasMode === 'storybook') return;

    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const oldZoom = zoomLevel;
    zoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor));

    // Zoom towards cursor position
    const zoomChange = zoomLevel / oldZoom;
    panOffsetX = mouseX - (mouseX - panOffsetX) * zoomChange;
    panOffsetY = mouseY - (mouseY - panOffsetY) * zoomChange;

    updateZoomIndicator();
    redraw();
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();

    // Handle panning with spacebar or hand tool (only in infinite canvas mode)
    if (canvasMode === 'infinite' && (spacePressed || currentTool === 'hand')) {
        isPanning = true;
        panStartX = e.clientX - panOffsetX;
        panStartY = e.clientY - panOffsetY;
        canvas.style.cursor = 'grabbing';
        return;
    }

    let x = (e.clientX - rect.left - panOffsetX) / zoomLevel;
    let y = (e.clientY - rect.top - panOffsetY) / zoomLevel;

    // Snap to shape edge for arrows and lines
    let startShape = null;
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestShapeEdge(x, y);
        x = snapped.x;
        y = snapped.y;
        startShape = snapped.shape;
    }

    startX = x;
    startY = y;
    // Store start shape for later use in mouseup
    window.tempStartShape = startShape;

    if (currentTool === 'select') {
        // In connect mode, always start rectangle selection
        if (isConnectMode) {
            selectedElement = null;
            selectedElements = [];
            isRectangleSelecting = true;
            isDrawing = true;
            selectionRect = { x: startX, y: startY, width: 0, height: 0 };
            redraw();
            return;
        }

        // Check if clicking on resize handle
        const handle = getResizeHandle(startX, startY);
        if (handle) {
            dragMode = 'resize';
            resizeHandle = handle;
            isDrawing = true;
            return;
        }

        // Check if clicking on element
        const clickedElement = getElementAtPoint(startX, startY);
        if (clickedElement) {
            // If clicking on already selected element, keep selection
            if (selectedElements.includes(clickedElement) || clickedElement === selectedElement) {
                dragMode = 'move';
                isDrawing = true;
            } else {
                // Select single element
                selectedElement = clickedElement;
                selectedElements = [];
                dragMode = 'move';
                isDrawing = true;

                // Update color pickers to match selected element
                if (selectedElement.strokeColor) {
                    strokeColorInput.value = selectedElement.strokeColor;
                }
                if (selectedElement.fillColor) {
                    fillColorInput.value = selectedElement.fillColor;
                    fillEnabledInput.checked = true;
                } else {
                    fillEnabledInput.checked = false;
                }
            }
        } else {
            // Clicking on empty space - start rectangle selection
            selectedElement = null;
            selectedElements = [];
            isRectangleSelecting = true;
            isDrawing = true;
            selectionRect = { x: startX, y: startY, width: 0, height: 0 };
        }
        redraw();
    } else if (currentTool === 'text') {
        e.preventDefault();
        createTextInput(startX, startY);
        return;
    } else {
        isDrawing = true;
        if (currentTool === 'pen') {
            elements.push({
                type: 'pen',
                points: [{x: startX, y: startY}],
                strokeColor: strokeColorInput.value,
                lineStyle: currentLineStyle,
                lineThickness: currentLineThickness
            });
        }
    }
}

function handleMouseMove(e) {
    // Handle panning
    if (isPanning) {
        panOffsetX = e.clientX - panStartX;
        panOffsetY = e.clientY - panStartY;
        redraw();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left - panOffsetX) / zoomLevel;
    const currentY = (e.clientY - rect.top - panOffsetY) / zoomLevel;

    if (!isDrawing) {
        // Update cursor based on hover
        if (currentTool === 'select') {
            const handle = getResizeHandle(currentX, currentY);
            if (handle) {
                canvas.style.cursor = handle.cursor;
            } else if (getElementAtPoint(currentX, currentY)) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
        return;
    }

    if (currentTool === 'select') {
        if (isRectangleSelecting) {
            // Update selection rectangle
            selectionRect.width = currentX - selectionRect.x;
            selectionRect.height = currentY - selectionRect.y;
            redraw();
        } else if (dragMode === 'move') {
            // Apply grid snapping to current position if snap is enabled
            const snappedCurrentX = snapToGrid ? snapToGridValue(currentX) : currentX;
            const snappedCurrentY = snapToGrid ? snapToGridValue(currentY) : currentY;

            const dx = snappedCurrentX - startX;
            const dy = snappedCurrentY - startY;

            // Move all selected elements
            if (selectedElements.length > 0) {
                // Create a set of parent IDs from selected elements
                const selectedIds = new Set(selectedElements.map(el => el.id).filter(id => id));

                selectedElements.forEach(el => {
                    // Only move this element if it's not a text child of another selected element
                    if (el.type === 'text' && el.parentId && selectedIds.has(el.parentId)) {
                        // Skip - this text will be moved with its parent
                    } else {
                        moveElement(el, dx, dy);
                    }
                });
            } else if (selectedElement) {
                moveElement(selectedElement, dx, dy);
            }

            startX = snappedCurrentX;
            startY = snappedCurrentY;
            redraw();
        } else if (dragMode === 'resize' && selectedElement) {
            resizeElement(selectedElement, currentX, currentY, resizeHandle);
            redraw();
        }
    } else if (currentTool === 'pen') {
        elements[elements.length - 1].points.push({x: currentX, y: currentY});
        redraw();
    } else if (currentTool !== 'text') {
        redraw();
        drawPreview(currentX, currentY);
    }
}

function handleMouseUp(e) {
    // Handle panning end
    if (isPanning) {
        isPanning = false;
        if (spacePressed) {
            canvas.style.cursor = 'grab';
        } else if (currentTool === 'hand') {
            canvas.style.cursor = 'grab';
        } else if (currentTool === 'select') {
            canvas.style.cursor = 'default';
        } else {
            canvas.style.cursor = 'crosshair';
        }
        return;
    }

    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    let endX = (e.clientX - rect.left - panOffsetX) / zoomLevel;
    let endY = (e.clientY - rect.top - panOffsetY) / zoomLevel;

    // Handle rectangle selection completion
    if (isRectangleSelecting) {
        isRectangleSelecting = false;

        // Find all elements within selection rectangle
        const selX = Math.min(selectionRect.x, selectionRect.x + selectionRect.width);
        const selY = Math.min(selectionRect.y, selectionRect.y + selectionRect.height);
        const selW = Math.abs(selectionRect.width);
        const selH = Math.abs(selectionRect.height);

        selectedElements = elements.filter(el => {
            // Skip locked elements
            if (el.locked) return false;

            const bounds = getElementBounds(el);
            // Check if element is within selection rectangle
            const inRect = selX <= bounds.x + bounds.width &&
                   selX + selW >= bounds.x &&
                   selY <= bounds.y + bounds.height &&
                   selY + selH >= bounds.y;

            // In connect mode, exclude text elements from selection
            if (isConnectMode && el.type === 'text') {
                return false;
            }

            return inRect;
        });

        selectionRect = null;
        isDrawing = false;

        // Connect mode: draw arrows between selected elements
        if (isConnectMode && selectedElements.length > 1) {
            connectSelectedElements();
            selectedElements = [];
            isConnectMode = false;
            canvas.style.cursor = 'default';
            saveHistory();
        }

        redraw();
        return;
    }

    // Snap endpoint to shape edge for arrows and lines
    let endShape = null;
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestShapeEdge(endX, endY);
        endX = snapped.x;
        endY = snapped.y;
        endShape = snapped.shape;
    }

    if (currentTool !== 'select' && currentTool !== 'pen' && currentTool !== 'text') {
        // Apply grid snapping to element position and size
        const snappedStartX = snapToGridValue(startX);
        const snappedStartY = snapToGridValue(startY);
        const snappedEndX = snapToGridValue(endX);
        const snappedEndY = snapToGridValue(endY);
        const width = snappedEndX - snappedStartX;
        const height = snappedEndY - snappedStartY;

        if (Math.abs(width) > 5 || Math.abs(height) > 5) {
            const element = {
                id: nextElementId++,
                type: currentTool,
                x: snappedStartX,
                y: snappedStartY,
                width: width,
                height: height,
                strokeColor: strokeColorInput.value,
                fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                lineStyle: currentLineStyle,
                lineRouting: (currentTool === 'line' || currentTool === 'arrow') ? currentLineRouting : undefined,
                lineThickness: currentLineThickness
            };

            // Store connection information for arrows and lines
            if (currentTool === 'arrow' || currentTool === 'line') {
                const startShape = window.tempStartShape;
                if (startShape && startShape.id) {
                    element.startShapeId = startShape.id;
                }
                if (endShape && endShape.id) {
                    element.endShapeId = endShape.id;
                }
            }

            elements.push(element);
            lastCreatedShape = element; // Track for 'M' key duplication
            duplicationDirection = null; // Reset direction for new shape
            saveHistory();

            // Auto-create text input for container shapes
            const containerShapes = ['rectangle', 'circle', 'diamond', 'parallelogram', 'roundRect'];
            if (containerShapes.includes(currentTool)) {
                const centerX = Math.min(startX, endX) + Math.abs(width) / 2;
                const centerY = Math.min(startY, endY) + Math.abs(height) / 2;

                // Small delay to ensure shape is rendered first
                setTimeout(() => {
                    createTextInputForShape(centerX, centerY, element);
                }, 10);
            }
        }
    }

    // Save history after move/resize operations
    if (dragMode === 'move' || dragMode === 'resize') {
        saveHistory();
    }

    // Save history after pen tool finishes drawing
    if (currentTool === 'pen' && isDrawing) {
        saveHistory();
    }

    isDrawing = false;
    dragMode = null;
    resizeHandle = null;
    redraw();
}

// Helper function to apply line style
function applyLineStyle(lineStyle) {
    switch (lineStyle) {
        case 'dashed':
            ctx.setLineDash([10, 5]);
            break;
        case 'dotted':
            ctx.setLineDash([2, 3]);
            break;
        case 'solid':
        default:
            ctx.setLineDash([]);
            break;
    }
}

// Connect selected elements with arrows
function connectSelectedElements() {
    if (selectedElements.length < 2) return;

    // Filter to only include shapes (exclude text, lines, arrows, pen)
    const shapesOnly = selectedElements.filter(el => {
        return el.type !== 'text' && el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen';
    });

    if (shapesOnly.length < 2) return;

    // Get bounds for all selected shape elements
    const elementBounds = shapesOnly.map(el => ({
        element: el,
        bounds: getElementBounds(el)
    }));

    // Calculate centers
    const centers = elementBounds.map(eb => ({
        element: eb.element,
        x: eb.bounds.x + eb.bounds.width / 2,
        y: eb.bounds.y + eb.bounds.height / 2
    }));

    // Determine if we should connect left-to-right or top-to-bottom
    // Based on which dimension has more variation
    const xPositions = centers.map(c => c.x);
    const yPositions = centers.map(c => c.y);
    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);

    // Sort elements by position
    let sortedCenters;
    if (xRange > yRange) {
        // Connect left to right
        sortedCenters = centers.sort((a, b) => a.x - b.x);
    } else {
        // Connect top to bottom
        sortedCenters = centers.sort((a, b) => a.y - b.y);
    }

    // Create arrows between consecutive elements
    const isHorizontal = xRange > yRange;

    for (let i = 0; i < sortedCenters.length - 1; i++) {
        const from = sortedCenters[i];
        const to = sortedCenters[i + 1];

        // Calculate edge points for arrow - use appropriate side centers based on flow direction
        const fromBounds = getElementBounds(from.element);
        const toBounds = getElementBounds(to.element);

        // Get the appropriate connection points based on flow direction
        const connectionPoints = getDirectionalConnection(
            fromBounds, from.element.type,
            toBounds, to.element.type,
            isHorizontal
        );

        if (connectionPoints) {
            const arrow = {
                id: nextElementId++,
                type: 'arrow',
                x: connectionPoints.from.x,
                y: connectionPoints.from.y,
                width: connectionPoints.to.x - connectionPoints.from.x,
                height: connectionPoints.to.y - connectionPoints.from.y,
                strokeColor: strokeColorInput.value,
                fillColor: null,
                lineStyle: currentLineStyle,
                lineRouting: currentLineRouting,
                lineThickness: currentLineThickness
            };

            // Store connection IDs so arrows update when shapes move
            if (from.element.id) {
                arrow.startShapeId = from.element.id;
            }
            if (to.element.id) {
                arrow.endShapeId = to.element.id;
            }

            elements.push(arrow);
        }
    }
}

// Get directional connection points based on flow (horizontal or vertical)
function getDirectionalConnection(boundsA, typeA, boundsB, typeB, isHorizontal) {
    const sidesA = getSideCenters(boundsA, typeA);
    const sidesB = getSideCenters(boundsB, typeB);

    if (isHorizontal) {
        // For horizontal flow: connect right side of A to left side of B
        return {
            from: sidesA.right,
            to: sidesB.left
        };
    } else {
        // For vertical flow: connect bottom side of A to top side of B
        return {
            from: sidesA.bottom,
            to: sidesB.top
        };
    }
}

// Get center points of all sides of a shape
function getSideCenters(bounds, shapeType) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    if (shapeType === 'circle') {
        // For circles, return points at cardinal directions
        const rx = bounds.width / 2;
        const ry = bounds.height / 2;
        return {
            top: { x: centerX, y: centerY - ry },
            bottom: { x: centerX, y: centerY + ry },
            left: { x: centerX - rx, y: centerY },
            right: { x: centerX + rx, y: centerY }
        };
    } else if (shapeType === 'diamond') {
        // For diamonds, the vertices are at the midpoints of the bounding box edges
        return {
            top: { x: centerX, y: bounds.y },
            bottom: { x: centerX, y: bounds.y + bounds.height },
            left: { x: bounds.x, y: centerY },
            right: { x: bounds.x + bounds.width, y: centerY }
        };
    } else {
        // For rectangles and other shapes
        return {
            top: { x: centerX, y: bounds.y },
            bottom: { x: centerX, y: bounds.y + bounds.height },
            left: { x: bounds.x, y: centerY },
            right: { x: bounds.x + bounds.width, y: centerY }
        };
    }
}

// Arrow snapping helpers
function findNearestShapeEdge(x, y, snapDistance = 20) {
    let nearestPoint = null;
    let nearestShape = null;
    let minDistance = snapDistance;

    for (const element of elements) {
        if (element.type === 'text' || element.type === 'line' || element.type === 'arrow' || element.type === 'pen') {
            continue; // Skip non-container elements
        }

        const bounds = getElementBounds(element);
        const edgePoint = getNearestEdgePoint(x, y, bounds, element.type);

        if (edgePoint) {
            const dist = Math.sqrt(Math.pow(x - edgePoint.x, 2) + Math.pow(y - edgePoint.y, 2));
            if (dist < minDistance) {
                minDistance = dist;
                nearestPoint = edgePoint;
                nearestShape = element;
            }
        }
    }

    return nearestPoint ? { ...nearestPoint, shape: nearestShape } : { x, y, shape: null };
}

function getNearestEdgePoint(x, y, bounds, shapeType) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    if (shapeType === 'circle') {
        // Calculate point on ellipse edge
        const rx = bounds.width / 2;
        const ry = bounds.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX);
        return {
            x: centerX + rx * Math.cos(angle),
            y: centerY + ry * Math.sin(angle)
        };
    } else {
        // For rectangles and other shapes, find nearest edge point
        const left = bounds.x;
        const right = bounds.x + bounds.width;
        const top = bounds.y;
        const bottom = bounds.y + bounds.height;

        // Calculate distances to each edge
        const distToLeft = Math.abs(x - left);
        const distToRight = Math.abs(x - right);
        const distToTop = Math.abs(y - top);
        const distToBottom = Math.abs(y - bottom);

        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

        // Clamp to bounds
        const clampedX = Math.max(left, Math.min(right, x));
        const clampedY = Math.max(top, Math.min(bottom, y));

        if (minDist === distToLeft) {
            return { x: left, y: clampedY };
        } else if (minDist === distToRight) {
            return { x: right, y: clampedY };
        } else if (minDist === distToTop) {
            return { x: clampedX, y: top };
        } else {
            return { x: clampedX, y: bottom };
        }
    }
}

// Drawing functions with hand-drawn effect
function drawRoughLine(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    applyLineStyle(lineStyle);

    ctx.beginPath();
    // Create multiple slightly offset lines for rough effect
    for (let i = 0; i < 2; i++) {
        const offset = (i - 0.5) * 0.5;
        ctx.moveTo(x1 + offset, y1 + offset);
        ctx.lineTo(x2 + offset, y2 + offset);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawRoughRect(x, y, w, h, strokeColor, fillColor, lineStyle = 'solid', lineThickness = 2) {
    const radius = Math.min(10, Math.abs(w) / 4, Math.abs(h) / 4);

    // Draw fill first with rounded corners
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
    }

    // Draw rough outline with rounded corners
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyLineStyle(lineStyle);

    // Draw slightly wavy rounded rectangle
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const offset = (Math.random() - 0.5) * 1;
        ctx.roundRect(x + offset, y + offset, w, h, radius);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawRoughCircle(x, y, w, h, strokeColor, fillColor, lineStyle = 'solid', lineThickness = 2) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = Math.abs(w) / 2;
    const ry = Math.abs(h) / 2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineThickness;
    applyLineStyle(lineStyle);

    // Draw multiple slightly offset ellipses
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const offset = (Math.random() - 0.5) * 1;
        ctx.ellipse(cx + offset, cy + offset, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawArrow(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2) {
    drawRoughLine(x1, y1, x2, y2, color, lineStyle, lineThickness);

    // Draw arrowhead (always solid)
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

// Calculate stepped path points (orthogonal routing)
function getSteppedPath(x1, y1, x2, y2) {
    const points = [];
    points.push({x: x1, y: y1});

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    // Determine if this is primarily a horizontal or vertical connection
    if (dx > dy) {
        // Horizontal flow: go horizontal first, then vertical, then horizontal
        const midX = (x1 + x2) / 2;
        points.push({x: midX, y: y1});
        points.push({x: midX, y: y2});
        points.push({x: x2, y: y2});
    } else {
        // Vertical flow: go vertical first, then horizontal, then vertical
        const midY = (y1 + y2) / 2;
        points.push({x: x1, y: midY});
        points.push({x: x2, y: midY});
        points.push({x: x2, y: y2});
    }

    return points;
}

function drawSteppedLine(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2) {
    const points = getSteppedPath(x1, y1, x2, y2);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    applyLineStyle(lineStyle);

    // Draw the stepped path with rough effect
    for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        for (let j = 0; j < 2; j++) {
            const offset = (j - 0.5) * 0.5;
            ctx.moveTo(points[i].x + offset, points[i].y + offset);
            ctx.lineTo(points[i + 1].x + offset, points[i + 1].y + offset);
        }
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawSteppedArrow(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2) {
    const points = getSteppedPath(x1, y1, x2, y2);

    // Draw the stepped line portion
    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    applyLineStyle(lineStyle);

    for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        for (let j = 0; j < 2; j++) {
            const offset = (j - 0.5) * 0.5;
            ctx.moveTo(points[i].x + offset, points[i].y + offset);
            ctx.lineTo(points[i + 1].x + offset, points[i + 1].y + offset);
        }
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw arrowhead at the end (always solid)
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
    const headLength = 15;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle - Math.PI / 6),
        lastPoint.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(
        lastPoint.x - headLength * Math.cos(angle + Math.PI / 6),
        lastPoint.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

function drawPen(points, color, lineStyle = 'solid', lineThickness = 2) {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyLineStyle(lineStyle);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawText(element) {
    const fontFamily = element.fontFamily || 'Comic Sans MS, cursive';
    const fontSize = element.fontSize || 16;
    const bold = element.bold ? 'bold ' : '';
    const italic = element.italic ? 'italic ' : '';
    ctx.font = `${italic}${bold}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = element.textColor || element.strokeColor;
    ctx.textBaseline = 'top';

    // Handle multi-line text
    const lines = element.text.split('\n');
    const lineHeight = fontSize * 1.2;

    lines.forEach((line, index) => {
        ctx.fillText(line, element.x, element.y + (index * lineHeight));
    });
}

// Template shape drawing functions
function drawDiamond(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(x + w, cy);
        ctx.lineTo(cx, y + h);
        ctx.lineTo(x, cy);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
        const offset = (Math.random() - 0.5) * 1;
        ctx.beginPath();
        ctx.moveTo(cx + offset, y + offset);
        ctx.lineTo(x + w + offset, cy + offset);
        ctx.lineTo(cx + offset, y + h + offset);
        ctx.lineTo(x + offset, cy + offset);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawParallelogram(x, y, w, h, strokeColor, fillColor) {
    const skew = w * 0.15;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x + skew, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w - skew, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
        const offset = (Math.random() - 0.5) * 1;
        ctx.beginPath();
        ctx.moveTo(x + skew + offset, y + offset);
        ctx.lineTo(x + w + offset, y + offset);
        ctx.lineTo(x + w - skew + offset, y + h + offset);
        ctx.lineTo(x + offset, y + h + offset);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawRoundRect(x, y, w, h, strokeColor, fillColor) {
    const radius = h / 2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.arc(x + w - radius, y + radius, radius, -Math.PI/2, Math.PI/2);
        ctx.lineTo(x + radius, y + h);
        ctx.arc(x + radius, y + radius, radius, Math.PI/2, -Math.PI/2);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arc(x + w - radius, y + radius, radius, -Math.PI/2, Math.PI/2);
    ctx.lineTo(x + radius, y + h);
    ctx.arc(x + radius, y + radius, radius, Math.PI/2, -Math.PI/2);
    ctx.stroke();
}

function drawUMLClass(x, y, w, h, strokeColor, fillColor) {
    drawRoughRect(x, y, w, h, strokeColor, fillColor);
    drawRoughLine(x, y + h/3, x + w, y + h/3, strokeColor);
    drawRoughLine(x, y + 2*h/3, x + w, y + 2*h/3, strokeColor);
}

function drawStickFigure(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const headRadius = w / 4;

    // Head
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y + headRadius, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    drawRoughLine(cx, y + headRadius * 2, cx, y + h * 0.7, strokeColor);
    // Arms
    drawRoughLine(cx - w/3, y + h * 0.4, cx + w/3, y + h * 0.4, strokeColor);
    // Legs
    drawRoughLine(cx, y + h * 0.7, cx - w/3, y + h, strokeColor);
    drawRoughLine(cx, y + h * 0.7, cx + w/3, y + h, strokeColor);
}

function drawUMLPackage(x, y, w, h, strokeColor, fillColor) {
    const tabW = w * 0.4;
    const tabH = h * 0.2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + tabH, w, h - tabH);
    }

    drawRoughRect(x, y + tabH, w, h - tabH, strokeColor, null);
    drawRoughRect(x, y, tabW, tabH, strokeColor, fillColor);
}

function drawServer(x, y, w, h, strokeColor, fillColor) {
    const unitH = h / 3;

    for (let i = 0; i < 3; i++) {
        const yPos = y + i * unitH;

        // Draw server unit
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, yPos, w, unitH);
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, yPos, w, unitH);

        // Draw indicator dots
        const dotRadius = 2;
        const dotY = yPos + unitH / 2;
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(x + w * 0.15, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.25, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDatabase(x, y, w, h, strokeColor, fillColor) {
    const ellipseH = h * 0.15;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + ellipseH, w, h - ellipseH * 2);

        // Top ellipse
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + ellipseH, w/2, ellipseH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottom ellipse
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h - ellipseH, w/2, ellipseH, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + ellipseH, w/2, ellipseH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(x, y + ellipseH);
    ctx.lineTo(x, y + h - ellipseH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w, y + ellipseH);
    ctx.lineTo(x + w, y + h - ellipseH);
    ctx.stroke();

    // Bottom ellipse (only visible part)
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h - ellipseH, w/2, ellipseH, 0, 0, Math.PI);
    ctx.stroke();
}

function drawCloud(x, y, w, h, strokeColor, fillColor) {
    // Simple, clean cloud shape based on SVG path
    const path = new Path2D();

    // Normalize to 100x60 viewBox then scale
    const scaleX = w / 100;
    const scaleY = h / 60;

    // Cloud path (simplified from Font Awesome cloud icon)
    path.moveTo(x + 80 * scaleX, y + 45 * scaleY);
    path.bezierCurveTo(x + 80 * scaleX, y + 38 * scaleY, x + 74 * scaleX, y + 32 * scaleY, x + 67 * scaleX, y + 32 * scaleY);
    path.bezierCurveTo(x + 66 * scaleX, y + 22 * scaleY, x + 57 * scaleX, y + 15 * scaleY, x + 47 * scaleX, y + 15 * scaleY);
    path.bezierCurveTo(x + 42 * scaleX, y + 15 * scaleY, x + 38 * scaleX, y + 17 * scaleY, x + 35 * scaleX, y + 20 * scaleY);
    path.bezierCurveTo(x + 31 * scaleX, y + 17 * scaleY, x + 26 * scaleX, y + 15 * scaleY, x + 21 * scaleX, y + 15 * scaleY);
    path.bezierCurveTo(x + 10 * scaleX, y + 15 * scaleY, x + 0 * scaleX, y + 24 * scaleY, x + 0 * scaleX, y + 35 * scaleY);
    path.bezierCurveTo(x + 0 * scaleX, y + 37 * scaleY, x + 1 * scaleX, y + 39 * scaleY, x + 1 * scaleX, y + 40 * scaleY);
    path.bezierCurveTo(x + 1 * scaleX, y + 48 * scaleY, x + 7 * scaleX, y + 55 * scaleY, x + 15 * scaleX, y + 55 * scaleY);
    path.lineTo(x + 80 * scaleX, y + 55 * scaleY);
    path.bezierCurveTo(x + 87 * scaleX, y + 55 * scaleY, x + 93 * scaleX, y + 51 * scaleY, x + 93 * scaleX, y + 45 * scaleY);
    path.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill(path);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke(path);
}

function drawLambda(x, y, w, h, strokeColor, fillColor) {
    // Draw lambda symbol with proper proportions
    const padding = w * 0.15;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw lambda symbol
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Left leg
    ctx.moveTo(x + padding, y + padding);
    ctx.lineTo(x + w/2, y + h - padding);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h/2);
    ctx.lineTo(x + w - padding, y + h - padding);
    ctx.stroke();
}

function drawHexagon(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = cx + (w / 2) * Math.cos(angle);
            const py = cy + (h / 2) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const offset = (Math.random() - 0.5) * 1;
            const px = cx + (w / 2) * Math.cos(angle) + offset;
            const py = cy + (h / 2) * Math.sin(angle) + offset;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

function drawTriangle(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x + w/2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
        const offset = (Math.random() - 0.5) * 1;
        ctx.beginPath();
        ctx.moveTo(x + w/2 + offset, y + offset);
        ctx.lineTo(x + w + offset, y + h + offset);
        ctx.lineTo(x + offset, y + h + offset);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawStar(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outerR = Math.min(w, h) / 2;
    const innerR = outerR * 0.4;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawNote(x, y, w, h, strokeColor, fillColor) {
    const cornerSize = Math.min(w, h) * 0.15;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w - cornerSize, y);
        ctx.lineTo(x + w, y + cornerSize);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();

    // Folded corner
    ctx.beginPath();
    ctx.moveTo(x + w - cornerSize, y);
    ctx.lineTo(x + w - cornerSize, y + cornerSize);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.stroke();
}

function drawDocument(x, y, w, h, strokeColor, fillColor) {
    const waveHeight = h * 0.1;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h - waveHeight);
        ctx.quadraticCurveTo(x + w * 0.75, y + h - waveHeight * 2, x + w * 0.5, y + h - waveHeight);
        ctx.quadraticCurveTo(x + w * 0.25, y + h, x, y + h - waveHeight);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - waveHeight);
    ctx.quadraticCurveTo(x + w * 0.75, y + h - waveHeight * 2, x + w * 0.5, y + h - waveHeight);
    ctx.quadraticCurveTo(x + w * 0.25, y + h, x, y + h - waveHeight);
    ctx.closePath();
    ctx.stroke();
}

function drawCylinder(x, y, w, h, strokeColor, fillColor) {
    const ellipseH = h * 0.2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + ellipseH/2, w, h - ellipseH);

        ctx.beginPath();
        ctx.ellipse(x + w/2, y + ellipseH/2, w/2, ellipseH/2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + ellipseH/2, w/2, ellipseH/2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Sides
    ctx.beginPath();
    ctx.moveTo(x, y + ellipseH/2);
    ctx.lineTo(x, y + h - ellipseH/2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w, y + ellipseH/2);
    ctx.lineTo(x + w, y + h - ellipseH/2);
    ctx.stroke();

    // Bottom (visible arc)
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h - ellipseH/2, w/2, ellipseH/2, 0, 0, Math.PI);
    ctx.stroke();
}

function drawStorage(x, y, w, h, strokeColor, fillColor) {
    // S3-style bucket icon
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw bucket pattern
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.3, y + h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y);
    ctx.lineTo(x + w * 0.7, y + h);
    ctx.stroke();

    // Draw horizontal dividers
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (h / 3) * i);
        ctx.lineTo(x + w, y + (h / 3) * i);
        ctx.stroke();
    }
}

function drawQueue(x, y, w, h, strokeColor, fillColor) {
    const boxW = w * 0.25;
    const gap = (w - boxW * 3) / 4;

    for (let i = 0; i < 3; i++) {
        const boxX = x + gap + i * (boxW + gap);

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(boxX, y, boxW, h);
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, y, boxW, h);
    }

    // Draw arrows between boxes
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    const arrowY = y + h / 2;

    for (let i = 0; i < 2; i++) {
        const arrowStartX = x + gap + (i + 1) * boxW + i * gap;
        const arrowEndX = arrowStartX + gap;

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowY);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(arrowEndX - 5, arrowY - 4);
        ctx.lineTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - 5, arrowY + 4);
        ctx.stroke();
    }
}

function drawRouter(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + h * 0.3, w, h * 0.7);

    // Draw antennas
    const antennaCount = 2;
    for (let i = 0; i < antennaCount; i++) {
        const antennaX = x + w * (0.3 + i * 0.4);
        ctx.beginPath();
        ctx.moveTo(antennaX, y + h * 0.3);
        ctx.lineTo(antennaX, y);
        ctx.stroke();

        // Antenna circle
        ctx.beginPath();
        ctx.arc(antennaX, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw indicator lights
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(x + w * (0.25 + i * 0.25), y + h * 0.65, 2, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
    }
}

function drawFirewall(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw brick pattern
    const brickH = h / 5;
    const brickW = w / 4;

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
            const offset = row % 2 === 0 ? 0 : -brickW / 2;
            const brickX = x + col * brickW + offset;
            const brickY = y + row * brickH;

            if (brickX >= x && brickX + brickW <= x + w) {
                ctx.strokeRect(brickX, brickY, brickW, brickH);
            }
        }
    }
}

function drawSwitch(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw ports
    const portCount = 8;
    const portW = w / portCount;
    const portH = h * 0.4;
    const portY = y + h - portH - 5;

    for (let i = 0; i < portCount; i++) {
        const portX = x + i * portW + 2;
        ctx.strokeRect(portX, portY, portW - 4, portH);
    }

    // Draw indicator lights
    for (let i = 0; i < portCount; i++) {
        ctx.beginPath();
        ctx.arc(x + i * portW + portW / 2, y + h * 0.25, 2, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
    }
}

// Business Icons
function drawUser(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const headRadius = w / 3;
    const headY = y + headRadius + h * 0.15;

    // Head
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Body (shoulders)
    const bodyY = headY + headRadius;
    ctx.beginPath();
    ctx.arc(cx, bodyY + headRadius * 1.5, headRadius * 1.3, Math.PI * 1.2, Math.PI * 1.8);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawUsers(x, y, w, h, strokeColor, fillColor) {
    // Draw three overlapping user silhouettes
    const userW = w / 2.5;
    drawUser(x, y, userW, h * 0.8, strokeColor, fillColor);
    drawUser(x + w / 3, y + h * 0.1, userW, h * 0.8, strokeColor, fillColor);
    drawUser(x + w / 1.6, y, userW, h * 0.8, strokeColor, fillColor);
}

function drawFolder(x, y, w, h, strokeColor, fillColor) {
    const tabW = w * 0.4;
    const tabH = h * 0.2;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + tabH, w, h - tabH);
        ctx.fillRect(x, y, tabW, tabH);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + tabH, w, h - tabH);
    ctx.strokeRect(x, y, tabW, tabH);
}

function drawFile(x, y, w, h, strokeColor, fillColor) {
    const foldSize = w * 0.25;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w - foldSize, y);
        ctx.lineTo(x + w, y + foldSize);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - foldSize, y);
    ctx.lineTo(x + w, y + foldSize);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.stroke();

    // Draw fold
    ctx.beginPath();
    ctx.moveTo(x + w - foldSize, y);
    ctx.lineTo(x + w - foldSize, y + foldSize);
    ctx.lineTo(x + w, y + foldSize);
    ctx.stroke();
}

function drawEnvelope(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw envelope flap
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w, y);
    ctx.stroke();
}

function drawCalendar(x, y, w, h, strokeColor, fillColor) {
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + h * 0.15, w, h * 0.85);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + h * 0.15, w, h * 0.85);

    // Top binding
    ctx.fillStyle = strokeColor;
    ctx.fillRect(x, y, w, h * 0.15);

    // Rings
    const ringW = w * 0.1;
    ctx.strokeStyle = fillColor || '#fff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
        const ringX = x + w * (0.2 + i * 0.3);
        ctx.beginPath();
        ctx.moveTo(ringX, y);
        ctx.lineTo(ringX, y + h * 0.15);
        ctx.stroke();
    }

    // Grid
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.15 + i * h * 0.28);
        ctx.lineTo(x + w, y + h * 0.15 + i * h * 0.28);
        ctx.stroke();
    }
}

// Device Icons
function drawDesktop(x, y, w, h, strokeColor, fillColor) {
    const monitorH = h * 0.7;
    const standH = h * 0.15;
    const baseH = h * 0.15;

    // Monitor
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, monitorH);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, monitorH);

    // Stand
    const standW = w * 0.2;
    const standX = x + w / 2 - standW / 2;
    ctx.strokeRect(standX, y + monitorH, standW, standH);

    // Base
    const baseW = w * 0.5;
    const baseX = x + w / 2 - baseW / 2;
    ctx.strokeRect(baseX, y + monitorH + standH, baseW, baseH);
}

function drawLaptop(x, y, w, h, strokeColor, fillColor) {
    const screenH = h * 0.6;
    const baseH = h * 0.4;

    // Screen
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x + w * 0.1, y, w * 0.8, screenH);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + w * 0.1, y, w * 0.8, screenH);

    // Base (keyboard)
    ctx.beginPath();
    ctx.moveTo(x, y + screenH);
    ctx.lineTo(x + w, y + screenH);
    ctx.lineTo(x + w * 0.95, y + h);
    ctx.lineTo(x + w * 0.05, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawMobile(x, y, w, h, strokeColor, fillColor) {
    const radius = w * 0.1;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();

    // Home button
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.9, w * 0.1, 0, Math.PI * 2);
    ctx.stroke();
}

function drawTablet(x, y, w, h, strokeColor, fillColor) {
    const radius = w * 0.08;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.stroke();

    // Camera
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.05, w * 0.05, 0, Math.PI * 2);
    ctx.stroke();
}

// Symbol Icons
function drawGear(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outerRadius = Math.min(w, h) / 2;
    const innerRadius = outerRadius * 0.6;
    const teethCount = 8;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < teethCount * 2; i++) {
        const angle = (i * Math.PI) / teethCount;
        const radius = i % 2 === 0 ? outerRadius : innerRadius * 1.2;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Center hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
}

function drawLock(x, y, w, h, strokeColor, fillColor) {
    const bodyH = h * 0.6;
    const shackleH = h * 0.4;
    const shackleW = w * 0.6;

    // Shackle
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + shackleH, shackleW / 2, Math.PI, 0, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w / 2 - shackleW / 2, y + shackleH);
    ctx.lineTo(x + w / 2 - shackleW / 2, y + shackleH * 1.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + w / 2 + shackleW / 2, y + shackleH);
    ctx.lineTo(x + w / 2 + shackleW / 2, y + shackleH * 1.2);
    ctx.stroke();

    // Body
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y + h - bodyH, w, bodyH);
    }
    ctx.strokeRect(x, y + h - bodyH, w, bodyH);

    // Keyhole
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - bodyH * 0.6, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w / 2 - w * 0.05, y + h - bodyH * 0.5, w * 0.1, bodyH * 0.3);
}

function drawShield(x, y, w, h, strokeColor, fillColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.lineTo(x + w, y + h * 0.6);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h * 0.6);
    ctx.lineTo(x, y + h * 0.3);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawKey(x, y, w, h, strokeColor, fillColor) {
    const headRadius = h * 0.4;
    const shaftW = w * 0.6;
    const shaftH = h * 0.25;

    // Head
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + headRadius, y + h / 2, headRadius, 0, Math.PI * 2);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(x + headRadius, y + h / 2, headRadius * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Shaft
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x + headRadius * 1.5, y + h / 2 - shaftH / 2, shaftW, shaftH);
    }
    ctx.strokeRect(x + headRadius * 1.5, y + h / 2 - shaftH / 2, shaftW, shaftH);

    // Teeth
    const teethCount = 3;
    const toothW = shaftW / (teethCount * 2);
    for (let i = 0; i < teethCount; i++) {
        const tx = x + headRadius * 1.5 + shaftW - i * toothW * 2 - toothW;
        ctx.strokeRect(tx, y + h / 2 + shaftH / 2, toothW, shaftH * 0.6);
    }
}

function drawBell(x, y, w, h, strokeColor, fillColor) {
    const bellH = h * 0.75;
    const cx = x + w / 2;

    // Bell body
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.4, y + bellH);
    ctx.quadraticCurveTo(cx - w * 0.45, y + bellH * 0.4, cx, y);
    ctx.quadraticCurveTo(cx + w * 0.45, y + bellH * 0.4, cx + w * 0.4, y + bellH);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Clapper
    ctx.beginPath();
    ctx.arc(cx, y + bellH + h * 0.1, w * 0.1, 0, Math.PI * 2);
    ctx.stroke();

    // Bell rim
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.45, y + bellH);
    ctx.lineTo(cx + w * 0.45, y + bellH);
    ctx.stroke();
}

function drawCheck(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    // Circle
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Check mark
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.4, cy);
    ctx.lineTo(cx - radius * 0.1, cy + radius * 0.3);
    ctx.lineTo(cx + radius * 0.4, cy - radius * 0.3);
    ctx.stroke();
}

function drawWarning(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;

    // Triangle
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Exclamation mark
    ctx.fillStyle = strokeColor;
    ctx.fillRect(cx - w * 0.05, y + h * 0.25, w * 0.1, h * 0.4);
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.75, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
}

function drawClock(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    // Circle
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Hour markers
    ctx.fillStyle = strokeColor;
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const markerRadius = radius * 0.85;
        const px = cx + Math.cos(angle - Math.PI / 2) * markerRadius;
        const py = cy + Math.sin(angle - Math.PI / 2) * markerRadius;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hour hand
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * 0.3, cy - radius * 0.3);
    ctx.stroke();

    // Minute hand
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - radius * 0.6);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Generic AWS Service Drawing Function
function drawAWSService(x, y, w, h, strokeColor, fillColor, serviceName, fallbackDrawFn) {
    // Draw background
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    // Draw border
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Try to draw official AWS icon
    const iconData = awsIconCache[serviceName];
    if (iconData && iconData.loaded && !iconData.error) {
        // Calculate icon size (80% of container, centered)
        const iconSize = Math.min(w, h) * 0.8;
        const iconX = x + (w - iconSize) / 2;
        const iconY = y + (h - iconSize) / 2;

        try {
            ctx.drawImage(iconData.image, iconX, iconY, iconSize, iconSize);
        } catch (e) {
            // If drawing fails, use fallback
            if (fallbackDrawFn) fallbackDrawFn(x, y, w, h, strokeColor, fillColor);
        }
    } else if (iconData && iconData.error && fallbackDrawFn) {
        // Icon failed to load, use fallback
        fallbackDrawFn(x, y, w, h, strokeColor, fillColor);
    }
}

// AWS Service Drawing Functions
function drawEC2(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'ec2', (x, y, w, h, strokeColor) => {
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = strokeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('EC2', x + w/2, y + h/2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    });
}

function drawS3(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 's3');
}

function drawRDS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'rds');
}

function drawDynamoDB(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'dynamodb');
}

function drawAthena(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'athena');
}

function drawRedshift(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'redshift');
}

function drawSQS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'sqs');
}

function drawSNS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'sns');
}

function drawAPIGateway(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'apiGateway');
}

function drawCloudFront(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'cloudfront');
}

function drawRoute53(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'route53');
}

function drawECS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'ecs');
}

function drawEKS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'eks');
}

function drawELB(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'elb');
}

function drawCloudWatch(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'cloudwatch');
}

// Additional AWS Services
function drawLambda(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'lambda');
}

function drawFargate(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'fargate');
}

function drawBatch(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'batch');
}

function drawEBS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'ebs');
}

function drawEFS(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'efs');
}

function drawGlacier(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'glacier');
}

function drawAurora(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'aurora');
}

function drawElastiCache(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'elasticache');
}

function drawNeptune(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'neptune');
}

function drawDocumentDB(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'documentdb');
}

function drawVPC(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'vpc');
}

function drawDirectConnect(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'directconnect');
}

function drawTransitGateway(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'transitgateway');
}

function drawNATGateway(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'natgateway');
}

function drawIAM(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'iam');
}

function drawCognito(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'cognito');
}

function drawSecretsManager(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'secretsmanager');
}

function drawWAF(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'waf');
}

function drawCodePipeline(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'codepipeline');
}

function drawCodeBuild(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'codebuild');
}

function drawCodeDeploy(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'codedeploy');
}

function drawCodeCommit(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'codecommit');
}

function drawEventBridge(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'eventbridge');
}

function drawStepFunctions(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'stepfunctions');
}

function drawAppSync(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'appsync');
}

function drawKinesis(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'kinesis');
}

function drawEMR(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'emr');
}

function drawSageMaker(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'sagemaker');
}

function drawGlue(x, y, w, h, strokeColor, fillColor) {
    drawAWSService(x, y, w, h, strokeColor, fillColor, 'glue');
}

function drawElement(element) {
    const lineStyle = element.lineStyle || 'solid';

    switch (element.type) {
        case 'rectangle':
            drawRoughRect(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor, lineStyle, element.lineThickness || 2);
            break;
        case 'circle':
            drawRoughCircle(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor, lineStyle, element.lineThickness || 2);
            break;
        case 'line':
            if (element.lineRouting === 'stepped') {
                drawSteppedLine(element.x, element.y,
                               element.x + element.width, element.y + element.height,
                               element.strokeColor, lineStyle, element.lineThickness || 2);
            } else {
                drawRoughLine(element.x, element.y,
                             element.x + element.width, element.y + element.height,
                             element.strokeColor, lineStyle, element.lineThickness || 2);
            }
            break;
        case 'arrow':
            if (element.lineRouting === 'stepped') {
                drawSteppedArrow(element.x, element.y,
                                element.x + element.width, element.y + element.height,
                                element.strokeColor, lineStyle, element.lineThickness || 2);
            } else {
                drawArrow(element.x, element.y,
                         element.x + element.width, element.y + element.height,
                         element.strokeColor, lineStyle, element.lineThickness || 2);
            }
            break;
        case 'pen':
            drawPen(element.points, element.strokeColor, lineStyle, element.lineThickness || 2);
            break;
        case 'text':
            drawText(element);
            break;
        case 'diamond':
            drawDiamond(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'parallelogram':
            drawParallelogram(element.x, element.y, element.width, element.height,
                            element.strokeColor, element.fillColor);
            break;
        case 'roundRect':
            drawRoundRect(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'umlClass':
            drawUMLClass(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'stickFigure':
            drawStickFigure(element.x, element.y, element.width, element.height,
                           element.strokeColor, element.fillColor);
            break;
        case 'umlPackage':
            drawUMLPackage(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'server':
            drawServer(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'database':
            drawDatabase(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'cloud':
            drawCloud(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'lambda':
            drawLambda(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'hexagon':
            drawHexagon(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'triangle':
            drawTriangle(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'star':
            drawStar(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'note':
            drawNote(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'document':
            drawDocument(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'cylinder':
            drawCylinder(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'storage':
            drawStorage(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'queue':
            drawQueue(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'router':
            drawRouter(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'firewall':
            drawFirewall(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'switch':
            drawSwitch(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'ec2':
            drawEC2(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 's3':
            drawS3(element.x, element.y, element.width, element.height,
                  element.strokeColor, element.fillColor);
            break;
        case 'rds':
            drawRDS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'dynamodb':
            drawDynamoDB(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'athena':
            drawAthena(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'redshift':
            drawRedshift(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'sqs':
            drawSQS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'sns':
            drawSNS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'apiGateway':
            drawAPIGateway(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'cloudfront':
            drawCloudFront(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'route53':
            drawRoute53(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'ecs':
            drawECS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'eks':
            drawEKS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'elb':
            drawELB(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'cloudwatch':
            drawCloudWatch(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'lambda':
            drawLambda(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'fargate':
            drawFargate(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'batch':
            drawBatch(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'ebs':
            drawEBS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'efs':
            drawEFS(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'glacier':
            drawGlacier(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'aurora':
            drawAurora(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'elasticache':
            drawElastiCache(element.x, element.y, element.width, element.height,
                           element.strokeColor, element.fillColor);
            break;
        case 'neptune':
            drawNeptune(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'documentdb':
            drawDocumentDB(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'vpc':
            drawVPC(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'directconnect':
            drawDirectConnect(element.x, element.y, element.width, element.height,
                             element.strokeColor, element.fillColor);
            break;
        case 'transitgateway':
            drawTransitGateway(element.x, element.y, element.width, element.height,
                              element.strokeColor, element.fillColor);
            break;
        case 'natgateway':
            drawNATGateway(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'iam':
            drawIAM(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'cognito':
            drawCognito(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'secretsmanager':
            drawSecretsManager(element.x, element.y, element.width, element.height,
                              element.strokeColor, element.fillColor);
            break;
        case 'waf':
            drawWAF(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'codepipeline':
            drawCodePipeline(element.x, element.y, element.width, element.height,
                            element.strokeColor, element.fillColor);
            break;
        case 'codebuild':
            drawCodeBuild(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'codedeploy':
            drawCodeDeploy(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'codecommit':
            drawCodeCommit(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'eventbridge':
            drawEventBridge(element.x, element.y, element.width, element.height,
                           element.strokeColor, element.fillColor);
            break;
        case 'stepfunctions':
            drawStepFunctions(element.x, element.y, element.width, element.height,
                             element.strokeColor, element.fillColor);
            break;
        case 'appsync':
            drawAppSync(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'kinesis':
            drawKinesis(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'emr':
            drawEMR(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'sagemaker':
            drawSageMaker(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'glue':
            drawGlue(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        // Business Icons
        case 'user':
            drawUser(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'users':
            drawUsers(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'folder':
            drawFolder(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'file':
            drawFile(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'envelope':
            drawEnvelope(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'calendar':
            drawCalendar(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        // Device Icons
        case 'desktop':
            drawDesktop(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'laptop':
            drawLaptop(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'mobile':
            drawMobile(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'tablet':
            drawTablet(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        // Symbol Icons
        case 'gear':
            drawGear(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'lock':
            drawLock(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'shield':
            drawShield(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'key':
            drawKey(element.x, element.y, element.width, element.height,
                   element.strokeColor, element.fillColor);
            break;
        case 'bell':
            drawBell(element.x, element.y, element.width, element.height,
                    element.strokeColor, element.fillColor);
            break;
        case 'check':
            drawCheck(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'warning':
            drawWarning(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'clock':
            drawClock(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
    }
}

function drawPreview(x, y) {
    const width = x - startX;
    const height = y - startY;

    ctx.save();
    ctx.translate(panOffsetX, panOffsetY);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.globalAlpha = 0.5;

    const previewElement = {
        type: currentTool,
        x: startX,
        y: startY,
        width: width,
        height: height,
        strokeColor: strokeColorInput.value,
        fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
        lineStyle: currentLineStyle,
        lineThickness: currentLineThickness
    };

    drawElement(previewElement);
    ctx.restore();
}

// Undo/Redo functionality
function saveHistory() {
    // Remove any redo states if we're not at the end
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }

    // Deep copy the current elements state
    history.push(JSON.parse(JSON.stringify(elements)));
    historyStep++;

    // Limit history to 50 steps
    if (history.length > 50) {
        history.shift();
        historyStep--;
    }
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        elements = JSON.parse(JSON.stringify(history[historyStep]));
        ensureElementIds(); // Ensure restored elements have IDs
        selectedElement = null;
        selectedElements = [];
        redraw();
    }
}

// Helper function to find which element a point is closest to
function findClosestElement(x, y, excludeTypes = ['line', 'arrow', 'pen', 'text']) {
    let closest = null;
    let minDistance = Infinity;

    elements.forEach(el => {
        if (excludeTypes.includes(el.type)) return;

        const centerX = el.x + (el.width || 0) / 2;
        const centerY = el.y + (el.height || 0) / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        if (distance < minDistance && distance < 200) { // Within 200px
            minDistance = distance;
            closest = el;
        }
    });

    return closest;
}

// Detect connections for arrows and lines
function detectConnections() {
    const connections = [];

    elements.forEach(el => {
        if (el.type === 'line' || el.type === 'arrow') {
            const startX = el.x;
            const startY = el.y;
            const endX = el.x + (el.width || 0);
            const endY = el.y + (el.height || 0);

            const fromElement = findClosestElement(startX, startY);
            const toElement = findClosestElement(endX, endY);

            if (fromElement && toElement && fromElement !== toElement) {
                connections.push({
                    connector: el,
                    from: fromElement,
                    to: toElement
                });
            }
        }
    });

    return connections;
}

// Reconnect arrows for horizontal layout (left to right)
function reconnectHorizontal(connections) {
    connections.forEach(({ connector, from, to }) => {
        // Connect from right edge of 'from' to left edge of 'to'
        const fromX = from.x + Math.abs(from.width || 100);
        const fromY = from.y + Math.abs(from.height || 100) / 2;
        const toX = to.x;
        const toY = to.y + Math.abs(to.height || 100) / 2;

        connector.x = fromX;
        connector.y = fromY;
        connector.width = toX - fromX;
        connector.height = toY - fromY;
    });
}

// Reconnect arrows for vertical layout (top to bottom)
function reconnectVertical(connections) {
    connections.forEach(({ connector, from, to }) => {
        // Connect from bottom edge of 'from' to top edge of 'to'
        const fromX = from.x + Math.abs(from.width || 100) / 2;
        const fromY = from.y + Math.abs(from.height || 100);
        const toX = to.x + Math.abs(to.width || 100) / 2;
        const toY = to.y;

        connector.x = fromX;
        connector.y = fromY;
        connector.width = toX - fromX;
        connector.height = toY - fromY;
    });
}

// Layout functions
function layoutHorizontal() {
    if (elements.length === 0) return;

    // Store current selection to preserve it
    const previousSelection = [...selectedElements];
    const previousSingleSelection = selectedElement;

    // Detect connections before layout
    const connections = detectConnections();

    const minSpacing = 10;
    const maxSpacing = 100;
    const margin = 50;
    const maxWidth = canvas.width - margin * 2;
    const availableHeight = canvas.height - margin * 2;

    // Sort elements by their current Y position, then X position (exclude connectors and text)
    const sortedElements = [...elements]
        .filter(el => el.type !== 'line' && el.type !== 'arrow' && el.type !== 'text')
        .sort((a, b) => {
            const ay = a.y || 0;
            const by = b.y || 0;
            if (Math.abs(ay - by) < 50) {
                return (a.x || 0) - (b.x || 0);
            }
            return ay - by;
        });

    // Group elements into rows with minimal spacing for grouping
    let currentX = 0;
    let rowHeight = 0;
    const rows = [];
    let currentRow = [];

    sortedElements.forEach(element => {
        const elementWidth = Math.abs(element.width || 100);
        const elementHeight = Math.abs(element.height || 100);

        if (currentX + elementWidth > maxWidth && currentRow.length > 0) {
            rows.push({ elements: currentRow, height: rowHeight });
            currentRow = [];
            currentX = 0;
            rowHeight = 0;
        }

        currentRow.push(element);
        rowHeight = Math.max(rowHeight, elementHeight);
        currentX += elementWidth + minSpacing;
    });

    if (currentRow.length > 0) {
        rows.push({ elements: currentRow, height: rowHeight });
    }

    // Calculate vertical spacing between rows
    const totalRowHeight = rows.reduce((sum, row) => sum + row.height, 0);
    let verticalSpacing = minSpacing;
    if (rows.length > 1) {
        const spaceForVerticalGaps = availableHeight - totalRowHeight;
        verticalSpacing = Math.min(maxSpacing, Math.max(minSpacing, spaceForVerticalGaps / (rows.length - 1)));
    }

    // Calculate total height with actual spacing
    const totalHeight = rows.reduce((sum, row, i) => sum + row.height + (i > 0 ? verticalSpacing : 0), 0);
    let startY = (canvas.height - totalHeight) / 2;

    // Position elements
    rows.forEach(row => {
        // Calculate horizontal spacing for this row
        const totalElementWidth = row.elements.reduce((sum, el) => sum + Math.abs(el.width || 100), 0);
        let horizontalSpacing = minSpacing;
        if (row.elements.length > 1) {
            const spaceForGaps = maxWidth - totalElementWidth;
            horizontalSpacing = Math.min(maxSpacing, Math.max(minSpacing, spaceForGaps / (row.elements.length - 1)));
        }

        const rowWidth = row.elements.reduce((sum, el, i) =>
            sum + Math.abs(el.width || 100) + (i > 0 ? horizontalSpacing : 0), 0);
        let x = (canvas.width - rowWidth) / 2;

        row.elements.forEach(element => {
            const oldX = element.x;
            const oldY = element.y;
            const oldCenterX = oldX + Math.abs(element.width || 100) / 2;
            const oldCenterY = oldY + Math.abs(element.height || 100) / 2;

            element.x = x;
            element.y = startY + (row.height - Math.abs(element.height || 100)) / 2;

            const newCenterX = element.x + Math.abs(element.width || 100) / 2;
            const newCenterY = element.y + Math.abs(element.height || 100) / 2;
            const deltaX = newCenterX - oldCenterX;
            const deltaY = newCenterY - oldCenterY;

            // Move child text elements with their parent shape
            elements.forEach(el => {
                if (el.type === 'text' && el.parentId === element.id) {
                    el.x += deltaX;
                    el.y += deltaY;
                }
            });

            x += Math.abs(element.width || 100) + horizontalSpacing;
        });

        startY += row.height + verticalSpacing;
    });

    // Reconnect arrows in horizontal orientation
    reconnectHorizontal(connections);

    // Restore and show selection
    selectedElements = previousSelection;
    selectedElement = previousSingleSelection;

    // Switch to select mode so selection is visible
    currentTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.classList.add('active');

    saveHistory();
    redraw();
}

function layoutVertical() {
    if (elements.length === 0) return;

    // Store current selection to preserve it
    const previousSelection = [...selectedElements];
    const previousSingleSelection = selectedElement;

    // Detect connections before layout
    const connections = detectConnections();

    const minSpacing = 10;
    const maxSpacing = 100;
    const margin = 50;
    const maxHeight = canvas.height - margin * 2;
    const availableWidth = canvas.width - margin * 2;

    // Sort elements by their current X position, then Y position (exclude connectors and text)
    const sortedElements = [...elements]
        .filter(el => el.type !== 'line' && el.type !== 'arrow' && el.type !== 'text')
        .sort((a, b) => {
            const ax = a.x || 0;
            const bx = b.x || 0;
            if (Math.abs(ax - bx) < 50) {
                return (a.y || 0) - (b.y || 0);
            }
            return ax - bx;
        });

    // Group elements into columns with minimal spacing for grouping
    let currentY = 0;
    let columnWidth = 0;
    const columns = [];
    let currentColumn = [];

    sortedElements.forEach(element => {
        const elementWidth = Math.abs(element.width || 100);
        const elementHeight = Math.abs(element.height || 100);

        if (currentY + elementHeight > maxHeight && currentColumn.length > 0) {
            columns.push({ elements: currentColumn, width: columnWidth });
            currentColumn = [];
            currentY = 0;
            columnWidth = 0;
        }

        currentColumn.push(element);
        columnWidth = Math.max(columnWidth, elementWidth);
        currentY += elementHeight + minSpacing;
    });

    if (currentColumn.length > 0) {
        columns.push({ elements: currentColumn, width: columnWidth });
    }

    // Calculate horizontal spacing between columns
    const totalColumnWidth = columns.reduce((sum, col) => sum + col.width, 0);
    let horizontalSpacing = minSpacing;
    if (columns.length > 1) {
        const spaceForHorizontalGaps = availableWidth - totalColumnWidth;
        horizontalSpacing = Math.min(maxSpacing, Math.max(minSpacing, spaceForHorizontalGaps / (columns.length - 1)));
    }

    // Calculate total width with actual spacing
    const totalWidth = columns.reduce((sum, col, i) => sum + col.width + (i > 0 ? horizontalSpacing : 0), 0);
    let startX = (canvas.width - totalWidth) / 2;

    // Position elements
    columns.forEach(column => {
        // Calculate vertical spacing for this column
        const totalElementHeight = column.elements.reduce((sum, el) => sum + Math.abs(el.height || 100), 0);
        let verticalSpacing = minSpacing;
        if (column.elements.length > 1) {
            const spaceForGaps = maxHeight - totalElementHeight;
            verticalSpacing = Math.min(maxSpacing, Math.max(minSpacing, spaceForGaps / (column.elements.length - 1)));
        }

        const columnHeight = column.elements.reduce((sum, el, i) =>
            sum + Math.abs(el.height || 100) + (i > 0 ? verticalSpacing : 0), 0);
        let y = (canvas.height - columnHeight) / 2;

        column.elements.forEach(element => {
            const oldX = element.x;
            const oldY = element.y;
            const oldCenterX = oldX + Math.abs(element.width || 100) / 2;
            const oldCenterY = oldY + Math.abs(element.height || 100) / 2;

            element.x = startX + (column.width - Math.abs(element.width || 100)) / 2;
            element.y = y;

            const newCenterX = element.x + Math.abs(element.width || 100) / 2;
            const newCenterY = element.y + Math.abs(element.height || 100) / 2;
            const deltaX = newCenterX - oldCenterX;
            const deltaY = newCenterY - oldCenterY;

            // Move child text elements with their parent shape
            elements.forEach(el => {
                if (el.type === 'text' && el.parentId === element.id) {
                    el.x += deltaX;
                    el.y += deltaY;
                }
            });

            y += Math.abs(element.height || 100) + verticalSpacing;
        });

        startX += column.width + horizontalSpacing;
    });

    // Reconnect arrows in vertical orientation
    reconnectVertical(connections);

    // Restore and show selection
    selectedElements = previousSelection;
    selectedElement = previousSingleSelection;

    // Switch to select mode so selection is visible
    currentTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.classList.add('active');

    saveHistory();
    redraw();
}

// Grid drawing function
function drawGrid() {
    const startX = Math.floor(-panOffsetX / zoomLevel / gridSize) * gridSize;
    const startY = Math.floor(-panOffsetY / zoomLevel / gridSize) * gridSize;
    const endX = startX + Math.ceil(canvas.width / zoomLevel / gridSize) * gridSize + gridSize;
    const endY = startY + Math.ceil(canvas.height / zoomLevel / gridSize) * gridSize + gridSize;

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1 / zoomLevel;
    ctx.beginPath();

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
    }

    ctx.stroke();
}

// Snap to grid helper
function snapToGridValue(value) {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
}

function redraw() {
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply pan and zoom transformations
    ctx.save();
    ctx.translate(panOffsetX, panOffsetY);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw grid if enabled
    if (showGrid) {
        drawGrid();
    }

    elements.forEach(element => {
        drawElement(element);

        // Draw lock indicator for locked elements
        if (element.locked) {
            const bounds = getElementBounds(element);
            const lockSize = 12;
            const lockX = bounds.x + bounds.width - lockSize - 4;
            const lockY = bounds.y + 4;

            // Draw lock icon background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(lockX - 2, lockY - 2, lockSize + 4, lockSize + 4);

            // Draw lock icon (simple representation)
            ctx.strokeStyle = '#f44336';
            ctx.fillStyle = '#f44336';
            ctx.lineWidth = 1.5;

            // Lock body
            ctx.fillRect(lockX + 2, lockY + 5, lockSize - 4, 7);

            // Lock shackle
            ctx.beginPath();
            ctx.arc(lockX + lockSize / 2, lockY + 4, 3, Math.PI, 0, true);
            ctx.stroke();
        }
    });

    // Draw selection boxes for multi-select
    if (currentTool === 'select') {
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw selection boxes for all selected elements
        if (selectedElements.length > 0) {
            selectedElements.forEach(el => {
                const bounds = getElementBounds(el);
                ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
            });
        } else if (selectedElement) {
            // Single element selection with resize handles
            const bounds = getElementBounds(selectedElement);
            ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
            ctx.setLineDash([]);

            // Draw resize handles only for single selection
            const handles = getResizeHandles(bounds);
            ctx.fillStyle = '#2196f3';
            handles.forEach(handle => {
                ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
            });
        }

        ctx.setLineDash([]);

        // Draw rectangle selection box
        if (isRectangleSelecting && selectionRect) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            ctx.setLineDash([]);
        }
    }

    // Restore context
    ctx.restore();
}

// Selection and manipulation
function getElementBounds(element) {
    switch (element.type) {
        case 'pen':
            const xs = element.points.map(p => p.x);
            const ys = element.points.map(p => p.y);
            return {
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys)
            };
        case 'text':
            const fontFamily = element.fontFamily || 'Comic Sans MS, cursive';
            const fontSize = element.fontSize || 16;
            const bold = element.bold ? 'bold ' : '';
            const italic = element.italic ? 'italic ' : '';
            ctx.font = `${italic}${bold}${fontSize}px ${fontFamily}`;

            // Handle multi-line text
            const lines = (element.text || '').split('\n');
            const lineHeight = fontSize * 1.2;
            let maxWidth = 20; // Minimum width for empty text

            lines.forEach(line => {
                const metrics = ctx.measureText(line);
                maxWidth = Math.max(maxWidth, metrics.width);
            });

            return {
                x: element.x,
                y: element.y,
                width: maxWidth,
                height: lines.length * lineHeight
            };
        default:
            return {
                x: Math.min(element.x, element.x + element.width),
                y: Math.min(element.y, element.y + element.height),
                width: Math.abs(element.width),
                height: Math.abs(element.height)
            };
    }
}

function getElementAtPoint(x, y) {
    for (let i = elements.length - 1; i >= 0; i--) {
        // Skip locked elements
        if (elements[i].locked) continue;

        const bounds = getElementBounds(elements[i]);
        if (x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height) {
            return elements[i];
        }
    }
    return null;
}

function getResizeHandles(bounds) {
    return [
        { x: bounds.x, y: bounds.y, position: 'nw', cursor: 'nw-resize' },
        { x: bounds.x + bounds.width, y: bounds.y, position: 'ne', cursor: 'ne-resize' },
        { x: bounds.x, y: bounds.y + bounds.height, position: 'sw', cursor: 'sw-resize' },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, position: 'se', cursor: 'se-resize' }
    ];
}

function getResizeHandle(x, y) {
    if (!selectedElement) return null;
    const bounds = getElementBounds(selectedElement);
    const handles = getResizeHandles(bounds);

    for (const handle of handles) {
        if (Math.abs(x - handle.x) < 8 && Math.abs(y - handle.y) < 8) {
            return handle;
        }
    }
    return null;
}

function moveElement(element, dx, dy) {
    if (element.type === 'pen') {
        element.points = element.points.map(p => ({x: p.x + dx, y: p.y + dy}));
    } else {
        element.x += dx;
        element.y += dy;
    }

    // Also move any child text elements
    if (element.id) {
        elements.forEach(el => {
            if (el.parentId === element.id && el.type === 'text') {
                el.x += dx;
                el.y += dy;
            }
        });

        // Update connected arrows/lines
        elements.forEach(connector => {
            if (connector.type === 'arrow' || connector.type === 'line') {
                // Check if this connector is connected to the element we just moved
                const connectedToStart = connector.startShapeId === element.id;
                const connectedToEnd = connector.endShapeId === element.id;

                if (connectedToStart || connectedToEnd) {
                    // Find both shapes this connector connects
                    const startShape = connector.startShapeId ? elements.find(el => el.id === connector.startShapeId) : null;
                    const endShape = connector.endShapeId ? elements.find(el => el.id === connector.endShapeId) : null;

                    if (startShape && endShape) {
                        const startBounds = getElementBounds(startShape);
                        const endBounds = getElementBounds(endShape);

                        // Determine flow direction
                        const centerToCenter = {
                            dx: (endBounds.x + endBounds.width / 2) - (startBounds.x + startBounds.width / 2),
                            dy: (endBounds.y + endBounds.height / 2) - (startBounds.y + startBounds.height / 2)
                        };
                        const isHorizontal = Math.abs(centerToCenter.dx) > Math.abs(centerToCenter.dy);

                        // Get proper connection points
                        const connectionPoints = getDirectionalConnection(
                            startBounds, startShape.type,
                            endBounds, endShape.type,
                            isHorizontal
                        );

                        if (connectionPoints) {
                            connector.x = connectionPoints.from.x;
                            connector.y = connectionPoints.from.y;
                            connector.width = connectionPoints.to.x - connectionPoints.from.x;
                            connector.height = connectionPoints.to.y - connectionPoints.from.y;
                        }
                    }
                }
            }
        });
    }
}

function resizeElement(element, x, y, handle) {
    if (element.type === 'pen' || element.type === 'text') return; // Can't resize these

    const bounds = getElementBounds(element);

    switch (handle.position) {
        case 'se':
            element.width = x - element.x;
            element.height = y - element.y;
            break;
        case 'sw':
            element.width = element.x + element.width - x;
            element.x = x;
            element.height = y - element.y;
            break;
        case 'ne':
            element.width = x - element.x;
            element.height = element.y + element.height - y;
            element.y = y;
            break;
        case 'nw':
            element.width = element.x + element.width - x;
            element.height = element.y + element.height - y;
            element.x = x;
            element.y = y;
            break;
    }
}

// Text input
function createTextInput(x, y) {
    const input = document.createElement('textarea');
    input.className = 'text-input';
    const rect = canvas.getBoundingClientRect();
    input.style.left = (rect.left + panOffsetX + x * zoomLevel) + 'px';
    input.style.top = (rect.top + panOffsetY + y * zoomLevel) + 'px';
    input.style.fontFamily = selectedFont;
    input.style.fontSize = fontSizeSelect.value + 'px';
    input.style.fontWeight = isBold ? 'bold' : 'normal';
    input.style.fontStyle = isItalic ? 'italic' : 'normal';
    input.style.color = textColorInput.value;
    input.rows = 1;
    input.style.minWidth = '200px';
    input.style.resize = 'both';
    document.body.appendChild(input);

    // Focus after a brief delay to prevent immediate blur
    setTimeout(() => input.focus(), 10);

    const finishText = () => {
        const text = input.value.trim();
        if (text) {
            elements.push({
                type: 'text',
                x: x,
                y: y,
                text: text,
                strokeColor: strokeColorInput.value,
                textColor: textColorInput.value,
                fontFamily: selectedFont,
                fontSize: parseInt(fontSizeSelect.value),
                bold: isBold,
                italic: isItalic
            });
            redraw();
        }
        input.remove();
    };

    // Add blur listener with a slight delay to prevent race conditions
    setTimeout(() => {
        input.addEventListener('blur', finishText);
    }, 100);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishText();
        } else if (e.key === 'Escape') {
            input.remove();
        }
    });
}

// Text input for shapes (centered)
function createTextInputForShape(centerX, centerY, shape) {
    const input = document.createElement('textarea');
    input.className = 'text-input';
    input.style.textAlign = 'center';
    input.value = `Thing ${thingCounter}`; // Pre-fill with "Thing N"
    thingCounter++; // Increment counter for next shape
    const rect = canvas.getBoundingClientRect();
    input.style.left = (rect.left + panOffsetX + centerX * zoomLevel - 50) + 'px'; // Offset to center the input box
    input.style.top = (rect.top + panOffsetY + centerY * zoomLevel - 12) + 'px';
    input.style.fontFamily = selectedFont;
    input.style.fontSize = fontSizeSelect.value + 'px';
    input.style.fontWeight = isBold ? 'bold' : 'normal';
    input.style.fontStyle = isItalic ? 'italic' : 'normal';
    input.style.color = textColorInput.value;
    input.style.width = '150px';
    input.rows = 1;
    input.style.resize = 'both';
    document.body.appendChild(input);

    // Focus and select all text after a brief delay
    setTimeout(() => {
        input.focus();
        input.select();
    }, 10);

    const finishText = () => {
        const text = input.value.trim();
        if (text) {
            // Measure text to center it properly (use longest line for centering)
            const fontSize = parseInt(fontSizeSelect.value);
            ctx.font = `${fontSize}px ${selectedFont}`;
            const lines = text.split('\n');
            const lineWidths = lines.map(line => ctx.measureText(line).width);
            const textWidth = Math.max(...lineWidths);
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;

            const textElement = {
                id: nextElementId++,
                type: 'text',
                x: centerX - textWidth / 2,
                y: centerY - totalHeight / 2, // Adjust for vertical centering of all lines
                text: text,
                strokeColor: strokeColorInput.value,
                textColor: textColorInput.value,
                fontFamily: selectedFont,
                fontSize: fontSize,
                bold: isBold,
                italic: isItalic
            };

            // Link to parent shape if it has an ID
            if (shape && shape.id) {
                textElement.parentId = shape.id;
            }

            elements.push(textElement);
            redraw();
        }
        input.remove();
    };

    // Add blur listener with a slight delay to prevent race conditions
    setTimeout(() => {
        input.addEventListener('blur', finishText);
    }, 100);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishText();
        } else if (e.key === 'Escape') {
            input.remove();
        }
    });
}

// Text input for shapes (positioned below)
function createTextInputBelowShape(centerX, bottomY, shape) {
    const input = document.createElement('textarea');
    input.className = 'text-input';
    input.style.textAlign = 'center';
    const rect = canvas.getBoundingClientRect();
    input.style.left = (rect.left + panOffsetX + centerX * zoomLevel - 50) + 'px'; // Offset to center the input box
    input.style.top = (rect.top + panOffsetY + bottomY * zoomLevel - 12) + 'px';
    input.style.fontFamily = selectedFont;
    input.style.fontSize = fontSizeSelect.value + 'px';
    input.style.fontWeight = isBold ? 'bold' : 'normal';
    input.style.fontStyle = isItalic ? 'italic' : 'normal';
    input.style.color = textColorInput.value;
    input.style.width = '150px';
    input.rows = 1;
    input.style.resize = 'both';
    document.body.appendChild(input);

    // Focus after a brief delay to prevent immediate blur
    setTimeout(() => input.focus(), 10);

    const finishText = () => {
        const text = input.value.trim();
        if (text) {
            // Measure text to center it below the shape (use longest line for centering)
            const fontSize = parseInt(fontSizeSelect.value);
            ctx.font = `${fontSize}px ${selectedFont}`;
            const lines = text.split('\n');
            const lineWidths = lines.map(line => ctx.measureText(line).width);
            const textWidth = Math.max(...lineWidths);

            const textElement = {
                id: nextElementId++,
                type: 'text',
                x: centerX - textWidth / 2,
                y: bottomY - 8, // Position below shape
                text: text,
                strokeColor: strokeColorInput.value,
                textColor: textColorInput.value,
                fontFamily: selectedFont,
                fontSize: fontSize,
                bold: isBold,
                italic: isItalic
            };

            // Link to parent shape if it has an ID
            if (shape && shape.id) {
                textElement.parentId = shape.id;
            }

            elements.push(textElement);
            redraw();
        }
        input.remove();
    };

    // Add blur listener with a slight delay to prevent race conditions
    setTimeout(() => {
        input.addEventListener('blur', finishText);
    }, 100);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishText();
        } else if (e.key === 'Escape') {
            input.remove();
        }
    });
}

// SVG Export function
function exportAsSVG() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

    // Add background
    svg += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;

    // Convert each element to SVG
    elements.forEach(element => {
        svg += elementToSVG(element);
    });

    svg += '</svg>';

    // Download SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'drawing.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
}

function elementToSVG(element) {
    const stroke = element.strokeColor || '#000000';
    const fill = element.fillColor || 'none';
    const lineStyle = element.lineStyle || 'solid';
    let dashArray = '';

    if (lineStyle === 'dashed') dashArray = 'stroke-dasharray="10,5"';
    else if (lineStyle === 'dotted') dashArray = 'stroke-dasharray="2,3"';

    switch (element.type) {
        case 'rectangle':
            const rx = Math.min(element.x, element.x + element.width);
            const ry = Math.min(element.y, element.y + element.height);
            const rw = Math.abs(element.width);
            const rh = Math.abs(element.height);
            const radius = Math.min(10, rw / 4, rh / 4);
            return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${radius}" ry="${radius}" stroke="${stroke}" fill="${fill}" stroke-width="2" ${dashArray}/>`;

        case 'circle':
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            const radiusX = Math.abs(element.width) / 2;
            const radiusY = Math.abs(element.height) / 2;
            return `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" stroke="${stroke}" fill="${fill}" stroke-width="2" ${dashArray}/>`;

        case 'line':
            const x2 = element.x + element.width;
            const y2 = element.y + element.height;
            if (element.lineRouting === 'stepped') {
                const points = getSteppedPath(element.x, element.y, x2, y2);
                let pathData = `M ${points[0].x} ${points[0].y}`;
                for (let i = 1; i < points.length; i++) {
                    pathData += ` L ${points[i].x} ${points[i].y}`;
                }
                return `<path d="${pathData}" stroke="${stroke}" fill="none" stroke-width="2" ${dashArray}/>`;
            } else {
                return `<line x1="${element.x}" y1="${element.y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" ${dashArray}/>`;
            }

        case 'arrow':
            const ax2 = element.x + element.width;
            const ay2 = element.y + element.height;
            if (element.lineRouting === 'stepped') {
                const points = getSteppedPath(element.x, element.y, ax2, ay2);
                let pathData = `M ${points[0].x} ${points[0].y}`;
                for (let i = 1; i < points.length; i++) {
                    pathData += ` L ${points[i].x} ${points[i].y}`;
                }
                // Calculate arrowhead based on last segment
                const lastPoint = points[points.length - 1];
                const secondLastPoint = points[points.length - 2];
                const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x);
                const headLength = 15;
                const arrowPoint1X = lastPoint.x - headLength * Math.cos(angle - Math.PI / 6);
                const arrowPoint1Y = lastPoint.y - headLength * Math.sin(angle - Math.PI / 6);
                const arrowPoint2X = lastPoint.x - headLength * Math.cos(angle + Math.PI / 6);
                const arrowPoint2Y = lastPoint.y - headLength * Math.sin(angle + Math.PI / 6);

                return `<path d="${pathData}" stroke="${stroke}" fill="none" stroke-width="2" ${dashArray}/>` +
                       `<line x1="${lastPoint.x}" y1="${lastPoint.y}" x2="${arrowPoint1X}" y2="${arrowPoint1Y}" stroke="${stroke}" stroke-width="2"/>` +
                       `<line x1="${lastPoint.x}" y1="${lastPoint.y}" x2="${arrowPoint2X}" y2="${arrowPoint2Y}" stroke="${stroke}" stroke-width="2"/>`;
            } else {
                const angle = Math.atan2(element.height, element.width);
                const headLength = 15;
                const arrowPoint1X = ax2 - headLength * Math.cos(angle - Math.PI / 6);
                const arrowPoint1Y = ay2 - headLength * Math.sin(angle - Math.PI / 6);
                const arrowPoint2X = ax2 - headLength * Math.cos(angle + Math.PI / 6);
                const arrowPoint2Y = ay2 - headLength * Math.sin(angle + Math.PI / 6);

                return `<line x1="${element.x}" y1="${element.y}" x2="${ax2}" y2="${ay2}" stroke="${stroke}" stroke-width="2" ${dashArray}/>` +
                       `<line x1="${ax2}" y1="${ay2}" x2="${arrowPoint1X}" y2="${arrowPoint1Y}" stroke="${stroke}" stroke-width="2"/>` +
                       `<line x1="${ax2}" y1="${ay2}" x2="${arrowPoint2X}" y2="${arrowPoint2Y}" stroke="${stroke}" stroke-width="2"/>`;
            }

        case 'pen':
            if (element.points.length < 2) return '';
            let pathData = `M ${element.points[0].x} ${element.points[0].y}`;
            for (let i = 1; i < element.points.length; i++) {
                pathData += ` L ${element.points[i].x} ${element.points[i].y}`;
            }
            return `<path d="${pathData}" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${dashArray}/>`;

        case 'text':
            const textFontFamily = element.fontFamily || 'Comic Sans MS, cursive';
            const textFontSize = element.fontSize || 16;
            const textColor = element.textColor || stroke;
            const fontWeight = element.bold ? 'bold' : 'normal';
            const fontStyle = element.italic ? 'italic' : 'normal';
            return `<text x="${element.x}" y="${element.y + textFontSize}" font-family="${textFontFamily}" font-size="${textFontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${textColor}">${escapeXML(element.text)}</text>`;

        case 'diamond':
            const dcx = element.x + element.width / 2;
            const dcy = element.y + element.height / 2;
            return `<polygon points="${dcx},${element.y} ${element.x + element.width},${dcy} ${dcx},${element.y + element.height} ${element.x},${dcy}" stroke="${stroke}" fill="${fill}" stroke-width="2"/>`;

        case 'triangle':
            return `<polygon points="${element.x + element.width/2},${element.y} ${element.x + element.width},${element.y + element.height} ${element.x},${element.y + element.height}" stroke="${stroke}" fill="${fill}" stroke-width="2"/>`;

        case 'hexagon':
            const hcx = element.x + element.width / 2;
            const hcy = element.y + element.height / 2;
            let hexPoints = '';
            for (let i = 0; i < 6; i++) {
                const hexAngle = (Math.PI / 3) * i;
                const px = hcx + (element.width / 2) * Math.cos(hexAngle);
                const py = hcy + (element.height / 2) * Math.sin(hexAngle);
                hexPoints += `${px},${py} `;
            }
            return `<polygon points="${hexPoints.trim()}" stroke="${stroke}" fill="${fill}" stroke-width="2"/>`;

        case 'star':
            const scx = element.x + element.width / 2;
            const scy = element.y + element.height / 2;
            const outerR = Math.min(element.width, element.height) / 2;
            const innerR = outerR * 0.4;
            let starPoints = '';
            for (let i = 0; i < 10; i++) {
                const starAngle = (Math.PI / 5) * i - Math.PI / 2;
                const r = i % 2 === 0 ? outerR : innerR;
                const px = scx + r * Math.cos(starAngle);
                const py = scy + r * Math.sin(starAngle);
                starPoints += `${px},${py} `;
            }
            return `<polygon points="${starPoints.trim()}" stroke="${stroke}" fill="${fill}" stroke-width="2"/>`;

        // For complex shapes, we'll create simplified SVG representations
        default:
            // Default to a rectangle representation for unsupported shapes
            return `<rect x="${element.x}" y="${element.y}" width="${Math.abs(element.width)}" height="${Math.abs(element.height)}" stroke="${stroke}" fill="${fill}" stroke-width="2"/>`;
    }
}

function escapeXML(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}

// Undo button
document.getElementById('undoBtn').addEventListener('click', () => {
    undo();
});

// Layout buttons
document.getElementById('layoutHorizontalBtn').addEventListener('click', () => {
    layoutHorizontal();
});

document.getElementById('layoutVerticalBtn').addEventListener('click', () => {
    layoutVertical();
});

// Grid and snapping toggles
document.getElementById('gridToggleBtn').addEventListener('click', () => {
    showGrid = !showGrid;
    const btn = document.getElementById('gridToggleBtn');
    if (showGrid) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    redraw();
});

document.getElementById('snapToggleBtn').addEventListener('click', () => {
    snapToGrid = !snapToGrid;
    const btn = document.getElementById('snapToggleBtn');
    if (snapToGrid) {
        btn.classList.add('active');
        // Auto-enable grid when snap is enabled
        if (!showGrid) {
            showGrid = true;
            document.getElementById('gridToggleBtn').classList.add('active');
        }
    } else {
        btn.classList.remove('active');
    }
    redraw();
});

// Export/Import
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear canvas?')) {
        elements = [];
        selectedElement = null;
        backgroundColor = '#FFFEF9';
        bgColorInput.value = '#FFFEF9';
        thingCounter = 1; // Reset the "Thing N" counter
        pages = [{ elements: [], backgroundColor: '#FFFEF9' }]; // Reset to single empty page
        currentPageIndex = 0;
        updatePageCounter();
        redraw();
    }
});

// Export button - show format selection modal
const exportImageBtn = document.getElementById('exportImage');
if (exportImageBtn) {
    exportImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.classList.add('active');
        }
    });
}

// Export modal close button
const exportModalCloseBtn = document.getElementById('exportModalClose');
if (exportModalCloseBtn) {
    exportModalCloseBtn.addEventListener('click', () => {
        const exportModal = document.getElementById('exportModal');
        if (exportModal) {
            exportModal.classList.remove('active');
        }
    });
}

// Close modal on background click
const exportModal = document.getElementById('exportModal');
if (exportModal) {
    exportModal.addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') {
            e.target.classList.remove('active');
        }
    });
}

// Export format selection handlers
document.querySelectorAll('.export-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        const exportModal = document.getElementById('exportModal');

        if (format === 'svg') {
            exportAsSVG();
        } else if (format === 'png') {
            const link = document.createElement('a');
            link.download = 'drawing.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } else if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = 'drawing.jpg';
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } else if (format === 'pptx') {
            exportAsPowerPoint();
        }

        // Close modal after export
        if (exportModal) {
            exportModal.classList.remove('active');
        }
    });
});

function exportAsPowerPoint() {
    // Create a new PowerPoint presentation
    const pres = new PptxGenJS();

    // Add a slide
    const slide = pres.addSlide();

    // Get canvas as image data URL
    const imageData = canvas.toDataURL('image/png');

    // Calculate dimensions to fit slide (standard 10" x 7.5" slide)
    // Convert canvas dimensions to inches (assuming 96 DPI)
    const canvasWidthInches = canvas.width / 96;
    const canvasHeightInches = canvas.height / 96;

    // Scale to fit within slide (max 9.5" x 7" to leave margins)
    const maxWidth = 9.5;
    const maxHeight = 7;
    let width = canvasWidthInches;
    let height = canvasHeightInches;

    if (width > maxWidth) {
        const scale = maxWidth / width;
        width = maxWidth;
        height = height * scale;
    }

    if (height > maxHeight) {
        const scale = maxHeight / height;
        height = maxHeight;
        width = width * scale;
    }

    // Center the image on the slide
    const x = (10 - width) / 2;
    const y = (7.5 - height) / 2;

    // Add image to slide
    slide.addImage({
        data: imageData,
        x: x,
        y: y,
        w: width,
        h: height
    });

    // Save the presentation
    pres.writeFile({ fileName: 'drawing.pptx' });
}

// Saved Diagrams Management (localStorage)
function getSavedDiagrams() {
    try {
        const saved = localStorage.getItem('andraw_saved_diagrams');
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Error getting saved diagrams:', error);
        return {};
    }
}

function saveDiagramToStorage(name, data) {
    try {
        const diagrams = getSavedDiagrams();
        diagrams[name] = {
            data: data,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('andraw_saved_diagrams', JSON.stringify(diagrams));
        populateSavedDiagramsDropdown();
        return true;
    } catch (error) {
        console.error('Error saving diagram:', error);
        alert('Failed to save diagram to browser storage: ' + error.message);
        return false;
    }
}

function loadDiagram(name) {
    try {
        const diagrams = getSavedDiagrams();
        if (!diagrams[name]) {
            alert('Diagram not found');
            return;
        }

        const data = diagrams[name].data;

        // Version 2: Multiple pages
        if (data.version === 2 && data.pages && data.pages.length > 0) {
            pages = data.pages;
            currentPageIndex = data.currentPageIndex || 0;

            // Ensure currentPageIndex is valid
            if (currentPageIndex >= pages.length) {
                currentPageIndex = 0;
            }

            canvasMode = 'storybook';

            // Load the current page elements directly
            const page = pages[currentPageIndex];
            if (page && page.elements) {
                elements = JSON.parse(JSON.stringify(page.elements));
                backgroundColor = page.backgroundColor || '#FFFEF9';
                bgColorInput.value = backgroundColor;
            } else {
                elements = [];
                backgroundColor = '#FFFEF9';
                bgColorInput.value = '#FFFEF9';
            }

            updateModeUI();
        }
        // Old format: single page
        else if (Array.isArray(data)) {
            elements = data;
            backgroundColor = '#FFFEF9';
            bgColorInput.value = '#FFFEF9';
            pages = [{ elements: JSON.parse(JSON.stringify(elements)), backgroundColor }];
            currentPageIndex = 0;
            canvasMode = 'infinite';
        } else {
            elements = data.elements || [];
            backgroundColor = data.backgroundColor || '#FFFEF9';
            bgColorInput.value = backgroundColor;
            pages = [{ elements: JSON.parse(JSON.stringify(elements)), backgroundColor }];
            currentPageIndex = 0;
            canvasMode = 'infinite';
        }

        selectedElement = null;
        selectedElements = [];
        updatePageCounter();
        redraw();

        // Close dropdown
        document.getElementById('logoDropdown').classList.remove('active');
    } catch (error) {
        console.error('Error loading diagram:', error);
        alert('Failed to load diagram: ' + error.message);
    }
}

function deleteDiagram(name) {
    if (confirm(`Delete "${name}" from browser storage?`)) {
        try {
            const diagrams = getSavedDiagrams();
            delete diagrams[name];
            localStorage.setItem('andraw_saved_diagrams', JSON.stringify(diagrams));
            populateSavedDiagramsDropdown();
        } catch (error) {
            console.error('Error deleting diagram:', error);
            alert('Failed to delete diagram: ' + error.message);
        }
    }
}

function populateSavedDiagramsDropdown() {
    const diagrams = getSavedDiagrams();
    const list = document.getElementById('savedDiagramsList');
    const names = Object.keys(diagrams).sort((a, b) => {
        return new Date(diagrams[b].savedAt) - new Date(diagrams[a].savedAt);
    });

    if (names.length === 0) {
        list.innerHTML = '<div class="no-diagrams">No saved diagrams</div>';
    } else {
        list.innerHTML = names.map(name => `
            <div class="saved-diagram-item">
                <div class="saved-diagram-name" onclick="loadDiagram('${name.replace(/'/g, "\\'")}')" title="${name}">
                    <i class="fas fa-file"></i> ${name}
                </div>
                <button class="saved-diagram-delete" onclick="event.stopPropagation(); deleteDiagram('${name.replace(/'/g, "\\'")}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
}

// Logo dropdown toggle
document.getElementById('logoBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('logoDropdown');
    dropdown.classList.toggle('active');

    // Populate when opening
    if (dropdown.classList.contains('active')) {
        populateSavedDiagramsDropdown();
    }

    // Close other dropdowns
    rectangleDropdown.classList.remove('active');
    circleDropdown.classList.remove('active');
    fontDropdown.classList.remove('active');
});

document.getElementById('exportJSON').addEventListener('click', () => {
    // Save current page before exporting
    saveCurrentPage();

    const data = {
        version: 2, // Version 2 supports pages
        pages: pages,
        currentPageIndex: currentPageIndex,
        // Legacy fields for backward compatibility
        backgroundColor: backgroundColor,
        elements: elements
    };

    // Prompt for filename
    const filename = prompt('Enter a name for this diagram:', 'drawing');
    if (!filename) return; // User cancelled

    // Save to browser storage for quick access
    saveDiagramToStorage(filename, data);

    // Also download as file
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${filename}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
});

document.getElementById('importJSON').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                // Save to localStorage for quick access (extract name from filename)
                const filename = file.name.replace('.json', '');
                saveDiagramToStorage(filename, data);

                // Version 2: Multiple pages
                if (data.version === 2 && data.pages && data.pages.length > 0) {
                    pages = data.pages;
                    currentPageIndex = data.currentPageIndex || 0;

                    // Ensure currentPageIndex is valid
                    if (currentPageIndex >= pages.length) {
                        currentPageIndex = 0;
                    }

                    canvasMode = 'storybook'; // Switch to storybook mode

                    // Load the current page elements directly
                    const page = pages[currentPageIndex];
                    if (page && page.elements) {
                        elements = JSON.parse(JSON.stringify(page.elements));
                        backgroundColor = page.backgroundColor || '#FFFEF9';
                        bgColorInput.value = backgroundColor;
                    } else {
                        elements = [];
                        backgroundColor = '#FFFEF9';
                        bgColorInput.value = '#FFFEF9';
                    }

                    updateModeUI();
                }
                // Old format: single page (array or object)
                else if (Array.isArray(data)) {
                    elements = data;
                    backgroundColor = '#FFFEF9';
                    bgColorInput.value = '#FFFEF9';
                    pages = [{ elements: JSON.parse(JSON.stringify(elements)), backgroundColor }];
                    currentPageIndex = 0;
                    canvasMode = 'infinite';
                } else {
                    elements = data.elements || [];
                    backgroundColor = data.backgroundColor || '#FFFEF9';
                    bgColorInput.value = backgroundColor;
                    pages = [{ elements: JSON.parse(JSON.stringify(elements)), backgroundColor }];
                    currentPageIndex = 0;
                    canvasMode = 'infinite';
                }

                selectedElement = null;
                selectedElements = [];
                updatePageCounter();
                redraw();
            } catch (err) {
                alert('Invalid JSON file');
                console.error('Error loading file:', err);
            }
        };
        reader.readAsText(file);
    }
    // Reset file input so the same file can be loaded again
    e.target.value = '';
});

// Help panel toggle
function toggleHelpPanel() {
    const helpPanel = document.getElementById('helpPanel');
    helpPanel.classList.toggle('active');
}

// Close help panel when clicking outside the content
document.getElementById('helpPanel').addEventListener('click', (e) => {
    if (e.target.id === 'helpPanel') {
        e.target.classList.remove('active');
    }
});

// Changelog panel toggle
function toggleChangelogPanel() {
    const changelogPanel = document.getElementById('changelogPanel');
    changelogPanel.classList.toggle('active');

    // Populate changelog if it's being opened
    if (changelogPanel.classList.contains('active')) {
        populateChangelog();
    }
}

// Populate changelog with features
function populateChangelog() {
    const changelogContent = document.querySelector('.changelog-content');

    const changelog = {
        '2025-10-05': [
            'Multi-line text editing with wrapping (Shift+Enter for line breaks)',
            'Grid toggle (G) and snap to grid (Shift+G)',
            'Copy/paste/duplicate (Cmd+C/V/D) with parent-child preservation',
            'Alignment tools (left/center/right/top/middle/bottom)',
            'Distribution tools (horizontal/vertical)',
            'Zoom controls (Fit/Reset/50%/100%/150%/200%)',
            'Selection tools (Select All, Lock/Unlock, Select by Type)',
            'Arrow key positioning (1px or 10px with Shift)',
            'Layout buttons now preserve selection',
            'Fixed copy/paste keyboard shortcuts',
            'What\'s New changelog panel (⭐ button)'
        ],
        '2025-10-04': [
            'New selection icons and improved styling',
            'Logo and visual enhancements'
        ],
        '2025-10-03': [
            'Keyboard shortcuts help panel (press ?)',
            'Connect mode for auto-connecting shapes with arrows (press C)',
            'Auto-numbering for duplicated shapes (Thing 1, Thing 2, etc.)',
            'Duplicate last shape with M key',
            'Smart arrow routing (horizontal/vertical)',
            'Improved parent-child text relationships',
            '6 new style presets for shapes'
        ],
        '2025-10-02': [
            'PowerPoint export functionality',
            'Font size selector for text',
            'Multi-select with rectangle drag',
            'Template shape library with categories',
            'Andraw logo and branding',
            'Pan and zoom for infinite canvas'
        ]
    };

    let html = '';
    for (const [date, items] of Object.entries(changelog)) {
        html += `<div class="changelog-date">${date}</div>`;
        html += '<ul class="changelog-items">';
        items.forEach(item => {
            html += `<li class="changelog-item">${item}</li>`;
        });
        html += '</ul>';
    }

    changelogContent.innerHTML = html;
}

// Changelog button click handler
document.getElementById('changelogBtn').addEventListener('click', toggleChangelogPanel);

// Close changelog panel when clicking outside the content
document.getElementById('changelogPanel').addEventListener('click', (e) => {
    if (e.target.id === 'changelogPanel') {
        e.target.classList.remove('active');
    }
});

// Warn user before leaving/refreshing if there are unsaved changes
window.addEventListener('beforeunload', (e) => {
    // Only show warning if there are elements on the canvas
    if (elements.length > 0) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = 'You have unsaved changes. Do you want to leave without saving?';
        return e.returnValue;
    }
});

// Page Management Functions
function initializePages() {
    // Initialize with current canvas as first page
    if (pages.length === 0) {
        pages.push({
            elements: JSON.parse(JSON.stringify(elements)),
            backgroundColor: backgroundColor
        });
    }
    updatePageCounter();
}

function updatePageCounter() {
    const counter = document.getElementById('pageCounter');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    counter.textContent = `Page ${currentPageIndex + 1} of ${pages.length}`;

    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex === pages.length - 1;
}

function saveCurrentPage() {
    if (pages.length > 0) {
        pages[currentPageIndex] = {
            elements: JSON.parse(JSON.stringify(elements)),
            backgroundColor: backgroundColor
        };
    }
}

function loadPage(index) {
    if (index >= 0 && index < pages.length) {
        // Save current page first
        saveCurrentPage();

        // Load the requested page
        currentPageIndex = index;
        const page = pages[currentPageIndex];
        elements = JSON.parse(JSON.stringify(page.elements));
        backgroundColor = page.backgroundColor;
        bgColorInput.value = backgroundColor;
        updateColorLabel('bgColor', 'bgLabel');

        // Clear selection
        selectedElement = null;
        selectedElements = [];

        updatePageCounter();
        redraw();
    }
}

function addNewPage() {
    // Save current page
    saveCurrentPage();

    // Clone current page
    const newPage = {
        elements: JSON.parse(JSON.stringify(elements)),
        backgroundColor: backgroundColor
    };

    // Add new page after current
    pages.splice(currentPageIndex + 1, 0, newPage);

    // Navigate to new page
    loadPage(currentPageIndex + 1);
}

// Mode Toggle
function updateModeUI() {
    const pageNav = document.getElementById('pageNavigation');
    const modeBtn = document.getElementById('modeToggleBtn');
    const modeIcon = modeBtn.querySelector('i');

    if (canvasMode === 'storybook') {
        pageNav.style.display = 'flex';
        modeIcon.className = 'fas fa-book';
        modeBtn.title = 'Mode: Storybook (click for Infinite Canvas)';
        modeBtn.classList.add('storybook-mode');
        // Reset pan/zoom
        panOffsetX = 0;
        panOffsetY = 0;
        zoomLevel = 1;
    } else {
        pageNav.style.display = 'none';
        modeIcon.className = 'fas fa-expand-arrows-alt';
        modeBtn.title = 'Mode: Infinite Canvas (click for Storybook)';
        modeBtn.classList.remove('storybook-mode');
    }
    redraw();
}

document.getElementById('modeToggleBtn').addEventListener('click', () => {
    canvasMode = canvasMode === 'infinite' ? 'storybook' : 'infinite';

    // When switching to storybook, initialize pages if needed
    if (canvasMode === 'storybook' && pages.length === 0) {
        initializePages();
    }

    updateModeUI();
});

// Page Navigation Event Handlers
document.getElementById('prevPage').addEventListener('click', () => {
    if (isPlayingPages) stopSlideshow();
    loadPage(currentPageIndex - 1);
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (isPlayingPages) stopSlideshow();
    loadPage(currentPageIndex + 1);
});

document.getElementById('addPage').addEventListener('click', () => {
    addNewPage();
});

// Play/pause slideshow
document.getElementById('playPages').addEventListener('click', () => {
    toggleSlideshow();
});

function toggleSlideshow() {
    const playBtn = document.getElementById('playPages');
    const playIcon = playBtn.querySelector('i');

    if (isPlayingPages) {
        // Stop playing
        stopSlideshow();
    } else {
        // Start playing
        startSlideshow();
    }
}

function startSlideshow() {
    if (canvasMode !== 'storybook' || pages.length <= 1) return;

    isPlayingPages = true;
    const playBtn = document.getElementById('playPages');
    const playIcon = playBtn.querySelector('i');

    // Change icon to pause
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    playBtn.title = 'Pause Slideshow';

    // Start auto-advancing pages
    playPagesInterval = setInterval(() => {
        // Move to next page
        const nextIndex = currentPageIndex + 1;

        // If we're at the last page, stop playing
        if (nextIndex >= pages.length) {
            stopSlideshow();
            return;
        }

        loadPage(nextIndex);
    }, SLIDESHOW_DELAY);
}

function stopSlideshow() {
    isPlayingPages = false;
    const playBtn = document.getElementById('playPages');
    const playIcon = playBtn.querySelector('i');

    // Change icon back to play
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    playBtn.title = 'Play Slideshow (2s delay)';

    // Clear interval
    if (playPagesInterval) {
        clearInterval(playPagesInterval);
        playPagesInterval = null;
    }
}

// Initialize canvas
resizeCanvas();

// Splash screen handling - run on window load to ensure everything is ready
window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        // Start fade out at 1 second
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            splashScreen.style.pointerEvents = 'none';
        }, 1000);

        // Remove splash screen from DOM at 1.5 seconds (after fade completes)
        setTimeout(() => {
            if (splashScreen && splashScreen.parentNode) {
                splashScreen.parentNode.removeChild(splashScreen);
            }
        }, 1500);
    }
});

// Ensure all elements have IDs (for backward compatibility)
ensureElementIds();

// Initialize undo history with empty state
saveHistory();

// Initialize mode UI (start in infinite canvas mode)
updateModeUI();
