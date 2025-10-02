// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60; // Account for toolbar
    if (typeof redraw === 'function') redraw();
}
window.addEventListener('resize', resizeCanvas);
// Will call resizeCanvas() after functions are defined

// State
let elements = [];
let currentTool = 'select';
let isDrawing = false;
let startX, startY;
let selectedElement = null;
let dragMode = null; // 'move' or 'resize'
let resizeHandle = null;

// Stroke and fill settings
const strokeColorInput = document.getElementById('strokeColor');
const fillColorInput = document.getElementById('fillColor');
const fillEnabledInput = document.getElementById('fillEnabled');
const fontSelect = document.getElementById('fontSelect');
const bgColorInput = document.getElementById('bgColor');
const lineStyleSelect = document.getElementById('lineStyleSelect');

// Background color state
let backgroundColor = '#FFFEF9';

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
    // AWS Services
    ec2: { type: 'ec2', width: 100, height: 100 },
    s3: { type: 's3', width: 100, height: 100 },
    rds: { type: 'rds', width: 100, height: 100 },
    dynamodb: { type: 'dynamodb', width: 100, height: 100 },
    athena: { type: 'athena', width: 100, height: 100 },
    redshift: { type: 'redshift', width: 100, height: 100 },
    sqs: { type: 'sqs', width: 120, height: 80 },
    sns: { type: 'sns', width: 100, height: 100 },
    'api-gateway': { type: 'apiGateway', width: 100, height: 100 },
    cloudfront: { type: 'cloudfront', width: 100, height: 100 },
    route53: { type: 'route53', width: 100, height: 100 },
    ecs: { type: 'ecs', width: 120, height: 80 },
    eks: { type: 'eks', width: 100, height: 100 },
    elb: { type: 'elb', width: 120, height: 80 },
    cloudwatch: { type: 'cloudwatch', width: 100, height: 100 }
};

// Tool selection
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
        canvas.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
        selectedElement = null;
        redraw();
    });
});

// Background color change
bgColorInput.addEventListener('input', (e) => {
    backgroundColor = e.target.value;
    fillColorInput.value = backgroundColor;
    redraw();
});

// Fill color change - update selected element
fillColorInput.addEventListener('input', (e) => {
    if (selectedElement && fillEnabledInput.checked) {
        selectedElement.fillColor = e.target.value;
        redraw();
    }
});

// Stroke color change - update selected element
strokeColorInput.addEventListener('input', (e) => {
    if (selectedElement) {
        selectedElement.strokeColor = e.target.value;
        redraw();
    }
});

// Fill enabled toggle - update selected element
fillEnabledInput.addEventListener('change', (e) => {
    if (selectedElement) {
        selectedElement.fillColor = e.target.checked ? fillColorInput.value : null;
        redraw();
    }
});

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
    });
});

// Template selection
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const templateName = btn.dataset.template;
        const template = templates[templateName];
        if (template) {
            const centerX = canvas.width / 2 - template.width / 2;
            const centerY = canvas.height / 2 - template.height / 2;

            const element = {
                ...template,
                x: centerX,
                y: centerY,
                strokeColor: strokeColorInput.value,
                fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                lineStyle: lineStyleSelect.value
            };
            elements.push(element);
            redraw();

            // Auto-create text input for container template shapes
            const containerTemplates = ['process', 'decision', 'data', 'terminator', 'document',
                                       'class', 'package', 'server', 'database', 'cloud', 'lambda',
                                       'storage', 'queue', 'hexagon', 'note', 'cylinder',
                                       'router', 'firewall', 'switch',
                                       'ec2', 's3', 'rds', 'dynamodb', 'athena', 'redshift',
                                       'sqs', 'sns', 'api-gateway', 'cloudfront', 'route53',
                                       'ecs', 'eks', 'elb', 'cloudwatch'];
            if (containerTemplates.includes(templateName)) {
                const shapeCenterX = centerX + template.width / 2;
                const shapeCenterY = centerY + template.height / 2;

                setTimeout(() => {
                    createTextInputForShape(shapeCenterX, shapeCenterY, element);
                }, 10);
            }
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const toolMap = {
        'v': 'select', 'r': 'rectangle', 'c': 'circle',
        'l': 'line', 'a': 'arrow', 'p': 'pen', 't': 'text'
    };
    if (toolMap[key]) {
        const btn = document.querySelector(`[data-tool="${toolMap[key]}"]`);
        if (btn) btn.click();
    }
    if (key === 'delete' || key === 'backspace') {
        if (selectedElement) {
            elements = elements.filter(el => el !== selectedElement);
            selectedElement = null;
            redraw();
            e.preventDefault();
        }
    }
});

// Mouse events
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Snap to shape edge for arrows and lines
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestShapeEdge(x, y);
        x = snapped.x;
        y = snapped.y;
    }

    startX = x;
    startY = y;

    if (currentTool === 'select') {
        // Check if clicking on resize handle
        const handle = getResizeHandle(startX, startY);
        if (handle) {
            dragMode = 'resize';
            resizeHandle = handle;
            isDrawing = true;
            return;
        }

        // Check if clicking on element
        selectedElement = getElementAtPoint(startX, startY);
        if (selectedElement) {
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
                lineStyle: lineStyleSelect.value
            });
        }
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

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

    if (currentTool === 'select' && selectedElement) {
        if (dragMode === 'move') {
            const dx = currentX - startX;
            const dy = currentY - startY;
            moveElement(selectedElement, dx, dy);
            startX = currentX;
            startY = currentY;
        } else if (dragMode === 'resize') {
            resizeElement(selectedElement, currentX, currentY, resizeHandle);
        }
        redraw();
    } else if (currentTool === 'pen') {
        elements[elements.length - 1].points.push({x: currentX, y: currentY});
        redraw();
    } else if (currentTool !== 'text') {
        redraw();
        drawPreview(currentX, currentY);
    }
}

function handleMouseUp(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    let endX = e.clientX - rect.left;
    let endY = e.clientY - rect.top;

    // Snap endpoint to shape edge for arrows and lines
    if (currentTool === 'arrow' || currentTool === 'line') {
        const snapped = findNearestShapeEdge(endX, endY);
        endX = snapped.x;
        endY = snapped.y;
    }

    if (currentTool !== 'select' && currentTool !== 'pen' && currentTool !== 'text') {
        const width = endX - startX;
        const height = endY - startY;

        if (Math.abs(width) > 5 || Math.abs(height) > 5) {
            const element = {
                type: currentTool,
                x: startX,
                y: startY,
                width: width,
                height: height,
                strokeColor: strokeColorInput.value,
                fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
                lineStyle: lineStyleSelect.value
            };
            elements.push(element);

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

// Arrow snapping helpers
function findNearestShapeEdge(x, y, snapDistance = 20) {
    let nearestPoint = null;
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
            }
        }
    }

    return nearestPoint || { x, y };
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
function drawRoughLine(x1, y1, x2, y2, color, lineStyle = 'solid') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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

function drawRoughRect(x, y, w, h, strokeColor, fillColor, lineStyle = 'solid') {
    // Draw fill first
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    // Draw rough outline
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    applyLineStyle(lineStyle);

    // Draw slightly wavy lines
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        const offset = (Math.random() - 0.5) * 1;
        ctx.moveTo(x + offset, y + offset);
        ctx.lineTo(x + w + offset, y + offset);
        ctx.lineTo(x + w + offset, y + h + offset);
        ctx.lineTo(x + offset, y + h + offset);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawRoughCircle(x, y, w, h, strokeColor, fillColor, lineStyle = 'solid') {
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
    ctx.lineWidth = 2;
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

function drawArrow(x1, y1, x2, y2, color, lineStyle = 'solid') {
    drawRoughLine(x1, y1, x2, y2, color, lineStyle);

    // Draw arrowhead (always solid)
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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

function drawPen(points, color, lineStyle = 'solid') {
    if (points.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
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
    ctx.font = `16px ${fontFamily}`;
    ctx.fillStyle = element.strokeColor;
    ctx.textBaseline = 'top';
    ctx.fillText(element.text, element.x, element.y);
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

// AWS Service Drawing Functions
function drawEC2(x, y, w, h, strokeColor, fillColor) {
    // EC2 instance - server with AWS branding
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Draw "EC2" text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EC2', x + w/2, y + h/2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
}

function drawS3(x, y, w, h, strokeColor, fillColor) {
    // S3 bucket - distinctive bucket shape
    const bucketTop = y + h * 0.3;

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, bucketTop);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w * 0.8, bucketTop);
        ctx.closePath();
        ctx.fill();
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, bucketTop);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.8, bucketTop);
    ctx.closePath();
    ctx.stroke();

    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(x + w/2, bucketTop, w * 0.3, h * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (fillColor) ctx.fill();

    // S3 label
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('S3', x + w/2, y + h * 0.7);
    ctx.textAlign = 'left';
}

function drawRDS(x, y, w, h, strokeColor, fillColor) {
    // RDS - cylinder database
    drawDatabase(x, y, w, h, strokeColor, fillColor);

    // Add RDS label
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('RDS', x + w/2, y + h/2);
    ctx.textAlign = 'left';
}

function drawDynamoDB(x, y, w, h, strokeColor, fillColor) {
    // DynamoDB - stacked tables
    const layers = 3;
    const layerH = h / (layers + 1);

    for (let i = 0; i < layers; i++) {
        const yPos = y + h - (i + 1) * layerH;
        const offset = i * 5;

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x + offset, yPos, w - offset * 2, layerH * 0.8);
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + offset, yPos, w - offset * 2, layerH * 0.8);
    }

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('Dynamo', x + w/2, y + h * 0.2);
    ctx.textAlign = 'left';
}

function drawAthena(x, y, w, h, strokeColor, fillColor) {
    // Athena - query/search icon
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Magnifying glass
    const centerX = x + w/2;
    const centerY = y + h/2;
    const radius = Math.min(w, h) * 0.25;

    ctx.beginPath();
    ctx.arc(centerX - 5, centerY - 5, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + radius * 0.5, centerY + radius * 0.5);
    ctx.lineTo(centerX + radius * 1.2, centerY + radius * 1.2);
    ctx.stroke();

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('Athena', x + w/2, y + h - 10);
    ctx.textAlign = 'left';
}

function drawRedshift(x, y, w, h, strokeColor, fillColor) {
    // Redshift - data warehouse
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Grid pattern for warehouse
    const cols = 3;
    const rows = 3;
    for (let i = 1; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(x + (w/cols) * i, y + h * 0.25);
        ctx.lineTo(x + (w/cols) * i, y + h * 0.75);
        ctx.stroke();
    }
    for (let i = 1; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h * 0.25 + (h * 0.5/rows) * i);
        ctx.lineTo(x + w * 0.85, y + h * 0.25 + (h * 0.5/rows) * i);
        ctx.stroke();
    }

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('Redshift', x + w/2, y + h - 10);
    ctx.textAlign = 'left';
}

function drawSQS(x, y, w, h, strokeColor, fillColor) {
    // SQS - message queue (similar to existing queue but with label)
    drawQueue(x, y, w, h, strokeColor, fillColor);

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('SQS', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawSNS(x, y, w, h, strokeColor, fillColor) {
    // SNS - notification/broadcast
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Bell icon
    const centerX = x + w/2;
    const centerY = y + h/2;
    const bellW = w * 0.3;
    const bellH = h * 0.3;

    ctx.beginPath();
    ctx.moveTo(centerX - bellW/2, centerY);
    ctx.quadraticCurveTo(centerX - bellW/2, centerY - bellH, centerX, centerY - bellH);
    ctx.quadraticCurveTo(centerX + bellW/2, centerY - bellH, centerX + bellW/2, centerY);
    ctx.lineTo(centerX - bellW/2, centerY);
    ctx.stroke();

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('SNS', x + w/2, y + h - 10);
    ctx.textAlign = 'left';
}

function drawAPIGateway(x, y, w, h, strokeColor, fillColor) {
    // API Gateway - gateway/door icon
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Gateway arch
    const archX = x + w * 0.25;
    const archW = w * 0.5;
    const archH = h * 0.5;
    const archY = y + h * 0.2;

    ctx.beginPath();
    ctx.moveTo(archX, archY + archH);
    ctx.lineTo(archX, archY + archH * 0.3);
    ctx.quadraticCurveTo(archX, archY, archX + archW/2, archY);
    ctx.quadraticCurveTo(archX + archW, archY, archX + archW, archY + archH * 0.3);
    ctx.lineTo(archX + archW, archY + archH);
    ctx.stroke();

    // Label
    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('API GW', x + w/2, y + h - 10);
    ctx.textAlign = 'left';
}

function drawCloudFront(x, y, w, h, strokeColor, fillColor) {
    // CloudFront - CDN/globe
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Globe
    const centerX = x + w/2;
    const centerY = y + h/2 - 5;
    const radius = Math.min(w, h) * 0.25;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Latitude lines
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Longitude line
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radius * 0.4, radius, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('CloudFront', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawRoute53(x, y, w, h, strokeColor, fillColor) {
    // Route 53 - DNS routing
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Network routing diagram
    const centerX = x + w/2;
    const centerY = y + h/2;

    // Central node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Connected nodes
    const nodePositions = [
        {x: centerX - w * 0.25, y: centerY - h * 0.2},
        {x: centerX + w * 0.25, y: centerY - h * 0.2},
        {x: centerX, y: centerY + h * 0.25}
    ];

    nodePositions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    });

    // Label
    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('Route 53', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawECS(x, y, w, h, strokeColor, fillColor) {
    // ECS - container service
    const containerCount = 3;
    const containerW = w / containerCount - 5;
    const containerH = h * 0.6;
    const containerY = y + h * 0.2;

    for (let i = 0; i < containerCount; i++) {
        const containerX = x + 5 + i * (containerW + 5);

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(containerX, containerY, containerW, containerH);
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(containerX, containerY, containerW, containerH);
    }

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('ECS', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawEKS(x, y, w, h, strokeColor, fillColor) {
    // EKS - Kubernetes hexagons
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Small hexagons representing K8s
    const hexCenters = [
        {x: x + w * 0.3, y: y + h * 0.35},
        {x: x + w * 0.7, y: y + h * 0.35},
        {x: x + w * 0.5, y: y + h * 0.6}
    ];

    hexCenters.forEach(center => {
        const hexSize = w * 0.12;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = center.x + hexSize * Math.cos(angle);
            const hy = center.y + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
    });

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('EKS', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawELB(x, y, w, h, strokeColor, fillColor) {
    // ELB - load balancer
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Balance/distribution diagram
    const topX = x + w/2;
    const topY = y + h * 0.25;

    // Top node (load balancer)
    ctx.beginPath();
    ctx.arc(topX, topY, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom nodes (targets)
    const bottomY = y + h * 0.65;
    const positions = [x + w * 0.25, x + w * 0.5, x + w * 0.75];

    positions.forEach(posX => {
        ctx.beginPath();
        ctx.arc(posX, bottomY, 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.lineTo(posX, bottomY);
        ctx.stroke();
    });

    // Label
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('ELB', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawCloudWatch(x, y, w, h, strokeColor, fillColor) {
    // CloudWatch - monitoring/chart
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Line chart
    const chartY = y + h * 0.5;
    const chartX1 = x + w * 0.2;
    const chartX2 = x + w * 0.8;

    ctx.beginPath();
    ctx.moveTo(chartX1, chartY);
    ctx.lineTo(x + w * 0.35, chartY - h * 0.2);
    ctx.lineTo(x + w * 0.5, chartY - h * 0.1);
    ctx.lineTo(x + w * 0.65, chartY - h * 0.25);
    ctx.lineTo(chartX2, chartY - h * 0.15);
    ctx.stroke();

    // Label
    ctx.font = 'bold 9px Arial';
    ctx.fillStyle = strokeColor;
    ctx.textAlign = 'center';
    ctx.fillText('CloudWatch', x + w/2, y + h - 5);
    ctx.textAlign = 'left';
}

function drawElement(element) {
    const lineStyle = element.lineStyle || 'solid';

    switch (element.type) {
        case 'rectangle':
            drawRoughRect(element.x, element.y, element.width, element.height,
                         element.strokeColor, element.fillColor, lineStyle);
            break;
        case 'circle':
            drawRoughCircle(element.x, element.y, element.width, element.height,
                          element.strokeColor, element.fillColor, lineStyle);
            break;
        case 'line':
            drawRoughLine(element.x, element.y,
                         element.x + element.width, element.y + element.height,
                         element.strokeColor, lineStyle);
            break;
        case 'arrow':
            drawArrow(element.x, element.y,
                     element.x + element.width, element.y + element.height,
                     element.strokeColor, lineStyle);
            break;
        case 'pen':
            drawPen(element.points, element.strokeColor, lineStyle);
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
    }
}

function drawPreview(x, y) {
    const width = x - startX;
    const height = y - startY;

    ctx.save();
    ctx.globalAlpha = 0.5;

    const previewElement = {
        type: currentTool,
        x: startX,
        y: startY,
        width: width,
        height: height,
        strokeColor: strokeColorInput.value,
        fillColor: fillEnabledInput.checked ? fillColorInput.value : null,
        lineStyle: lineStyleSelect.value
    };

    drawElement(previewElement);
    ctx.restore();
}

function redraw() {
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
        drawElement(element);
    });

    // Draw selection box and resize handles
    if (selectedElement && currentTool === 'select') {
        const bounds = getElementBounds(selectedElement);
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.setLineDash([]);

        // Draw resize handles
        const handles = getResizeHandles(bounds);
        ctx.fillStyle = '#2196f3';
        handles.forEach(handle => {
            ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
        });
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
            ctx.font = `16px ${fontFamily}`;
            const metrics = ctx.measureText(element.text);
            return {
                x: element.x,
                y: element.y,
                width: metrics.width,
                height: 20
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
    input.style.left = (rect.left + x) + 'px';
    input.style.top = (rect.top + y) + 'px';
    input.style.fontFamily = fontSelect.value;
    input.rows = 1;
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
                fontFamily: fontSelect.value
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
    const rect = canvas.getBoundingClientRect();
    input.style.left = (rect.left + centerX - 50) + 'px'; // Offset to center the input box
    input.style.top = (rect.top + centerY - 12) + 'px';
    input.style.fontFamily = fontSelect.value;
    input.style.width = '100px';
    input.rows = 1;
    document.body.appendChild(input);

    // Focus after a brief delay to prevent immediate blur
    setTimeout(() => input.focus(), 10);

    const finishText = () => {
        const text = input.value.trim();
        if (text) {
            // Measure text to center it properly
            ctx.font = `16px ${fontSelect.value}`;
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;

            elements.push({
                type: 'text',
                x: centerX - textWidth / 2,
                y: centerY - 8, // Adjust for vertical centering
                text: text,
                strokeColor: strokeColorInput.value,
                fontFamily: fontSelect.value
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
            return `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" stroke="${stroke}" fill="${fill}" stroke-width="2" ${dashArray}/>`;

        case 'circle':
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            const radiusX = Math.abs(element.width) / 2;
            const radiusY = Math.abs(element.height) / 2;
            return `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" stroke="${stroke}" fill="${fill}" stroke-width="2" ${dashArray}/>`;

        case 'line':
            const x2 = element.x + element.width;
            const y2 = element.y + element.height;
            return `<line x1="${element.x}" y1="${element.y}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" ${dashArray}/>`;

        case 'arrow':
            const ax2 = element.x + element.width;
            const ay2 = element.y + element.height;
            const angle = Math.atan2(element.height, element.width);
            const headLength = 15;
            const arrowPoint1X = ax2 - headLength * Math.cos(angle - Math.PI / 6);
            const arrowPoint1Y = ay2 - headLength * Math.sin(angle - Math.PI / 6);
            const arrowPoint2X = ax2 - headLength * Math.cos(angle + Math.PI / 6);
            const arrowPoint2Y = ay2 - headLength * Math.sin(angle + Math.PI / 6);

            return `<line x1="${element.x}" y1="${element.y}" x2="${ax2}" y2="${ay2}" stroke="${stroke}" stroke-width="2" ${dashArray}/>` +
                   `<line x1="${ax2}" y1="${ay2}" x2="${arrowPoint1X}" y2="${arrowPoint1Y}" stroke="${stroke}" stroke-width="2"/>` +
                   `<line x1="${ax2}" y1="${ay2}" x2="${arrowPoint2X}" y2="${arrowPoint2Y}" stroke="${stroke}" stroke-width="2"/>`;

        case 'pen':
            if (element.points.length < 2) return '';
            let pathData = `M ${element.points[0].x} ${element.points[0].y}`;
            for (let i = 1; i < element.points.length; i++) {
                pathData += ` L ${element.points[i].x} ${element.points[i].y}`;
            }
            return `<path d="${pathData}" stroke="${stroke}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${dashArray}/>`;

        case 'text':
            const fontFamily = element.fontFamily || 'Comic Sans MS, cursive';
            return `<text x="${element.x}" y="${element.y + 16}" font-family="${fontFamily}" font-size="16" fill="${stroke}">${escapeXML(element.text)}</text>`;

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

// Export/Import
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear canvas?')) {
        elements = [];
        selectedElement = null;
        backgroundColor = '#FFFEF9';
        bgColorInput.value = '#FFFEF9';
        redraw();
    }
});

document.getElementById('exportImage').addEventListener('click', () => {
    const format = prompt('Choose format: PNG, JPG, or SVG', 'PNG');
    if (!format) return;

    const formatLower = format.toLowerCase().trim();

    if (formatLower === 'svg') {
        exportAsSVG();
    } else if (formatLower === 'png') {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } else if (formatLower === 'jpg' || formatLower === 'jpeg') {
        const link = document.createElement('a');
        link.download = 'drawing.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    } else {
        alert('Invalid format. Please choose PNG, JPG, or SVG');
    }
});

document.getElementById('exportJSON').addEventListener('click', () => {
    const data = {
        backgroundColor: backgroundColor,
        elements: elements
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'drawing.json';
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

                // Support both old format (array) and new format (object with backgroundColor)
                if (Array.isArray(data)) {
                    elements = data;
                    backgroundColor = '#FFFEF9';
                    bgColorInput.value = '#FFFEF9';
                } else {
                    elements = data.elements || [];
                    backgroundColor = data.backgroundColor || '#FFFEF9';
                    bgColorInput.value = backgroundColor;
                }

                selectedElement = null;
                redraw();
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }
});

// Initialize canvas
resizeCanvas();
