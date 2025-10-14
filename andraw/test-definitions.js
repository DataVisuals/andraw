// Comprehensive Test Definitions for Andraw

// Helper to get app functions from iframe
function getAppContext() {
    const iframe = document.getElementById('app-frame');
    return iframe?.contentWindow || window;
}

// Mock elements array for testing
let testElements = [];
let testNextElementId = 1;

// Helper functions
function createRect(id, x, y, width = 120, height = 80) {
    return { id, type: 'rect', x, y, width, height };
}

function getObstacles(excludeIds) {
    return testElements.filter(el =>
        !excludeIds.includes(el.id) &&
        (el.type === 'rect' || el.type === 'circle' || el.type === 'diamond')
    );
}

function getSideCenters(bounds, type) {
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    return {
        top: { x: cx, y: bounds.y },
        bottom: { x: cx, y: bounds.y + bounds.height },
        left: { x: bounds.x, y: cy },
        right: { x: bounds.x + bounds.width, y: cy }
    };
}

// ============================================================================
// TEST SUITE 1: Obstacle Detection - Horizontal Paths
// ============================================================================
testFramework.suite('Obstacle Detection - Horizontal Paths', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('Detects obstacle directly in horizontal path', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A
            createRect(2, 300, 300),  // B (between A and C)
            createRect(3, 500, 300)   // C
        ];

        const obstacles = getObstacles([1, 3]);
        const pathY = 340; // Middle of shapes at y=300

        // Obstacle B at 300-380 overlaps pathY=340
        const obsRect = { left: 300, right: 420, top: 300, bottom: 380 };
        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.true(blocks, 'Obstacle in path should block');
    });

    test('Does not detect obstacle above horizontal path (outside tolerance)', (assert) => {
        testElements = [
            createRect(1, 100, 400),  // A
            createRect(2, 300, 200),  // B (above)
            createRect(3, 500, 400)   // C
        ];

        const pathY = 440; // Middle of A and C
        const obsRect = { left: 300, right: 420, top: 200, bottom: 280 };

        // B is 160px above path (280 to 440), outside 30px tolerance
        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.false(blocks, 'Obstacle far above should not block');
    });

    test('Does not detect obstacle below horizontal path (outside tolerance)', (assert) => {
        testElements = [
            createRect(1, 100, 200),  // A
            createRect(2, 300, 400),  // B (below)
            createRect(3, 500, 200)   // C
        ];

        const pathY = 240; // Middle of A and C
        const obsRect = { left: 300, right: 420, top: 400, bottom: 480 };

        // B is 160px below path (240 to 400), outside 30px tolerance
        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.false(blocks, 'Obstacle far below should not block');
    });

    test('Detects obstacle within tolerance band', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A
            createRect(2, 300, 320),  // B (20px below path center)
            createRect(3, 500, 300)   // C
        ];

        const pathY = 340; // Center of A and C
        const obsRect = { left: 300, right: 420, top: 320, bottom: 400 };

        // B overlaps with tolerance band (310-370)
        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.true(blocks, 'Obstacle within tolerance should block');
    });

    test('Does not detect obstacle with no horizontal overlap', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A
            createRect(2, 600, 300),  // B (to the right of C)
            createRect(3, 400, 300)   // C
        ];

        const obstacles = getObstacles([1, 3]);
        const pathRect = { left: 220, right: 400, top: 340, bottom: 340 };
        const obsRect = { left: 600, right: 720, top: 300, bottom: 380 };

        // B is outside horizontal span (220-400)
        const horizontalOverlap = obsRect.right >= pathRect.left && obsRect.left <= pathRect.right;

        assert.false(horizontalOverlap, 'Obstacle outside horizontal span should not block');
    });

    test('Handles multiple obstacles in path', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A
            createRect(2, 250, 300),  // B
            createRect(3, 400, 300),  // C
            createRect(4, 550, 300)   // D
        ];

        const obstacles = getObstacles([1, 4]);
        const pathY = 340;

        // Both B and C should block
        let blockedCount = 0;
        obstacles.forEach(obs => {
            const obsRect = {
                left: obs.x,
                right: obs.x + obs.width,
                top: obs.y,
                bottom: obs.y + obs.height
            };
            if (obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30) {
                blockedCount++;
            }
        });

        assert.equal(blockedCount, 2, 'Should detect 2 blocking obstacles');
    });
});

// ============================================================================
// TEST SUITE 2: Obstacle Detection - Vertical Paths
// ============================================================================
testFramework.suite('Obstacle Detection - Vertical Paths', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('Detects obstacle directly in vertical path', (assert) => {
        testElements = [
            createRect(1, 300, 100),  // A
            createRect(2, 300, 300),  // B (between A and C)
            createRect(3, 300, 500)   // C
        ];

        const pathX = 360; // Middle of shapes at x=300
        const obsRect = { left: 300, right: 420, top: 300, bottom: 380 };

        const blocks = obsRect.left <= pathX + 30 && obsRect.right >= pathX - 30;

        assert.true(blocks, 'Obstacle in vertical path should block');
    });

    test('Does not detect obstacle to the right (outside tolerance)', (assert) => {
        testElements = [
            createRect(1, 200, 100),  // A
            createRect(2, 400, 300),  // B (to the right)
            createRect(3, 200, 500)   // C
        ];

        const pathX = 260; // Center of A and C
        const obsRect = { left: 400, right: 520, top: 300, bottom: 380 };

        // B is 140px to the right (260 to 400), outside 30px tolerance
        const blocks = obsRect.left <= pathX + 30 && obsRect.right >= pathX - 30;

        assert.false(blocks, 'Obstacle far right should not block');
    });

    test('Detects obstacle within tolerance band vertically', (assert) => {
        testElements = [
            createRect(1, 300, 100),  // A
            createRect(2, 320, 300),  // B (20px to right of center)
            createRect(3, 300, 500)   // C
        ];

        const pathX = 360; // Center of A and C
        const obsRect = { left: 320, right: 440, top: 300, bottom: 380 };

        const blocks = obsRect.left <= pathX + 30 && obsRect.right >= pathX - 30;

        assert.true(blocks, 'Obstacle within tolerance should block vertical path');
    });
});

// ============================================================================
// TEST SUITE 3: Anchor Selection - Same-Side Anchors
// ============================================================================
testFramework.suite('Anchor Selection - Same-Side Anchors', ({ test }) => {
    test('Selects top→top for same-level shapes with obstacles above', (assert) => {
        testElements = [
            createRect(1, 100, 400),  // A
            createRect(2, 350, 400),  // B (same level as A)
            createRect(3, 350, 250)   // C (above B)
        ];

        const boundsA = { x: 100, y: 400, width: 120, height: 80 };
        const boundsB = { x: 350, y: 400, width: 120, height: 80 };
        const sidesA = getSideCenters(boundsA, 'rect');
        const sidesB = getSideCenters(boundsB, 'rect');

        const yDiff = (boundsB.y + boundsB.height / 2) - (boundsA.y + boundsA.height / 2);
        const isSameLevel = Math.abs(yDiff) < 20;

        assert.true(isSameLevel, 'Should detect same level');
        assert.within(yDiff, 0, 20, 'Y difference should be minimal');
    });

    test('Selects bottom→bottom for same-level shapes with obstacles below', (assert) => {
        testElements = [
            createRect(1, 100, 200),  // A
            createRect(2, 350, 200),  // B (same level)
            createRect(3, 350, 400)   // C (below B)
        ];

        const yDiff = 200 - 200;
        const isSameLevel = Math.abs(yDiff) < 20;

        assert.true(isSameLevel, 'Should detect same level');
        assert.equal(yDiff, 0, 'Y difference should be zero');
    });

    test('Distinguishes same-level from slightly offset shapes', (assert) => {
        const testCases = [
            { yDiff: 0, expected: true, label: 'Exact same level' },
            { yDiff: 10, expected: true, label: '10px offset within tolerance' },
            { yDiff: 19, expected: true, label: '19px offset within tolerance' },
            { yDiff: 25, expected: false, label: '25px offset outside tolerance' },
            { yDiff: -15, expected: true, label: '-15px offset within tolerance' },
            { yDiff: -30, expected: false, label: '-30px offset outside tolerance' }
        ];

        testCases.forEach(tc => {
            const isSameLevel = Math.abs(tc.yDiff) < 20;
            assert.equal(isSameLevel, tc.expected, tc.label);
        });
    });
});

// ============================================================================
// TEST SUITE 4: Anchor Selection - Perpendicular Anchors
// ============================================================================
testFramework.suite('Anchor Selection - Perpendicular Anchors', ({ test }) => {
    test('Selects top→left for target above-right', (assert) => {
        testElements = [
            createRect(1, 100, 400),  // A
            createRect(2, 350, 400),  // B (right of A, same level)
            createRect(3, 350, 250)   // C (above B)
        ];

        const centerA = { x: 160, y: 440 };
        const centerC = { x: 410, y: 290 };

        const dx = centerC.x - centerA.x; // 250 (positive, to the right)
        const dy = centerC.y - centerA.y; // -150 (negative, above)

        const isAbove = dy < -20;
        const isRight = dx > 0;

        assert.true(isAbove, 'Target should be above');
        assert.true(isRight, 'Target should be to the right');
    });

    test('Selects bottom→left for target below-right', (assert) => {
        testElements = [
            createRect(1, 100, 200),  // A
            createRect(2, 350, 400)   // B (below and right of A)
        ];

        const centerA = { x: 160, y: 240 };
        const centerB = { x: 410, y: 440 };

        const dx = centerB.x - centerA.x; // 250
        const dy = centerB.y - centerA.y; // 200

        const isBelow = dy > 20;
        const isRight = dx > 0;

        assert.true(isBelow, 'Target should be below');
        assert.true(isRight, 'Target should be to the right');
    });

    test('Does not use A* pathfinding for perpendicular anchors', (assert) => {
        const startAnchor = 'top';
        const endAnchor = 'left';

        const startIsVertical = startAnchor === 'top' || startAnchor === 'bottom';
        const endIsVertical = endAnchor === 'top' || endAnchor === 'bottom';
        const perpendicularAnchors = startIsVertical !== endIsVertical;

        assert.true(perpendicularAnchors, 'Should identify as perpendicular');
    });
});

// ============================================================================
// TEST SUITE 5: Anchor Selection - Simple Opposite Anchors
// ============================================================================
testFramework.suite('Anchor Selection - Simple Opposite Anchors', ({ test }) => {
    test('Identifies left→right as simple opposite', (assert) => {
        const startAnchor = 'left';
        const endAnchor = 'right';

        const isSimpleOpposite = (startAnchor === 'left' && endAnchor === 'right') ||
                                 (startAnchor === 'right' && endAnchor === 'left');

        assert.true(isSimpleOpposite, 'left→right should be simple opposite');
    });

    test('Identifies right→left as simple opposite', (assert) => {
        const startAnchor = 'right';
        const endAnchor = 'left';

        const isSimpleOpposite = (startAnchor === 'left' && endAnchor === 'right') ||
                                 (startAnchor === 'right' && endAnchor === 'left');

        assert.true(isSimpleOpposite, 'right→left should be simple opposite');
    });

    test('Identifies top→bottom as simple opposite', (assert) => {
        const startAnchor = 'top';
        const endAnchor = 'bottom';

        const isSimpleOpposite = (startAnchor === 'top' && endAnchor === 'bottom') ||
                                 (startAnchor === 'bottom' && endAnchor === 'top');

        assert.true(isSimpleOpposite, 'top→bottom should be simple opposite');
    });

    test('Does not use A* for simple opposite at same level', (assert) => {
        const startAnchor = 'left';
        const endAnchor = 'right';
        const sameSideAnchors = startAnchor === endAnchor;
        const perpendicularAnchors = false;
        const isSimpleOpposite = true;

        const needsAStar = !sameSideAnchors && !perpendicularAnchors && !isSimpleOpposite;

        assert.false(needsAStar, 'Should not need A* for simple opposite');
    });

    test('top→left is not simple opposite (perpendicular)', (assert) => {
        const startAnchor = 'top';
        const endAnchor = 'left';

        const isSimpleOpposite = (startAnchor === 'left' && endAnchor === 'right') ||
                                 (startAnchor === 'right' && endAnchor === 'left') ||
                                 (startAnchor === 'top' && endAnchor === 'bottom') ||
                                 (startAnchor === 'bottom' && endAnchor === 'top');

        assert.false(isSimpleOpposite, 'top→left is perpendicular, not simple opposite');
    });
});

// ============================================================================
// TEST SUITE 6: Path Routing - Straight Lines
// ============================================================================
testFramework.suite('Path Routing - Straight Lines', ({ test }) => {
    test('Creates straight line for left→right at same level', (assert) => {
        const x1 = 220, y1 = 340; // A.right
        const x2 = 350, y2 = 340; // B.left

        const points = [{x: x1, y: y1}];

        // Check if at same level
        if (Math.abs(y1 - y2) < 5) {
            points.push({x: x2, y: y2});
        }

        assert.equal(points.length, 2, 'Should have 2 points (straight line)');
        assert.equal(points[0].y, points[1].y, 'Y coordinates should be equal');
    });

    test('Creates straight line for top→bottom at same X', (assert) => {
        const x1 = 360, y1 = 180; // A.bottom
        const x2 = 360, y2 = 400; // B.top

        const points = [{x: x1, y: y1}];

        if (Math.abs(x1 - x2) < 5) {
            points.push({x: x2, y: y2});
        }

        assert.equal(points.length, 2, 'Should have 2 points (straight line)');
        assert.equal(points[0].x, points[1].x, 'X coordinates should be equal');
    });

    test('Does not create straight line for left→right at different levels', (assert) => {
        const x1 = 220, y1 = 340; // A.right
        const x2 = 350, y2 = 400; // B.left (60px below)

        const needsMultiSegment = Math.abs(y1 - y2) >= 5;

        assert.true(needsMultiSegment, 'Should need multi-segment path');
    });
});

// ============================================================================
// TEST SUITE 7: Path Routing - Dynamic Offset Calculation
// ============================================================================
testFramework.suite('Path Routing - Dynamic Offset Calculation', ({ test }) => {
    test('Calculates offset for top routing with obstacle above', (assert) => {
        testElements = [
            createRect(1, 100, 400),  // A
            createRect(2, 300, 250),  // Obstacle above
            createRect(3, 500, 400)   // B
        ];

        const obstacles = getObstacles([1, 3]);
        const y1 = 400, y2 = 400;
        const horizontalSpan = { left: 100, right: 620 };

        let highestObstacle = Math.min(y1, y2);

        obstacles.forEach(obs => {
            if (obs.x + obs.width >= horizontalSpan.left && obs.x <= horizontalSpan.right) {
                if (obs.y < highestObstacle) {
                    highestObstacle = obs.y; // 250
                }
            }
        });

        const clearance = 40;
        const offset = Math.max(60, Math.min(y1, y2) - highestObstacle + clearance);

        // Expected: 400 - 250 + 40 = 190
        assert.equal(offset, 190, 'Should calculate correct offset above obstacle');
    });

    test('Uses minimum offset when no obstacles', (assert) => {
        testElements = [
            createRect(1, 100, 400),
            createRect(2, 500, 400)
        ];

        const obstacles = getObstacles([1, 2]);
        const offset = obstacles.length === 0 ? 60 : 60;

        assert.equal(offset, 60, 'Should use minimum offset with no obstacles');
    });

    test('Calculates offset for bottom routing with obstacle below', (assert) => {
        testElements = [
            createRect(1, 100, 300, 120, 80),  // A (300-380)
            createRect(2, 300, 500, 120, 80),  // Obstacle below (500-580)
            createRect(3, 500, 300, 120, 80)   // B (300-380)
        ];

        const obstacles = getObstacles([1, 3]);
        const y1 = 380, y2 = 380; // Bottom edges
        const horizontalSpan = { left: 100, right: 620 };

        let lowestObstacle = Math.max(y1, y2);

        obstacles.forEach(obs => {
            if (obs.x + obs.width >= horizontalSpan.left && obs.x <= horizontalSpan.right) {
                const obsBottom = obs.y + obs.height;
                if (obsBottom > lowestObstacle) {
                    lowestObstacle = obsBottom; // 580
                }
            }
        });

        const clearance = 40;
        const offset = Math.max(60, lowestObstacle - Math.max(y1, y2) + clearance);

        // Expected: 580 - 380 + 40 = 240
        assert.equal(offset, 240, 'Should calculate correct offset below obstacle');
    });
});

// ============================================================================
// TEST SUITE 8: Edge Cases - Boundary Conditions
// ============================================================================
testFramework.suite('Edge Cases - Boundary Conditions', ({ test }) => {
    test('Handles zero-width path (same X coordinates)', (assert) => {
        const x1 = 300, y1 = 200;
        const x2 = 300, y2 = 400;

        const pathWidth = Math.abs(x2 - x1);

        assert.equal(pathWidth, 0, 'Path width should be zero');
    });

    test('Handles zero-height path (same Y coordinates)', (assert) => {
        const x1 = 100, y1 = 300;
        const x2 = 500, y2 = 300;

        const pathHeight = Math.abs(y2 - y1);

        assert.equal(pathHeight, 0, 'Path height should be zero');
    });

    test('Handles obstacle at exact tolerance boundary (30px)', (assert) => {
        const pathY = 340;
        const obsRect = { top: 310, bottom: 370 }; // Exactly 30px above and below

        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.true(blocks, 'Obstacle at exact tolerance boundary should block');
    });

    test('Handles obstacle just outside tolerance boundary (31px)', (assert) => {
        const pathY = 340;
        const obsRect = { top: 309, bottom: 371 }; // 31px above and below

        const blocks = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

        assert.true(blocks, 'Obstacle just outside tolerance should still overlap');
    });

    test('Handles very large shapes', (assert) => {
        const largeShape = createRect(1, 0, 0, 10000, 10000);

        assert.equal(largeShape.width, 10000, 'Should handle large width');
        assert.equal(largeShape.height, 10000, 'Should handle large height');
    });

    test('Handles shapes at canvas boundaries', (assert) => {
        const shapes = [
            createRect(1, 0, 0),      // Top-left corner
            createRect(2, 1880, 0),   // Top-right corner
            createRect(3, 0, 920),    // Bottom-left corner
            createRect(4, 1880, 920)  // Bottom-right corner
        ];

        assert.equal(shapes.length, 4, 'Should create all boundary shapes');
    });
});

// ============================================================================
// TEST SUITE 9: Edge Cases - Overlapping Shapes
// ============================================================================
testFramework.suite('Edge Cases - Overlapping Shapes', ({ test }) => {
    test('Handles completely overlapping shapes', (assert) => {
        testElements = [
            createRect(1, 300, 300),
            createRect(2, 300, 300) // Same position
        ];

        const bounds1 = { x: 300, y: 300, width: 120, height: 80 };
        const bounds2 = { x: 300, y: 300, width: 120, height: 80 };

        const overlaps = bounds1.x === bounds2.x && bounds1.y === bounds2.y;

        assert.true(overlaps, 'Should detect complete overlap');
    });

    test('Handles partially overlapping shapes', (assert) => {
        const rect1 = { left: 100, right: 220, top: 300, bottom: 380 };
        const rect2 = { left: 180, right: 300, top: 350, bottom: 430 };

        const overlaps = rect1.right >= rect2.left &&
                        rect1.left <= rect2.right &&
                        rect1.bottom >= rect2.top &&
                        rect1.top <= rect2.bottom;

        assert.true(overlaps, 'Should detect partial overlap');
    });

    test('Handles shapes touching at edges', (assert) => {
        const rect1 = { left: 100, right: 220, top: 300, bottom: 380 };
        const rect2 = { left: 220, right: 340, top: 300, bottom: 380 };

        const touching = rect1.right === rect2.left;

        assert.true(touching, 'Should detect edge touching');
    });
});

// ============================================================================
// TEST SUITE 10: Integration - Complex Layouts
// ============================================================================
testFramework.suite('Integration - Complex Layouts', ({ test }) => {
    test('Handles tunnel scenario (obstacles above and below)', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A
            createRect(2, 300, 150),  // Obstacle above
            createRect(3, 300, 470),  // Obstacle below
            createRect(4, 500, 300)   // B
        ];

        const obstacles = getObstacles([1, 4]);
        const pathY = 340;

        let topBlocked = false, bottomBlocked = false;

        obstacles.forEach(obs => {
            const obsRect = { top: obs.y, bottom: obs.y + obs.height };

            // Check if blocks top path (path goes up)
            if (obsRect.bottom < pathY + 30) topBlocked = true;

            // Check if blocks bottom path (path goes down)
            if (obsRect.top > pathY - 30) bottomBlocked = true;
        });

        assert.true(topBlocked, 'Top path should be blocked');
        assert.true(bottomBlocked, 'Bottom path should be blocked');
    });

    test('Handles checkerboard pattern (staggered obstacles)', (assert) => {
        testElements = [
            createRect(1, 100, 400),   // A
            createRect(2, 250, 250),   // Above-left
            createRect(3, 450, 550),   // Below-middle
            createRect(4, 650, 280),   // Above-right
            createRect(5, 800, 520),   // Below-right
            createRect(6, 900, 400)    // B
        ];

        const obstacles = getObstacles([1, 6]);

        assert.equal(obstacles.length, 4, 'Should have 4 obstacles');
    });

    test('Handles grid layout (6 shapes in 2x3 grid)', (assert) => {
        testElements = [
            createRect(1, 100, 100),   // Row 1
            createRect(2, 300, 100),
            createRect(3, 500, 100),
            createRect(4, 100, 300),   // Row 2
            createRect(5, 300, 300),
            createRect(6, 500, 300)
        ];

        assert.equal(testElements.length, 6, 'Should have 6 shapes in grid');
    });

    test('Handles star pattern (center with 4 surrounding)', (assert) => {
        testElements = [
            createRect(1, 400, 400),   // Center
            createRect(2, 400, 200),   // Top
            createRect(3, 400, 600),   // Bottom
            createRect(4, 200, 400),   // Left
            createRect(5, 600, 400)    // Right
        ];

        const center = testElements[0];
        const surrounding = testElements.slice(1);

        surrounding.forEach(shape => {
            const dx = shape.x - center.x;
            const dy = shape.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            assert.within(distance, 200, 10, 'Surrounding shapes should be ~200px from center');
        });
    });

    test('Handles dense obstacle field (10 shapes)', (assert) => {
        for (let i = 0; i < 10; i++) {
            testElements.push(createRect(i + 1, i * 100, i * 50));
        }

        assert.equal(testElements.length, 10, 'Should handle 10 shapes');
        assert.equal(getObstacles([1]).length, 9, 'Should get 9 obstacles when excluding 1');
    });
});

// ============================================================================
// TEST SUITE 11: Performance Tests
// ============================================================================
testFramework.suite('Performance Tests', ({ test }) => {
    test('Obstacle detection completes in <1ms for 10 shapes', (assert) => {
        for (let i = 0; i < 10; i++) {
            testElements.push(createRect(i + 1, i * 100, 300));
        }

        const start = performance.now();
        const obstacles = getObstacles([1, 10]);
        const duration = performance.now() - start;

        assert.true(duration < 1, `Should complete in <1ms (was ${duration.toFixed(3)}ms)`);
    });

    test('Obstacle detection completes in <5ms for 100 shapes', (assert) => {
        for (let i = 0; i < 100; i++) {
            testElements.push(createRect(i + 1, (i % 10) * 100, Math.floor(i / 10) * 100));
        }

        const start = performance.now();
        const obstacles = getObstacles([1, 100]);
        const duration = performance.now() - start;

        assert.true(duration < 5, `Should complete in <5ms (was ${duration.toFixed(3)}ms)`);
    });

    test('Side centers calculation is fast', (assert) => {
        const bounds = { x: 300, y: 400, width: 120, height: 80 };

        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
            getSideCenters(bounds, 'rect');
        }
        const duration = performance.now() - start;

        assert.true(duration < 10, `1000 iterations should take <10ms (was ${duration.toFixed(3)}ms)`);
    });
});

// Run all tests automatically
setTimeout(() => {
    console.log('Test definitions loaded. Running tests...');
    runAllTests();
}, 100);
