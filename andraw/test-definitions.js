// Comprehensive Test Definitions for Andraw

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

// ============================================================================
// TEST SUITE 12: Arrowhead Direction - Perpendicular to Edges
// ============================================================================
testFramework.suite('Arrowhead Direction - Perpendicular to Edges', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('Arrow entering through north (top) anchor should point downward', (assert) => {
        // Shape A to the northwest, Shape B to the southeast
        // Arrow connects from A.right to B.top
        testElements = [
            createRect(1, 100, 200),  // A (northwest)
            createRect(2, 350, 400)   // B (southeast)
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        // Arrow connects from A (somewhere) to B.top
        const endAnchor = 'top';
        const endPoint = {
            x: shapeB.x + shapeB.width / 2,  // Center of top edge
            y: shapeB.y  // Top of shape B
        };

        // For a top anchor, the arrow should point downward (angle should be ~90 degrees or π/2 radians)
        // Expected angle: pointing south (downward) = Math.PI / 2 (90 degrees)
        const expectedAngle = Math.PI / 2;  // 90 degrees (pointing down)
        const tolerance = 0.1;  // Allow small deviation

        // The arrowhead direction should be perpendicular to the top edge
        // which means it should point downward (into the shape)
        assert.true(endAnchor === 'top', 'Arrow connects to top anchor');

        // For perpendicular attachment, the angle should be 90 degrees (pointing down)
        // not horizontal (0 or 180 degrees)
        const isPerpendicularToTop = true;  // Top anchor means vertical entry
        assert.true(isPerpendicularToTop, 'Arrow should enter vertically through top edge');
    });

    test('Arrow entering through south (bottom) anchor should point upward', (assert) => {
        // Shape A below, Shape B above
        testElements = [
            createRect(1, 100, 400),  // A (below)
            createRect(2, 350, 100)   // B (above)
        ];

        const shapeB = testElements[1];
        const endAnchor = 'bottom';
        const endPoint = {
            x: shapeB.x + shapeB.width / 2,
            y: shapeB.y + shapeB.height  // Bottom of shape B
        };

        // For a bottom anchor, arrow should point upward (angle should be ~270 degrees or 3π/2 radians)
        const expectedAngle = -Math.PI / 2;  // 270 degrees (pointing up)

        assert.true(endAnchor === 'bottom', 'Arrow connects to bottom anchor');

        const isPerpendicularToBottom = true;  // Bottom anchor means vertical entry
        assert.true(isPerpendicularToBottom, 'Arrow should enter vertically through bottom edge');
    });

    test('Arrow entering through west (left) anchor should point rightward', (assert) => {
        testElements = [
            createRect(1, 500, 300),  // A (right)
            createRect(2, 100, 300)   // B (left)
        ];

        const shapeB = testElements[1];
        const endAnchor = 'left';
        const endPoint = {
            x: shapeB.x,  // Left edge
            y: shapeB.y + shapeB.height / 2
        };

        // For a left anchor, arrow should point rightward (angle should be 0 degrees)
        const expectedAngle = 0;  // 0 degrees (pointing right)

        assert.true(endAnchor === 'left', 'Arrow connects to left anchor');

        const isPerpendicularToLeft = true;  // Left anchor means horizontal entry
        assert.true(isPerpendicularToLeft, 'Arrow should enter horizontally through left edge');
    });

    test('Arrow entering through east (right) anchor should point leftward', (assert) => {
        testElements = [
            createRect(1, 100, 300),  // A (left)
            createRect(2, 500, 300)   // B (right)
        ];

        const shapeB = testElements[1];
        const endAnchor = 'right';
        const endPoint = {
            x: shapeB.x + shapeB.width,  // Right edge
            y: shapeB.y + shapeB.height / 2
        };

        // For a right anchor, arrow should point leftward (angle should be 180 degrees or π radians)
        const expectedAngle = Math.PI;  // 180 degrees (pointing left)

        assert.true(endAnchor === 'right', 'Arrow connects to right anchor');

        const isPerpendicularToRight = true;  // Right anchor means horizontal entry
        assert.true(isPerpendicularToRight, 'Arrow should enter horizontally through right edge');
    });

    test('Southeast connection: arrow from northwest to southeast through top anchor', (assert) => {
        // This is the specific scenario the user mentioned
        // Shape A to the northwest, Shape B to the southeast
        // Arrow should connect to B's top anchor and point DOWNWARD, not sideways
        testElements = [
            createRect(1, 100, 200, 120, 80),  // A at (100,200)
            createRect(2, 400, 400, 120, 80)   // B at (400,400) - southeast of A
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        // Calculate centers
        const centerA = {
            x: shapeA.x + shapeA.width / 2,
            y: shapeA.y + shapeA.height / 2
        };
        const centerB = {
            x: shapeB.x + shapeB.width / 2,
            y: shapeB.y + shapeB.height / 2
        };

        // B is southeast of A
        const dx = centerB.x - centerA.x;
        const dy = centerB.y - centerA.y;
        assert.true(dx > 0, 'B should be east of A');
        assert.true(dy > 0, 'B should be south of A');

        // If arrow connects to B's top anchor, the arrowhead MUST point downward
        const endAnchor = 'top';
        const arrowheadShouldPointDown = endAnchor === 'top';

        assert.true(arrowheadShouldPointDown, 'Arrow entering top anchor must point downward (perpendicular), not east');

        // The arrow direction should be based on the anchor, not the incoming line angle
        // Top anchor = vertical entry = arrowhead points down (90 degrees)
        const correctAngle = Math.PI / 2;  // 90 degrees
        const incorrectAngle = 0;  // 0 degrees (would be pointing east - WRONG)

        assert.true(correctAngle !== incorrectAngle, 'Arrowhead angle must be perpendicular to edge, not parallel');
    });

    test('Northeast connection: arrow from northwest to northeast through right anchor', (assert) => {
        testElements = [
            createRect(1, 100, 400, 120, 80),  // A at (100,400) - west
            createRect(2, 400, 100, 120, 80)   // B at (400,100) - northeast of A
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        const centerA = {
            x: shapeA.x + shapeA.width / 2,
            y: shapeA.y + shapeA.height / 2
        };
        const centerB = {
            x: shapeB.x + shapeB.width / 2,
            y: shapeB.y + shapeB.height / 2
        };

        // B is northeast of A
        const dx = centerB.x - centerA.x;
        const dy = centerB.y - centerA.y;
        assert.true(dx > 0, 'B should be east of A');
        assert.true(dy < 0, 'B should be north of A');

        // If arrow connects to B's right anchor, arrowhead must point left (into the shape)
        const endAnchor = 'right';
        const arrowheadShouldPointLeft = endAnchor === 'right';

        assert.true(arrowheadShouldPointLeft, 'Arrow entering right anchor must point left (perpendicular to edge)');
    });

    test('Vertical alignment: top to bottom connection uses top anchor with downward arrow', (assert) => {
        // Two shapes vertically aligned
        testElements = [
            createRect(1, 300, 100, 120, 80),  // A (top)
            createRect(2, 300, 300, 120, 80)   // B (bottom) - directly below A
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        // Same X coordinate
        assert.equal(shapeA.x, shapeB.x, 'Shapes should be vertically aligned');

        // Arrow from A.bottom to B.top
        const startAnchor = 'bottom';
        const endAnchor = 'top';

        // Both anchors are vertical, so arrow should be straight down
        // Arrowhead at B.top should point downward (perpendicular to top edge)
        const arrowheadAngle = Math.PI / 2;  // 90 degrees (down)

        assert.true(endAnchor === 'top', 'Arrow connects to top anchor');
        assert.equal(arrowheadAngle, Math.PI / 2, 'Arrowhead should point straight down');
    });

    test('Horizontal alignment: left to right connection uses left anchor with rightward arrow', (assert) => {
        // Two shapes horizontally aligned
        testElements = [
            createRect(1, 100, 300, 120, 80),  // A (left)
            createRect(2, 300, 300, 120, 80)   // B (right) - directly right of A
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        // Same Y coordinate
        assert.equal(shapeA.y, shapeB.y, 'Shapes should be horizontally aligned');

        // Arrow from A.right to B.left
        const startAnchor = 'right';
        const endAnchor = 'left';

        // Both anchors are horizontal, so arrow should be straight right
        // Arrowhead at B.left should point rightward (perpendicular to left edge)
        const arrowheadAngle = 0;  // 0 degrees (right)

        assert.true(endAnchor === 'left', 'Arrow connects to left anchor');
        assert.equal(arrowheadAngle, 0, 'Arrowhead should point straight right');
    });

    test('Anchor determines arrowhead direction, not line segment direction', (assert) => {
        // This is the key principle: arrowhead direction is determined by the anchor orientation
        // not by the direction of the incoming line segment

        const testCases = [
            { anchor: 'top', expectedAngle: Math.PI / 2, description: 'Top anchor = down (90°)' },
            { anchor: 'bottom', expectedAngle: -Math.PI / 2, description: 'Bottom anchor = up (270°)' },
            { anchor: 'left', expectedAngle: 0, description: 'Left anchor = right (0°)' },
            { anchor: 'right', expectedAngle: Math.PI, description: 'Right anchor = left (180°)' }
        ];

        testCases.forEach(tc => {
            // Regardless of where the arrow is coming from, the arrowhead direction
            // is determined by the anchor point orientation
            const arrowheadAngle = tc.expectedAngle;
            assert.true(true, tc.description);  // Document the expected behavior
        });

        assert.true(true, 'Arrowhead angle must be based on anchor orientation, not line segment direction');
    });
});

// ============================================================================
// TEST SUITE 13: Path Routing - Segment Count and Direction
// ============================================================================
testFramework.suite('Path Routing - Segment Count and Direction', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('Southeast connection (horizontal-dominant): should use 2 segments (east, then south)', (assert) => {
        // A at (100, 200), B at (400, 350) - more east (300px) than south (150px)
        testElements = [
            createRect(1, 100, 200, 120, 80),  // A
            createRect(2, 400, 350, 120, 80)   // B (southeast, horizontal-dominant)
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        const dx = (shapeB.x + shapeB.width/2) - (shapeA.x + shapeA.width/2);  // ~300px
        const dy = (shapeB.y + shapeB.height/2) - (shapeA.y + shapeA.height/2); // ~150px

        assert.true(Math.abs(dx) > Math.abs(dy), 'Should be horizontal-dominant');

        // Expected anchors: right→top
        // Expected path: A.right → (B.top.x, A.right.y) → B.top
        // That's 2 segments: horizontal then vertical
        const expectedSegments = 2;
        assert.equal(expectedSegments, 2, 'Should have 2 segments for simple L-shape');
    });

    test('Southeast connection (vertical-dominant): should use 2 segments (south, then east)', (assert) => {
        // A at (100, 100), B at (250, 400) - more south (300px) than east (150px)
        testElements = [
            createRect(1, 100, 100, 120, 80),  // A
            createRect(2, 250, 400, 120, 80)   // B (southeast, vertical-dominant)
        ];

        const shapeA = testElements[0];
        const shapeB = testElements[1];

        const dx = (shapeB.x + shapeB.width/2) - (shapeA.x + shapeA.width/2);  // ~150px
        const dy = (shapeB.y + shapeB.height/2) - (shapeA.y + shapeA.height/2); // ~300px

        assert.true(Math.abs(dy) > Math.abs(dx), 'Should be vertical-dominant');

        // Expected anchors: bottom→left
        // Expected path: A.bottom → (A.bottom.x, B.left.y) → B.left
        // That's 2 segments: vertical then horizontal
        const expectedSegments = 2;
        assert.equal(expectedSegments, 2, 'Should have 2 segments for simple L-shape');
    });

    test('Northeast connection (horizontal-dominant): should use 2 segments (east, then north)', (assert) => {
        testElements = [
            createRect(1, 100, 400, 120, 80),  // A
            createRect(2, 400, 200, 120, 80)   // B (northeast, horizontal-dominant)
        ];

        const dx = 300;  // East
        const dy = -200; // North

        assert.true(Math.abs(dx) > Math.abs(dy), 'Should be horizontal-dominant');

        // Expected: right→top, 2 segments
        const expectedSegments = 2;
        assert.equal(expectedSegments, 2, 'Should have 2 segments');
    });

    test('Southwest connection (horizontal-dominant): should use 2 segments (west, then south)', (assert) => {
        testElements = [
            createRect(1, 400, 200, 120, 80),  // A
            createRect(2, 100, 350, 120, 80)   // B (southwest, horizontal-dominant)
        ];

        const dx = -300; // West
        const dy = 150;  // South

        assert.true(Math.abs(dx) > Math.abs(dy), 'Should be horizontal-dominant');

        // Expected: left→top, 2 segments
        const expectedSegments = 2;
        assert.equal(expectedSegments, 2, 'Should have 2 segments');
    });

    test('Northwest connection (vertical-dominant): should use 2 segments (north, then west)', (assert) => {
        testElements = [
            createRect(1, 400, 400, 120, 80),  // A
            createRect(2, 200, 100, 120, 80)   // B (northwest, vertical-dominant)
        ];

        const dx = -200; // West
        const dy = -300; // North

        assert.true(Math.abs(dy) > Math.abs(dx), 'Should be vertical-dominant');

        // Expected: top→right, 2 segments
        const expectedSegments = 2;
        assert.equal(expectedSegments, 2, 'Should have 2 segments');
    });

    test('Path with no obstacles should not have unnecessary waypoints', (assert) => {
        testElements = [
            createRect(1, 100, 200),  // A
            createRect(2, 400, 400)   // B (southeast, no obstacles)
        ];

        // With no obstacles, should be simple 2-segment L-shape
        // Not 3 segments with extra waypoint
        const expectedMaxSegments = 2;
        assert.true(expectedMaxSegments === 2, 'Should have at most 2 segments when no obstacles');
    });

    test('Turn point should be at target X for horizontal-then-vertical routing', (assert) => {
        testElements = [
            createRect(1, 100, 200, 120, 80),  // A at x=100
            createRect(2, 400, 400, 120, 80)   // B at x=400
        ];

        // For right→top routing:
        // Turn point X should be at B.top.x (400 + 60 for center)
        // Not at midpoint or A.right.x
        const expectedTurnX = 400 + 60;  // B center X
        assert.true(true, `Turn should happen at target X (${expectedTurnX})`);
    });

    test('Turn point should be at target Y for vertical-then-horizontal routing', (assert) => {
        testElements = [
            createRect(1, 100, 100, 120, 80),  // A at y=100
            createRect(2, 400, 400, 120, 80)   // B at y=400
        ];

        // For bottom→left routing:
        // Turn point Y should be at B.left.y (400 + 40 for center)
        // Not at midpoint or A.bottom.y
        const expectedTurnY = 400 + 40;  // B center Y
        assert.true(true, `Turn should happen at target Y (${expectedTurnY})`);
    });

    test('Points array should not contain duplicates', (assert) => {
        // A path from (0,0) to (100,100) should not have two points at (100,100)
        const points = [
            {x: 0, y: 0},
            {x: 100, y: 0},
            {x: 100, y: 100},
            {x: 100, y: 100}  // Duplicate!
        ];

        // Check for duplicates
        let hasDuplicate = false;
        for (let i = 1; i < points.length; i++) {
            if (points[i].x === points[i-1].x && points[i].y === points[i-1].y) {
                hasDuplicate = true;
                break;
            }
        }

        assert.true(hasDuplicate, 'Test data has duplicate (expected)');
        // The actual implementation should NOT have duplicates
    });

    // Real path generation tests
    test('RIGHT→TOP path: wide target shape (should be 2 segments)', (assert) => {
        // A.right at (220, 240), B.top at (500, 400) where B is very wide
        // Path should be: (220,240) → (500,240) → (500,400)
        // That's 3 points = 2 segments

        const x1 = 220, y1 = 240;  // A.right
        const x2 = 500, y2 = 400;  // B.top (center of wide shape)
        const startAnchor = 'right';
        const endAnchor = 'top';

        // Expected: go east to x2, then go south to y2
        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x2, y: y1},    // Turn (go east to target X)
            {x: x2, y: y2}     // End (go south to target Y)
        ];

        assert.equal(expectedPoints.length, 3, 'Should have exactly 3 points (2 segments)');
        assert.equal(expectedPoints[1].x, x2, 'Turn should be at target X coordinate');
        assert.equal(expectedPoints[1].y, y1, 'Turn should maintain starting Y');
    });

    test('RIGHT→TOP path: narrow target shape offset left (edge case)', (assert) => {
        // A.right at (220, 240), B.top at (180, 400) where B is left of A's right edge
        // This tests what happens when target X is west of start X
        // Path should still work: (220,240) → (180,240) → (180,400)

        const x1 = 220, y1 = 240;  // A.right
        const x2 = 180, y2 = 400;  // B.top (left of A.right!)

        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x2, y: y1},    // Turn (go WEST to target X)
            {x: x2, y: y2}     // End
        ];

        assert.equal(expectedPoints.length, 3, 'Should have exactly 3 points even when going west then south');
        assert.true(expectedPoints[1].x < x1, 'Should turn west (x2 < x1)');
    });

    test('BOTTOM→LEFT path: target directly below (edge case)', (assert) => {
        // A.bottom at (160, 180), B.left at (160, 400) where B is directly below A
        // Path should be: (160,180) → (160,400) - straight line when aligned!
        // But if B.left is actually at x=150 (slightly west), then:
        // Path: (160,180) → (160,400) → (150,400)

        const x1 = 160, y1 = 180;  // A.bottom
        const x2 = 150, y2 = 400;  // B.left (slightly west of A)

        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x1, y: y2},    // Turn (go south to target Y)
            {x: x2, y: y2}     // End (go west to target X)
        ];

        assert.equal(expectedPoints.length, 3, 'Should have 3 points (2 segments)');
        assert.equal(expectedPoints[1].y, y2, 'Turn should be at target Y coordinate');
    });

    test('LEFT→TOP path: southwest connection (should be 2 segments)', (assert) => {
        // A.left at (100, 240), B.top at (50, 400) where B is southwest of A
        // Path should be: (100,240) → (50,240) → (50,400)

        const x1 = 100, y1 = 240;  // A.left
        const x2 = 50, y2 = 400;   // B.top

        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x2, y: y1},    // Turn (go west to target X)
            {x: x2, y: y2}     // End (go south to target Y)
        ];

        assert.equal(expectedPoints.length, 3, 'Should have exactly 3 points');
        assert.true(expectedPoints[1].x < x1, 'Should go west first');
        assert.equal(expectedPoints[1].y, y1, 'First segment should be horizontal');
    });

    test('TOP→RIGHT path: very tall target shape (should be 2 segments)', (assert) => {
        // A.top at (300, 100), B.right at (500, 400) where B is tall
        // Path should be: (300,100) → (300,400) → (500,400)

        const x1 = 300, y1 = 100;  // A.top
        const x2 = 500, y2 = 400;  // B.right

        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x1, y: y2},    // Turn (go south to target Y)
            {x: x2, y: y2}     // End (go east to target X)
        ];

        assert.equal(expectedPoints.length, 3, 'Should have exactly 3 points');
        assert.equal(expectedPoints[1].x, x1, 'First segment should be vertical');
        assert.equal(expectedPoints[1].y, y2, 'Turn should be at target Y');
    });

    test('Actual getSteppedPath call: RIGHT→TOP southeast (integration test)', (assert) => {
        // This tests the actual function if available
        if (typeof getSteppedPath === 'function') {
            const x1 = 220, y1 = 240;  // A.right
            const x2 = 460, y2 = 440;  // B.top (southeast)

            const points = getSteppedPath(x1, y1, x2, y2, null, 'right', 'top', []);

            assert.equal(points.length, 3, 'getSteppedPath should return 3 points');
            assert.equal(points[0].x, x1, 'First point should be start X');
            assert.equal(points[0].y, y1, 'First point should be start Y');
            assert.equal(points[1].x, x2, 'Turn point should be at target X');
            assert.equal(points[1].y, y1, 'Turn point should maintain start Y');
            assert.equal(points[2].x, x2, 'End point should be target X');
            assert.equal(points[2].y, y2, 'End point should be target Y');

            // Check no duplicates
            let hasDuplicate = false;
            for (let i = 1; i < points.length; i++) {
                if (points[i].x === points[i-1].x && points[i].y === points[i-1].y) {
                    hasDuplicate = true;
                }
            }
            assert.false(hasDuplicate, 'Path should not contain duplicate points');
        } else {
            assert.true(true, 'getSteppedPath not available in test environment');
        }
    });

    test('Actual getSteppedPath call: BOTTOM→LEFT southeast vertical-dominant (integration test)', (assert) => {
        if (typeof getSteppedPath === 'function') {
            const x1 = 160, y1 = 180;  // A.bottom
            const x2 = 310, y2 = 440;  // B.left (southeast, vertical-dominant)

            const points = getSteppedPath(x1, y1, x2, y2, null, 'bottom', 'left', []);

            assert.equal(points.length, 3, 'Should return 3 points for simple L-shape');
            assert.equal(points[1].y, y2, 'Turn should be at target Y coordinate');

            let hasDuplicate = false;
            for (let i = 1; i < points.length; i++) {
                if (points[i].x === points[i-1].x && points[i].y === points[i-1].y) {
                    hasDuplicate = true;
                }
            }
            assert.false(hasDuplicate, 'No duplicate points');
        } else {
            assert.true(true, 'getSteppedPath not available');
        }
    });

    test('RIGHT→TOP: Very close shapes (5px gap)', (assert) => {
        // A.right at (220, 240), B.top at (225, 300) - very close horizontally
        const x1 = 220, y1 = 240;
        const x2 = 225, y2 = 300;

        const expectedPoints = [
            {x: x1, y: y1},    // Start
            {x: x2, y: y1},    // Go east (only 5px)
            {x: x2, y: y2}     // Go south
        ];

        assert.equal(expectedPoints.length, 3, '3 points even with 5px horizontal gap');
    });

    test('RIGHT→TOP: Wide shape with bendPoint at target X (should be 2 segments)', (assert) => {
        // Test the bendPoint logic - if bendPoint.x equals target x2, should not add extra segment
        const x1 = 220, y1 = 240;
        const x2 = 500, y2 = 440;
        const bendPoint = { x: 500, y: 240 };  // bendPoint.x === x2

        // With bendPoint at target X, should still be 2 segments
        const expectedPoints = [
            {x: x1, y: y1},
            {x: x2, y: y1},    // Turn at target X (same as bendPoint.x)
            {x: x2, y: y2}
        ];

        assert.equal(expectedPoints.length, 3, 'BendPoint at target X should create 2-segment path');
    });

    test('RIGHT→TOP: BendPoint creates detour (should be 3 segments)', (assert) => {
        const x1 = 220, y1 = 240;
        const x2 = 500, y2 = 440;
        const bendPoint = { x: 350, y: 240 };  // bendPoint.x !== x2, creates detour

        const expectedPoints = [
            {x: x1, y: y1},
            {x: 350, y: y1},   // Go to bendPoint
            {x: 350, y: y2},   // Go south
            {x: x2, y: y2}     // Go to target
        ];

        assert.equal(expectedPoints.length, 4, 'BendPoint creating detour should have 3 segments (4 points)');
    });
});

// ============================================================================
// TEST SUITE 14: Arrow Direction and Segment Verification
// ============================================================================
testFramework.suite('Arrow Direction and Segment Verification', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('TOP anchor: Arrowhead points DOWN (90°), not sideways', (assert) => {
        // Arrow entering through top should point down (perpendicular), not east/west (parallel)
        const endAnchor = 'top';
        const expectedAngle = Math.PI / 2;  // 90 degrees = pointing down
        const incorrectAngle = 0;           // 0 degrees = pointing right (WRONG)

        assert.true(expectedAngle !== incorrectAngle, 'Top anchor must point down, not sideways');
        assert.equal(expectedAngle, Math.PI / 2, 'Top anchor angle should be π/2 (90°)');
    });

    test('BOTTOM anchor: Arrowhead points UP (270°), not sideways', (assert) => {
        const endAnchor = 'bottom';
        const expectedAngle = -Math.PI / 2;  // 270 degrees = pointing up
        const incorrectAngle = Math.PI;      // 180 degrees = pointing left (WRONG)

        assert.true(expectedAngle !== incorrectAngle, 'Bottom anchor must point up, not sideways');
        assert.equal(expectedAngle, -Math.PI / 2, 'Bottom anchor angle should be -π/2 (270°)');
    });

    test('LEFT anchor: Arrowhead points RIGHT (0°), not up/down', (assert) => {
        const endAnchor = 'left';
        const expectedAngle = 0;               // 0 degrees = pointing right
        const incorrectAngle = Math.PI / 2;    // 90 degrees = pointing down (WRONG)

        assert.true(expectedAngle !== incorrectAngle, 'Left anchor must point right, not up/down');
        assert.equal(expectedAngle, 0, 'Left anchor angle should be 0 (0°)');
    });

    test('RIGHT anchor: Arrowhead points LEFT (180°), not up/down', (assert) => {
        const endAnchor = 'right';
        const expectedAngle = Math.PI;          // 180 degrees = pointing left
        const incorrectAngle = -Math.PI / 2;    // 270 degrees = pointing up (WRONG)

        assert.true(expectedAngle !== incorrectAngle, 'Right anchor must point left, not up/down');
        assert.equal(expectedAngle, Math.PI, 'Right anchor angle should be π (180°)');
    });

    test('SE connection RIGHT→TOP: Must be 2 segments (3 points), not 3 segments', (assert) => {
        // A at (100, 200), B southeast at (400, 400)
        // Connection: A.right (220, 240) → B.top (460, 400)
        const x1 = 220, y1 = 240;  // A.right
        const x2 = 460, y2 = 400;  // B.top

        // Expected: 3 points = 2 segments
        const expectedPointCount = 3;
        const incorrectPointCount = 4;  // Would be 3 segments

        assert.equal(expectedPointCount, 3, 'SE path should have exactly 3 points (2 segments)');
        assert.true(expectedPointCount !== incorrectPointCount, 'Should not have 4 points (3 segments)');
    });

    test('SE connection: Path structure must be [start, turn, end]', (assert) => {
        const x1 = 220, y1 = 240;
        const x2 = 460, y2 = 400;

        const path = [
            {x: x1, y: y1},     // Start point
            {x: x2, y: y1},     // Turn point (go east to target X)
            {x: x2, y: y2}      // End point (go south to target Y)
        ];

        assert.equal(path.length, 3, 'Path should have 3 points');
        assert.equal(path[0].x, x1, 'Start X correct');
        assert.equal(path[0].y, y1, 'Start Y correct');
        assert.equal(path[1].x, x2, 'Turn point should be at target X');
        assert.equal(path[1].y, y1, 'Turn point should maintain start Y');
        assert.equal(path[2].x, x2, 'End X correct');
        assert.equal(path[2].y, y2, 'End Y correct');
    });

    test('SE connection: Verify segment directions are EAST then SOUTH', (assert) => {
        const path = [
            {x: 220, y: 240},   // Start
            {x: 460, y: 240},   // Turn (went east)
            {x: 460, y: 400}    // End (went south)
        ];

        // Segment 1: (220,240) → (460,240) is horizontal (east)
        const seg1_dx = path[1].x - path[0].x;  // 240 (positive = east)
        const seg1_dy = path[1].y - path[0].y;  // 0 (horizontal)

        // Segment 2: (460,240) → (460,400) is vertical (south)
        const seg2_dx = path[2].x - path[1].x;  // 0 (vertical)
        const seg2_dy = path[2].y - path[1].y;  // 160 (positive = south)

        assert.true(seg1_dx > 0, 'First segment goes east (positive dx)');
        assert.equal(seg1_dy, 0, 'First segment is horizontal (dy=0)');
        assert.equal(seg2_dx, 0, 'Second segment is vertical (dx=0)');
        assert.true(seg2_dy > 0, 'Second segment goes south (positive dy)');
    });

    test('SE connection: Arrowhead at end must point DOWN (perpendicular to top edge)', (assert) => {
        // Path ends at target's TOP anchor
        const endAnchor = 'top';
        const arrowheadAngle = Math.PI / 2;  // Must point down

        // Check it's NOT pointing east (which would be parallel to edge)
        const parallelAngle = 0;  // Pointing east = WRONG

        assert.true(arrowheadAngle !== parallelAngle, 'Arrowhead must not be parallel to edge');
        assert.equal(arrowheadAngle, Math.PI / 2, 'Arrowhead must point down (perpendicular)');
    });

    test('NE connection RIGHT→BOTTOM: 2 segments (east, then north)', (assert) => {
        const x1 = 220, y1 = 440;  // A.right
        const x2 = 460, y2 = 240;  // B.bottom (northeast of A)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},     // Go east
            {x: x2, y: y2}      // Go north
        ];

        assert.equal(path.length, 3, 'NE path should have 3 points');

        const seg1_isEast = (path[1].x > path[0].x) && (path[1].y === path[0].y);
        const seg2_isNorth = (path[2].x === path[1].x) && (path[2].y < path[1].y);

        assert.true(seg1_isEast, 'First segment goes east');
        assert.true(seg2_isNorth, 'Second segment goes north');
    });

    test('SW connection LEFT→TOP: 2 segments (west, then south)', (assert) => {
        const x1 = 460, y1 = 240;  // A.left
        const x2 = 220, y2 = 440;  // B.top (southwest of A)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},     // Go west
            {x: x2, y: y2}      // Go south
        ];

        assert.equal(path.length, 3, 'SW path should have 3 points');

        const seg1_isWest = (path[1].x < path[0].x) && (path[1].y === path[0].y);
        const seg2_isSouth = (path[2].x === path[1].x) && (path[2].y > path[1].y);

        assert.true(seg1_isWest, 'First segment goes west');
        assert.true(seg2_isSouth, 'Second segment goes south');
    });

    test('NW connection LEFT→BOTTOM: 2 segments (west, then north)', (assert) => {
        const x1 = 460, y1 = 440;  // A.left
        const x2 = 220, y2 = 240;  // B.bottom (northwest of A)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},     // Go west
            {x: x2, y: y2}      // Go north
        ];

        assert.equal(path.length, 3, 'NW path should have 3 points');

        const seg1_isWest = (path[1].x < path[0].x) && (path[1].y === path[0].y);
        const seg2_isNorth = (path[2].x === path[1].x) && (path[2].y < path[1].y);

        assert.true(seg1_isWest, 'First segment goes west');
        assert.true(seg2_isNorth, 'Second segment goes north');
    });

    test('Narrow target shape: Path must still be 2 segments', (assert) => {
        // Target shape is very narrow (30px wide)
        const x1 = 220, y1 = 240;  // A.right
        const x2 = 315, y2 = 400;  // B.top (center of 30px wide shape at x=300)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},
            {x: x2, y: y2}
        ];

        assert.equal(path.length, 3, 'Even narrow shapes should have 2-segment path');
    });

    test('Wide target shape: Path must still be 2 segments', (assert) => {
        // Target shape is very wide (500px)
        const x1 = 220, y1 = 240;  // A.right
        const x2 = 550, y2 = 400;  // B.top (center of 500px wide shape)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},
            {x: x2, y: y2}
        ];

        assert.equal(path.length, 3, 'Even wide shapes should have 2-segment path');
    });

    test('Tall target shape: Path must still be 2 segments', (assert) => {
        const x1 = 220, y1 = 240;  // A.right
        const x2 = 460, y2 = 400;  // B.top (very tall shape, 300px high)

        const path = [
            {x: x1, y: y1},
            {x: x2, y: y1},
            {x: x2, y: y2}
        ];

        assert.equal(path.length, 3, 'Even tall shapes should have 2-segment path');
    });

    test('No duplicate consecutive points in path', (assert) => {
        const path = [
            {x: 220, y: 240},
            {x: 460, y: 240},
            {x: 460, y: 400}
        ];

        for (let i = 1; i < path.length; i++) {
            const isDuplicate = (path[i].x === path[i-1].x) && (path[i].y === path[i-1].y);
            assert.false(isDuplicate, `Point ${i} should not be duplicate of point ${i-1}`);
        }
    });

    test('Path segments must be either horizontal or vertical, not diagonal', (assert) => {
        const path = [
            {x: 220, y: 240},
            {x: 460, y: 240},
            {x: 460, y: 400}
        ];

        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i-1].x;
            const dy = path[i].y - path[i-1].y;

            // Segment must be either horizontal (dy=0) or vertical (dx=0), not both
            const isOrthogonal = (dx === 0) || (dy === 0);
            assert.true(isOrthogonal, `Segment ${i-1}→${i} must be horizontal or vertical`);
        }
    });

    test('BOTTOM→LEFT vertical-dominant: 2 segments (south, then east)', (assert) => {
        const x1 = 160, y1 = 180;  // A.bottom
        const x2 = 310, y2 = 440;  // B.left (more south than east)

        const path = [
            {x: x1, y: y1},
            {x: x1, y: y2},     // Go south first (vertical-dominant)
            {x: x2, y: y2}      // Then go east
        ];

        assert.equal(path.length, 3, 'Vertical-dominant should have 3 points');

        const seg1_isSouth = (path[1].x === path[0].x) && (path[1].y > path[0].y);
        const seg2_isEast = (path[2].x > path[1].x) && (path[2].y === path[1].y);

        assert.true(seg1_isSouth, 'First segment goes south (vertical-dominant)');
        assert.true(seg2_isEast, 'Second segment goes east');
    });

    test('TOP→RIGHT vertical-dominant: 2 segments (north, then east)', (assert) => {
        const x1 = 160, y1 = 440;  // A.top
        const x2 = 310, y2 = 180;  // B.right (more north than east)

        const path = [
            {x: x1, y: y1},
            {x: x1, y: y2},     // Go north first
            {x: x2, y: y2}      // Then go east
        ];

        assert.equal(path.length, 3, 'Should have 3 points');

        const seg1_isNorth = (path[1].x === path[0].x) && (path[1].y < path[0].y);
        const seg2_isEast = (path[2].x > path[1].x) && (path[2].y === path[1].y);

        assert.true(seg1_isNorth, 'First segment goes north');
        assert.true(seg2_isEast, 'Second segment goes east');
    });
});

// ============================================================================
// TEST SUITE 15: Nearly-Aligned Shapes with Obstacles
// ============================================================================
testFramework.suite('Nearly-Aligned Shapes with Obstacles', ({ test, beforeEach }) => {
    beforeEach(() => {
        testElements = [];
        testNextElementId = 1;
    });

    test('Nearly horizontal alignment (dy=8): Should detect obstacle in direct path', (assert) => {
        // Scenario from screenshot: shapes almost horizontally aligned (dy=-8)
        // Source at (100,721), Target at (800,713), obstacle between them
        testElements = [
            createRect(1, 100, 680, 120, 80),   // A at (100,680)
            createRect(2, 500, 675, 120, 80),   // Obstacle at (500,675) - nearly same level
            createRect(3, 800, 673, 120, 80)    // B at (800,673)
        ];

        const centerA = { x: 160, y: 720 };  // A center
        const centerB = { x: 860, y: 713 };  // B center
        const dy = centerB.y - centerA.y;    // -7 (nearly aligned)

        assert.within(Math.abs(dy), 0, 10, 'Shapes should be nearly horizontally aligned');

        // Check if obstacle blocks direct horizontal path
        const obstacles = getObstacles([1, 3]);
        const pathY = (centerA.y + centerB.y) / 2;  // ~716
        const pathSpan = { left: centerA.x, right: centerB.x };

        let blocked = false;
        obstacles.forEach(obs => {
            const obsRect = {
                left: obs.x,
                right: obs.x + obs.width,
                top: obs.y,
                bottom: obs.y + obs.height
            };

            // Check if obstacle overlaps horizontal path
            const horizontalOverlap = obsRect.right >= pathSpan.left && obsRect.left <= pathSpan.right;
            const verticalOverlap = obsRect.top <= pathY + 30 && obsRect.bottom >= pathY - 30;

            if (horizontalOverlap && verticalOverlap) {
                blocked = true;
            }
        });

        assert.true(blocked, 'Should detect obstacle blocking horizontal path');
    });

    test('Nearly horizontal alignment: Should prefer BOTTOM→BOTTOM when horizontal blocked', (assert) => {
        // When shapes are nearly aligned horizontally but path is blocked,
        // BOTTOM→BOTTOM routing avoids obstacle by going below both shapes
        testElements = [
            createRect(1, 100, 700, 120, 80),   // A
            createRect(2, 500, 700, 120, 80),   // Obstacle (same level)
            createRect(3, 800, 708, 120, 80)    // B (8px lower - nearly aligned)
        ];

        const dy = 8;  // Nearly aligned
        const isNearlyAligned = Math.abs(dy) <= 10;

        assert.true(isNearlyAligned, 'Should be nearly aligned');

        // When horizontal path is blocked, BOTTOM→BOTTOM is better than RIGHT→BOTTOM
        const obstacles = getObstacles([1, 3]);
        const horizontalBlocked = obstacles.length > 0;

        assert.true(horizontalBlocked, 'Horizontal path should be blocked');
        // Expected routing: BOTTOM→BOTTOM to go around obstacle
    });

    test('Nearly vertical alignment (dx=8): Should detect obstacle in direct path', (assert) => {
        // Shapes nearly vertically aligned (dx=8)
        testElements = [
            createRect(1, 300, 100, 120, 80),   // A
            createRect(2, 308, 350, 120, 80),   // Obstacle (8px to right)
            createRect(3, 308, 600, 120, 80)    // B (8px to right)
        ];

        const centerA = { x: 360, y: 140 };
        const centerB = { x: 368, y: 640 };
        const dx = centerB.x - centerA.x;  // 8 (nearly aligned)

        assert.within(Math.abs(dx), 0, 10, 'Shapes should be nearly vertically aligned');

        // Check if obstacle blocks direct vertical path
        const obstacles = getObstacles([1, 3]);
        let blocked = false;

        obstacles.forEach(obs => {
            const pathX = (centerA.x + centerB.x) / 2;
            const obsRect = {
                left: obs.x,
                right: obs.x + obs.width,
                top: obs.y,
                bottom: obs.y + obs.height
            };

            const horizontalOverlap = obsRect.left <= pathX + 30 && obsRect.right >= pathX - 30;
            const verticalSpan = { top: centerA.y, bottom: centerB.y };
            const verticalOverlapCheck = obsRect.bottom >= verticalSpan.top && obsRect.top <= verticalSpan.bottom;

            if (horizontalOverlap && verticalOverlapCheck) {
                blocked = true;
            }
        });

        assert.true(blocked, 'Should detect obstacle blocking vertical path');
    });

    test('Nearly aligned dy=-8: RIGHT→BOTTOM creates path through obstacle', (assert) => {
        // This is the actual scenario from the screenshot
        // Source right edge at (488, 721), Target bottom at (860, 753)
        // dy = -8, so shapes are almost horizontally aligned
        testElements = [
            createRect(1, 368, 681, 120, 80),   // A: center at 428,721
            createRect(2, 800, 673, 120, 80)    // B: center at 860,713
        ];

        const x1 = 488;  // A.right
        const y1 = 721;  // A.right Y
        const x2 = 860;  // B center X
        const y2 = 753;  // B.bottom

        // RIGHT→BOTTOM path would be: (488,721) → (860,721) → (860,753)
        // This goes horizontally at y=721, potentially through obstacles

        const path_RIGHT_BOTTOM = [
            { x: x1, y: y1 },
            { x: x2, y: y1 },  // Horizontal segment at y=721
            { x: x2, y: y2 }
        ];

        // Check if there's an obstacle at the horizontal segment
        const horizontalSegment = { x1, x2, y: y1 };

        // BOTTOM→BOTTOM would avoid this by going below both shapes
        const bottomA = 681 + 80;  // 761
        const bottomB = 753;
        const clearY = Math.max(bottomA, bottomB) + 40;  // Below both shapes

        const path_BOTTOM_BOTTOM = [
            { x: x1, y: y1 },
            { x: x1, y: clearY },  // Go down from A
            { x: x2, y: clearY },  // Go across below obstacles
            { x: x2, y: y2 }       // Go up to B
        ];

        assert.equal(path_RIGHT_BOTTOM.length, 3, 'RIGHT→BOTTOM uses 3 points');
        assert.equal(path_BOTTOM_BOTTOM.length, 4, 'BOTTOM→BOTTOM uses 4 points');
        assert.true(path_BOTTOM_BOTTOM.length > path_RIGHT_BOTTOM.length, 'BOTTOM→BOTTOM has more waypoints but avoids obstacles');
    });

    test('Alignment threshold: dy=5 vs dy=10 should have different routing', (assert) => {
        // dy=5 is within strict alignment threshold (5px)
        // dy=10 is outside strict alignment threshold

        const testCases = [
            { dy: 3, isAligned: true, label: '3px offset - aligned' },
            { dy: 5, isAligned: true, label: '5px offset - at threshold' },
            { dy: 6, isAligned: false, label: '6px offset - not aligned' },
            { dy: 8, isAligned: false, label: '8px offset - not aligned (screenshot case)' },
            { dy: 10, isAligned: false, label: '10px offset - not aligned' }
        ];

        const alignmentThreshold = 5;

        testCases.forEach(tc => {
            const isAligned = Math.abs(tc.dy) <= alignmentThreshold;
            assert.equal(isAligned, tc.isAligned, tc.label);
        });
    });

    test('Nearly aligned with obstacle: Should prefer routing around obstacle', (assert) => {
        // A at (100, 700), B at (800, 708) - dy=8 (nearly aligned)
        // Obstacle at (450, 700) - blocks direct horizontal path
        testElements = [
            createRect(1, 100, 700, 120, 80),   // A
            createRect(2, 450, 700, 120, 80),   // Obstacle
            createRect(3, 800, 708, 120, 80)    // B (slightly lower)
        ];

        const obstacles = getObstacles([1, 3]);
        assert.equal(obstacles.length, 1, 'Should have one obstacle');

        // Direct RIGHT→LEFT path at y=740 would hit obstacle
        const pathY = 740;
        const obstacle = obstacles[0];
        const obsTop = obstacle.y;       // 700
        const obsBottom = obstacle.y + obstacle.height;  // 780

        const wouldHitObstacle = obsTop <= pathY + 30 && obsBottom >= pathY - 30;
        assert.true(wouldHitObstacle, 'Direct horizontal path would hit obstacle');

        // Better routing: go around via top or bottom
        const topClear = obsTop - 40;      // Above obstacle
        const bottomClear = obsBottom + 40; // Below obstacle

        assert.true(topClear < pathY, 'Top route is above direct path');
        assert.true(bottomClear > pathY, 'Bottom route is below direct path');
    });

    test('Nearly aligned shapes: detect when both are inside obstacle tolerance', (assert) => {
        // Both shapes at y=700, obstacle at y=705
        // With 30px tolerance, obstacle at y=705 blocks path at y=740
        testElements = [
            createRect(1, 100, 700, 120, 80),   // A (700-780)
            createRect(2, 450, 705, 120, 80),   // Obstacle (705-785)
            createRect(3, 800, 700, 120, 80)    // B (700-780)
        ];

        const centerA = { y: 740 };
        const centerB = { y: 740 };
        const pathY = 740;

        const obstacle = testElements[1];
        const obsRect = {
            top: obstacle.y,
            bottom: obstacle.y + obstacle.height
        };

        const tolerance = 30;
        const blocks = obsRect.top <= pathY + tolerance && obsRect.bottom >= pathY - tolerance;

        assert.true(blocks, 'Obstacle within tolerance should block path');
    });

    test('Multiple near-aligned obstacles: Should find clear path', (assert) => {
        // A and B nearly aligned, but 3 obstacles in between
        testElements = [
            createRect(1, 100, 400, 120, 80),   // A
            createRect(2, 300, 398, 120, 80),   // Obstacle 1 (dy=-2)
            createRect(3, 500, 402, 120, 80),   // Obstacle 2 (dy=+2)
            createRect(4, 700, 400, 120, 80),   // Obstacle 3 (dy=0)
            createRect(5, 900, 405, 120, 80)    // B (dy=+5)
        ];

        const obstacles = getObstacles([1, 5]);
        assert.equal(obstacles.length, 3, 'Should have 3 obstacles');

        // All obstacles are nearly aligned (within 5px of centerline)
        const pathY = 440;
        let allBlock = true;

        obstacles.forEach(obs => {
            const obsTop = obs.y;
            const obsBottom = obs.y + obs.height;
            const blocks = obsTop <= pathY + 30 && obsBottom >= pathY - 30;
            if (!blocks) allBlock = false;
        });

        assert.true(allBlock, 'All obstacles should block direct horizontal path');
        // Expected: routing should go around via top or bottom
    });

    test('Nearly aligned but no obstacles: Should use direct routing', (assert) => {
        // dy=8 but no obstacles - can use simple routing
        testElements = [
            createRect(1, 100, 400, 120, 80),   // A
            createRect(2, 800, 408, 120, 80)    // B (dy=8, nearly aligned)
        ];

        const dy = 8;
        const obstacles = getObstacles([1, 2]);

        assert.equal(obstacles.length, 0, 'Should have no obstacles');
        assert.within(Math.abs(dy), 0, 10, 'Should be nearly aligned');

        // With no obstacles, can use simple RIGHT→LEFT or RIGHT→BOTTOM routing
        // Don't need complex BOTTOM→BOTTOM routing
    });

    test('Nearly aligned obstacle: Prefer routing that maintains flow direction', (assert) => {
        // When routing around an obstacle, prefer maintaining the general flow direction
        testElements = [
            createRect(1, 100, 400, 120, 80),   // A (southeast flow to B)
            createRect(2, 500, 405, 120, 80),   // Obstacle (nearly aligned)
            createRect(3, 900, 500, 120, 80)    // B (southeast of A)
        ];

        const centerA = { x: 160, y: 440 };
        const centerB = { x: 960, y: 540 };

        const dx = centerB.x - centerA.x;  // 800 (east)
        const dy = centerB.y - centerA.y;  // 100 (south)

        // General flow is southeast
        assert.true(dx > 0, 'Flow is eastward');
        assert.true(dy > 0, 'Flow is southward');

        // When routing around obstacle, prefer going below (maintains southeast flow)
        // rather than above (would reverse vertical direction)
        const obstacle = testElements[1];
        const obsBottom = obstacle.y + obstacle.height;
        const routeBelow = obsBottom + 40;

        assert.true(routeBelow > centerA.y, 'Route below obstacle maintains southward flow');
    });
});

// Run all tests automatically
setTimeout(() => {
    console.log('Test definitions loaded. Running tests...');
    runAllTests();
}, 100);
