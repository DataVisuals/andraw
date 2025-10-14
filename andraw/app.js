// Canvas setup
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

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
let userHasMovedShapes = false; // Track if user has manually moved shapes (disables auto-layout)
let thingCounter = 1; // Auto-incrementing counter for "Thing N"
let isConnectMode = false; // For connecting selected elements
let nextElementId = 1; // Unique ID for elements
let isFormatPainterActive = false; // Format painter mode
let copiedFormat = null; // Stores the format to be applied
let formatPainterMultiApply = false; // When true, format painter stays active after applying
let formatPainterLastClick = 0; // For double-click detection

// Canvas mode ('infinite' or 'storybook')
let canvasMode = 'infinite'; // Default to infinite canvas

// Storybook mode state
let pages = []; // Array of pages, each contains {elements, backgroundColor}
let currentPageIndex = 0; // Current page being viewed

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
const shadowEnabledInput = document.getElementById('shadowEnabled');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
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
let currentOpacity = 1.0; // Default opacity (1.0 = 100%)

// Recent colors tracking
let recentColors = [];
const MAX_RECENT_COLORS = 8;

// Grid
const gridSize = 20;
let showSizeDistance = false; // Show dimensions when resizing and distance when moving
let darkMode = false; // Dark mode for UI

// Smart guides for alignment
let smartGuides = []; // Array of {type: 'vertical'|'horizontal', position: number, label: string}
const SNAP_THRESHOLD = 5; // Pixels threshold for snapping to guides

// Last used styles per shape type (persisted across sessions)
let lastUsedStyles = {
    rectangle: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    circle: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    diamond: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    parallelogram: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    roundRect: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    triangle: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    hexagon: { strokeColor: '#556B2F', fillColor: '#D8E4BC', fillEnabled: false, shadow: false },
    line: { strokeColor: '#556B2F', lineStyle: 'solid', lineRouting: 'straight', lineThickness: 2, shadow: false },
    arrow: { strokeColor: '#556B2F', lineStyle: 'solid', lineRouting: 'straight', lineThickness: 2, shadow: false },
    text: { textColor: '#556B2F', fontFamily: 'Comic Sans MS, cursive', fontSize: 16, bold: false, italic: false }
};

// Load last used styles from localStorage
function loadLastUsedStyles() {
    const saved = localStorage.getItem('andraw_lastUsedStyles');
    if (saved) {
        try {
            lastUsedStyles = { ...lastUsedStyles, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to load last used styles:', e);
        }
    }
}

// Save last used styles to localStorage
function saveLastUsedStyles() {
    try {
        localStorage.setItem('andraw_lastUsedStyles', JSON.stringify(lastUsedStyles));
    } catch (e) {
        console.error('Failed to save last used styles:', e);
    }
}

// Update last used style for a shape type
function updateLastUsedStyle(shapeType) {
    if (shapeType === 'line' || shapeType === 'arrow') {
        lastUsedStyles[shapeType] = {
            strokeColor: strokeColorInput.value,
            lineStyle: currentLineStyle,
            lineRouting: currentLineRouting,
            lineThickness: currentLineThickness
        };
    } else if (shapeType === 'text') {
        lastUsedStyles[shapeType] = {
            textColor: textColorInput.value,
            fontFamily: selectedFont,
            fontSize: parseInt(fontSizeSelect.value),
            bold: isBold,
            italic: isItalic
        };
    } else {
        // Shape types: rectangle, circle, diamond, etc.
        lastUsedStyles[shapeType] = {
            strokeColor: strokeColorInput.value,
            fillColor: fillColorInput.value,
            fillEnabled: fillEnabledInput.checked
        };
    }
    saveLastUsedStyles();
}

// Apply last used style for a shape type to UI
function applyLastUsedStyle(shapeType) {
    const style = lastUsedStyles[shapeType];
    if (!style) return;

    if (shapeType === 'line' || shapeType === 'arrow') {
        strokeColorInput.value = style.strokeColor;
        currentLineStyle = style.lineStyle;
        currentLineRouting = style.lineRouting;
        currentLineThickness = style.lineThickness;
        updateStrokeIcon();
    } else if (shapeType === 'text') {
        textColorInput.value = style.textColor;
        selectedFont = style.fontFamily;
        fontSizeSelect.value = style.fontSize;
        isBold = style.bold;
        isItalic = style.italic;
        updateTextColorIcon();
        if (isBold) boldBtn.classList.add('active');
        else boldBtn.classList.remove('active');
        if (isItalic) italicBtn.classList.add('active');
        else italicBtn.classList.remove('active');
    } else {
        strokeColorInput.value = style.strokeColor;
        fillColorInput.value = style.fillColor;
        fillEnabledInput.checked = style.fillEnabled;
        updateStrokeIcon();
        updateFillIcon();
    }
}

// Find a non-overlapping position for a new element
function findNonOverlappingPosition(desiredX, desiredY, width, height) {
    const OFFSET_STEP = 30; // Pixels to offset each time
    const MAX_ATTEMPTS = 10; // Maximum number of positions to try

    // Helper to check if a rectangle overlaps with any existing element
    function overlapsWithExisting(x, y, w, h) {
        return elements.some(el => {
            const bounds = getElementBounds(el);
            // Check if rectangles overlap
            return !(x + w < bounds.x ||
                    x > bounds.x + bounds.width ||
                    y + h < bounds.y ||
                    y > bounds.y + bounds.height);
        });
    }

    // Try the desired position first
    if (!overlapsWithExisting(desiredX, desiredY, width, height)) {
        return { x: desiredX, y: desiredY };
    }

    // Try offsets in a diagonal pattern (down-right)
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        const offsetX = desiredX + (OFFSET_STEP * i);
        const offsetY = desiredY + (OFFSET_STEP * i);

        if (!overlapsWithExisting(offsetX, offsetY, width, height)) {
            return { x: offsetX, y: offsetY };
        }
    }

    // If all positions overlap, just use the last offset position
    return {
        x: desiredX + (OFFSET_STEP * MAX_ATTEMPTS),
        y: desiredY + (OFFSET_STEP * MAX_ATTEMPTS)
    };
}

// Quick create shape at canvas center-left with last used style
function quickCreateShape(shapeType) {
    const style = lastUsedStyles[shapeType];
    if (!style) return;

    // Determine position based on whether we have a last created shape
    let desiredX, desiredY;
    const spacing = 20;

    if (lastCreatedShape) {
        // Use alignment logic similar to 'M' key duplication
        // Determine direction only on first duplication, then keep consistent
        if (!duplicationDirection) {
            const elementCenterX = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 0) / 2;
            const isCentered = Math.abs(elementCenterX - canvas.width / 2) < canvas.width * 0.15; // Within 15% of center
            const isNearTop = lastCreatedShape.y < canvas.height * 0.3; // In top 30%
            duplicationDirection = (isCentered && isNearTop) ? 'vertical' : 'horizontal';
        }

        const shouldPlaceVertically = duplicationDirection === 'vertical';

        if (shapeType === 'text') {
            const tempHeight = style.fontSize * 1.2 || 20;
            if (shouldPlaceVertically) {
                desiredX = lastCreatedShape.x;
                desiredY = lastCreatedShape.y + (lastCreatedShape.height || tempHeight) + spacing;
            } else {
                desiredX = lastCreatedShape.x + (lastCreatedShape.width || 200) + spacing;
                desiredY = lastCreatedShape.y;
            }
        } else if (shapeType === 'line' || shapeType === 'arrow') {
            const lineHeight = Math.abs(lastCreatedShape.height || 0);
            const lineWidth = Math.abs(lastCreatedShape.width || 150);
            if (shouldPlaceVertically) {
                desiredX = lastCreatedShape.x;
                desiredY = lastCreatedShape.y + lineHeight + spacing;
            } else {
                desiredX = lastCreatedShape.x + lineWidth + spacing;
                desiredY = lastCreatedShape.y;
            }
        } else {
            // Shapes with width/height
            if (shouldPlaceVertically) {
                desiredX = lastCreatedShape.x;
                desiredY = lastCreatedShape.y + Math.abs(lastCreatedShape.height || 80) + spacing;
            } else {
                desiredX = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 120) + spacing;
                desiredY = lastCreatedShape.y;
            }
        }
    } else {
        // No last created shape - use canvas center-left position (1/4 from left, vertically centered)
        let centerX = (canvas.width / 4 - panOffsetX) / zoomLevel;
        let centerY = (canvas.height / 2 - panOffsetY) / zoomLevel;

        if (shapeType === 'text') {
            desiredX = centerX;
            desiredY = centerY;
        } else if (shapeType === 'line' || shapeType === 'arrow') {
            const width = 150;
            desiredX = centerX - width / 2;
            desiredY = centerY;
        } else {
            const width = 120;
            const height = 80;
            desiredX = centerX - width / 2;
            desiredY = centerY - height / 2;
        }
    }

    if (shapeType === 'text') {
        // Create text element
        const tempWidth = 200; // Default text box width
        const tempHeight = style.fontSize * 1.2 || 20;
        const pos = findNonOverlappingPosition(desiredX, desiredY, tempWidth, tempHeight);

        const element = {
            id: nextElementId++,
            type: 'text',
            x: pos.x,
            y: pos.y,
            width: tempWidth,
            height: tempHeight,
            text: 'Text',
            color: style.textColor,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            bold: style.bold,
            italic: style.italic
        };
        elements.push(element);
        lastCreatedShape = element;
        saveHistory();
        redraw();

        // Don't select the text element - allows adding multiple elements without interruption
        selectedElement = null;
        selectedElements = [];
    } else if (shapeType === 'line' || shapeType === 'arrow') {
        // Create line/arrow
        const width = 150;
        const height = 2; // Small height for overlap detection
        const pos = findNonOverlappingPosition(desiredX, desiredY, width, height);

        const element = {
            id: nextElementId++,
            type: shapeType,
            x: pos.x,
            y: pos.y,
            width: width,
            height: 0,
            strokeColor: style.strokeColor,
            fillColor: null,
            shadow: style.shadow,
            lineStyle: style.lineStyle,
            lineRouting: style.lineRouting,
            lineThickness: style.lineThickness
        };
        elements.push(element);
        lastCreatedShape = element;
        saveHistory();
        redraw();
    } else {
        // Create shape
        const width = 120;
        const height = 80;
        const pos = findNonOverlappingPosition(desiredX, desiredY, width, height);

        const element = {
            id: nextElementId++,
            type: shapeType,
            x: pos.x,
            y: pos.y,
            width: width,
            height: height,
            strokeColor: style.strokeColor,
            fillColor: style.fillEnabled ? style.fillColor : null,
            shadow: style.shadow,
            lineStyle: style.lineStyle,
            lineRouting: undefined,
            lineThickness: style.lineThickness
        };
        elements.push(element);
        lastCreatedShape = element;
        saveHistory();

        // Don't auto-create text input for quick create - allows adding multiple shapes
        // User can double-click shape later to add text

        redraw();
    }
}

// Rulers and guides
let showRulers = false;
let guides = []; // Array of {type: 'vertical'|'horizontal', position: number}
let draggingGuide = null; // Currently dragging guide
let isDraggingFromRuler = false; // Creating new guide from ruler
const RULER_SIZE = 20; // Size of ruler in pixels

// Clipboard for copy/paste
let clipboard = [];

// Mouse position for paste location
let lastMouseX = 0;
let lastMouseY = 0;

const rectangleBtn = document.getElementById('rectangleBtn');
const rectangleDropdown = document.getElementById('rectangleDropdown');
const circleBtn = document.getElementById('circleBtn');
const circleDropdown = document.getElementById('circleDropdown');

// New unified shape and preset selectors
const shapeBtn = document.getElementById('shapeBtn');
const shapeDropdown = document.getElementById('shapeDropdown');
let currentShapeType = 'rectangle'; // Track selected shape type
let currentPreset = 'slate'; // Track selected preset

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
    mauve: { stroke: '#7D6B7D', fill: '#F0E6EF' },      // Muted purple border, light rose fill
    cerulean: { stroke: '#00395d', fill: '#00aeef' }    // Astronaut blue border, cerulean fill
};

// Diagram templates
const diagramTemplates = {};

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
    // Kubernetes
    'k8s-pod': { type: 'k8sPod', width: 80, height: 80 },
    'k8s-service': { type: 'k8sService', width: 100, height: 80 },
    'k8s-deployment': { type: 'k8sDeployment', width: 100, height: 100 },
    'k8s-configmap': { type: 'k8sConfigMap', width: 90, height: 70 },
    'k8s-secret': { type: 'k8sSecret', width: 90, height: 70 },
    'k8s-ingress': { type: 'k8sIngress', width: 120, height: 60 },
    'k8s-volume': { type: 'k8sVolume', width: 80, height: 80 },
    'k8s-namespace': { type: 'k8sNamespace', width: 140, height: 100 },
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
    calendar: { type: 'calendar', width: 90, height: 90 }
};

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Only handle as tool selection if button has data-tool attribute
        if (!btn.dataset.tool) return;

        // Deactivate format painter when switching tools
        if (isFormatPainterActive) {
            deactivateFormatPainter();
        }

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

    // Update style button icon
    const styleBtn = document.getElementById('styleBtn');
    if (styleBtn) {
        const btnSvg = styleBtn.querySelector('svg rect');
        if (btnSvg) {
            btnSvg.setAttribute('stroke', strokeColorInput.value);
            btnSvg.setAttribute('fill', fillEnabledInput.checked ? fillColorInput.value : 'none');
        }
    }

    // Update color swatches in style dropdown
    const strokeSwatch = document.getElementById('strokeSwatch');
    const fillSwatch = document.getElementById('fillSwatch');
    const textSwatch = document.getElementById('textSwatch');
    if (strokeSwatch && strokeColorInput) {
        strokeSwatch.style.backgroundColor = strokeColorInput.value;
    }
    if (fillSwatch && fillColorInput) {
        fillSwatch.style.backgroundColor = fillColorInput.value;
    }
    if (textSwatch && textColorInput) {
        textSwatch.style.backgroundColor = textColorInput.value;
    }
}

// Recent colors functions
function loadRecentColors() {
    try {
        const saved = localStorage.getItem('andraw_recentColors');
        if (saved) {
            recentColors = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load recent colors:', e);
        recentColors = [];
    }
}

function saveRecentColors() {
    try {
        localStorage.setItem('andraw_recentColors', JSON.stringify(recentColors));
    } catch (e) {
        console.error('Failed to save recent colors:', e);
    }
}

function addRecentColor(color) {
    // Normalize color to lowercase
    color = color.toLowerCase();

    // Remove if already exists
    recentColors = recentColors.filter(c => c !== color);

    // Add to beginning
    recentColors.unshift(color);

    // Limit to MAX_RECENT_COLORS
    if (recentColors.length > MAX_RECENT_COLORS) {
        recentColors = recentColors.slice(0, MAX_RECENT_COLORS);
    }

    saveRecentColors();
    updateRecentColorsPalette();
}

function updateRecentColorsPalette() {
    const container = document.getElementById('recentColorsContainer');
    const palette = document.getElementById('recentColorsPalette');

    if (!container || !palette) return;

    if (recentColors.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    palette.innerHTML = '';

    recentColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.style.width = '24px';
        swatch.style.height = '24px';
        swatch.style.backgroundColor = color;
        swatch.style.border = '1px solid #d0d0d0';
        swatch.style.borderRadius = '4px';
        swatch.style.cursor = 'pointer';
        swatch.style.transition = 'transform 0.2s, box-shadow 0.2s';
        swatch.title = color;

        swatch.addEventListener('mouseenter', () => {
            swatch.style.transform = 'scale(1.1)';
            swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        swatch.addEventListener('mouseleave', () => {
            swatch.style.transform = 'scale(1)';
            swatch.style.boxShadow = 'none';
        });

        swatch.addEventListener('click', () => {
            // Apply to stroke color by default
            strokeColorInput.value = color;
            updateColorIcons();

            // If elements are selected, update their stroke color
            const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
            if (elementsToUpdate.length > 0) {
                elementsToUpdate.forEach(el => {
                    el.strokeColor = color;
                });
                saveHistory();
                redraw();
            }
        });

        palette.appendChild(swatch);
    });
}

// Initialize color labels and icons (only for elements that exist)
updateColorLabel('bgColor', 'bgLabel');
updateColorIcons();
loadRecentColors();
updateRecentColorsPalette();

// Background color change
bgColorInput.addEventListener('input', (e) => {
    backgroundColor = e.target.value;
    updateColorLabel('bgColor', 'bgLabel');
    redraw();
});

// Shape dropdown toggle for rectangle (legacy - kept for compatibility)
if (rectangleBtn && rectangleDropdown) {
    rectangleBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Toggle dropdown open/close
        const isOpen = rectangleDropdown.classList.contains('active');
        rectangleDropdown.classList.toggle('active');
        if (circleDropdown) circleDropdown.classList.remove('active');

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
}

// Shape dropdown toggle for circle (legacy - kept for compatibility)
if (circleBtn && circleDropdown) {
    circleBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Toggle dropdown open/close
        const isOpen = circleDropdown.classList.contains('active');
        circleDropdown.classList.toggle('active');
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');

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
}

// Font dropdown toggle
fontBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fontDropdown.classList.toggle('active');
    if (rectangleDropdown) rectangleDropdown.classList.remove('active');
    if (circleDropdown) circleDropdown.classList.remove('active');
    if (shapeDropdown) shapeDropdown.classList.remove('active');
});

// New shape selector dropdown
if (shapeBtn && shapeDropdown) {
    shapeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shapeDropdown.classList.toggle('active');
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
    });

    // Handle shape selection
    shapeDropdown.querySelectorAll('.shape-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const shape = e.currentTarget.dataset.shape;
            if (shape) {
                currentShapeType = shape;
                currentTool = shape;

                // Check if there are selected shape elements to transform
                const elementsToTransform = selectedElements.length > 0
                    ? selectedElements
                    : (selectedElement ? [selectedElement] : []);

                const shapesToTransform = elementsToTransform.filter(el =>
                    el.type !== 'line' && el.type !== 'arrow' &&
                    el.type !== 'text' && el.type !== 'pen' && el.type !== 'icon'
                );

                if (shapesToTransform.length > 0) {
                    // Transform selected shapes to new type
                    shapesToTransform.forEach(el => {
                        const oldId = el.id;
                        el.type = shape;

                        // Update any arrows connected to this shape to recalculate anchor points
                        elements.forEach(connector => {
                            if ((connector.type === 'arrow' || connector.type === 'line') &&
                                (connector.startShapeId === oldId || connector.endShapeId === oldId)) {

                                const startShape = connector.startShapeId ? elements.find(e => e.id === connector.startShapeId) : null;
                                const endShape = connector.endShapeId ? elements.find(e => e.id === connector.endShapeId) : null;

                                if (startShape && endShape) {
                                    const startBounds = getElementBounds(startShape);
                                    const endBounds = getElementBounds(endShape);

                                    // Use stored anchor points if available
                                    if (connector.startAnchor && connector.endAnchor) {
                                        const startAnchors = getAnchorPoints(startBounds, startShape.type);
                                        const endAnchors = getAnchorPoints(endBounds, endShape.type);
                                        const fromPoint = startAnchors[connector.startAnchor];
                                        const toPoint = endAnchors[connector.endAnchor];

                                        if (fromPoint && toPoint) {
                                            connector.x = fromPoint.x;
                                            connector.y = fromPoint.y;
                                            connector.width = toPoint.x - fromPoint.x;
                                            connector.height = toPoint.y - fromPoint.y;
                                        }
                                    }
                                }
                            }
                        });
                    });

                    saveHistory();
                    shapeDropdown.classList.remove('active');
                    redraw();
                } else {
                    // No shapes selected - just switch tool
                    // Activate the shape tool
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    shapeBtn.classList.add('active');
                    canvas.style.cursor = 'crosshair';

                    // Apply current preset colors
                    if (stylePresets[currentPreset]) {
                        strokeColorInput.value = stylePresets[currentPreset].stroke;
                        fillColorInput.value = stylePresets[currentPreset].fill;
                        fillEnabledInput.checked = true;
                        updateColorIcons();
                    }

                    selectedElement = null;
                    selectedElements = [];
                    shapeDropdown.classList.remove('active');
                    redraw();
                }
            }
        });
    });
}

// Function to insert a template at canvas center
function insertTemplate(templateKey) {
    const template = diagramTemplates[templateKey];
    if (!template) return;

    // Get canvas center in world coordinates
    const centerX = (canvas.width / 2 - panOffsetX) / zoomLevel;
    const centerY = (canvas.height / 2 - panOffsetY) / zoomLevel;

    // Get current style settings
    const currentStroke = strokeColorInput.value;
    const currentFill = fillEnabledInput.checked ? fillColorInput.value : null;
    const currentShadow = shadowEnabledInput.checked;

    // Create all elements with proper IDs and positioning
    const createdElements = [];
    const idMapping = {}; // Map template index to new element ID

    template.elements.forEach((templateEl, index) => {
        const element = {
            id: nextElementId++,
            type: templateEl.type,
            x: centerX + templateEl.x,
            y: centerY + templateEl.y,
            width: templateEl.width,
            height: templateEl.height,
            strokeColor: currentStroke,
            fillColor: currentFill,
            shadow: currentShadow,
            lineStyle: currentLineStyle,
            lineThickness: currentLineThickness
        };

        // Store the mapping for connections
        idMapping[index] = element.id;

        elements.push(element);
        createdElements.push(element);

        // If template element has text, create a text child
        if (templateEl.text) {
            const textElement = {
                id: nextElementId++,
                type: 'text',
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
                text: templateEl.text,
                textColor: currentStroke,
                fontFamily: 'Comic Sans MS, cursive',
                fontSize: 16,
                bold: false,
                italic: false,
                parentId: element.id
            };
            elements.push(textElement);
            createdElements.push(textElement);
        }
    });

    // Create connections between elements
    if (template.connections) {
        template.connections.forEach(conn => {
            const fromElement = elements.find(el => el.id === idMapping[conn.from]);
            const toElement = elements.find(el => el.id === idMapping[conn.to]);

            if (fromElement && toElement) {
                const fromBounds = getElementBounds(fromElement);
                const toBounds = getElementBounds(toElement);

                // Get connection points using directional logic
                const connectionPoints = getDirectionalConnection(
                    fromBounds, fromElement.type,
                    toBounds, toElement.type,
                    false // Will be calculated automatically
                );

                if (connectionPoints) {
                    // Check alignment for auto stepped routing
                    const ALIGNMENT_THRESHOLD = 20;
                    const isAlignedHorizontally = Math.abs(connectionPoints.from.y - connectionPoints.to.y) < ALIGNMENT_THRESHOLD;
                    const isAlignedVertically = Math.abs(connectionPoints.from.x - connectionPoints.to.x) < ALIGNMENT_THRESHOLD;

                    let routing = currentLineRouting;
                    if (!isAlignedHorizontally && !isAlignedVertically) {
                        routing = 'stepped';
                    }

                    const arrow = {
                        id: nextElementId++,
                        type: 'arrow',
                        x: connectionPoints.from.x,
                        y: connectionPoints.from.y,
                        width: connectionPoints.to.x - connectionPoints.from.x,
                        height: connectionPoints.to.y - connectionPoints.from.y,
                        strokeColor: currentStroke,
                        fillColor: null,
                        lineStyle: currentLineStyle,
                        lineRouting: routing,
                        lineThickness: currentLineThickness,
                        startShapeId: fromElement.id,
                        endShapeId: toElement.id,
                        startAnchor: connectionPoints.fromAnchor,
                        endAnchor: connectionPoints.toAnchor
                    };

                    elements.push(arrow);
                    createdElements.push(arrow);

                    // Add label if specified
                    if (conn.label) {
                        const labelElement = {
                            id: nextElementId++,
                            type: 'text',
                            x: 0, // Will be calculated dynamically based on parent arrow
                            y: 0,
                            text: conn.label,
                            textColor: currentStroke,
                            fontFamily: 'Comic Sans MS, cursive',
                            fontSize: 14,
                            bold: false,
                            italic: false,
                            parentId: arrow.id // Link to the arrow so it moves with it
                        };
                        elements.push(labelElement);
                        createdElements.push(labelElement);
                    }
                }
            }
        });
    }

    // Select all created elements
    selectedElements = createdElements.filter(el => el.type !== 'text' || !el.parentId);
    selectedElement = null;

    saveHistory();
    redraw();
}

// Function to get SVG path for a shape type
function getShapeSVGPath(shapeType) {
    const shapes = {
        rectangle: '<rect x="3" y="6" width="18" height="12" />',
        circle: '<circle cx="12" cy="12" r="9" />',
        diamond: '<path d="M12 3 L21 12 L12 21 L3 12 Z" />',
        parallelogram: '<path d="M6 6 L21 6 L18 18 L3 18 Z" />',
        roundRect: '<rect x="3" y="6" width="18" height="12" rx="6" />',
        triangle: '<path d="M12 3 L21 21 L3 21 Z" />',
        hexagon: '<path d="M8 3 L16 3 L21 12 L16 21 L8 21 L3 12 Z" />'
    };
    return shapes[shapeType] || shapes.rectangle;
}


// Font Awesome icon selector
const iconBtn = document.getElementById('iconBtn');
const iconDropdown = document.getElementById('iconDropdown');
const iconSearch = document.getElementById('iconSearch');
const iconGrid = document.getElementById('iconGrid');

// Popular Font Awesome icons
const popularIcons = [
    { name: 'user', class: 'fas fa-user', keywords: 'person profile account' },
    { name: 'users', class: 'fas fa-users', keywords: 'people group team' },
    { name: 'home', class: 'fas fa-home', keywords: 'house building' },
    { name: 'heart', class: 'fas fa-heart', keywords: 'love favorite like' },
    { name: 'star', class: 'fas fa-star', keywords: 'favorite rating' },
    { name: 'check', class: 'fas fa-check', keywords: 'confirm ok done tick' },
    { name: 'times', class: 'fas fa-times', keywords: 'close delete remove x' },
    { name: 'envelope', class: 'fas fa-envelope', keywords: 'email mail message' },
    { name: 'phone', class: 'fas fa-phone', keywords: 'call telephone' },
    { name: 'calendar', class: 'fas fa-calendar', keywords: 'date schedule' },
    { name: 'clock', class: 'fas fa-clock', keywords: 'time watch' },
    { name: 'map-marker', class: 'fas fa-map-marker-alt', keywords: 'location pin place' },
    { name: 'search', class: 'fas fa-search', keywords: 'find magnify' },
    { name: 'cog', class: 'fas fa-cog', keywords: 'settings gear config' },
    { name: 'bell', class: 'fas fa-bell', keywords: 'notification alert' },
    { name: 'lock', class: 'fas fa-lock', keywords: 'secure password' },
    { name: 'unlock', class: 'fas fa-unlock', keywords: 'open unsecure' },
    { name: 'key', class: 'fas fa-key', keywords: 'password access' },
    { name: 'shield', class: 'fas fa-shield-alt', keywords: 'security protect' },
    { name: 'download', class: 'fas fa-download', keywords: 'save arrow' },
    { name: 'upload', class: 'fas fa-upload', keywords: 'send arrow' },
    { name: 'cloud', class: 'fas fa-cloud', keywords: 'weather sky' },
    { name: 'database', class: 'fas fa-database', keywords: 'storage data' },
    { name: 'server', class: 'fas fa-server', keywords: 'computer host' },
    { name: 'laptop', class: 'fas fa-laptop', keywords: 'computer device' },
    { name: 'mobile', class: 'fas fa-mobile-alt', keywords: 'phone device' },
    { name: 'folder', class: 'fas fa-folder', keywords: 'directory files' },
    { name: 'file', class: 'fas fa-file', keywords: 'document' },
    { name: 'chart-bar', class: 'fas fa-chart-bar', keywords: 'graph analytics' },
    { name: 'chart-pie', class: 'fas fa-chart-pie', keywords: 'graph analytics' },
    { name: 'shopping-cart', class: 'fas fa-shopping-cart', keywords: 'buy store' },
    { name: 'credit-card', class: 'fas fa-credit-card', keywords: 'payment money' },
    { name: 'dollar', class: 'fas fa-dollar-sign', keywords: 'money currency' },
    { name: 'globe', class: 'fas fa-globe', keywords: 'world international' },
    { name: 'wifi', class: 'fas fa-wifi', keywords: 'internet network' },
    { name: 'plug', class: 'fas fa-plug', keywords: 'power electric' },
    { name: 'bolt', class: 'fas fa-bolt', keywords: 'lightning power' },
    { name: 'fire', class: 'fas fa-fire', keywords: 'flame hot' },
    { name: 'lightbulb', class: 'fas fa-lightbulb', keywords: 'idea bright' },
    { name: 'camera', class: 'fas fa-camera', keywords: 'photo picture' },
    { name: 'video', class: 'fas fa-video', keywords: 'film movie' },
    { name: 'music', class: 'fas fa-music', keywords: 'audio sound' },
    { name: 'comment', class: 'fas fa-comment', keywords: 'message chat' },
    { name: 'bookmark', class: 'fas fa-bookmark', keywords: 'save favorite' },
    { name: 'flag', class: 'fas fa-flag', keywords: 'marker banner' },
    { name: 'trophy', class: 'fas fa-trophy', keywords: 'award win' },
    { name: 'gift', class: 'fas fa-gift', keywords: 'present box' },
    { name: 'thumbs-up', class: 'fas fa-thumbs-up', keywords: 'like approve' },
    { name: 'arrow-right', class: 'fas fa-arrow-right', keywords: 'next direction' },
    { name: 'arrow-left', class: 'fas fa-arrow-left', keywords: 'back direction' },
    { name: 'arrow-up', class: 'fas fa-arrow-up', keywords: 'top direction' },
    { name: 'arrow-down', class: 'fas fa-arrow-down', keywords: 'bottom direction' },
    { name: 'plus', class: 'fas fa-plus', keywords: 'add create new' },
    { name: 'minus', class: 'fas fa-minus', keywords: 'remove subtract' },
    { name: 'exclamation', class: 'fas fa-exclamation-triangle', keywords: 'warning alert' },
    { name: 'info', class: 'fas fa-info-circle', keywords: 'information help' },
    { name: 'question', class: 'fas fa-question-circle', keywords: 'help unknown' }
];

// Populate icon grid
function populateIconGrid(filter = '') {
    iconGrid.innerHTML = '';
    const filteredIcons = filter
        ? popularIcons.filter(icon =>
            icon.name.includes(filter.toLowerCase()) ||
            icon.keywords.includes(filter.toLowerCase()))
        : popularIcons;

    filteredIcons.forEach(icon => {
        const btn = document.createElement('button');
        btn.className = 'icon-grid-item';
        btn.dataset.iconClass = icon.class;
        btn.title = icon.name;
        btn.innerHTML = `<i class="${icon.class}"></i>`;
        iconGrid.appendChild(btn);
    });
}

// Icon dropdown toggle
if (iconBtn && iconDropdown) {
    iconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        iconDropdown.classList.toggle('active');

        if (iconDropdown.classList.contains('active')) {
            populateIconGrid();
            iconSearch.value = '';
            iconSearch.focus();
        }

        if (shapeDropdown) shapeDropdown.classList.remove('active');
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
    });

    // Icon search
    iconSearch.addEventListener('input', (e) => {
        populateIconGrid(e.target.value);
    });

    // Icon selection
    iconGrid.addEventListener('click', (e) => {
        const item = e.target.closest('.icon-grid-item');
        if (item) {
            const iconClass = item.dataset.iconClass;
            // Switch to select tool and prepare to place icon
            currentTool = 'icon';
            selectedIconClass = iconClass;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            iconBtn.classList.add('active');
            canvas.style.cursor = 'crosshair';
            iconDropdown.classList.remove('active');
        }
    });
}

let selectedIconClass = 'fas fa-star'; // Default icon

// Draw Font Awesome icon
function drawIcon(element) {
    ctx.save();

    // Use the smaller dimension to ensure icon fits
    const iconSize = Math.min(Math.abs(element.width), Math.abs(element.height));

    // Set font to Font Awesome
    ctx.font = `${iconSize}px "Font Awesome 6 Free"`;
    ctx.fillStyle = element.color || '#2C3E50';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Get the icon character from the iconClass
    // Create a temporary element to get the icon's unicode character
    const tempElement = document.createElement('i');
    tempElement.className = element.iconClass;
    tempElement.style.fontFamily = '"Font Awesome 6 Free", "Font Awesome 6 Brands"';
    tempElement.style.fontWeight = element.iconClass.includes('fas') ? '900' :
                                   element.iconClass.includes('far') ? '400' :
                                   element.iconClass.includes('fab') ? '400' : '900';
    document.body.appendChild(tempElement);
    const iconText = window.getComputedStyle(tempElement, '::before').content;
    document.body.removeChild(tempElement);

    // Remove quotes from content if present
    const iconChar = iconText ? iconText.replace(/['"]/g, '') : '\uf005'; // fallback to star

    // Draw the icon centered in its bounding box
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;

    // Set proper font weight based on icon class
    const fontWeight = element.iconClass.includes('fas') ? '900' :
                       element.iconClass.includes('far') ? '400' :
                       element.iconClass.includes('fab') ? '400' : '900';
    ctx.font = `${fontWeight} ${iconSize}px "Font Awesome 6 Free", "Font Awesome 6 Brands"`;

    ctx.fillText(iconChar, centerX, centerY);

    ctx.restore();
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const logoBtn = document.getElementById('logoBtn');
    const logoDropdown = document.getElementById('logoDropdown');
    const lineOptionsBtn = document.getElementById('lineOptionsBtn');
    const lineOptionsDropdown = document.getElementById('lineOptionsDropdown');
    const styleBtn = document.getElementById('styleBtn');
    const styleDropdown = document.getElementById('styleDropdown');
    const alignBtn = document.getElementById('alignBtn');
    const alignDropdown = document.getElementById('alignDropdown');
    const zoomBtn = document.getElementById('zoomBtn');
    const zoomDropdown = document.getElementById('zoomDropdown');
    const selectionBtn = document.getElementById('selectionBtn');
    const selectionDropdown = document.getElementById('selectionDropdown');

    if (rectangleBtn && rectangleDropdown && !rectangleBtn.contains(e.target) && !rectangleDropdown.contains(e.target)) {
        rectangleDropdown.classList.remove('active');
    }
    if (circleBtn && circleDropdown && !circleBtn.contains(e.target) && !circleDropdown.contains(e.target)) {
        circleDropdown.classList.remove('active');
    }
    if (!fontBtn.contains(e.target) && !fontDropdown.contains(e.target)) {
        fontDropdown.classList.remove('active');
    }
    if (shapeBtn && shapeDropdown && !shapeBtn.contains(e.target) && !shapeDropdown.contains(e.target)) {
        shapeDropdown.classList.remove('active');
    }
    if (iconBtn && iconDropdown && !iconBtn.contains(e.target) && !iconDropdown.contains(e.target)) {
        iconDropdown.classList.remove('active');
    }
    if (logoBtn && logoDropdown && !logoBtn.contains(e.target) && !logoDropdown.contains(e.target)) {
        logoDropdown.classList.remove('active');
    }
    if (lineOptionsBtn && lineOptionsDropdown && !lineOptionsBtn.contains(e.target) && !lineOptionsDropdown.contains(e.target)) {
        lineOptionsDropdown.classList.remove('active');
    }
    if (styleBtn && styleDropdown && !styleBtn.contains(e.target) && !styleDropdown.contains(e.target)) {
        styleDropdown.classList.remove('active');
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
    if (patternBtn && patternDropdown && !patternBtn.contains(e.target) && !patternDropdown.contains(e.target)) {
        patternDropdown.classList.remove('active');
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
                    // Also update icon color
                    if (el.type === 'icon') {
                        el.color = stylePresets[preset].stroke;
                    }
                });
                saveHistory();
            } else if (selectedElement) {
                selectedElement.strokeColor = stylePresets[preset].stroke;
                selectedElement.fillColor = stylePresets[preset].fill;
                // Also update icon color
                if (selectedElement.type === 'icon') {
                    selectedElement.color = stylePresets[preset].stroke;
                }
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
            if (rectangleDropdown) rectangleDropdown.classList.remove('active');
            if (circleDropdown) circleDropdown.classList.remove('active');
            if (shapeDropdown) shapeDropdown.classList.remove('active');
    
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
            // Also update icon color
            if (el.type === 'icon') {
                el.color = e.target.value;
            }
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

// Shadow enabled toggle - update selected element
shadowEnabledInput.addEventListener('change', (e) => {
    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            if (el.type !== 'text' && el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen') {
                el.shadow = e.target.checked;
            }
        });
        saveHistory();
        redraw();
    }
});

// Opacity slider - update selected elements
opacitySlider.addEventListener('input', (e) => {
    const opacity = parseInt(e.target.value) / 100;
    currentOpacity = opacity;
    opacityValue.textContent = e.target.value + '%';

    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
    if (elementsToUpdate.length > 0) {
        elementsToUpdate.forEach(el => {
            el.opacity = opacity;
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
    if (rectangleDropdown) rectangleDropdown.classList.remove('active');
    if (circleDropdown) circleDropdown.classList.remove('active');
    if (shapeDropdown) shapeDropdown.classList.remove('active');
    fontDropdown.classList.remove('active');
    const logoDropdown = document.getElementById('logoDropdown');
    if (logoDropdown) logoDropdown.classList.remove('active');
    const styleDropdown = document.getElementById('styleDropdown');
    if (styleDropdown) styleDropdown.classList.remove('active');
});

// Style dropdown
const styleBtn = document.getElementById('styleBtn');
const styleDropdown = document.getElementById('styleDropdown');

if (styleBtn && styleDropdown) {
    styleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        styleDropdown.classList.toggle('active');

        // Close other dropdowns
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        if (shapeDropdown) shapeDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
        lineOptionsDropdown.classList.remove('active');
        const logoDropdown = document.getElementById('logoDropdown');
        if (logoDropdown) logoDropdown.classList.remove('active');
    });

    // Listen to color changes to update button icon and swatches
    strokeColorInput.addEventListener('change', () => {
        updateColorIcons();
        addRecentColor(strokeColorInput.value);
    });
    fillColorInput.addEventListener('change', () => {
        updateColorIcons();
        addRecentColor(fillColorInput.value);
    });
    fillEnabledInput.addEventListener('change', updateColorIcons);
    textColorInput.addEventListener('change', () => {
        updateColorIcons();
        addRecentColor(textColorInput.value);
    });

    // Populate toolbar preset grid
    const toolbarPresetGrid = document.getElementById('toolbarPresetGrid');
    if (toolbarPresetGrid) {
        // Generate preset buttons dynamically
        const presetNames = Object.keys(stylePresets);
        const variants = ['', '-shadow', '-dashed', '-shadow-dashed'];

        presetNames.forEach(presetName => {
            variants.forEach(variant => {
                const presetId = presetName + variant;
                const button = document.createElement('button');
                button.className = 'preset-grid-item';
                button.dataset.preset = presetId;

                // Build title
                const parts = presetId.split('-');
                const title = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' + ');
                button.title = title;

                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('preset-preview');
                svg.setAttribute('width', '32');
                svg.setAttribute('height', '32');
                svg.setAttribute('viewBox', '0 0 24 24');

                button.appendChild(svg);
                toolbarPresetGrid.appendChild(button);
            });
        });

        // Update preset previews when opening
        styleBtn.addEventListener('click', () => {
            if (styleDropdown.classList.contains('active')) {
                updateToolbarPresetPreviews();
            }
        });

        // Handle preset clicks
        toolbarPresetGrid.querySelectorAll('.preset-grid-item').forEach(item => {
            item.addEventListener('click', () => {
                const preset = item.dataset.preset;
                const presetParts = preset.split('-');
                const basePreset = presetParts[0];
                const hasShadow = presetParts.includes('shadow');

                const presetColors = stylePresets[basePreset];
                if (presetColors) {
                    strokeColorInput.value = presetColors.stroke;
                    fillColorInput.value = presetColors.fill;
                    textColorInput.value = presetColors.stroke;
                    fillEnabledInput.checked = true;
                    shadowEnabledInput.checked = hasShadow;

                    // Update swatches
                    updateColorIcons();

                    // Update button icon
                    const btnSvg = styleBtn.querySelector('rect');
                    if (btnSvg) {
                        btnSvg.setAttribute('stroke', presetColors.stroke);
                        btnSvg.setAttribute('fill', presetColors.fill);
                    }

                    // Apply to selected elements
                    const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
                    if (elementsToUpdate.length > 0) {
                        elementsToUpdate.forEach(el => {
                            if (el.type !== 'text' && el.type !== 'line' && el.type !== 'arrow' && el.type !== 'pen') {
                                el.strokeColor = presetColors.stroke;
                                el.fillColor = presetColors.fill;
                                el.shadow = hasShadow;
                            }
                        });
                        saveHistory();
                        redraw();
                    }
                }
            });
        });
    }
}

// Update toolbar preset previews
function updateToolbarPresetPreviews() {
    const toolbarPresetGrid = document.getElementById('toolbarPresetGrid');
    if (!toolbarPresetGrid) return;

    const shapePath = getShapeSVGPath('rectangle');

    toolbarPresetGrid.querySelectorAll('.preset-grid-item').forEach(item => {
        const preset = item.dataset.preset;
        const svg = item.querySelector('.preset-preview');

        if (preset && svg) {
            const parts = preset.split('-');
            const basePreset = parts[0];
            const hasShadow = parts.includes('shadow');
            const hasDashed = parts.includes('dashed');

            const colors = stylePresets[basePreset];
            if (colors) {
                const strokeDasharray = hasDashed ? '2,2' : '';
                const filter = hasShadow ? 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' : '';

                svg.innerHTML = shapePath;
                svg.style.filter = filter;

                const shape = svg.querySelector('rect, circle, path');
                if (shape) {
                    shape.setAttribute('fill', colors.fill);
                    shape.setAttribute('stroke', colors.stroke);
                    shape.setAttribute('stroke-width', '2');
                    if (strokeDasharray) {
                        shape.setAttribute('stroke-dasharray', strokeDasharray);
                    }
                }
            }
        }
    });
}

// Update line options button icon
function updateLineOptionsButtonIcon(style, routing, thickness = 2) {
    // Get the button each time to ensure we have the latest reference
    const btn = document.getElementById('lineOptionsBtn');
    if (!btn) {
        return;
    }

    const btnSvg = btn.querySelector('svg');
    if (!btnSvg) {
        return;
    }

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

// Line type conversion (line <-> arrow)
document.querySelectorAll('.line-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lineType = btn.dataset.lineType;

        // Update button states
        document.querySelectorAll('.line-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update current tool for future drawing
        if (currentTool === 'line' || currentTool === 'arrow') {
            currentTool = lineType;
        }

        // Convert selected lines/arrows
        const elementsToUpdate = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);
        if (elementsToUpdate.length > 0) {
            let convertedCount = 0;
            elementsToUpdate.forEach(el => {
                if (el.type === 'line' || el.type === 'arrow') {
                    el.type = lineType;
                    convertedCount++;
                }
            });

            if (convertedCount > 0) {
                saveHistory();
                redraw();
            }
        }

        // Don't close dropdown - let user continue selecting options
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
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        if (shapeDropdown) shapeDropdown.classList.remove('active');
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
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        if (shapeDropdown) shapeDropdown.classList.remove('active');
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

// Background pattern controls
let currentBackgroundPattern = 'line-grid'; // default
let lastNonBlankPattern = 'line-grid'; // for toggling with G key
const patternBtn = document.getElementById('patternBtn');
const patternDropdown = document.getElementById('patternDropdown');

if (patternBtn && patternDropdown) {
    patternBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        patternDropdown.classList.toggle('active');

        // Close other dropdowns
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        if (shapeDropdown) shapeDropdown.classList.remove('active');
        fontDropdown.classList.remove('active');
        lineOptionsDropdown.classList.remove('active');
        const logoDropdown = document.getElementById('logoDropdown');
        if (logoDropdown) logoDropdown.classList.remove('active');
        const alignDropdown = document.getElementById('alignDropdown');
        if (alignDropdown) alignDropdown.classList.remove('active');
        const zoomDropdown = document.getElementById('zoomDropdown');
        if (zoomDropdown) zoomDropdown.classList.remove('active');
        const iconDropdown = document.getElementById('iconDropdown');
        if (iconDropdown) iconDropdown.classList.remove('active');
        const selectionDropdown = document.getElementById('selectionDropdown');
        if (selectionDropdown) selectionDropdown.classList.remove('active');
    });

    // Event listeners for pattern buttons
    document.querySelectorAll('.pattern-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pattern = btn.dataset.pattern;
            currentBackgroundPattern = pattern;
            if (pattern !== 'blank') {
                lastNonBlankPattern = pattern;
            }
            patternDropdown.classList.remove('active');
            redraw();
        });
    });
}

// Selection controls dropdown
const selectionBtn = document.getElementById('selectionBtn');
const selectionDropdown = document.getElementById('selectionDropdown');

if (selectionBtn && selectionDropdown) {
    selectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectionDropdown.classList.toggle('active');

        // Close other dropdowns
        if (rectangleDropdown) rectangleDropdown.classList.remove('active');
        if (circleDropdown) circleDropdown.classList.remove('active');
        if (shapeDropdown) shapeDropdown.classList.remove('active');
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

        // Check if it's a diagram template first (multi-element)
        if (diagramTemplates[templateName]) {
            insertTemplate(templateName);
            return;
        }

        // Otherwise treat as shape template (single element)
        const template = templates[templateName];
        if (template) {
            // Get current colors
            const currentStroke = strokeColorInput.value;
            const currentFill = fillEnabledInput.checked ? fillColorInput.value : null;

            // Create shape at temporary position (layout will reposition)
            const element = {
                ...template,
                id: nextElementId++,
                x: 50,
                y: 50,
                strokeColor: currentStroke,
                fillColor: currentFill,
                shadow: shadowEnabledInput.checked,
                lineStyle: currentLineStyle,
                lineThickness: currentLineThickness
            };
            elements.push(element);
            lastCreatedShape = element; // Track for 'M' key duplication
            duplicationDirection = null; // Reset direction for new shape

            // Only auto-layout if user hasn't manually moved shapes yet
            if (!userHasMovedShapes) {
                layoutShapesWithColors(currentStroke, currentFill);
            }

            saveHistory();
            redraw();

            // No auto-text for templates - user can double-click to add text
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

    // Prevent browser default for all our Ctrl/Cmd shortcuts early
    if (e.ctrlKey || e.metaKey) {
        if (['a', 'c', 'v', 'd', 'z', 'l'].includes(key)) {
            e.preventDefault();
        }
    }

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

        // Deactivate format painter if active
        if (isFormatPainterActive) {
            deactivateFormatPainter();
            e.preventDefault();
            return;
        }
    }

    // Quick create shortcuts (Shift + number keys)
    // Note: e.key when Shift is pressed gives us '!', '@', etc. so we use e.code
    if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const quickCreateMap = {
            'Digit1': 'rectangle',
            'Digit2': 'circle',
            'Digit3': 'diamond',
            'Digit4': 'parallelogram',
            'Digit5': 'roundRect',
            'Digit6': 'triangle',
            'Digit7': 'hexagon',
            'Digit8': 'line',
            'Digit9': 'arrow',
            'Digit0': 'text'
        };

        if (quickCreateMap[e.code]) {
            const shapeType = quickCreateMap[e.code];

            // Update the style for this shape type with current toolbar values before creating
            if (shapeType !== 'text') {
                lastUsedStyles[shapeType] = {
                    strokeColor: strokeColorInput.value,
                    fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                    fillEnabled: fillEnabledInput.checked,
                    shadow: shadowEnabledInput.checked,
                    lineStyle: currentLineStyle,
                    lineThickness: currentLineThickness,
                    lineRouting: currentLineRouting
                };
            } else {
                lastUsedStyles[shapeType] = {
                    textColor: textColorInput.value,
                    fontFamily: selectedFont,
                    fontSize: parseInt(fontSizeSelect.value),
                    bold: isBold,
                    italic: isItalic
                };
            }

            // Use quick create with current format for all types
            quickCreateShape(shapeType);
            e.preventDefault();
            return;
        }
    }

    // 'c' key enters connect mode for drawing arrows between selected elements
    if (key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        isConnectMode = true;
        currentTool = 'select';
        isRectangleSelecting = false;
        selectionRect = null;
        canvas.style.cursor = 'crosshair';
        redraw();
        return;
    }

    // 'g' key toggles pattern
    if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        // G toggles between blank and last selected pattern
        if (currentBackgroundPattern === 'blank') {
            currentBackgroundPattern = lastNonBlankPattern;
        } else {
            currentBackgroundPattern = 'blank';
        }
        redraw();
        e.preventDefault();
        return;
    }

    // 'r' key with Shift toggles rulers (lowercase since we check shift)
    if (key === 'r' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        showRulers = !showRulers;
        redraw();
        e.preventDefault();
        return;
    }

    // 'p' key with Shift activates format painter
    if (key === 'p' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const now = Date.now();
        const isDoublePress = (now - formatPainterLastClick) < 300;
        formatPainterLastClick = now;
        toggleFormatPainter(isDoublePress);
        e.preventDefault();
        return;
    }

    // Modifier key shortcuts - check these BEFORE single-key shortcuts
    // Undo (Cmd/Ctrl+Z)
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
        undo();
        e.preventDefault();
        return;
    }

    // Redo (Cmd/Ctrl+Y)
    if ((e.ctrlKey || e.metaKey) && key === 'y') {
        redo();
        e.preventDefault();
        return;
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

    // Save (Cmd/Ctrl+S)
    if ((e.ctrlKey || e.metaKey) && key === 's') {
        const exportBtn = document.getElementById('exportJSON');
        if (exportBtn) exportBtn.click();
        e.preventDefault();
        return;
    }

    // Open/Load (Cmd/Ctrl+O)
    if ((e.ctrlKey || e.metaKey) && key === 'o') {
        const importBtn = document.getElementById('importJSON');
        if (importBtn) importBtn.click();
        e.preventDefault();
        return;
    }

    // Export Image (Cmd/Ctrl+E)
    if ((e.ctrlKey || e.metaKey) && key === 'e') {
        const exportImageBtn = document.getElementById('exportImage');
        if (exportImageBtn) exportImageBtn.click();
        e.preventDefault();
        return;
    }

    // Settings (Cmd/Ctrl+,)
    if ((e.ctrlKey || e.metaKey) && key === ',') {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.click();
        e.preventDefault();
        return;
    }

    // Single-key tool shortcuts
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

    // 'M' key duplicates the last created shape
    if (key === 'm' && lastCreatedShape) {
        duplicateLastShape();
        e.preventDefault();
        return;
    }

    // 'I' key opens eyedropper/color picker
    if (key === 'i' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (window.EyeDropper && eyeDropperBtn && !eyeDropperBtn.disabled) {
            eyeDropperBtn.click();
            e.preventDefault();
        }
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

                                // Use stored anchor points if available
                                let fromPoint, toPoint;
                                if (connector.startAnchor && connector.endAnchor) {
                                    const startAnchors = getAnchorPoints(startBounds, startShape.type);
                                    const endAnchors = getAnchorPoints(endBounds, endShape.type);
                                    fromPoint = startAnchors[connector.startAnchor];
                                    toPoint = endAnchors[connector.endAnchor];
                                } else {
                                    // Fallback to directional connection for old arrows
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
                                        fromPoint = connectionPoints.from;
                                        toPoint = connectionPoints.to;
                                    }
                                }

                                if (fromPoint && toPoint) {
                                    connector.x = fromPoint.x;
                                    connector.y = fromPoint.y;
                                    connector.width = toPoint.x - fromPoint.x;
                                    connector.height = toPoint.y - fromPoint.y;
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
            // Delete all selected elements and their child text
            const deletedIds = new Set(selectedElements.map(el => el.id).filter(id => id));
            elements = elements.filter(el =>
                !selectedElements.includes(el) &&
                !(el.type === 'text' && el.parentId && deletedIds.has(el.parentId))
            );
            selectedElements = [];
            selectedElement = null;
            saveHistory();
            redraw();
            e.preventDefault();
        } else if (selectedElement) {
            // Delete single selected element and its child text
            const deletedId = selectedElement.id;
            elements = elements.filter(el =>
                el !== selectedElement &&
                !(el.type === 'text' && el.parentId && el.parentId === deletedId)
            );
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

    // Create a set of IDs for the elements being copied
    const copiedIds = new Set(elementsToCopy.map(el => el.id).filter(id => id));

    // Find all child text elements that belong to the copied elements
    const childTextElements = elements.filter(el =>
        el.type === 'text' && el.parentId && copiedIds.has(el.parentId)
    );

    // Copy both the selected elements and their child text
    clipboard = [...elementsToCopy, ...childTextElements].map(el => ({...el}));
}

// Copy selection as image to clipboard
async function copyAsImage() {
    const elementsToCopy = selectedElements.length > 0
        ? selectedElements
        : (selectedElement ? [selectedElement] : []);

    if (elementsToCopy.length === 0) return;

    // Calculate bounding box of selected elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elementsToCopy.forEach(el => {
        const bounds = getElementBounds(el);
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    // Add padding
    const padding = 20;
    minX -= padding;
    minY -= padding;
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    // Create temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw white background
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, width, height);

    // Save current context and create temporary one
    const savedCtx = ctx;
    window.ctx = tempCtx;

    // Translate to account for bounding box offset
    tempCtx.translate(-minX, -minY);

    // Draw each element
    elementsToCopy.forEach(el => {
        drawElement(el);
    });

    // Restore context
    window.ctx = savedCtx;

    // Convert to blob and copy to clipboard
    try {
        const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));

        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            console.log('Image copied to clipboard');
        } else {
            throw new Error('Clipboard API not supported');
        }
    } catch (err) {
        console.error('Clipboard API failed, using download fallback:', err);

        // Fallback: Download the image
        const url = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'andraw-selection.png';
        link.href = url;
        link.click();

        // Show a helpful message
        setTimeout(() => {
            alert('Your browser doesn\'t support copying images to clipboard.\nThe image has been downloaded instead.');
        }, 100);
    }
}

// Paste elements from clipboard
function pasteSelection() {
    if (clipboard.length === 0) return;

    // Calculate centroid of clipboard elements
    let sumX = 0, sumY = 0;
    clipboard.forEach(el => {
        sumX += el.x;
        sumY += el.y;
    });
    const centroidX = sumX / clipboard.length;
    const centroidY = sumY / clipboard.length;

    // Calculate offset to paste at cursor location
    let offsetX = lastMouseX - centroidX;
    let offsetY = lastMouseY - centroidY;

    const idMap = new Map(); // Maps old IDs to new IDs for parent references
    const pastedElements = [];

    clipboard.forEach(el => {
        const newElement = {
            ...el,
            id: nextElementId++,
            x: el.x + offsetX,
            y: el.y + offsetY
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

    // Create a set of IDs for the elements being duplicated
    const duplicatedIds = new Set(elementsToDuplicate.map(el => el.id).filter(id => id));

    // Find all child text elements that belong to the duplicated elements
    const childTextElements = elements.filter(el =>
        el.type === 'text' && el.parentId && duplicatedIds.has(el.parentId)
    );

    // Combine selected elements and their child text
    const allElementsToDuplicate = [...elementsToDuplicate, ...childTextElements];

    const duplicateOffset = 20;
    const idMap = new Map();
    const duplicatedElements = [];

    allElementsToDuplicate.forEach(el => {
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

    // Switch to select tool without triggering click event
    currentTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.classList.add('active');

    redraw();
}

// Select elements by type
function selectByType(type) {
    selectedElements = elements.filter(el => el.type === type && !el.locked);
    selectedElement = null;

    // Switch to select tool without triggering click event
    currentTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.classList.add('active');

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

function addSageShape(shapeType) {
    // Use provided shape type or last created or default to rectangle
    if (!shapeType) {
        shapeType = lastCreatedShape?.type || 'rectangle';
    }

    // Only work with fillable shapes
    if (shapeType === 'line' || shapeType === 'arrow' || shapeType === 'pen' || shapeType === 'text') {
        return;
    }

    // Sage color scheme
    const sageStroke = '#556B2F';
    const sageFill = '#D8E4BC';

    // Standard shape size
    const shapeWidth = 100;
    const shapeHeight = 80;

    // Create new shape at temporary position (layout will reposition)
    const newShape = {
        type: shapeType,
        id: nextElementId++,
        x: 50,
        y: 50,
        width: shapeWidth,
        height: shapeHeight,
        strokeColor: sageStroke,
        fillColor: sageFill
    };

    elements.push(newShape);

    // If last created shape had associated text, copy it with same text
    if (lastCreatedShape) {
        const associatedText = elements.find(el =>
            el.type === 'text' && el.parentId === lastCreatedShape.id
        );

        if (associatedText) {
            // Create centered text for new shape
            const newText = {
                ...associatedText,
                id: nextElementId++,
                parentId: newShape.id,
                x: newShape.x + shapeWidth / 2,
                y: newShape.y + shapeHeight / 2
                // Keep the same text (don't increment)
            };

            elements.push(newText);
        }
    }

    lastCreatedShape = newShape;

    // Apply horizontal layout to arrange only sage shapes
    layoutSageShapes();

    saveHistory();
    redraw();
}

// Generic layout function for shapes with specific colors
function layoutShapesWithColors(strokeColor, fillColor) {
    // Get shapes matching the specified colors
    const matchingShapes = elements.filter(el =>
        el.strokeColor === strokeColor &&
        el.fillColor === fillColor &&
        el.type !== 'line' &&
        el.type !== 'arrow' &&
        el.type !== 'text'
    );

    if (matchingShapes.length === 0) return;

    const spacing = 20;
    const sideMargin = 50;
    const canvasWidth = canvas.width - sideMargin * 2;
    const canvasHeight = canvas.height;

    // Sort by creation order (ID) to keep new shapes at the end
    matchingShapes.sort((a, b) => (a.id || 0) - (b.id || 0));

    // First pass: group shapes into rows
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    matchingShapes.forEach((shape, index) => {
        const shapeWidth = Math.abs(shape.width || 100);
        const shapeHeight = Math.abs(shape.height || 80);

        // Check if shape fits on current row
        if (currentRowWidth + shapeWidth > canvasWidth && currentRow.length > 0) {
            rows.push(currentRow);
            currentRow = [];
            currentRowWidth = 0;
        }

        currentRow.push(shape);
        currentRowWidth += shapeWidth + (currentRow.length > 1 ? spacing : 0);
    });

    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    // Calculate total height needed
    const totalHeight = rows.reduce((sum, row, i) => {
        const rowHeight = Math.max(...row.map(s => Math.abs(s.height || 80)));
        return sum + rowHeight + (i > 0 ? spacing : 0);
    }, 0);

    // Start from vertical center
    let currentY = (canvasHeight - totalHeight) / 2;

    // Second pass: position shapes
    rows.forEach((row) => {
        const rowHeight = Math.max(...row.map(s => Math.abs(s.height || 80)));

        // Calculate row width
        const rowWidth = row.reduce((sum, shape, i) => {
            return sum + Math.abs(shape.width || 100) + (i > 0 ? spacing : 0);
        }, 0);

        // Center row horizontally
        let currentX = (canvas.width - rowWidth) / 2;

        row.forEach((shape) => {
            const shapeWidth = Math.abs(shape.width || 100);
            const shapeHeight = Math.abs(shape.height || 80);

            // Position shape
            const deltaX = currentX - shape.x;
            const deltaY = currentY - shape.y;
            shape.x = currentX;
            shape.y = currentY;

            // Move and center associated text elements
            elements.forEach(el => {
                if (el.type === 'text' && el.parentId === shape.id) {
                    // Center text on shape
                    el.x = shape.x + shapeWidth / 2;
                    el.y = shape.y + shapeHeight / 2;
                }
            });

            currentX += shapeWidth + spacing;
        });

        currentY += rowHeight + spacing;
    });
}

function layoutSageShapes() {
    const sageStroke = '#556B2F';
    const sageFill = '#D8E4BC';

    // Use the generic layout function with sage colors
    layoutShapesWithColors(sageStroke, sageFill);
}

function duplicateLastShape() {
    if (!lastCreatedShape) return;

    // Find any text element associated with the last created shape (for shapes with labels)
    const associatedText = elements.find(el =>
        el.type === 'text' && el.parentId === lastCreatedShape.id
    );

    // Determine direction only on first duplication, then keep consistent
    if (!duplicationDirection) {
        // Determine if element is centered horizontally and near top
        const elementCenterX = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 0) / 2;
        const isCentered = Math.abs(elementCenterX - canvas.width / 2) < canvas.width * 0.15; // Within 15% of center
        const isNearTop = lastCreatedShape.y < canvas.height * 0.3; // In top 30%

        duplicationDirection = (isCentered && isNearTop) ? 'vertical' : 'horizontal';
    }

    const shouldPlaceVertically = duplicationDirection === 'vertical';

    // Calculate spacing based on element size
    const spacing = 20;

    // Create duplicate element
    const newElement = {
        ...lastCreatedShape,
        id: nextElementId++
    };

    // Handle different element types
    if (lastCreatedShape.type === 'text') {
        // For text, use approximate height based on font size
        const textHeight = lastCreatedShape.fontSize || 16;
        if (shouldPlaceVertically) {
            newElement.y = lastCreatedShape.y + textHeight * 1.5 + spacing;
        } else {
            // For text, estimate width or just offset by fixed amount
            newElement.x = lastCreatedShape.x + 100 + spacing;
        }
    } else if (lastCreatedShape.type === 'pen') {
        // For pen paths, offset the entire path
        if (shouldPlaceVertically) {
            const bounds = getElementBounds(lastCreatedShape);
            newElement.points = lastCreatedShape.points.map(p => ({
                x: p.x,
                y: p.y + bounds.height + spacing
            }));
        } else {
            const bounds = getElementBounds(lastCreatedShape);
            newElement.points = lastCreatedShape.points.map(p => ({
                x: p.x + bounds.width + spacing,
                y: p.y
            }));
        }
    } else if (lastCreatedShape.type === 'line' || lastCreatedShape.type === 'arrow') {
        // For lines and arrows, offset both endpoints
        const lineHeight = Math.abs(lastCreatedShape.height || 100);
        const lineWidth = Math.abs(lastCreatedShape.width || 100);
        if (shouldPlaceVertically) {
            newElement.y = lastCreatedShape.y + lineHeight + spacing;
        } else {
            newElement.x = lastCreatedShape.x + lineWidth + spacing;
        }
    } else {
        // For shapes with width/height (rectangle, circle, icon, etc.)
        if (shouldPlaceVertically) {
            // Place below
            newElement.y = lastCreatedShape.y + Math.abs(lastCreatedShape.height || 100) + spacing;
        } else {
            // Place to the right
            newElement.x = lastCreatedShape.x + Math.abs(lastCreatedShape.width || 100) + spacing;
        }
    }

    elements.push(newElement);

    // If there was associated text, duplicate it too
    if (associatedText) {
        const deltaX = newElement.x - lastCreatedShape.x;
        const deltaY = newElement.y - lastCreatedShape.y;

        const newText = {
            ...associatedText,
            id: nextElementId++,
            parentId: newElement.id,
            x: associatedText.x + deltaX,
            y: associatedText.y + deltaY,
            text: `Thing ${thingCounter++}` // Auto-increment text
        };

        elements.push(newText);
    }

    lastCreatedShape = newElement; // Update to new element for chaining
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

    // Store mouse position for paste location
    lastMouseX = x;
    lastMouseY = y;

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
    document.getElementById('contextCopyAsImage').style.display = hasSelection ? 'flex' : 'none';
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

document.getElementById('contextCopyAsImage')?.addEventListener('click', () => {
    copyAsImage();
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
        // Delete all selected elements and their child text
        const deletedIds = new Set(selectedElements.map(el => el.id).filter(id => id));
        elements = elements.filter(el =>
            !selectedElements.includes(el) &&
            !(el.type === 'text' && el.parentId && deletedIds.has(el.parentId))
        );
        selectedElements = [];
        selectedElement = null;
    } else if (selectedElement) {
        // Delete single selected element and its child text
        const deletedId = selectedElement.id;
        elements = elements.filter(el =>
            el !== selectedElement &&
            !(el.type === 'text' && el.parentId && el.parentId === deletedId)
        );
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

    // Get IDs of elements being moved
    const movedIds = new Set(elementsToMove.map(el => el.id).filter(id => id));

    // Find child text elements
    const childTextElements = elements.filter(el =>
        el.type === 'text' && el.parentId && movedIds.has(el.parentId)
    );

    // Move both parent elements and their child text
    const allElementsToMove = [...elementsToMove, ...childTextElements];

    allElementsToMove.forEach(el => {
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

    // Get IDs of elements being moved
    const movedIds = new Set(elementsToMove.map(el => el.id).filter(id => id));

    // Find child text elements
    const childTextElements = elements.filter(el =>
        el.type === 'text' && el.parentId && movedIds.has(el.parentId)
    );

    // Move both parent elements and their child text
    const allElementsToMove = [...elementsToMove, ...childTextElements];

    // Move to back in reverse order to maintain relative order
    allElementsToMove.reverse().forEach(el => {
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

    // Check if double-clicked on a standalone text element first (not child text)
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (element.type === 'text' && !element.parentId) {
            const bounds = getElementBounds(element);
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                // Found standalone text element - make it editable
                editTextElement(element);
                return;
            }
        }
    }

    // Check if double-clicked on an arrow or line
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        if (element.type === 'arrow' || element.type === 'line') {
            const bounds = getElementBounds(element);
            // More generous hit detection for lines/arrows
            const hitPadding = 10;
            if (x >= bounds.x - hitPadding && x <= bounds.x + bounds.width + hitPadding &&
                y >= bounds.y - hitPadding && y <= bounds.y + bounds.height + hitPadding) {
                // Found an arrow/line - check if it has child text
                const childText = elements.find(el => el.type === 'text' && el.parentId === element.id);

                if (childText) {
                    // Edit existing child text
                    editTextElement(childText);
                } else {
                    // Create new label for this connector
                    const midX = element.x + element.width / 2;
                    const midY = element.y + element.height / 2;
                    createTextInputForConnector(midX, midY, element);
                }
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

    // Check if this text has a parent (shape or connector)
    const hasParent = textElement.parentId !== undefined;

    if (hasParent && textElement.parentId) {
        const parent = elements.find(el => el.id === textElement.parentId);

        if (parent && (parent.type === 'arrow' || parent.type === 'line')) {
            // Determine label position based on connector type
            let labelX, labelY, defaultOffsetX = 0, defaultOffsetY = 0;

            if (parent.lineRouting === 'stepped') {
                const x1 = parent.x;
                const y1 = parent.y;
                const x2 = parent.x + parent.width;
                const y2 = parent.y + parent.height;
                const absWidth = Math.abs(parent.width);
                const absHeight = Math.abs(parent.height);

                if (absWidth > absHeight) {
                    labelX = (x1 + x2) / 2;
                    labelY = y1;
                    defaultOffsetY = -20;
                } else {
                    labelX = x1;
                    labelY = (y1 + y2) / 2;
                    defaultOffsetX = 25;
                }
            } else {
                const absWidth = Math.abs(parent.width);
                const absHeight = Math.abs(parent.height);
                labelX = parent.x + parent.width / 2;
                labelY = parent.y + parent.height / 2;

                if (absWidth > absHeight) {
                    defaultOffsetY = -20;
                } else {
                    defaultOffsetX = 25;
                }
            }

            const offsetX = textElement.offsetX !== undefined ? textElement.offsetX : defaultOffsetX;
            const offsetY = textElement.offsetY !== undefined ? textElement.offsetY : defaultOffsetY;

            input.style.textAlign = 'center';
            input.style.left = (rect.left + panOffsetX + (labelX + offsetX) * zoomLevel - 50) + 'px';
            input.style.top = (rect.top + panOffsetY + (labelY + offsetY) * zoomLevel - 12) + 'px';
            input.style.width = '100px';
        } else if (parent) {
            // Shape text - center on shape
            input.style.textAlign = 'center';

            const shapeWidth = Math.abs(parent.width || 100);
            const centerX = parent.x + shapeWidth / 2;
            const centerY = parent.y + Math.abs(parent.height || 100) / 2;

            // Position textarea centered on shape
            const inputWidth = shapeWidth * 0.9;
            input.style.left = (rect.left + panOffsetX + (centerX - inputWidth / 2) * zoomLevel) + 'px';
            input.style.top = (rect.top + panOffsetY + (centerY - 12) * zoomLevel) + 'px';
            input.style.width = (inputWidth * zoomLevel) + 'px';
        } else {
            // Parent not found - fallback
            input.style.left = (rect.left + panOffsetX + textElement.x * zoomLevel) + 'px';
            input.style.top = (rect.left + panOffsetY + textElement.y * zoomLevel) + 'px';
            input.style.width = '150px';
        }
    } else {
        // Regular text (no parent)
        input.style.left = (rect.left + panOffsetX + textElement.x * zoomLevel) + 'px';
        input.style.top = (rect.top + panOffsetY + textElement.y * zoomLevel) + 'px';
        input.style.minWidth = '200px';
    }

    input.style.fontFamily = textElement.fontFamily || 'Comic Sans MS, cursive';
    input.style.fontSize = (textElement.fontSize || 16) + 'px';
    input.style.fontWeight = textElement.bold ? 'bold' : 'normal';
    input.style.fontStyle = textElement.italic ? 'italic' : 'normal';
    input.style.color = textElement.textColor || textElement.strokeColor;
    input.value = textElement.text;
    input.rows = 1;
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

            // For shape text, position is calculated dynamically during draw
            // so we don't need to update x,y coordinates here

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
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Handle ruler interactions (create guides by dragging from rulers)
    if (showRulers && currentTool === 'select') {
        // Check if clicking on vertical ruler (left side)
        if (screenX < RULER_SIZE && screenY >= RULER_SIZE) {
            isDraggingFromRuler = true;
            draggingGuide = {
                type: 'horizontal',
                position: (screenY - panOffsetY) / zoomLevel
            };
            canvas.style.cursor = 'ns-resize';
            return;
        }
        // Check if clicking on horizontal ruler (top side)
        if (screenY < RULER_SIZE && screenX >= RULER_SIZE) {
            isDraggingFromRuler = true;
            draggingGuide = {
                type: 'vertical',
                position: (screenX - panOffsetX) / zoomLevel
            };
            canvas.style.cursor = 'ew-resize';
            return;
        }

        // Check if clicking on existing guide to drag it
        const canvasX = (screenX - panOffsetX) / zoomLevel;
        const canvasY = (screenY - panOffsetY) / zoomLevel;
        const threshold = 5 / zoomLevel;

        for (let i = 0; i < guides.length; i++) {
            const guide = guides[i];
            if (guide.type === 'vertical' && Math.abs(guide.position - canvasX) < threshold) {
                draggingGuide = guide;
                canvas.style.cursor = 'ew-resize';
                return;
            }
            if (guide.type === 'horizontal' && Math.abs(guide.position - canvasY) < threshold) {
                draggingGuide = guide;
                canvas.style.cursor = 'ns-resize';
                return;
            }
        }
    }

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

    // Snap to anchor point for arrows and lines
    let startShape = null;
    let startAnchor = null;
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestAnchorPoint(x, y);
        if (snapped) {
            x = snapped.point.x;
            y = snapped.point.y;
            startShape = snapped.shape;
            startAnchor = snapped.anchor;
        }
    }

    startX = x;
    startY = y;
    // Store start shape and anchor for later use in mouseup
    window.tempStartShape = startShape;
    window.tempStartAnchor = startAnchor;

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

        // Check if clicking on bend point handle for stepped arrows/lines
        const bendHandle = getBendPointHandle(startX, startY);
        if (bendHandle) {
            dragMode = 'bend';
            isDrawing = true;
            return;
        }

        // Check if clicking on element
        const clickedElement = getElementAtPoint(startX, startY);
        if (clickedElement) {
            // If format painter is active, apply format
            if (isFormatPainterActive) {
                applyFormat(clickedElement);
                saveHistory();
                // Only deactivate if not in multi-apply mode
                if (!formatPainterMultiApply) {
                    deactivateFormatPainter();
                }
                redraw();
                return;
            }

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
                // For icons, use the color property for stroke color picker
                if (selectedElement.type === 'icon' && selectedElement.color) {
                    strokeColorInput.value = selectedElement.color;
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
            const penElement = {
                id: nextElementId++,
                type: 'pen',
                points: [{x: startX, y: startY}],
                strokeColor: strokeColorInput.value,
                lineStyle: currentLineStyle,
                lineThickness: currentLineThickness
            };
            elements.push(penElement);
            // Will set lastCreatedShape when pen finishes (on mouseup)
            window.tempPenElement = penElement;
        }
    }
}

function handleMouseMove(e) {
    // Handle ruler guide dragging
    if (draggingGuide) {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (draggingGuide.type === 'vertical') {
            draggingGuide.position = (screenX - panOffsetX) / zoomLevel;
        } else {
            draggingGuide.position = (screenY - panOffsetY) / zoomLevel;
        }

        redraw();
        return;
    }

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

    // Track mouse position for paste location
    lastMouseX = currentX;
    lastMouseY = currentY;

    if (!isDrawing) {
        // Update cursor based on hover
        if (currentTool === 'select') {
            const handle = getResizeHandle(currentX, currentY);
            const bendHandle = getBendPointHandle(currentX, currentY);
            if (handle) {
                canvas.style.cursor = handle.cursor;
            } else if (bendHandle) {
                canvas.style.cursor = 'move';
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
            let dx = currentX - startX;
            let dy = currentY - startY;

            // Get dragging elements
            const draggingElements = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);

            // Apply smart guide snapping
            if (draggingElements.length > 0) {
                const snapped = applySmartGuideSnapping(draggingElements, dx, dy);
                dx = snapped.dx;
                dy = snapped.dy;

                // Find and store smart guides for visual feedback
                // Temporarily move elements to check alignment
                const originalPositions = [];
                draggingElements.forEach(el => {
                    if (el.type === 'pen') {
                        originalPositions.push({ el, points: [...el.points] });
                    } else {
                        originalPositions.push({ el, x: el.x, y: el.y });
                    }
                });

                // Temporarily apply movement to find guides
                const selectedIds = new Set(draggingElements.map(el => el.id).filter(id => id));
                draggingElements.forEach(el => {
                    if (el.type === 'text' && el.parentId && selectedIds.has(el.parentId)) {
                        return;
                    }
                    if (el.type === 'pen') {
                        el.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                    } else {
                        el.x += dx;
                        el.y += dy;
                    }
                });

                smartGuides = findSmartGuides(draggingElements);

                // Restore original positions
                originalPositions.forEach(({ el, x, y, points }) => {
                    if (points) {
                        el.points = points;
                    } else {
                        el.x = x;
                        el.y = y;
                    }
                });
            } else {
                smartGuides = [];
            }

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

            startX = currentX;
            startY = currentY;
            redraw();
        } else if (dragMode === 'resize' && selectedElement) {
            resizeElement(selectedElement, currentX, currentY, resizeHandle);
            redraw();
        } else if (dragMode === 'bend' && selectedElement) {
            // Update bend point for stepped arrow/line
            const x1 = selectedElement.x;
            const y1 = selectedElement.y;
            const x2 = selectedElement.x + selectedElement.width;
            const y2 = selectedElement.y + selectedElement.height;

            // Determine bend point constraints based on anchor information
            if (selectedElement.startAnchor && selectedElement.endAnchor) {
                const startIsHorizontal = selectedElement.startAnchor === 'left' || selectedElement.startAnchor === 'right';
                const endIsHorizontal = selectedElement.endAnchor === 'left' || selectedElement.endAnchor === 'right';

                if (startIsHorizontal && endIsHorizontal) {
                    // Both horizontal - allow x movement, keep y at start
                    selectedElement.bendPoint = { x: currentX, y: y1 };
                } else if (!startIsHorizontal && !endIsHorizontal) {
                    // Both vertical - allow y movement, keep x at start
                    selectedElement.bendPoint = { x: x1, y: currentY };
                } else if (startIsHorizontal && !endIsHorizontal) {
                    // Start horizontal, end vertical - allow x movement of the turn point
                    selectedElement.bendPoint = { x: currentX, y: y1 };
                } else {
                    // Start vertical, end horizontal - allow y movement of the turn point
                    selectedElement.bendPoint = { x: x1, y: currentY };
                }
            } else {
                // Fallback to old logic
                const dx = Math.abs(x2 - x1);
                const dy = Math.abs(y2 - y1);

                if (dx > dy) {
                    selectedElement.bendPoint = { x: currentX, y: y1 };
                } else {
                    selectedElement.bendPoint = { x: x1, y: currentY };
                }
            }
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
    // Handle ruler guide dragging end
    if (draggingGuide) {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // If dragging from ruler and releasing on canvas, add permanent guide
        if (isDraggingFromRuler) {
            // Check if releasing outside ruler area (on canvas)
            const outsideRuler = (draggingGuide.type === 'vertical' && screenY >= RULER_SIZE) ||
                                 (draggingGuide.type === 'horizontal' && screenX >= RULER_SIZE);

            if (outsideRuler) {
                guides.push(draggingGuide);
            }
            isDraggingFromRuler = false;
        } else {
            // Dragging existing guide - check if releasing back on ruler to delete
            const onRuler = (draggingGuide.type === 'vertical' && screenY < RULER_SIZE) ||
                           (draggingGuide.type === 'horizontal' && screenX < RULER_SIZE);

            if (onRuler) {
                // Remove guide
                guides = guides.filter(g => g !== draggingGuide);
            }
        }

        draggingGuide = null;
        canvas.style.cursor = 'default';
        redraw();
        return;
    }

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

    // Snap endpoint to anchor point for arrows and lines
    let endShape = null;
    let endAnchor = null;
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestAnchorPoint(endX, endY);
        if (snapped) {
            endX = snapped.point.x;
            endY = snapped.point.y;
            endShape = snapped.shape;
            endAnchor = snapped.anchor;
        }
    }

    if (currentTool !== 'select' && currentTool !== 'pen' && currentTool !== 'text') {
        const width = endX - startX;
        const height = endY - startY;

        if (Math.abs(width) > 5 || Math.abs(height) > 5) {
            const element = {
                id: nextElementId++,
                type: currentTool,
                x: startX,
                y: startY,
                width: width,
                height: height,
                strokeColor: strokeColorInput.value,
                fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                shadow: shadowEnabledInput.checked,
                lineStyle: currentLineStyle,
                lineRouting: (currentTool === 'line' || currentTool === 'arrow') ? currentLineRouting : undefined,
                lineThickness: currentLineThickness,
                opacity: currentOpacity
            };

            // Add icon-specific properties
            if (currentTool === 'icon') {
                element.iconClass = selectedIconClass;
                element.color = textColorInput.value;
            }

            // Store connection information for arrows and lines
            if (currentTool === 'arrow' || currentTool === 'line') {
                const startShape = window.tempStartShape;
                const startAnchor = window.tempStartAnchor;
                if (startShape && startShape.id) {
                    element.startShapeId = startShape.id;
                    element.startAnchor = startAnchor;
                }
                if (endShape && endShape.id) {
                    element.endShapeId = endShape.id;
                    element.endAnchor = endAnchor;
                }
            }

            elements.push(element);
            lastCreatedShape = element; // Track for 'M' key duplication
            duplicationDirection = null; // Reset direction for new shape
            updateLastUsedStyle(currentTool); // Track style for this shape type
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

    // Save history after move/resize/bend operations
    if (dragMode === 'move' || dragMode === 'resize' || dragMode === 'bend') {
        // Track that user has manually moved shapes (disables auto-layout)
        if (dragMode === 'move') {
            userHasMovedShapes = true;
        }
        saveHistory();
    }

    // Save history after pen tool finishes drawing
    if (currentTool === 'pen' && isDrawing) {
        if (window.tempPenElement) {
            lastCreatedShape = window.tempPenElement;
            duplicationDirection = null;
            window.tempPenElement = null;
        }
        saveHistory();
    }

    isDrawing = false;
    dragMode = null;
    resizeHandle = null;
    smartGuides = []; // Clear smart guides when drag ends
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
            // Check if shapes are aligned on the same plane
            const ALIGNMENT_THRESHOLD = 20; // pixels
            const isAlignedHorizontally = Math.abs(connectionPoints.from.y - connectionPoints.to.y) < ALIGNMENT_THRESHOLD;
            const isAlignedVertically = Math.abs(connectionPoints.from.x - connectionPoints.to.x) < ALIGNMENT_THRESHOLD;

            // Auto-use stepped routing if shapes are not aligned on the same plane
            let routing = currentLineRouting;
            if (!isAlignedHorizontally && !isAlignedVertically) {
                routing = 'stepped';
            }

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
                lineRouting: routing,
                lineThickness: currentLineThickness
            };

            // Store connection IDs and anchor names so arrows update when shapes move
            if (from.element.id) {
                arrow.startShapeId = from.element.id;
                arrow.startAnchor = connectionPoints.fromAnchor;
            }
            if (to.element.id) {
                arrow.endShapeId = to.element.id;
                arrow.endAnchor = connectionPoints.toAnchor;
            }

            elements.push(arrow);
        }
    }
}

// Get directional connection points based on relative position of shapes
function getDirectionalConnection(boundsA, typeA, boundsB, typeB, isHorizontal) {
    const sidesA = getSideCenters(boundsA, typeA);
    const sidesB = getSideCenters(boundsB, typeB);

    // Calculate centers of both shapes
    const centerA = {
        x: boundsA.x + boundsA.width / 2,
        y: boundsA.y + boundsA.height / 2
    };
    const centerB = {
        x: boundsB.x + boundsB.width / 2,
        y: boundsB.y + boundsB.height / 2
    };

    // Calculate relative position
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;

    // Determine connection based on which dimension has greater offset
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
        // Horizontal connection is more appropriate
        if (dx > 0) {
            // B is to the right of A
            return {
                from: sidesA.right,
                to: sidesB.left,
                fromAnchor: 'right',
                toAnchor: 'left'
            };
        } else {
            // B is to the left of A
            return {
                from: sidesA.left,
                to: sidesB.right,
                fromAnchor: 'left',
                toAnchor: 'right'
            };
        }
    } else {
        // Vertical connection is more appropriate
        if (dy > 0) {
            // B is below A
            return {
                from: sidesA.bottom,
                to: sidesB.top,
                fromAnchor: 'bottom',
                toAnchor: 'top'
            };
        } else {
            // B is above A
            return {
                from: sidesA.top,
                to: sidesB.bottom,
                fromAnchor: 'top',
                toAnchor: 'bottom'
            };
        }
    }
}

// Get all anchor points for a shape (9 points: 4 corners, 4 sides, 1 center)
function getAnchorPoints(bounds, shapeType) {
    const { x, y, width: w, height: h } = bounds;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    if (shapeType === 'circle') {
        // For circles, return points at cardinal directions plus center and corners
        const rx = w / 2;
        const ry = h / 2;
        return {
            center: { x: centerX, y: centerY },
            top: { x: centerX, y: centerY - ry },
            bottom: { x: centerX, y: centerY + ry },
            left: { x: centerX - rx, y: centerY },
            right: { x: centerX + rx, y: centerY },
            topLeft: { x: centerX - rx * 0.707, y: centerY - ry * 0.707 },
            topRight: { x: centerX + rx * 0.707, y: centerY - ry * 0.707 },
            bottomLeft: { x: centerX - rx * 0.707, y: centerY + ry * 0.707 },
            bottomRight: { x: centerX + rx * 0.707, y: centerY + ry * 0.707 }
        };
    } else if (shapeType === 'diamond') {
        // For diamonds, the vertices are at the midpoints of the bounding box edges
        return {
            center: { x: centerX, y: centerY },
            top: { x: centerX, y },
            bottom: { x: centerX, y: y + h },
            left: { x, y: centerY },
            right: { x: x + w, y: centerY },
            topLeft: { x: centerX - w * 0.25, y: centerY - h * 0.25 },
            topRight: { x: centerX + w * 0.25, y: centerY - h * 0.25 },
            bottomLeft: { x: centerX - w * 0.25, y: centerY + h * 0.25 },
            bottomRight: { x: centerX + w * 0.25, y: centerY + h * 0.25 }
        };
    } else if (shapeType === 'parallelogram') {
        const skew = w * 0.15;
        return {
            center: { x: centerX, y: centerY },
            top: { x: x + w / 2 + skew / 2, y },
            bottom: { x: x + w / 2 - skew / 2, y: y + h },
            left: { x: x + skew / 2, y: centerY },
            right: { x: x + w - skew / 2, y: centerY },
            topLeft: { x: x + skew, y },
            topRight: { x: x + w, y },
            bottomLeft: { x, y: y + h },
            bottomRight: { x: x + w - skew, y: y + h }
        };
    } else if (shapeType === 'triangle') {
        return {
            center: { x: centerX, y: y + h * 0.6 },
            top: { x: centerX, y },
            bottom: { x: centerX, y: y + h },
            left: { x: x + w / 4, y: y + h / 2 },
            right: { x: x + w * 0.75, y: y + h / 2 },
            topLeft: { x: x + w * 0.25, y: y + h * 0.3 },
            topRight: { x: x + w * 0.75, y: y + h * 0.3 },
            bottomLeft: { x, y: y + h },
            bottomRight: { x: x + w, y: y + h }
        };
    } else if (shapeType === 'hexagon') {
        const hw = w / 4;
        return {
            center: { x: centerX, y: centerY },
            top: { x: centerX, y },
            bottom: { x: centerX, y: y + h },
            left: { x, y: centerY },
            right: { x: x + w, y: centerY },
            topLeft: { x: x + hw, y },
            topRight: { x: x + w - hw, y },
            bottomLeft: { x: x + hw, y: y + h },
            bottomRight: { x: x + w - hw, y: y + h }
        };
    } else {
        // For rectangles and other shapes
        return {
            center: { x: centerX, y: centerY },
            top: { x: centerX, y },
            bottom: { x: centerX, y: y + h },
            left: { x, y: centerY },
            right: { x: x + w, y: centerY },
            topLeft: { x, y },
            topRight: { x: x + w, y },
            bottomLeft: { x, y: y + h },
            bottomRight: { x: x + w, y: y + h }
        };
    }
}

// Get center points of all sides of a shape (legacy function for backwards compatibility)
function getSideCenters(bounds, shapeType) {
    const anchors = getAnchorPoints(bounds, shapeType);
    return {
        top: anchors.top,
        bottom: anchors.bottom,
        left: anchors.left,
        right: anchors.right
    };
}

// Find nearest anchor point on any shape
function findNearestAnchorPoint(x, y, snapDistance = 25) {
    let nearestPoint = null;
    let nearestShape = null;
    let nearestAnchor = null;
    let minDistance = snapDistance;

    for (const element of elements) {
        if (element.type === 'text' || element.type === 'line' || element.type === 'arrow' || element.type === 'pen') {
            continue; // Skip non-container elements
        }

        const bounds = getElementBounds(element);
        const anchors = getAnchorPoints(bounds, element.type);

        // Check each anchor point
        for (const [anchorName, point] of Object.entries(anchors)) {
            const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
            if (dist < minDistance) {
                minDistance = dist;
                nearestPoint = point;
                nearestShape = element;
                nearestAnchor = anchorName;
            }
        }
    }

    return nearestPoint ? { point: nearestPoint, shape: nearestShape, anchor: nearestAnchor } : null;
}

// Draw anchor points for a shape
function drawAnchorPoints(element) {
    const bounds = getElementBounds(element);
    const anchors = getAnchorPoints(bounds, element.type);

    ctx.fillStyle = '#2196f3';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / zoomLevel;

    for (const point of Object.values(anchors)) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / zoomLevel, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// Arrow snapping helpers
function findNearestShapeEdge(x, y, snapDistance = 20, fromX = null, fromY = null) {
    let nearestPoint = null;
    let nearestShape = null;
    let minDistance = snapDistance;

    for (const element of elements) {
        if (element.type === 'text' || element.type === 'line' || element.type === 'arrow' || element.type === 'pen') {
            continue; // Skip non-container elements
        }

        const bounds = getElementBounds(element);
        const edgePoint = getNearestEdgePoint(x, y, bounds, element.type, fromX, fromY);

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

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return { x: x1, y: y1 };

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    return {
        x: x1 + t * dx,
        y: y1 + t * dy
    };
}

function getShapeVertices(bounds, shapeType) {
    const { x, y, width: w, height: h } = bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (shapeType) {
        case 'diamond':
            return [
                { x: cx, y },           // top
                { x: x + w, y: cy },    // right
                { x: cx, y: y + h },    // bottom
                { x, y: cy }            // left
            ];

        case 'parallelogram':
            const skew = w * 0.15;
            return [
                { x: x + skew, y },
                { x: x + w, y },
                { x: x + w - skew, y: y + h },
                { x, y: y + h }
            ];

        case 'triangle':
            return [
                { x: x + w/2, y },
                { x: x + w, y: y + h },
                { x, y: y + h }
            ];

        case 'hexagon':
            const hw = w / 4;
            return [
                { x: x + hw, y },
                { x: x + w - hw, y },
                { x: x + w, y: cy },
                { x: x + w - hw, y: y + h },
                { x: x + hw, y: y + h },
                { x, y: cy }
            ];

        default:
            // Rectangle and other shapes
            return [
                { x, y },
                { x: x + w, y },
                { x: x + w, y: y + h },
                { x, y: y + h }
            ];
    }
}

function getNearestEdgePoint(x, y, bounds, shapeType, fromX = null, fromY = null) {
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
    }

    // For polygon shapes, get vertices and find closest point on any edge
    const vertices = getShapeVertices(bounds, shapeType);

    // If we know where the arrow is coming from, choose the best edge based on direction
    if (fromX !== null && fromY !== null && shapeType === 'triangle') {
        // For triangles, find which edge is most aligned with the approach direction
        const approachAngle = Math.atan2(y - fromY, x - fromX);
        let bestEdge = 0;
        let bestAlignment = -Infinity;

        for (let i = 0; i < vertices.length; i++) {
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % vertices.length];

            // Calculate the normal to this edge (perpendicular)
            const edgeDx = v2.x - v1.x;
            const edgeDy = v2.y - v1.y;
            const edgeAngle = Math.atan2(edgeDy, edgeDx);

            // Normal pointing inward (we want the arrow to approach from outside)
            const normalAngle = edgeAngle + Math.PI / 2;

            // Check alignment between approach direction and edge normal
            const alignment = Math.cos(approachAngle - normalAngle);

            if (alignment > bestAlignment) {
                bestAlignment = alignment;
                bestEdge = i;
            }
        }

        // Snap to midpoint of the best edge
        const v1 = vertices[bestEdge];
        const v2 = vertices[(bestEdge + 1) % vertices.length];
        return {
            x: (v1.x + v2.x) / 2,
            y: (v1.y + v2.y) / 2
        };
    }

    // For other shapes or when we don't have a fromPoint, find closest point on any edge
    let closestPoint = null;
    let minDistance = Infinity;

    for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        const point = closestPointOnSegment(x, y, v1.x, v1.y, v2.x, v2.y);
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));

        if (dist < minDistance) {
            minDistance = dist;
            closestPoint = point;
        }
    }

    return closestPoint || { x, y };
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

// Smart pathfinding for arrows that avoid obstacles
// Returns array of obstacles (shapes that should be avoided)
function getObstacles(excludeIds = []) {
    return elements.filter(el => {
        // Exclude connectors (lines, arrows, pens) and excluded IDs
        if (el.type === 'line' || el.type === 'arrow' || el.type === 'pen') return false;
        if (excludeIds.includes(el.id)) return false;
        return true;
    });
}

// Check if a rectangle intersects with any obstacles
function hasObstacleCollision(x, y, width, height, obstacles, margin = 20) {
    const rect = {
        left: Math.min(x, x + width) - margin,
        right: Math.max(x, x + width) + margin,
        top: Math.min(y, y + height) - margin,
        bottom: Math.max(y, y + height) + margin
    };

    for (const obstacle of obstacles) {
        const obsRect = {
            left: obstacle.x,
            right: obstacle.x + obstacle.width,
            top: obstacle.y,
            bottom: obstacle.y + obstacle.height
        };

        // Check if rectangles intersect
        if (rect.right > obsRect.left &&
            rect.left < obsRect.right &&
            rect.bottom > obsRect.top &&
            rect.top < obsRect.bottom) {
            return true;
        }
    }
    return false;
}

// A* pathfinding algorithm for orthogonal routing
function findSmartPath(startX, startY, endX, endY, startAnchor, endAnchor, excludeIds = []) {
    const obstacles = getObstacles(excludeIds);

    // Grid resolution for pathfinding
    const gridSize = 30;
    const margin = 25; // Margin around obstacles
    const exitDistance = 50; // Distance to move away from anchor point before pathfinding

    // Convert coordinates to grid
    const toGrid = (x, y) => ({
        x: Math.round(x / gridSize),
        y: Math.round(y / gridSize)
    });

    const fromGrid = (gx, gy) => ({
        x: gx * gridSize,
        y: gy * gridSize
    });

    // Add intermediate points based on anchor directions
    // This ensures the path exits/enters in the correct direction
    let actualStartX = startX;
    let actualStartY = startY;
    let actualEndX = endX;
    let actualEndY = endY;

    // Adjust start point based on start anchor
    switch (startAnchor) {
        case 'left':
            actualStartX -= exitDistance;
            break;
        case 'right':
            actualStartX += exitDistance;
            break;
        case 'top':
            actualStartY -= exitDistance;
            break;
        case 'bottom':
            actualStartY += exitDistance;
            break;
    }

    // Adjust end point based on end anchor
    switch (endAnchor) {
        case 'left':
            actualEndX -= exitDistance;
            break;
        case 'right':
            actualEndX += exitDistance;
            break;
        case 'top':
            actualEndY -= exitDistance;
            break;
        case 'bottom':
            actualEndY += exitDistance;
            break;
    }

    const start = toGrid(actualStartX, actualStartY);
    const end = toGrid(actualEndX, actualEndY);

    // Check if a grid cell is blocked by obstacles
    const isBlocked = (gx, gy) => {
        const worldPos = fromGrid(gx, gy);
        for (const obstacle of obstacles) {
            const obsRect = {
                left: obstacle.x - margin,
                right: obstacle.x + obstacle.width + margin,
                top: obstacle.y - margin,
                bottom: obstacle.y + obstacle.height + margin
            };

            if (worldPos.x >= obsRect.left && worldPos.x <= obsRect.right &&
                worldPos.y >= obsRect.top && worldPos.y <= obsRect.bottom) {
                return true;
            }
        }
        return false;
    };

    // A* implementation
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const key = (p) => `${p.x},${p.y}`;
    const h = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y); // Manhattan distance

    openSet.push(start);
    gScore.set(key(start), 0);
    fScore.set(key(start), h(start, end));

    // Limit iterations to prevent infinite loops
    let iterations = 0;
    const maxIterations = 1000;

    while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;

        // Find node with lowest fScore
        openSet.sort((a, b) => (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity));
        const current = openSet.shift();

        // Reached goal
        if (current.x === end.x && current.y === end.y) {
            // Reconstruct path
            const path = [fromGrid(current.x, current.y)];
            let temp = current;
            while (cameFrom.has(key(temp))) {
                temp = cameFrom.get(key(temp));
                path.unshift(fromGrid(temp.x, temp.y));
            }

            // Add anchor exit/entry points at the beginning and end
            // Add intermediate point at start anchor exit
            const startExit = {x: actualStartX, y: actualStartY};
            // Add intermediate point at end anchor entry
            const endEntry = {x: actualEndX, y: actualEndY};

            // Prepend start points
            path.unshift(startExit);
            path.unshift({x: startX, y: startY});

            // Append end points
            path.push(endEntry);
            path.push({x: endX, y: endY});

            return path;
        }

        closedSet.add(key(current));

        // Check neighbors (only orthogonal moves)
        const neighbors = [
            {x: current.x + 1, y: current.y},
            {x: current.x - 1, y: current.y},
            {x: current.x, y: current.y + 1},
            {x: current.x, y: current.y - 1}
        ];

        for (const neighbor of neighbors) {
            const nKey = key(neighbor);

            if (closedSet.has(nKey)) continue;
            if (isBlocked(neighbor.x, neighbor.y)) continue;

            const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1;

            if (!openSet.find(p => p.x === neighbor.x && p.y === neighbor.y)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= (gScore.get(nKey) || Infinity)) {
                continue;
            }

            cameFrom.set(nKey, current);
            gScore.set(nKey, tentativeGScore);
            fScore.set(nKey, tentativeGScore + h(neighbor, end));
        }
    }

    // No path found, return straight line
    return null;
}

// Simplify path by removing redundant points (co-linear points)
function simplifyPath(points) {
    if (points.length <= 2) return points;

    const simplified = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        const curr = points[i];
        const next = points[i + 1];

        // Check if current point is on the same line as prev and next
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        // If not co-linear, keep this point
        if (!(dx1 === 0 && dx2 === 0) && !(dy1 === 0 && dy2 === 0)) {
            simplified.push(curr);
        } else if ((dx1 === 0 && dx2 === 0) || (dy1 === 0 && dy2 === 0)) {
            // Co-linear, skip this point (don't add)
        } else {
            simplified.push(curr);
        }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
}

// Calculate stepped path points (orthogonal routing)
// bendPoint: optional {x, y} to override automatic midpoint calculation
// startAnchor: direction exiting from ('top', 'bottom', 'left', 'right')
// endAnchor: direction entering to ('top', 'bottom', 'left', 'right')
// excludeIds: shape IDs to exclude from obstacle detection (typically the start/end shapes)
// useSmart: whether to use smart pathfinding to avoid obstacles
function getSteppedPath(x1, y1, x2, y2, bendPoint = null, startAnchor = null, endAnchor = null, excludeIds = [], useSmart = true) {
    // Try smart pathfinding if enabled and not using custom bend point
    if (useSmart && !bendPoint && startAnchor && endAnchor && excludeIds.length > 0) {
        const smartPath = findSmartPath(x1, y1, x2, y2, startAnchor, endAnchor, excludeIds);
        if (smartPath && smartPath.length > 0) {
            // Smart path already includes correct start/end points
            return simplifyPath(smartPath);
        }
    }

    const points = [];
    points.push({x: x1, y: y1});

    // If we have anchor information, use it to determine the path
    if (startAnchor && endAnchor) {
        const startIsHorizontal = startAnchor === 'left' || startAnchor === 'right';
        const endIsHorizontal = endAnchor === 'left' || endAnchor === 'right';

        if (startIsHorizontal && endIsHorizontal) {
            // Both horizontal - go horizontal, vertical, horizontal
            const midX = bendPoint ? bendPoint.x : (x1 + x2) / 2;
            points.push({x: midX, y: y1});
            points.push({x: midX, y: y2});
            points.push({x: x2, y: y2});
        } else if (!startIsHorizontal && !endIsHorizontal) {
            // Both vertical - go vertical, horizontal, vertical
            const midY = bendPoint ? bendPoint.y : (y1 + y2) / 2;
            points.push({x: x1, y: midY});
            points.push({x: x2, y: midY});
            points.push({x: x2, y: y2});
        } else if (startIsHorizontal && !endIsHorizontal) {
            // Start horizontal, end vertical - go horizontal then vertical
            const turnX = bendPoint ? bendPoint.x : x2;
            points.push({x: turnX, y: y1});
            points.push({x: turnX, y: y2});
            points.push({x: x2, y: y2});
        } else {
            // Start vertical, end horizontal - go vertical then horizontal
            const turnY = bendPoint ? bendPoint.y : y2;
            points.push({x: x1, y: turnY});
            points.push({x: x2, y: turnY});
            points.push({x: x2, y: y2});
        }
    } else {
        // Fallback to old logic if no anchor info
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);

        if (dx > dy) {
            // Horizontal flow: go horizontal first, then vertical, then horizontal
            const midX = bendPoint ? bendPoint.x : (x1 + x2) / 2;
            points.push({x: midX, y: y1});
            points.push({x: midX, y: y2});
            points.push({x: x2, y: y2});
        } else {
            // Vertical flow: go vertical first, then horizontal, then vertical
            const midY = bendPoint ? bendPoint.y : (y1 + y2) / 2;
            points.push({x: x1, y: midY});
            points.push({x: x2, y: midY});
            points.push({x: x2, y: y2});
        }
    }

    return points;
}

function drawSteppedLine(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2, bendPoint = null, startAnchor = null, endAnchor = null, excludeIds = [], useSmart = true) {
    const points = getSteppedPath(x1, y1, x2, y2, bendPoint, startAnchor, endAnchor, excludeIds, useSmart);

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

function drawSteppedArrow(x1, y1, x2, y2, color, lineStyle = 'solid', lineThickness = 2, bendPoint = null, startAnchor = null, endAnchor = null, excludeIds = [], useSmart = true) {
    const points = getSteppedPath(x1, y1, x2, y2, bendPoint, startAnchor, endAnchor, excludeIds, useSmart);

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

    const lineHeight = fontSize * 1.2;

    // Check if this is text with a parent (shape or connector)
    const hasParent = element.parentId !== undefined;

    if (hasParent) {
        const parent = elements.find(el => el.id === element.parentId);
        if (parent) {
            // Check if parent is an arrow or line
            if (parent.type === 'arrow' || parent.type === 'line') {
                // Determine label position based on connector type
                let labelX, labelY, defaultOffsetX = 0, defaultOffsetY = 0;

                if (parent.lineRouting === 'stepped') {
                    // For stepped lines, position on the first segment
                    const x1 = parent.x;
                    const y1 = parent.y;
                    const x2 = parent.x + parent.width;
                    const y2 = parent.y + parent.height;

                    // Get the path to determine first segment
                    const absWidth = Math.abs(parent.width);
                    const absHeight = Math.abs(parent.height);

                    if (absWidth > absHeight) {
                        // More horizontal - label on horizontal segment
                        labelX = (x1 + x2) / 2;
                        labelY = y1;
                        defaultOffsetY = -20; // Offset upward
                    } else {
                        // More vertical - label on vertical segment
                        labelX = x1;
                        labelY = (y1 + y2) / 2;
                        defaultOffsetX = 25; // Offset to the right
                    }
                } else {
                    // Straight connectors - position at midpoint
                    const absWidth = Math.abs(parent.width);
                    const absHeight = Math.abs(parent.height);

                    labelX = parent.x + parent.width / 2;
                    labelY = parent.y + parent.height / 2;

                    if (absWidth > absHeight) {
                        // Horizontal - offset upward
                        defaultOffsetY = -20;
                    } else {
                        // Vertical - offset to the right
                        defaultOffsetX = 25;
                    }
                }

                // Use custom offset if user has repositioned the label
                const offsetX = element.offsetX !== undefined ? element.offsetX : defaultOffsetX;
                const offsetY = element.offsetY !== undefined ? element.offsetY : defaultOffsetY;

                // Measure text for centering
                const metrics = ctx.measureText(element.text);
                const textWidth = metrics.width;
                const textHeight = fontSize;

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(element.text, labelX + offsetX, labelY + offsetY);
                ctx.textAlign = 'start';
                ctx.textBaseline = 'top'; // Reset
            } else {
                // Parent is a shape - center and wrap text
                const shapeWidth = Math.abs(parent.width || 100);
                const shapeHeight = Math.abs(parent.height || 100);
                const centerX = parent.x + shapeWidth / 2;
                const centerY = parent.y + shapeHeight / 2;
                const maxWidth = shapeWidth * 0.9; // 90% of shape width for padding

                // Wrap text to fit shape width
                const wrappedLines = [];
                const inputLines = element.text.split('\n');

                inputLines.forEach(line => {
                    const words = line.split(' ');
                    let currentLine = '';

                    words.forEach((word, i) => {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        const metrics = ctx.measureText(testLine);

                        if (metrics.width > maxWidth && currentLine) {
                            wrappedLines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    });

                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }
                });

                // Calculate total height and vertical centering
                const totalHeight = wrappedLines.length * lineHeight;
                const startY = centerY - totalHeight / 2;

                // Draw centered text
                ctx.textAlign = 'center';
                wrappedLines.forEach((line, index) => {
                    ctx.fillText(line, centerX, startY + (index * lineHeight));
                });
                ctx.textAlign = 'start'; // Reset
            }
        }
    } else {
        // Regular text rendering (no parent)
        // If text has explicit width/height, wrap within bounds
        if (element.width !== undefined && element.height !== undefined) {
            const maxWidth = element.width;
            const wrappedLines = [];
            const inputLines = element.text.split('\n');

            inputLines.forEach(line => {
                const words = line.split(' ');
                let currentLine = '';

                words.forEach((word) => {
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const metrics = ctx.measureText(testLine);

                    if (metrics.width > maxWidth && currentLine) {
                        wrappedLines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                });

                if (currentLine) {
                    wrappedLines.push(currentLine);
                }
            });

            // Draw wrapped text
            wrappedLines.forEach((line, index) => {
                ctx.fillText(line, element.x, element.y + (index * lineHeight));
            });
        } else {
            // No explicit bounds - render as-is
            const lines = element.text.split('\n');
            lines.forEach((line, index) => {
                ctx.fillText(line, element.x, element.y + (index * lineHeight));
            });
        }
    }
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

    // Bottom ellipse - fill it first if there's a fill color
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.ellipse(x + w/2, y + h - ellipseH/2, w/2, ellipseH/2, 0, 0, Math.PI);
        ctx.fill();
    }

    // Bottom (visible arc) - stroke
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

// New flowchart shapes
function drawPredefinedProcess(x, y, w, h, strokeColor, fillColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Vertical lines on left and right
    const lineOffset = w * 0.1;
    ctx.beginPath();
    ctx.moveTo(x + lineOffset, y);
    ctx.lineTo(x + lineOffset, y + h);
    ctx.moveTo(x + w - lineOffset, y);
    ctx.lineTo(x + w - lineOffset, y + h);
    ctx.stroke();
}

function drawManualInput(x, y, w, h, strokeColor, fillColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const slantHeight = h * 0.2;
    ctx.moveTo(x, y + slantHeight);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawDelay(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rx = w / 2;
    const ry = h / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left semi-circle
    ctx.arc(cx - rx / 2, cy, ry, Math.PI / 2, -Math.PI / 2, false);
    // Right semi-circle
    ctx.arc(cx + rx / 2, cy, ry, -Math.PI / 2, Math.PI / 2, false);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawDisplay(x, y, w, h, strokeColor, fillColor) {
    const curve = w * 0.15;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - curve, y);
    ctx.quadraticCurveTo(x + w + curve, y + h / 2, x + w - curve, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawManualOperation(x, y, w, h, strokeColor, fillColor) {
    const slant = w * 0.15;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w - slant, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

// New geometric shapes
function drawPentagon(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawOctagon(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI / 8) - Math.PI / 2;
        const px = cx + radius * Math.cos(angle);
        const py = cy + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawTrapezoid(x, y, w, h, strokeColor, fillColor) {
    const inset = w * 0.2;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + inset, y);
    ctx.lineTo(x + w - inset, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawCross(x, y, w, h, strokeColor, fillColor) {
    const thickness = Math.min(w, h) / 3;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Vertical bar
    ctx.rect(cx - thickness / 2, y, thickness, h);
    // Horizontal bar
    ctx.rect(x, cy - thickness / 2, w, thickness);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawArrowShape(x, y, w, h, strokeColor, fillColor, direction) {
    const headWidth = w * 0.4;
    const shaftHeight = h * 0.5;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    if (direction === 'right') {
        // Arrow pointing right
        ctx.moveTo(x, y + (h - shaftHeight) / 2);
        ctx.lineTo(x + w - headWidth, y + (h - shaftHeight) / 2);
        ctx.lineTo(x + w - headWidth, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w - headWidth, y + h);
        ctx.lineTo(x + w - headWidth, y + (h + shaftHeight) / 2);
        ctx.lineTo(x, y + (h + shaftHeight) / 2);
    } else {
        // Arrow pointing left
        ctx.moveTo(x + w, y + (h - shaftHeight) / 2);
        ctx.lineTo(x + headWidth, y + (h - shaftHeight) / 2);
        ctx.lineTo(x + headWidth, y);
        ctx.lineTo(x, y + h / 2);
        ctx.lineTo(x + headWidth, y + h);
        ctx.lineTo(x + headWidth, y + (h + shaftHeight) / 2);
        ctx.lineTo(x + w, y + (h + shaftHeight) / 2);
    }

    ctx.closePath();
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawSpeechBubble(x, y, w, h, strokeColor, fillColor) {
    const tailWidth = w * 0.15;
    const tailHeight = h * 0.2;
    const radius = 10;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Main bubble with rounded corners
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - tailHeight - radius);
    ctx.quadraticCurveTo(x + w, y + h - tailHeight, x + w - radius, y + h - tailHeight);

    // Tail
    ctx.lineTo(x + w * 0.3 + tailWidth, y + h - tailHeight);
    ctx.lineTo(x + w * 0.2, y + h);
    ctx.lineTo(x + w * 0.3, y + h - tailHeight);

    ctx.lineTo(x + radius, y + h - tailHeight);
    ctx.quadraticCurveTo(x, y + h - tailHeight, x, y + h - tailHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawHeart(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const top = y + h * 0.3;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Top left curve
    ctx.moveTo(cx, top);
    ctx.bezierCurveTo(cx, top - h * 0.3, x, top - h * 0.3, x, top + h * 0.1);
    ctx.bezierCurveTo(x, top + h * 0.3, x, top + h * 0.4, cx, y + h);

    // Top right curve
    ctx.bezierCurveTo(x + w, top + h * 0.4, x + w, top + h * 0.3, x + w, top + h * 0.1);
    ctx.bezierCurveTo(x + w, top - h * 0.3, cx, top - h * 0.3, cx, top);

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

// Kubernetes shapes
function drawK8sPod(x, y, w, h, strokeColor, fillColor) {
    // Draw as a cube/box
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Add "K8s" text
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pod', x + w / 2, y + h / 2);
}

function drawK8sService(x, y, w, h, strokeColor, fillColor) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) / 2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Add "Svc" text
    ctx.fillStyle = strokeColor;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Svc', cx, cy);
}

function drawK8sDeployment(x, y, w, h, strokeColor, fillColor) {
    // Draw multiple overlapping rectangles
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    const offset = 5;
    for (let i = 2; i >= 0; i--) {
        ctx.beginPath();
        ctx.rect(x + i * offset, y + i * offset, w - i * offset * 2, h - i * offset * 2);
        if (i === 0 && fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        ctx.stroke();
    }
}

function drawK8sConfigMap(x, y, w, h, strokeColor, fillColor) {
    // Draw as a document/file icon
    const foldSize = w * 0.2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - foldSize, y);
    ctx.lineTo(x + w, y + foldSize);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Fold corner
    ctx.beginPath();
    ctx.moveTo(x + w - foldSize, y);
    ctx.lineTo(x + w - foldSize, y + foldSize);
    ctx.lineTo(x + w, y + foldSize);
    ctx.stroke();
}

function drawK8sSecret(x, y, w, h, strokeColor, fillColor) {
    // Draw as a lock/key icon
    const cx = x + w / 2;
    const lockHeight = h * 0.6;
    const shackleRadius = w * 0.25;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;

    // Shackle
    ctx.beginPath();
    ctx.arc(cx, y + shackleRadius, shackleRadius, Math.PI, 0, false);
    ctx.stroke();

    // Lock body
    ctx.beginPath();
    ctx.rect(x + w * 0.2, y + h - lockHeight, w * 0.6, lockHeight);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
}

function drawK8sIngress(x, y, w, h, strokeColor, fillColor) {
    // Draw as an arrow entering a box
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x + w * 0.3, y, w * 0.7, h);
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();

    // Arrow
    const arrowY = y + h / 2;
    ctx.beginPath();
    ctx.moveTo(x, arrowY);
    ctx.lineTo(x + w * 0.3, arrowY);
    ctx.moveTo(x + w * 0.2, arrowY - 5);
    ctx.lineTo(x + w * 0.3, arrowY);
    ctx.lineTo(x + w * 0.2, arrowY + 5);
    ctx.stroke();
}

function drawK8sVolume(x, y, w, h, strokeColor, fillColor) {
    // Draw as a cylinder
    drawCylinder(x, y, w, h, strokeColor, fillColor);
}

function drawK8sNamespace(x, y, w, h, strokeColor, fillColor) {
    // Draw as a folder
    const tabHeight = h * 0.25;
    const tabWidth = w * 0.4;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + tabHeight);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + tabHeight);
    ctx.lineTo(x + tabWidth, y + tabHeight);
    ctx.lineTo(x + tabWidth, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + tabHeight);

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    ctx.stroke();
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

    // Apply opacity if set
    const originalAlpha = ctx.globalAlpha;
    if (element.opacity !== undefined) {
        ctx.globalAlpha = element.opacity;
    }

    // Apply shadow if enabled
    if (element.shadow) {
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    }

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
                // Build exclude IDs list (start and end shapes)
                const excludeIds = [];
                if (element.startShapeId) excludeIds.push(element.startShapeId);
                if (element.endShapeId) excludeIds.push(element.endShapeId);

                drawSteppedLine(element.x, element.y,
                               element.x + element.width, element.y + element.height,
                               element.strokeColor, lineStyle, element.lineThickness || 2,
                               element.bendPoint, element.startAnchor, element.endAnchor,
                               excludeIds, true);
            } else {
                drawRoughLine(element.x, element.y,
                             element.x + element.width, element.y + element.height,
                             element.strokeColor, lineStyle, element.lineThickness || 2);
            }
            break;
        case 'arrow':
            if (element.lineRouting === 'stepped') {
                // Build exclude IDs list (start and end shapes)
                const excludeIds = [];
                if (element.startShapeId) excludeIds.push(element.startShapeId);
                if (element.endShapeId) excludeIds.push(element.endShapeId);

                drawSteppedArrow(element.x, element.y,
                                element.x + element.width, element.y + element.height,
                                element.strokeColor, lineStyle, element.lineThickness || 2,
                                element.bendPoint, element.startAnchor, element.endAnchor,
                                excludeIds, true);
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
        case 'icon':
            drawIcon(element);
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
        // New flowchart shapes
        case 'predefinedProcess':
            drawPredefinedProcess(element.x, element.y, element.width, element.height,
                                 element.strokeColor, element.fillColor);
            break;
        case 'manualInput':
            drawManualInput(element.x, element.y, element.width, element.height,
                           element.strokeColor, element.fillColor);
            break;
        case 'delay':
            drawDelay(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'display':
            drawDisplay(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'manualOperation':
            drawManualOperation(element.x, element.y, element.width, element.height,
                               element.strokeColor, element.fillColor);
            break;
        // New geometric shapes
        case 'pentagon':
            drawPentagon(element.x, element.y, element.width, element.height,
                        element.strokeColor, element.fillColor);
            break;
        case 'octagon':
            drawOctagon(element.x, element.y, element.width, element.height,
                       element.strokeColor, element.fillColor);
            break;
        case 'trapezoid':
            drawTrapezoid(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'cross':
            drawCross(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        case 'arrowRight':
            drawArrowShape(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor, 'right');
            break;
        case 'arrowLeft':
            drawArrowShape(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor, 'left');
            break;
        case 'speechBubble':
            drawSpeechBubble(element.x, element.y, element.width, element.height,
                            element.strokeColor, element.fillColor);
            break;
        case 'heart':
            drawHeart(element.x, element.y, element.width, element.height,
                     element.strokeColor, element.fillColor);
            break;
        // Kubernetes shapes
        case 'k8sPod':
            drawK8sPod(element.x, element.y, element.width, element.height,
                      element.strokeColor, element.fillColor);
            break;
        case 'k8sService':
            drawK8sService(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'k8sDeployment':
            drawK8sDeployment(element.x, element.y, element.width, element.height,
                             element.strokeColor, element.fillColor);
            break;
        case 'k8sConfigMap':
            drawK8sConfigMap(element.x, element.y, element.width, element.height,
                            element.strokeColor, element.fillColor);
            break;
        case 'k8sSecret':
            drawK8sSecret(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'k8sIngress':
            drawK8sIngress(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor);
            break;
        case 'k8sVolume':
            drawK8sVolume(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor);
            break;
        case 'k8sNamespace':
            drawK8sNamespace(element.x, element.y, element.width, element.height,
                            element.strokeColor, element.fillColor);
            break;
    }

    // Reset shadow
    if (element.shadow) {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }

    // Reset opacity
    ctx.globalAlpha = originalAlpha;
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

    // Add icon-specific properties to preview
    if (currentTool === 'icon') {
        previewElement.iconClass = selectedIconClass;
        previewElement.color = textColorInput.value;
    }

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

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
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

    // Sort elements by their current X position for left-to-right layout (exclude connectors and text)
    const sortedElements = [...elements]
        .filter(el => el.type !== 'line' && el.type !== 'arrow' && el.type !== 'text')
        .sort((a, b) => (a.x || 0) - (b.x || 0));

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

// Background pattern drawing functions
function drawLineGrid() {
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

function drawDotGrid() {
    const startX = Math.floor(-panOffsetX / zoomLevel / gridSize) * gridSize;
    const startY = Math.floor(-panOffsetY / zoomLevel / gridSize) * gridSize;
    const endX = startX + Math.ceil(canvas.width / zoomLevel / gridSize) * gridSize + gridSize;
    const endY = startY + Math.ceil(canvas.height / zoomLevel / gridSize) * gridSize + gridSize;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    const dotSize = 2 / zoomLevel;

    for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawBackgroundPattern() {
    if (currentBackgroundPattern === 'blank') {
        // No pattern, just background color
        return;
    } else if (currentBackgroundPattern === 'line-grid') {
        drawLineGrid();
    } else if (currentBackgroundPattern === 'dot-grid') {
        drawDotGrid();
    }
}

// Legacy function for backwards compatibility
function drawGrid() {
    drawLineGrid();
}

function drawRulers() {
    // Save current transformation state
    ctx.save();
    // Reset to screen coordinates (not canvas coordinates)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const rulerColor = '#e0e0e0';
    const textColor = '#666';
    const tickColor = '#999';

    // Draw horizontal ruler (top) - starts after the vertical ruler
    ctx.fillStyle = rulerColor;
    ctx.fillRect(RULER_SIZE, 0, canvas.width - RULER_SIZE, RULER_SIZE);

    // Draw vertical ruler (left) - flush with left edge
    ctx.fillRect(0, RULER_SIZE, RULER_SIZE, canvas.height - RULER_SIZE);

    // Draw corner square
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, RULER_SIZE, RULER_SIZE);

    // Draw ruler markings
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = textColor;
    ctx.font = '9px Arial';
    ctx.lineWidth = 1;

    const tickSpacing = 50; // Pixels between major ticks
    const minorTickSpacing = 10;

    // Horizontal ruler ticks
    for (let i = RULER_SIZE; i < canvas.width; i += minorTickSpacing) {
        const screenX = i;
        const canvasX = (screenX - panOffsetX) / zoomLevel;

        if ((i - RULER_SIZE) % tickSpacing === 0) {
            // Major tick
            ctx.beginPath();
            ctx.moveTo(screenX, RULER_SIZE - 8);
            ctx.lineTo(screenX, RULER_SIZE);
            ctx.stroke();

            // Label inside ruler
            ctx.fillText(Math.round(canvasX).toString(), screenX + 2, 10);
        } else {
            // Minor tick
            ctx.beginPath();
            ctx.moveTo(screenX, RULER_SIZE - 4);
            ctx.lineTo(screenX, RULER_SIZE);
            ctx.stroke();
        }
    }

    // Vertical ruler ticks
    for (let i = RULER_SIZE; i < canvas.height; i += minorTickSpacing) {
        const screenY = i;
        const canvasY = (screenY - panOffsetY) / zoomLevel;

        if ((i - RULER_SIZE) % tickSpacing === 0) {
            // Major tick - towards canvas (right side of ruler)
            ctx.beginPath();
            ctx.moveTo(RULER_SIZE - 8, screenY);
            ctx.lineTo(RULER_SIZE, screenY);
            ctx.stroke();

            // Label (rotated) inside ruler - positioned like horizontal ruler
            ctx.save();
            ctx.translate(10, screenY + 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(Math.round(canvasY).toString(), 0, 0);
            ctx.restore();
        } else {
            // Minor tick
            ctx.beginPath();
            ctx.moveTo(RULER_SIZE - 4, screenY);
            ctx.lineTo(RULER_SIZE, screenY);
            ctx.stroke();
        }
    }

    ctx.restore();
}

function drawGuides() {
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 1 / zoomLevel;
    ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel]);

    guides.forEach(guide => {
        if (guide.type === 'vertical') {
            ctx.beginPath();
            ctx.moveTo(guide.position, -10000);
            ctx.lineTo(guide.position, 10000);
            ctx.stroke();
        } else if (guide.type === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(-10000, guide.position);
            ctx.lineTo(10000, guide.position);
            ctx.stroke();
        }
    });

    ctx.setLineDash([]);
}

function redraw() {
    // Clear canvas completely first
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Apply pan and zoom transformations
    ctx.save();
    ctx.translate(panOffsetX, panOffsetY);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw background pattern
    if (currentBackgroundPattern !== 'blank') {
        drawBackgroundPattern();
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
            if (selectedElement.type === 'line' || selectedElement.type === 'arrow') {
                // For lines/arrows, show larger endpoint handles instead of corner handles
                const x1 = selectedElement.x;
                const y1 = selectedElement.y;
                const x2 = selectedElement.x + selectedElement.width;
                const y2 = selectedElement.y + selectedElement.height;

                ctx.fillStyle = '#2196f3';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;

                // Start point handle
                ctx.fillRect(x1 - 6, y1 - 6, 12, 12);
                ctx.strokeRect(x1 - 6, y1 - 6, 12, 12);

                // End point handle
                ctx.fillRect(x2 - 6, y2 - 6, 12, 12);
                ctx.strokeRect(x2 - 6, y2 - 6, 12, 12);
            } else {
                // Regular resize handles for other elements
                const handles = getResizeHandles(bounds);
                ctx.fillStyle = '#2196f3';
                handles.forEach(handle => {
                    ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
                });
            }

            // Draw bend point handle for stepped arrows/lines
            if ((selectedElement.type === 'arrow' || selectedElement.type === 'line') &&
                selectedElement.lineRouting === 'stepped') {
                const bendPointPos = getSteppedBendPoint(selectedElement);
                if (bendPointPos) {
                    ctx.fillStyle = '#ff9800'; // Orange color for bend point
                    ctx.fillRect(bendPointPos.x - 6, bendPointPos.y - 6, 12, 12);

                    // Draw a small circle inside to indicate it's draggable
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(bendPointPos.x, bendPointPos.y, 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Draw anchor points for shapes (not for lines, arrows, text, or pen)
            if (selectedElement.type !== 'line' && selectedElement.type !== 'arrow' &&
                selectedElement.type !== 'text' && selectedElement.type !== 'pen') {
                drawAnchorPoints(selectedElement);
            }
        }

        ctx.setLineDash([]);

        // Show anchor points on all shapes when drawing arrows or lines
        if ((currentTool === 'arrow' || currentTool === 'line') && isDrawing) {
            elements.forEach(el => {
                if (el.type !== 'line' && el.type !== 'arrow' && el.type !== 'text' && el.type !== 'pen') {
                    drawAnchorPoints(el);
                }
            });
        }

        // Draw rectangle selection box
        if (isRectangleSelecting && selectionRect) {
            ctx.strokeStyle = '#2196f3';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height);
            ctx.setLineDash([]);
        }
    }

    // Draw guides (from rulers)
    if (guides.length > 0) {
        drawGuides();
    }

    // Draw dragging guide (while being created or moved)
    if (draggingGuide) {
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2 / zoomLevel;
        ctx.setLineDash([5 / zoomLevel, 5 / zoomLevel]);

        if (draggingGuide.type === 'vertical') {
            ctx.beginPath();
            ctx.moveTo(draggingGuide.position, -10000);
            ctx.lineTo(draggingGuide.position, 10000);
            ctx.stroke();
        } else if (draggingGuide.type === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(-10000, draggingGuide.position);
            ctx.lineTo(10000, draggingGuide.position);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    // Draw smart guides
    if (smartGuides.length > 0) {
        ctx.strokeStyle = '#ff4081';
        ctx.lineWidth = 1 / zoomLevel;
        ctx.setLineDash([]);

        smartGuides.forEach(guide => {
            if (guide.type === 'vertical') {
                // Draw vertical line
                ctx.beginPath();
                ctx.moveTo(guide.position, -10000);
                ctx.lineTo(guide.position, 10000);
                ctx.stroke();
            } else if (guide.type === 'horizontal') {
                // Draw horizontal line
                ctx.beginPath();
                ctx.moveTo(-10000, guide.position);
                ctx.lineTo(10000, guide.position);
                ctx.stroke();
            }

            // Draw distance label if enabled and label exists
            if (showSizeDistance && guide.label) {
                ctx.save();
                ctx.fillStyle = '#ff4081';
                ctx.font = `${12 / zoomLevel}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Draw background for label
                const metrics = ctx.measureText(guide.label);
                const padding = 4 / zoomLevel;
                const labelWidth = metrics.width + padding * 2;
                const labelHeight = 16 / zoomLevel;

                // Calculate viewport center in world coordinates
                const viewportCenterX = (canvas.width / 2 - panOffsetX) / zoomLevel;
                const viewportCenterY = (canvas.height / 2 - panOffsetY) / zoomLevel;

                if (guide.type === 'vertical') {
                    const labelX = guide.position;
                    const labelY = viewportCenterY;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
                    ctx.fillStyle = '#ff4081';
                    ctx.fillText(guide.label, labelX, labelY);
                } else {
                    const labelX = viewportCenterX;
                    const labelY = guide.position;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
                    ctx.fillStyle = '#ff4081';
                    ctx.fillText(guide.label, labelX, labelY);
                }
                ctx.restore();
            }
        });
    }

    // Draw size indicator when resizing
    if (showSizeDistance && dragMode === 'resize' && selectedElement) {
        const bounds = getElementBounds(selectedElement);
        const width = Math.round(Math.abs(bounds.width));
        const height = Math.round(Math.abs(bounds.height));
        const label = `${width} × ${height}`;

        ctx.save();
        ctx.fillStyle = '#2196f3';
        ctx.font = `${14 / zoomLevel}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Draw background for label
        const metrics = ctx.measureText(label);
        const padding = 6 / zoomLevel;
        const labelWidth = metrics.width + padding * 2;
        const labelHeight = 20 / zoomLevel;
        const labelX = bounds.x + bounds.width / 2;
        const labelY = bounds.y - 10 / zoomLevel;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 1 / zoomLevel;
        ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight, labelWidth, labelHeight);
        ctx.strokeRect(labelX - labelWidth / 2, labelY - labelHeight, labelWidth, labelHeight);

        ctx.fillStyle = '#2196f3';
        ctx.fillText(label, labelX, labelY - padding);
        ctx.restore();
    }

    // Restore context
    ctx.restore();

    // Draw rulers (after restore, in screen coordinates)
    if (showRulers) {
        drawRulers();
    }
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
            const lineHeight = fontSize * 1.2;

            // Check if this is text with a parent (shape or connector)
            if (element.parentId) {
                const parent = elements.find(el => el.id === element.parentId);
                if (parent) {
                    // Check if parent is an arrow or line
                    if (parent.type === 'arrow' || parent.type === 'line') {
                        // Determine label position based on connector type
                        let labelX, labelY, defaultOffsetX = 0, defaultOffsetY = 0;

                        if (parent.lineRouting === 'stepped') {
                            // For stepped lines, position on the first segment
                            const x1 = parent.x;
                            const y1 = parent.y;
                            const x2 = parent.x + parent.width;
                            const y2 = parent.y + parent.height;

                            const absWidth = Math.abs(parent.width);
                            const absHeight = Math.abs(parent.height);

                            if (absWidth > absHeight) {
                                // More horizontal - label on horizontal segment
                                labelX = (x1 + x2) / 2;
                                labelY = y1;
                                defaultOffsetY = -20;
                            } else {
                                // More vertical - label on vertical segment
                                labelX = x1;
                                labelY = (y1 + y2) / 2;
                                defaultOffsetX = 25;
                            }
                        } else {
                            // Straight connectors - position at midpoint
                            const absWidth = Math.abs(parent.width);
                            const absHeight = Math.abs(parent.height);

                            labelX = parent.x + parent.width / 2;
                            labelY = parent.y + parent.height / 2;

                            if (absWidth > absHeight) {
                                defaultOffsetY = -20;
                            } else {
                                defaultOffsetX = 25;
                            }
                        }

                        // Use custom offset if present
                        const offsetX = element.offsetX !== undefined ? element.offsetX : defaultOffsetX;
                        const offsetY = element.offsetY !== undefined ? element.offsetY : defaultOffsetY;

                        const metrics = ctx.measureText(element.text || '');
                        const textWidth = metrics.width || 20;
                        const textHeight = fontSize * 1.2;

                        return {
                            x: labelX + offsetX - textWidth / 2,
                            y: labelY + offsetY - textHeight / 2,
                            width: textWidth,
                            height: textHeight
                        };
                    } else {
                        // Parent is a shape - calculate wrapped text bounds
                        const shapeWidth = Math.abs(parent.width || 100);
                        const shapeHeight = Math.abs(parent.height || 100);
                        const centerX = parent.x + shapeWidth / 2;
                        const centerY = parent.y + shapeHeight / 2;
                        const maxWidth = shapeWidth * 0.9;

                        // Calculate wrapped lines
                        const wrappedLines = [];
                        const inputLines = (element.text || '').split('\n');

                        inputLines.forEach(line => {
                            const words = line.split(' ');
                            let currentLine = '';

                            words.forEach((word) => {
                                const testLine = currentLine ? currentLine + ' ' + word : word;
                                const metrics = ctx.measureText(testLine);

                                if (metrics.width > maxWidth && currentLine) {
                                    wrappedLines.push(currentLine);
                                    currentLine = word;
                                } else {
                                    currentLine = testLine;
                                }
                            });

                            if (currentLine) {
                                wrappedLines.push(currentLine);
                            }
                        });

                        const totalHeight = wrappedLines.length * lineHeight;
                        const startY = centerY - totalHeight / 2;

                        // Return bounds that encompass the wrapped text
                        return {
                            x: centerX - maxWidth / 2,
                            y: startY,
                            width: maxWidth,
                            height: totalHeight
                        };
                    }
                }
            }

            // Regular text (not parented to anything)
            // If text has explicit width/height, use those (resizable text box)
            if (element.width !== undefined && element.height !== undefined) {
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                };
            }

            // Otherwise calculate bounds based on content
            const lines = (element.text || '').split('\n');
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

// Helper function to check if a point is near a line segment
function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Line is a point
        return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    // Parameter t represents position along the line (0 = start, 1 = end)
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    // Closest point on the line segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Distance from point to closest point on line
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

function getElementAtPoint(x, y) {
    for (let i = elements.length - 1; i >= 0; i--) {
        // Skip locked elements
        if (elements[i].locked) continue;

        const element = elements[i];

        // Special handling for lines and arrows - check distance to line path
        if (element.type === 'line' || element.type === 'arrow') {
            const x1 = element.x;
            const y1 = element.y;
            const x2 = element.x + element.width;
            const y2 = element.y + element.height;

            // Increase click tolerance for easier selection (10 pixels)
            const tolerance = 10;

            if (element.lineRouting === 'stepped') {
                // For stepped routing, check all three segments
                const dx = x2 - x1;
                const dy = y2 - y1;

                // Determine bend point
                let bendX, bendY;
                if (element.bendPoint) {
                    bendX = element.bendPoint.x;
                    bendY = element.bendPoint.y;
                } else if (Math.abs(dx) > Math.abs(dy)) {
                    bendX = (x1 + x2) / 2;
                    bendY = y1;
                } else {
                    bendX = x1;
                    bendY = (y1 + y2) / 2;
                }

                // Check distance to each segment
                const dist1 = distanceToLineSegment(x, y, x1, y1, bendX, bendY);
                const dist2 = distanceToLineSegment(x, y, bendX, bendY, x2, y2);

                if (Math.min(dist1, dist2) <= tolerance) {
                    return element;
                }
            } else {
                // Straight routing
                const dist = distanceToLineSegment(x, y, x1, y1, x2, y2);
                if (dist <= tolerance) {
                    return element;
                }
            }
            continue;
        }

        // Regular bounding box check for other elements
        const bounds = getElementBounds(element);
        if (x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height) {
            return element;
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

// Get the bend point position for a stepped arrow/line
function getSteppedBendPoint(element) {
    if (!element || (element.type !== 'arrow' && element.type !== 'line') || element.lineRouting !== 'stepped') {
        return null;
    }

    const x1 = element.x;
    const y1 = element.y;
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;

    // If there's a custom bend point, use it
    if (element.bendPoint) {
        return element.bendPoint;
    }

    // Use anchor information if available
    if (element.startAnchor && element.endAnchor) {
        const startIsHorizontal = element.startAnchor === 'left' || element.startAnchor === 'right';
        const endIsHorizontal = element.endAnchor === 'left' || element.endAnchor === 'right';

        if (startIsHorizontal && endIsHorizontal) {
            // Both horizontal - bend point is at the midpoint
            const midX = (x1 + x2) / 2;
            return { x: midX, y: y1 };
        } else if (!startIsHorizontal && !endIsHorizontal) {
            // Both vertical - bend point is at the midpoint
            const midY = (y1 + y2) / 2;
            return { x: x1, y: midY };
        } else if (startIsHorizontal && !endIsHorizontal) {
            // Start horizontal, end vertical - bend at the turn
            return { x: x2, y: y1 };
        } else {
            // Start vertical, end horizontal - bend at the turn
            return { x: x1, y: y2 };
        }
    }

    // Fallback to old logic if no anchor info
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    if (dx > dy) {
        const midX = (x1 + x2) / 2;
        return { x: midX, y: y1 };
    } else {
        const midY = (y1 + y2) / 2;
        return { x: x1, y: midY };
    }
}

function getResizeHandle(x, y) {
    if (!selectedElement) return null;

    // Special handling for lines and arrows - check endpoint handles
    if (selectedElement.type === 'line' || selectedElement.type === 'arrow') {
        const x1 = selectedElement.x;
        const y1 = selectedElement.y;
        const x2 = selectedElement.x + selectedElement.width;
        const y2 = selectedElement.y + selectedElement.height;

        // Check start point (larger tolerance for easier clicking)
        if (Math.abs(x - x1) < 10 && Math.abs(y - y1) < 10) {
            return { x: x1, y: y1, position: 'start', cursor: 'move' };
        }

        // Check end point
        if (Math.abs(x - x2) < 10 && Math.abs(y - y2) < 10) {
            return { x: x2, y: y2, position: 'end', cursor: 'move' };
        }

        return null;
    }

    // Regular resize handles for other elements
    const bounds = getElementBounds(selectedElement);
    const handles = getResizeHandles(bounds);

    for (const handle of handles) {
        if (Math.abs(x - handle.x) < 8 && Math.abs(y - handle.y) < 8) {
            return handle;
        }
    }
    return null;
}

// Check if mouse is over bend point handle
function getBendPointHandle(x, y) {
    if (!selectedElement) return null;
    if ((selectedElement.type !== 'arrow' && selectedElement.type !== 'line') ||
        selectedElement.lineRouting !== 'stepped') {
        return null;
    }

    const bendPoint = getSteppedBendPoint(selectedElement);
    if (!bendPoint) return null;

    // Check if mouse is within 10 pixels of the bend point
    if (Math.abs(x - bendPoint.x) < 10 && Math.abs(y - bendPoint.y) < 10) {
        return bendPoint;
    }

    return null;
}

// Find smart guides for alignment when dragging elements
function findSmartGuides(draggingElements) {
    const guides = [];
    const draggingIds = new Set(draggingElements.map(el => el.id).filter(id => id));

    // Get bounds of all dragging elements
    const draggingBounds = [];
    draggingElements.forEach(el => {
        if (el.type === 'text' && el.parentId && draggingIds.has(el.parentId)) {
            // Skip child text - it moves with parent
            return;
        }
        const bounds = getElementBounds(el);
        if (bounds) {
            draggingBounds.push({
                ...bounds,
                centerX: bounds.x + bounds.width / 2,
                centerY: bounds.y + bounds.height / 2,
                right: bounds.x + bounds.width,
                bottom: bounds.y + bounds.height
            });
        }
    });

    if (draggingBounds.length === 0) return guides;

    // Get bounds of all other (reference) elements
    const referenceElements = elements.filter(el => {
        // Skip dragging elements and their children
        if (draggingIds.has(el.id)) return false;
        if (el.type === 'text' && el.parentId && draggingIds.has(el.parentId)) return false;
        // Skip locked elements
        if (el.locked) return false;
        return true;
    });

    // Check each dragging element against each reference element
    draggingBounds.forEach(dragBounds => {
        referenceElements.forEach(refEl => {
            const refBounds = getElementBounds(refEl);
            if (!refBounds) return;

            const refCenterX = refBounds.x + refBounds.width / 2;
            const refCenterY = refBounds.y + refBounds.height / 2;
            const refRight = refBounds.x + refBounds.width;
            const refBottom = refBounds.y + refBounds.height;

            // Check vertical alignments
            const verticalAlignments = [
                { pos: refBounds.x, dragPos: dragBounds.x, type: 'left' },
                { pos: refCenterX, dragPos: dragBounds.centerX, type: 'center' },
                { pos: refRight, dragPos: dragBounds.right, type: 'right' }
            ];

            verticalAlignments.forEach(align => {
                if (Math.abs(align.pos - align.dragPos) < SNAP_THRESHOLD) {
                    // Calculate vertical gap between elements (when they're vertically aligned)
                    let gap = null;

                    // Check if dragged element is above reference
                    if (dragBounds.bottom < refBounds.y) {
                        gap = refBounds.y - dragBounds.bottom;
                    }
                    // Check if dragged element is below reference
                    else if (dragBounds.y > refBottom) {
                        gap = dragBounds.y - refBottom;
                    }

                    const label = gap && gap > 1 ? `${Math.round(gap)}px` : null;

                    guides.push({
                        type: 'vertical',
                        position: align.pos,
                        label: label
                    });
                }
            });

            // Check horizontal alignments
            const horizontalAlignments = [
                { pos: refBounds.y, dragPos: dragBounds.y, type: 'top' },
                { pos: refCenterY, dragPos: dragBounds.centerY, type: 'middle' },
                { pos: refBottom, dragPos: dragBounds.bottom, type: 'bottom' }
            ];

            horizontalAlignments.forEach(align => {
                if (Math.abs(align.pos - align.dragPos) < SNAP_THRESHOLD) {
                    // Calculate horizontal gap between elements (when they're horizontally aligned)
                    let gap = null;

                    // Check if dragged element is to the left of reference
                    if (dragBounds.right < refBounds.x) {
                        gap = refBounds.x - dragBounds.right;
                    }
                    // Check if dragged element is to the right of reference
                    else if (dragBounds.x > refRight) {
                        gap = dragBounds.x - refRight;
                    }

                    const label = gap && gap > 1 ? `${Math.round(gap)}px` : null;

                    guides.push({
                        type: 'horizontal',
                        position: align.pos,
                        label: label
                    });
                }
            });
        });
    });

    // Remove duplicate guides (same type and position)
    const uniqueGuides = [];
    const seen = new Set();
    guides.forEach(guide => {
        const key = `${guide.type}-${guide.position}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueGuides.push(guide);
        }
    });

    return uniqueGuides;
}

// Apply smart guide snapping to drag delta
function applySmartGuideSnapping(draggingElements, dx, dy) {
    const draggingIds = new Set(draggingElements.map(el => el.id).filter(id => id));

    // Get bounds of first dragging element (primary element for snapping)
    const primaryEl = draggingElements.find(el =>
        !(el.type === 'text' && el.parentId && draggingIds.has(el.parentId))
    );

    if (!primaryEl) return { dx, dy };

    const bounds = getElementBounds(primaryEl);
    if (!bounds) return { dx, dy };

    const newBounds = {
        x: bounds.x + dx,
        y: bounds.y + dy,
        width: bounds.width,
        height: bounds.height,
        centerX: bounds.x + dx + bounds.width / 2,
        centerY: bounds.y + dy + bounds.height / 2,
        right: bounds.x + dx + bounds.width,
        bottom: bounds.y + dy + bounds.height
    };

    // Get reference elements
    const referenceElements = elements.filter(el => {
        if (draggingIds.has(el.id)) return false;
        if (el.type === 'text' && el.parentId && draggingIds.has(el.parentId)) return false;
        if (el.locked) return false;
        return true;
    });

    let snapDx = 0;
    let snapDy = 0;
    let minDistX = SNAP_THRESHOLD;
    let minDistY = SNAP_THRESHOLD;

    // Find closest snap points
    referenceElements.forEach(refEl => {
        const refBounds = getElementBounds(refEl);
        if (!refBounds) return;

        const refCenterX = refBounds.x + refBounds.width / 2;
        const refCenterY = refBounds.y + refBounds.height / 2;
        const refRight = refBounds.x + refBounds.width;
        const refBottom = refBounds.y + refBounds.height;

        // Check vertical snapping (X alignment)
        const verticalChecks = [
            { ref: refBounds.x, drag: newBounds.x },
            { ref: refCenterX, drag: newBounds.centerX },
            { ref: refRight, drag: newBounds.right }
        ];

        verticalChecks.forEach(check => {
            const dist = Math.abs(check.ref - check.drag);
            if (dist < minDistX) {
                minDistX = dist;
                snapDx = check.ref - check.drag;
            }
        });

        // Check horizontal snapping (Y alignment)
        const horizontalChecks = [
            { ref: refBounds.y, drag: newBounds.y },
            { ref: refCenterY, drag: newBounds.centerY },
            { ref: refBottom, drag: newBounds.bottom }
        ];

        horizontalChecks.forEach(check => {
            const dist = Math.abs(check.ref - check.drag);
            if (dist < minDistY) {
                minDistY = dist;
                snapDy = check.ref - check.drag;
            }
        });
    });

    return {
        dx: dx + snapDx,
        dy: dy + snapDy
    };
}

function moveElement(element, dx, dy) {
    // Special handling for text elements with connector parents
    if (element.type === 'text' && element.parentId) {
        const parent = elements.find(el => el.id === element.parentId);
        if (parent && (parent.type === 'arrow' || parent.type === 'line')) {
            // For connector labels, update the offset instead of x,y
            const currentOffsetX = element.offsetX !== undefined ? element.offsetX : 0;
            const currentOffsetY = element.offsetY !== undefined ? element.offsetY : 0;
            element.offsetX = currentOffsetX + dx;
            element.offsetY = currentOffsetY + dy;
            return; // Don't proceed with regular movement
        }
    }

    if (element.type === 'pen') {
        element.points = element.points.map(p => ({x: p.x + dx, y: p.y + dy}));
    } else {
        element.x += dx;
        element.y += dy;
    }

    // Also move any child text elements (except connector labels, which are handled above)
    if (element.id) {
        elements.forEach(el => {
            if (el.parentId === element.id && el.type === 'text') {
                const parent = elements.find(p => p.id === el.parentId);
                // Skip connector labels - they maintain their offset
                if (parent && (parent.type === 'arrow' || parent.type === 'line')) {
                    return;
                }
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
    if (element.type === 'pen') return; // Can't resize pen

    const bounds = getElementBounds(element);

    // Handle endpoint dragging for lines and arrows
    if ((element.type === 'line' || element.type === 'arrow') &&
        (handle.position === 'start' || handle.position === 'end')) {

        if (handle.position === 'start') {
            // Moving the start point - adjust x, y, width, height
            const deltaX = x - element.x;
            const deltaY = y - element.y;
            element.x = x;
            element.y = y;
            element.width -= deltaX;
            element.height -= deltaY;

            // Clear bend point when moving endpoints
            if (element.bendPoint) {
                delete element.bendPoint;
            }
        } else {
            // Moving the end point - adjust width and height only
            element.width = x - element.x;
            element.height = y - element.y;

            // Clear bend point when moving endpoints
            if (element.bendPoint) {
                delete element.bendPoint;
            }
        }
        return;
    }

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
            const fontSize = parseInt(fontSizeSelect.value);
            const textElement = {
                id: nextElementId++,
                type: 'text',
                x: x,
                y: y,
                width: 200, // Default text box width
                height: fontSize * 1.2, // Initial height based on font size
                text: text,
                strokeColor: strokeColorInput.value,
                textColor: textColorInput.value,
                fontFamily: selectedFont,
                fontSize: fontSize,
                bold: isBold,
                italic: isItalic
            };
            elements.push(textElement);
            lastCreatedShape = textElement; // Track for 'M' key duplication
            duplicationDirection = null;
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

// Text input for connectors (arrows/lines)
function createTextInputForConnector(midX, midY, connector) {
    const input = document.createElement('textarea');
    input.className = 'text-input';
    input.style.textAlign = 'center';
    input.value = 'Label'; // Pre-fill with "Label"
    const rect = canvas.getBoundingClientRect();

    // Determine label position based on connector type
    let labelX, labelY, defaultOffsetX = 0, defaultOffsetY = 0;

    if (connector.lineRouting === 'stepped') {
        const x1 = connector.x;
        const y1 = connector.y;
        const x2 = connector.x + connector.width;
        const y2 = connector.y + connector.height;
        const absWidth = Math.abs(connector.width);
        const absHeight = Math.abs(connector.height);

        if (absWidth > absHeight) {
            labelX = (x1 + x2) / 2;
            labelY = y1;
            defaultOffsetY = -20;
        } else {
            labelX = x1;
            labelY = (y1 + y2) / 2;
            defaultOffsetX = 25;
        }
    } else {
        const absWidth = Math.abs(connector.width);
        const absHeight = Math.abs(connector.height);
        labelX = connector.x + connector.width / 2;
        labelY = connector.y + connector.height / 2;

        if (absWidth > absHeight) {
            defaultOffsetY = -20;
        } else {
            defaultOffsetX = 25;
        }
    }

    // Position with default offset
    input.style.left = (rect.left + panOffsetX + (labelX + defaultOffsetX) * zoomLevel - 50) + 'px';
    input.style.top = (rect.top + panOffsetY + (labelY + defaultOffsetY) * zoomLevel - 12) + 'px';
    input.style.fontFamily = selectedFont;
    input.style.fontSize = fontSizeSelect.value + 'px';
    input.style.fontWeight = isBold ? 'bold' : 'normal';
    input.style.fontStyle = isItalic ? 'italic' : 'normal';
    input.style.color = textColorInput.value;
    input.style.width = '100px';
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
            const fontSize = parseInt(fontSizeSelect.value);

            const textElement = {
                id: nextElementId++,
                type: 'text',
                x: 0, // Position calculated dynamically based on parent
                y: 0,
                text: text,
                strokeColor: strokeColorInput.value,
                textColor: textColorInput.value,
                fontFamily: selectedFont,
                fontSize: fontSize,
                bold: isBold,
                italic: isItalic,
                parentId: connector.id // Link to parent connector
            };

            elements.push(textElement);
            saveHistory();
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
                // Build exclude IDs list for smart routing
                const excludeIds = [];
                if (element.startShapeId) excludeIds.push(element.startShapeId);
                if (element.endShapeId) excludeIds.push(element.endShapeId);

                const points = getSteppedPath(element.x, element.y, x2, y2, element.bendPoint, element.startAnchor, element.endAnchor, excludeIds, true);
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
                // Build exclude IDs list for smart routing
                const excludeIds = [];
                if (element.startShapeId) excludeIds.push(element.startShapeId);
                if (element.endShapeId) excludeIds.push(element.endShapeId);

                const points = getSteppedPath(element.x, element.y, ax2, ay2, element.bendPoint, element.startAnchor, element.endAnchor, excludeIds, true);
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

// Undo button - removed from UI, now keyboard-only (Ctrl/Cmd+Z)

// Format Painter Functions
function toggleFormatPainter(isDoubleClick = false) {
    if (isFormatPainterActive) {
        // Deactivate format painter
        deactivateFormatPainter();
    } else {
        // Activate format painter - copy format from selected element
        if (selectedElement) {
            copyFormat(selectedElement);
            activateFormatPainter(isDoubleClick);
        } else if (selectedElements.length === 1) {
            copyFormat(selectedElements[0]);
            activateFormatPainter(isDoubleClick);
        } else {
            alert('Please select a single element to copy its format');
        }
    }
}

function activateFormatPainter(multiApply = false) {
    isFormatPainterActive = true;
    formatPainterMultiApply = multiApply;
    const btn = document.getElementById('formatPainterBtn');
    if (btn) {
        btn.classList.add('active');
        // Add special styling for multi-apply mode
        if (multiApply) {
            btn.style.boxShadow = '0 0 0 2px #2196f3 inset';
        }
    }
    canvas.style.cursor = 'copy';

    // Deactivate connect mode if active
    if (isConnectMode) {
        isConnectMode = false;
    }

    // Switch to select tool
    currentTool = 'select';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const selectBtn = document.querySelector('[data-tool="select"]');
    if (selectBtn) selectBtn.classList.add('active');
}

function deactivateFormatPainter() {
    isFormatPainterActive = false;
    formatPainterMultiApply = false;
    const btn = document.getElementById('formatPainterBtn');
    if (btn) {
        btn.classList.remove('active');
        btn.style.boxShadow = '';
    }
    canvas.style.cursor = 'default';
    copiedFormat = null;
}

function copyFormat(element) {
    copiedFormat = {};

    // Copy common properties
    if (element.strokeColor !== undefined) copiedFormat.strokeColor = element.strokeColor;
    if (element.fillColor !== undefined) copiedFormat.fillColor = element.fillColor;
    if (element.shadow !== undefined) copiedFormat.shadow = element.shadow;
    if (element.lineStyle !== undefined) copiedFormat.lineStyle = element.lineStyle;
    if (element.lineThickness !== undefined) copiedFormat.lineThickness = element.lineThickness;
    if (element.lineRouting !== undefined) copiedFormat.lineRouting = element.lineRouting;

    // Copy text properties
    if (element.type === 'text') {
        if (element.textColor !== undefined) copiedFormat.textColor = element.textColor;
        if (element.fontFamily !== undefined) copiedFormat.fontFamily = element.fontFamily;
        if (element.fontSize !== undefined) copiedFormat.fontSize = element.fontSize;
        if (element.bold !== undefined) copiedFormat.bold = element.bold;
        if (element.italic !== undefined) copiedFormat.italic = element.italic;
    } else {
        // If this is a shape with child text, copy the child text properties
        // First try to find by parentId (for new diagrams)
        let childText = elements.find(el => el.type === 'text' && el.parentId === element.id);

        // Fallback: Find text that's positioned within the shape bounds (for old diagrams)
        if (!childText) {
            const bounds = getElementBounds(element);
            childText = elements.find(el => {
                if (el.type !== 'text' || el === element) return false;
                const textBounds = getElementBounds(el);
                // Check if text center is within shape bounds
                const textCenterX = textBounds.x + textBounds.width / 2;
                const textCenterY = textBounds.y + textBounds.height / 2;
                return textCenterX >= bounds.x && textCenterX <= bounds.x + bounds.width &&
                       textCenterY >= bounds.y && textCenterY <= bounds.y + bounds.height;
            });
        }

        if (childText) {
            if (childText.textColor !== undefined) copiedFormat.textColor = childText.textColor;
            if (childText.fontFamily !== undefined) copiedFormat.fontFamily = childText.fontFamily;
            if (childText.fontSize !== undefined) copiedFormat.fontSize = childText.fontSize;
            if (childText.bold !== undefined) copiedFormat.bold = childText.bold;
            if (childText.italic !== undefined) copiedFormat.italic = childText.italic;
        }
    }

    // Copy icon color
    if (element.type === 'icon' && element.color !== undefined) {
        copiedFormat.color = element.color;
    }
}

function applyFormat(element) {
    if (!copiedFormat) return;

    // Apply common properties
    if (copiedFormat.strokeColor !== undefined) element.strokeColor = copiedFormat.strokeColor;
    if (copiedFormat.fillColor !== undefined) element.fillColor = copiedFormat.fillColor;
    if (copiedFormat.shadow !== undefined) element.shadow = copiedFormat.shadow;
    if (copiedFormat.lineStyle !== undefined) element.lineStyle = copiedFormat.lineStyle;
    if (copiedFormat.lineThickness !== undefined) element.lineThickness = copiedFormat.lineThickness;
    if (copiedFormat.lineRouting !== undefined && (element.type === 'arrow' || element.type === 'line')) {
        element.lineRouting = copiedFormat.lineRouting;
    }

    // Apply text properties
    if (element.type === 'text') {
        if (copiedFormat.textColor !== undefined) element.textColor = copiedFormat.textColor;
        if (copiedFormat.fontFamily !== undefined) element.fontFamily = copiedFormat.fontFamily;
        if (copiedFormat.fontSize !== undefined) element.fontSize = copiedFormat.fontSize;
        if (copiedFormat.bold !== undefined) element.bold = copiedFormat.bold;
        if (copiedFormat.italic !== undefined) element.italic = copiedFormat.italic;
    } else {
        // If this is a shape with child text, apply text properties to the child
        // First try to find by parentId (for new diagrams)
        let childText = elements.find(el => el.type === 'text' && el.parentId === element.id);

        // Fallback: Find text that's positioned within the shape bounds (for old diagrams)
        if (!childText) {
            const bounds = getElementBounds(element);
            childText = elements.find(el => {
                if (el.type !== 'text' || el === element) return false;
                const textBounds = getElementBounds(el);
                // Check if text center is within shape bounds
                const textCenterX = textBounds.x + textBounds.width / 2;
                const textCenterY = textBounds.y + textBounds.height / 2;
                return textCenterX >= bounds.x && textCenterX <= bounds.x + bounds.width &&
                       textCenterY >= bounds.y && textCenterY <= bounds.y + bounds.height;
            });
        }

        if (childText) {
            if (copiedFormat.textColor !== undefined) childText.textColor = copiedFormat.textColor;
            if (copiedFormat.fontFamily !== undefined) childText.fontFamily = copiedFormat.fontFamily;
            if (copiedFormat.fontSize !== undefined) childText.fontSize = copiedFormat.fontSize;
            if (copiedFormat.bold !== undefined) childText.bold = copiedFormat.bold;
            if (copiedFormat.italic !== undefined) childText.italic = copiedFormat.italic;
        }
    }

    // Apply icon color
    if (element.type === 'icon' && copiedFormat.color !== undefined) {
        element.color = copiedFormat.color;
    }
}

// Format Painter
const formatPainterBtn = document.getElementById('formatPainterBtn');
if (formatPainterBtn) {
    formatPainterBtn.addEventListener('click', (e) => {
        const now = Date.now();
        const isDoubleClick = (now - formatPainterLastClick) < 300;
        formatPainterLastClick = now;

        toggleFormatPainter(isDoubleClick);
    });
}

// EyeDropper / Color Picker
const eyeDropperBtn = document.getElementById('eyeDropperBtn');
if (eyeDropperBtn) {
    // Check if EyeDropper API is supported
    if (!window.EyeDropper) {
        eyeDropperBtn.style.opacity = '0.5';
        eyeDropperBtn.title = 'Color Picker not supported in this browser';
        eyeDropperBtn.disabled = true;
    } else {
        eyeDropperBtn.addEventListener('click', async () => {
            try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();

                // Apply to stroke color by default
                // TODO: Could add a dropdown to choose which color to apply to
                strokeColorInput.value = result.sRGBHex;
                updateColorIcons();

            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('EyeDropper error:', err);
                }
            }
        });
    }
}

// Layout buttons
document.getElementById('layoutHorizontalBtn').addEventListener('click', () => {
    layoutHorizontal();
});

document.getElementById('layoutVerticalBtn').addEventListener('click', () => {
    layoutVertical();
});

// Export/Import
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear canvas?')) {
        elements = [];
        selectedElement = null;
        backgroundColor = '#FFFEF9';
        bgColorInput.value = '#FFFEF9';
        thingCounter = 1; // Reset the "Thing N" counter
        userHasMovedShapes = false; // Reset movement tracking for auto-layout
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
    try {
        console.log('exportAsPowerPoint called');
        console.log('canvasMode:', canvasMode);
        console.log('pages.length:', pages.length);
        console.log('elements.length:', elements.length);

        // Create a new PowerPoint presentation
        const pres = new PptxGenJS();

        // Helper function to get content bounds from elements
        function getContentBounds(elementsList) {
        if (elementsList.length === 0) {
            return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        elementsList.forEach(element => {
            const bounds = getElementBounds(element);
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });

        return { minX, minY, maxX, maxY };
    }

    // Helper function to create slide from elements
    function createSlideFromElements(elementsList, slideNumber) {
        // Calculate content bounds
        const bounds = getContentBounds(elementsList);
        const contentWidth = bounds.maxX - bounds.minX;
        const contentHeight = bounds.maxY - bounds.minY;
        const padding = 20; // pixels of padding around content

        // Create temporary canvas for cropped content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = contentWidth + padding * 2;
        tempCanvas.height = contentHeight + padding * 2;
        const tempCtx = tempCanvas.getContext('2d');

        // Fill with white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Save current state
        const oldPanX = panOffsetX;
        const oldPanY = panOffsetY;
        const oldZoom = zoomLevel;
        const oldElements = elements;
        const oldCanvas = canvas;
        const oldCtx = ctx;

        // Set up temp canvas context
        canvas = tempCanvas;
        ctx = tempCtx;
        elements = elementsList;
        zoomLevel = 1;
        panOffsetX = 0;
        panOffsetY = 0;

        // Set up canvas transformation like redraw() does
        ctx.save();
        ctx.translate(-bounds.minX + padding, -bounds.minY + padding);
        ctx.scale(1, 1);

        // Draw all elements
        console.log('Drawing', elementsList.length, 'elements to temp canvas');
        elementsList.forEach(element => {
            drawElement(element);
        });

        // Restore context
        ctx.restore();

        // Restore original state
        canvas = oldCanvas;
        ctx = oldCtx;
        panOffsetX = oldPanX;
        panOffsetY = oldPanY;
        zoomLevel = oldZoom;
        elements = oldElements;

        // Get image data from temp canvas
        const imageData = tempCanvas.toDataURL('image/png');

        // Add slide
        const slide = pres.addSlide();

        // Calculate dimensions to fit slide (standard 10" x 7.5" slide)
        // Convert canvas dimensions to inches (assuming 96 DPI)
        const canvasWidthInches = tempCanvas.width / 96;
        const canvasHeightInches = tempCanvas.height / 96;

        // Scale to fit within slide (max 9.8" x 7.3" to leave minimal margins)
        const maxWidth = 9.8;
        const maxHeight = 7.3;
        let width = canvasWidthInches;
        let height = canvasHeightInches;

        if (width > maxWidth || height > maxHeight) {
            const scaleW = maxWidth / width;
            const scaleH = maxHeight / height;
            const scale = Math.min(scaleW, scaleH);
            width = width * scale;
            height = height * scale;
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
    }

    // Check if we're in storybook mode with multiple pages
    if (canvasMode === 'storybook' && pages.length > 1) {
        // Export one slide per page
        console.log('Exporting', pages.length, 'pages to PowerPoint');
        pages.forEach((page, index) => {
            console.log('Creating slide', index + 1, 'with', (page.elements || []).length, 'elements');
            createSlideFromElements(page.elements || [], index + 1);
        });
    } else {
        // Export current view as single slide
        console.log('Exporting single slide with', elements.length, 'elements');
        createSlideFromElements(elements, 1);
    }

    // Save the presentation
    console.log('Calling pres.writeFile');
    pres.writeFile({ fileName: 'drawing.pptx' });
    console.log('PowerPoint export completed');

    } catch (error) {
        console.error('Error exporting to PowerPoint:', error);
        alert('Failed to export to PowerPoint: ' + error.message);
    }
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
        userHasMovedShapes = false; // Reset movement tracking for auto-layout
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
    if (rectangleDropdown) rectangleDropdown.classList.remove('active');
    if (circleDropdown) circleDropdown.classList.remove('active');
    if (shapeDropdown) shapeDropdown.classList.remove('active');
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
                userHasMovedShapes = false; // Reset movement tracking for auto-layout
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
        '2025-10-06': [
            'Font Awesome icon library - searchable selector with 60+ popular icons',
            'Icons are resizable, moveable, and color customizable',
            'Unified shape selector with all shapes and keyboard shortcuts (Shift+1-7)',
            'Style preset selector reorganized into 4-column grid layout',
            'Dynamic shape thumbnails in style presets - updates based on selected shape',
            'Style presets now include shadow and dashed line variants',
            'Removed slideshow feature from storybook mode',
            'Fixed splash screen hanging issue on load'
        ],
        '2025-10-05': [
            'Background pattern selector - dot grid, line grid, or blank backgrounds',
            'Pattern selector replaces grid toggle - select pattern or blank directly',
            'G key now toggles between blank and last selected pattern',
            'Smart anchor points - arrows snap to 9 anchor points per shape (corners, sides, center)',
            'Anchor points visible when shapes selected or drawing arrows for precise connections',
            'Arrows remember anchor points - stay connected when shapes move or resize',
            'Transform shapes - select shapes and click a shape tool to transform them while preserving connections',
            'Connected arrows automatically adjust when shapes are transformed',
            'Icons now work like shapes - drag to draw at desired size instead of fixed size',
            'Icon size scales based on smaller dimension to maintain aspect ratio',
            'Style preset selector moved to Style group for better organization',
            'Fixed zoom rendering artifacts',
            'Redo support with Ctrl/⌘+Y keyboard shortcut',
            'Removed Undo button from toolbar (use Ctrl/⌘+Z keyboard shortcut)',
            'Drop shadows for shapes - toggle with Shadow checkbox in toolbar',
            'Copy as Image - right-click selected elements and copy as PNG to clipboard (downloads in Safari)',
            'Quick create shapes with last used style (Shift+1-9/0) - persists across sessions',
            'Smart positioning: new shapes automatically offset to avoid overlapping existing objects',
            'Toolbar reorganized into labeled, color-coded groups (File, Tools, Style, View, Arrange, History, Export)',
            'Help panel reorganized into compact 5-column layout to avoid scrolling',
            'Keyboard shortcuts now use Ctrl/⌘ notation for cross-platform compatibility',
            'Removed automatic text from template shapes (use double-click to add text)',
            'Expanded shape library: 6 new flowchart shapes, 8 new geometric shapes, 8 Kubernetes shapes',
            'Flowchart: Predefined Process, Manual Input, Delay, Display, Manual Operation',
            'Shapes: Pentagon, Octagon, Trapezoid, Cross, Arrow Left/Right, Speech Bubble, Heart',
            'Kubernetes: Pod, Service, Deployment, ConfigMap, Secret, Ingress, Volume, Namespace',
            'Associated text now moves with shapes for all operations (copy/paste/duplicate/delete/z-order)',
            'Copy/paste/duplicate now retains associated text with shapes',
            'Delete now removes associated text when deleting shapes',
            'Bring to front/send to back now moves associated text with shapes',
            'Rulers and draggable guides (Shift+R to toggle rulers)',
            'Smart guides for alignment hints when dragging elements',
            'Right-click context menu with Copy/Paste/Delete/Z-order/Lock',
            'Double-click empty canvas to create rectangle with text',
            'Zoom indicator display (bottom-right corner)',
            'Multi-line text editing with wrapping (Shift+Enter for line breaks)',
            'Paste now pastes at cursor location instead of fixed offset',
            'Grid toggle (G)',
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
    loadPage(currentPageIndex - 1);
});

document.getElementById('nextPage').addEventListener('click', () => {
    loadPage(currentPageIndex + 1);
});

document.getElementById('addPage').addEventListener('click', () => {
    addNewPage();
});

// ============================================================================
// PAGE MANAGER
// ============================================================================

const pageManagerPanel = document.getElementById('pageManagerPanel');
const pageManagerBtn = document.getElementById('pageManagerBtn');
const pagesList = document.getElementById('pagesList');

// Open page manager
pageManagerBtn.addEventListener('click', () => {
    pageManagerPanel.classList.add('active');
    populatePagesList();
});

// Close page manager on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pageManagerPanel.classList.contains('active')) {
        pageManagerPanel.classList.remove('active');
        e.preventDefault();
    }
});

// Close page manager on background click
pageManagerPanel.addEventListener('click', (e) => {
    if (e.target === pageManagerPanel) {
        pageManagerPanel.classList.remove('active');
    }
});

// Add blank page button
document.getElementById('addBlankPageBtn').addEventListener('click', () => {
    addBlankPage();
    populatePagesList();
});

// Duplicate page button
document.getElementById('duplicatePageBtn').addEventListener('click', () => {
    addNewPage();
    populatePagesList();
});

function addBlankPage() {
    // Save current page
    saveCurrentPage();

    // Create blank page
    const newPage = {
        elements: [],
        backgroundColor: '#FFFEF9'
    };

    // Add new page after current
    pages.splice(currentPageIndex + 1, 0, newPage);

    // Navigate to new page
    loadPage(currentPageIndex + 1);
}

function populatePagesList() {
    pagesList.innerHTML = '';

    pages.forEach((page, index) => {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        if (index === currentPageIndex) {
            pageItem.classList.add('active');
        }

        pageItem.innerHTML = `
            <div class="page-item-header">
                <div class="page-item-title">Page ${index + 1}</div>
                <div class="page-item-actions">
                    ${index > 0 ? '<button class="page-item-btn" data-action="moveUp" title="Move Up"><i class="fas fa-arrow-up"></i></button>' : ''}
                    ${index < pages.length - 1 ? '<button class="page-item-btn" data-action="moveDown" title="Move Down"><i class="fas fa-arrow-down"></i></button>' : ''}
                    ${pages.length > 1 ? '<button class="page-item-btn delete" data-action="delete" title="Delete Page"><i class="fas fa-trash"></i></button>' : ''}
                </div>
            </div>
            <div class="page-item-thumbnail">
                ${page.elements.length} element${page.elements.length !== 1 ? 's' : ''}
            </div>
        `;

        // Click to navigate to page
        pageItem.addEventListener('click', (e) => {
            if (!e.target.closest('.page-item-btn')) {
                loadPage(index);
                pageManagerPanel.classList.remove('active');
            }
        });

        // Action buttons
        pageItem.querySelectorAll('.page-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;

                if (action === 'moveUp') {
                    movePageUp(index);
                } else if (action === 'moveDown') {
                    movePageDown(index);
                } else if (action === 'delete') {
                    deletePage(index);
                }
            });
        });

        pagesList.appendChild(pageItem);
    });
}

function movePageUp(index) {
    if (index > 0) {
        // Save current page before moving
        saveCurrentPage();

        // Swap pages
        [pages[index], pages[index - 1]] = [pages[index - 1], pages[index]];

        // Adjust current page index if needed
        if (currentPageIndex === index) {
            currentPageIndex = index - 1;
        } else if (currentPageIndex === index - 1) {
            currentPageIndex = index;
        }

        populatePagesList();
        updatePageCounter();
        redraw();
    }
}

function movePageDown(index) {
    if (index < pages.length - 1) {
        // Save current page before moving
        saveCurrentPage();

        // Swap pages
        [pages[index], pages[index + 1]] = [pages[index + 1], pages[index]];

        // Adjust current page index if needed
        if (currentPageIndex === index) {
            currentPageIndex = index + 1;
        } else if (currentPageIndex === index + 1) {
            currentPageIndex = index;
        }

        populatePagesList();
        updatePageCounter();
        redraw();
    }
}

function deletePage(index) {
    if (pages.length > 1 && confirm(`Delete Page ${index + 1}?`)) {
        pages.splice(index, 1);

        // Adjust current page index
        if (currentPageIndex >= pages.length) {
            currentPageIndex = pages.length - 1;
        } else if (currentPageIndex > index) {
            currentPageIndex--;
        }

        // Load the adjusted page
        const page = pages[currentPageIndex];
        elements = JSON.parse(JSON.stringify(page.elements));
        backgroundColor = page.backgroundColor;
        bgColorInput.value = backgroundColor;
        updateColorLabel('bgColor', 'bgLabel');

        populatePagesList();
        updatePageCounter();
        redraw();
    }
}

// ============================================================================
// SETTINGS DIALOG
// ============================================================================

// Default settings
const defaultSettings = {
    strokeColor: '#556B2F',
    fillColor: '#D8E4BC',
    textColor: '#556B2F',
    fillEnabled: true,
    shadowEnabled: false,
    opacity: 1.0,
    backgroundColor: '#FFFEF9',
    backgroundPattern: 'line-grid',
    showRulers: false,
    showSizeDistance: false,
    darkMode: false,
    canvasMode: 'infinite',
    fontFamily: 'Comic Sans MS, cursive',
    fontSize: 16
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('andraw_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            return { ...defaultSettings, ...settings };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return { ...defaultSettings };
        }
    }

    return { ...defaultSettings };
}

// Save settings to localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem('andraw_settings', JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// Apply settings to application
function applySettings(settings) {
    // Apply style settings
    if (settings.strokeColor) strokeColorInput.value = settings.strokeColor;
    if (settings.fillColor) fillColorInput.value = settings.fillColor;
    if (settings.textColor) textColorInput.value = settings.textColor;
    if (settings.fillEnabled !== undefined) fillEnabledInput.checked = settings.fillEnabled;
    if (settings.shadowEnabled !== undefined) shadowEnabledInput.checked = settings.shadowEnabled;
    if (settings.opacity !== undefined) {
        currentOpacity = settings.opacity;
        opacitySlider.value = settings.opacity * 100;
        opacityValue.textContent = Math.round(settings.opacity * 100) + '%';
    }

    // Update color icons to reflect the new colors
    updateColorIcons();

    // Apply view defaults
    backgroundColor = settings.backgroundColor;
    bgColorInput.value = settings.backgroundColor;
    currentBackgroundPattern = settings.backgroundPattern;
    lastNonBlankPattern = settings.backgroundPattern !== 'blank' ? settings.backgroundPattern : 'line-grid';
    showRulers = settings.showRulers;
    showSizeDistance = settings.showSizeDistance !== undefined ? settings.showSizeDistance : false;
    darkMode = settings.darkMode !== undefined ? settings.darkMode : false;

    // Apply dark mode
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // Apply canvas mode
    canvasMode = settings.canvasMode;
    if (canvasMode === 'storybook' && pages.length === 0) {
        initializePages();
    }
    updateModeUI();

    // Apply text defaults
    selectedFont = settings.fontFamily;
    fontBtnText.textContent = settings.fontFamily.split(',')[0].replace(/['"]/g, '');
    fontSizeSelect.value = settings.fontSize;

    redraw();
}

// Populate settings dialog with current values
function populateSettingsDialog() {
    const settings = loadSettings();

    // Populate style controls with current values
    const settingsStrokeColor = document.getElementById('settingsStrokeColor');
    const settingsFillColor = document.getElementById('settingsFillColor');
    const settingsTextColor = document.getElementById('settingsTextColor');
    const settingsFillEnabled = document.getElementById('settingsFillEnabled');
    const settingsShadowEnabled = document.getElementById('settingsShadowEnabled');
    const settingsOpacitySlider = document.getElementById('settingsOpacitySlider');
    const settingsOpacityValue = document.getElementById('settingsOpacityValue');

    if (settingsStrokeColor) {
        settingsStrokeColor.value = strokeColorInput.value;
        const swatch = document.getElementById('settingsStrokeSwatch');
        if (swatch) swatch.style.backgroundColor = strokeColorInput.value;
    }

    if (settingsFillColor) {
        settingsFillColor.value = fillColorInput.value;
        const swatch = document.getElementById('settingsFillSwatch');
        if (swatch) swatch.style.backgroundColor = fillColorInput.value;
    }

    if (settingsTextColor) {
        settingsTextColor.value = textColorInput.value;
        const swatch = document.getElementById('settingsTextSwatch');
        if (swatch) swatch.style.backgroundColor = textColorInput.value;
    }

    if (settingsFillEnabled) {
        settingsFillEnabled.checked = fillEnabledInput.checked;
    }

    if (settingsShadowEnabled) {
        settingsShadowEnabled.checked = shadowEnabledInput.checked;
    }

    if (settingsOpacitySlider && settingsOpacityValue) {
        settingsOpacitySlider.value = currentOpacity * 100;
        settingsOpacityValue.textContent = Math.round(currentOpacity * 100) + '%';

        // Add live update for settings opacity slider
        settingsOpacitySlider.addEventListener('input', (e) => {
            settingsOpacityValue.textContent = e.target.value + '%';
        });
    }

    // Set font text and value
    const fontName = settings.fontFamily.split(',')[0].replace(/['"]/g, '');
    document.getElementById('settingsFontText').textContent = fontName;
    settingsCurrentFont = settings.fontFamily;

    document.getElementById('settingsBackgroundColor').value = settings.backgroundColor;
    document.getElementById('settingsBackgroundPattern').value = settings.backgroundPattern;
    document.getElementById('settingsShowRulers').checked = settings.showRulers;
    document.getElementById('settingsShowSizeDistance').checked = settings.showSizeDistance !== undefined ? settings.showSizeDistance : false;
    document.getElementById('settingsDarkMode').checked = settings.darkMode !== undefined ? settings.darkMode : false;
    document.getElementById('settingsCanvasMode').value = settings.canvasMode;
    document.getElementById('settingsFontSize').value = settings.fontSize;

    // Add live color swatch updates
    if (settingsStrokeColor) {
        settingsStrokeColor.addEventListener('input', (e) => {
            const swatch = document.getElementById('settingsStrokeSwatch');
            if (swatch) swatch.style.backgroundColor = e.target.value;
        });
    }

    if (settingsFillColor) {
        settingsFillColor.addEventListener('input', (e) => {
            const swatch = document.getElementById('settingsFillSwatch');
            if (swatch) swatch.style.backgroundColor = e.target.value;
        });
    }

    if (settingsTextColor) {
        settingsTextColor.addEventListener('input', (e) => {
            const swatch = document.getElementById('settingsTextSwatch');
            if (swatch) swatch.style.backgroundColor = e.target.value;
        });
    }

    // Update the button icon to reflect current colors
    if (settingsStyleBtn) {
        const btnSvg = settingsStyleBtn.querySelector('rect');
        if (btnSvg) {
            btnSvg.setAttribute('stroke', strokeColorInput.value);
            btnSvg.setAttribute('fill', fillColorInput.value);
        }
    }

    // Update preset previews in settings dropdown
    updateSettingsPresetPreviews();
}

// Update preset previews in settings dialog
function updateSettingsPresetPreviews() {
    const shapePath = getShapeSVGPath('rectangle'); // Always use rectangle for settings preview

    if (!settingsStyleDropdown) return;

    settingsStyleDropdown.querySelectorAll('.preset-grid-item').forEach(item => {
        const preset = item.dataset.preset;
        const svg = item.querySelector('.preset-preview');

        if (preset && svg) {
            // Parse preset name
            const parts = preset.split('-');
            const basePreset = parts[0];
            const hasShadow = parts.includes('shadow');
            const hasDashed = parts.includes('dashed');

            const colors = stylePresets[basePreset];
            if (colors) {
                const strokeDasharray = hasDashed ? '2,2' : '';
                const filter = hasShadow ? 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' : '';

                svg.innerHTML = shapePath;
                svg.style.filter = filter;

                const shape = svg.querySelector('rect, circle, path');
                if (shape) {
                    shape.setAttribute('fill', colors.fill);
                    shape.setAttribute('stroke', colors.stroke);
                    shape.setAttribute('stroke-width', '2');
                    if (strokeDasharray) {
                        shape.setAttribute('stroke-dasharray', strokeDasharray);
                    }
                }
            }
        }
    });
}

// Settings dialog event handlers
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const settingsSaveBtn = document.getElementById('settingsSave');
const settingsResetBtn = document.getElementById('settingsReset');
const settingsCloseBtn = document.getElementById('settingsClose');

// Settings font state
let settingsCurrentFont = 'Comic Sans MS, cursive';

// Settings style dropdown
const settingsStyleBtn = document.getElementById('settingsStyleBtn');
const settingsStyleDropdown = document.getElementById('settingsStyleDropdown');

if (settingsStyleBtn) {
    settingsStyleBtn.addEventListener('click', () => {
        settingsStyleDropdown.classList.toggle('active');
        const settingsFontDropdown = document.getElementById('settingsFontDropdown');
        if (settingsFontDropdown) settingsFontDropdown.classList.remove('active');
    });
}

// Settings preset thumbnail clicks
if (settingsStyleDropdown) {
    settingsStyleDropdown.querySelectorAll('.preset-grid-item').forEach(item => {
        item.addEventListener('click', () => {
            const preset = item.dataset.preset;

            // Parse preset and update individual controls
            const presetParts = preset.split('-');
            const basePreset = presetParts[0];
            const hasShadow = presetParts.includes('shadow');

            const presetColors = stylePresets[basePreset];
            if (presetColors) {
                // Update color inputs and swatches
                const settingsStrokeColor = document.getElementById('settingsStrokeColor');
                const settingsFillColor = document.getElementById('settingsFillColor');
                const settingsTextColor = document.getElementById('settingsTextColor');
                const settingsShadowEnabled = document.getElementById('settingsShadowEnabled');

                if (settingsStrokeColor) {
                    settingsStrokeColor.value = presetColors.stroke;
                    const swatch = document.getElementById('settingsStrokeSwatch');
                    if (swatch) swatch.style.backgroundColor = presetColors.stroke;
                }

                if (settingsFillColor) {
                    settingsFillColor.value = presetColors.fill;
                    const swatch = document.getElementById('settingsFillSwatch');
                    if (swatch) swatch.style.backgroundColor = presetColors.fill;
                }

                if (settingsTextColor) {
                    settingsTextColor.value = presetColors.stroke;
                    const swatch = document.getElementById('settingsTextSwatch');
                    if (swatch) swatch.style.backgroundColor = presetColors.stroke;
                }

                if (settingsShadowEnabled) {
                    settingsShadowEnabled.checked = hasShadow;
                }

                // Update the icon preview on the button
                const btnSvg = settingsStyleBtn.querySelector('rect');
                if (btnSvg) {
                    btnSvg.setAttribute('stroke', presetColors.stroke);
                    btnSvg.setAttribute('fill', presetColors.fill);
                }
            }
        });
    });
}

// Settings font dropdown
const settingsFontBtn = document.getElementById('settingsFontBtn');
const settingsFontDropdown = document.getElementById('settingsFontDropdown');

settingsFontBtn.addEventListener('click', () => {
    settingsFontDropdown.classList.toggle('active');
    settingsStyleDropdown.classList.remove('active');
});

settingsFontDropdown.querySelectorAll('.font-item').forEach(item => {
    item.addEventListener('click', () => {
        const font = item.dataset.font;
        const name = item.dataset.name;
        settingsCurrentFont = font;
        document.getElementById('settingsFontText').textContent = name;
        settingsFontDropdown.classList.remove('active');
    });
});

// Open settings dialog
settingsBtn.addEventListener('click', () => {
    populateSettingsDialog();
    settingsModal.classList.add('active');

    // Close logo dropdown if open
    const logoDropdown = document.getElementById('logoDropdown');
    if (logoDropdown) {
        logoDropdown.classList.remove('active');
    }
});

// Close settings dialog
settingsCloseBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

// Close on outside click
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

// Close dropdowns when clicking outside (only when modal is active)
document.addEventListener('click', (e) => {
    if (settingsModal.classList.contains('active')) {
        if (settingsStyleBtn && settingsStyleDropdown &&
            !settingsStyleBtn.contains(e.target) && !settingsStyleDropdown.contains(e.target)) {
            settingsStyleDropdown.classList.remove('active');
        }
        if (settingsFontBtn && settingsFontDropdown &&
            !settingsFontBtn.contains(e.target) && !settingsFontDropdown.contains(e.target)) {
            settingsFontDropdown.classList.remove('active');
        }
    }
});

// Save and apply settings
settingsSaveBtn.addEventListener('click', () => {
    const settingsOpacitySlider = document.getElementById('settingsOpacitySlider');
    const settings = {
        strokeColor: document.getElementById('settingsStrokeColor').value,
        fillColor: document.getElementById('settingsFillColor').value,
        textColor: document.getElementById('settingsTextColor').value,
        fillEnabled: document.getElementById('settingsFillEnabled').checked,
        shadowEnabled: document.getElementById('settingsShadowEnabled').checked,
        opacity: settingsOpacitySlider ? parseInt(settingsOpacitySlider.value) / 100 : 1.0,
        backgroundColor: document.getElementById('settingsBackgroundColor').value,
        backgroundPattern: document.getElementById('settingsBackgroundPattern').value,
        showRulers: document.getElementById('settingsShowRulers').checked,
        showSizeDistance: document.getElementById('settingsShowSizeDistance').checked,
        darkMode: document.getElementById('settingsDarkMode').checked,
        canvasMode: document.getElementById('settingsCanvasMode').value,
        fontFamily: settingsCurrentFont,
        fontSize: parseInt(document.getElementById('settingsFontSize').value)
    };

    saveSettings(settings);
    applySettings(settings);
    settingsModal.classList.remove('active');
});

// Reset to defaults
settingsResetBtn.addEventListener('click', () => {
    if (confirm('Reset all settings to defaults? This will reload the page.')) {
        localStorage.removeItem('andraw_settings');
        // Also remove old individual settings for clean slate
        localStorage.removeItem('andraw_backgroundColor');
        localStorage.removeItem('andraw_canvasMode');
        location.reload();
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize canvas
resizeCanvas();

// Splash screen handling - show for 0.75 seconds
(function() {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                if (splashScreen.parentNode) {
                    splashScreen.parentNode.removeChild(splashScreen);
                }
            }, 250);
        }, 750);
    }
})();

// Load and apply settings from localStorage on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const savedSettings = loadSettings();
    applySettings(savedSettings);
});

// Load last used styles from localStorage
loadLastUsedStyles();

// Ensure all elements have IDs (for backward compatibility)
ensureElementIds();

// Initialize undo history with empty state
saveHistory();

// Initialize mode UI (handled by applySettings now)
// updateModeUI();
