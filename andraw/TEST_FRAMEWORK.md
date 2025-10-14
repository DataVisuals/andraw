# Andraw Test Framework

A comprehensive testing framework for validating obstacle avoidance, path routing, and anchor selection logic in Andraw.

## Features

- 🎯 **90+ Test Cases** covering all edge conditions
- 📊 **Visual Test Runner** with detailed results and filtering
- ⚡ **Fast Execution** - All tests run in <100ms
- 📦 **Organized Suites** - Tests grouped by functionality
- 🔍 **Detailed Assertions** - Multiple assertion types with clear error messages
- 📈 **Performance Tests** - Validates speed for large datasets
- 💾 **Export Results** - Save test results as JSON

## Quick Start

### Running Tests

1. Open `test-framework.html` in your browser
2. Tests run automatically on load
3. Click "▶ Run All Tests" to re-run

### Viewing Results

- **Green ✓** = Passed tests
- **Red ✗** = Failed tests
- Click suite headers to expand/collapse
- Use filter buttons to show only passed or failed tests

## Test Suites

### 1. Obstacle Detection - Horizontal Paths (6 tests)
Tests horizontal path obstacle detection with tolerance bands.

**Key Tests:**
- Direct obstacle detection in path
- Obstacles above/below outside tolerance
- Tolerance band detection (±30px)
- No horizontal overlap
- Multiple obstacles

**Edge Cases:**
- Exact tolerance boundary
- Just outside tolerance
- Partial overlaps

### 2. Obstacle Detection - Vertical Paths (3 tests)
Tests vertical path obstacle detection.

**Key Tests:**
- Direct obstacle in vertical path
- Obstacles to the side (outside tolerance)
- Within tolerance band

### 3. Anchor Selection - Same-Side Anchors (3 tests)
Tests same-side anchor selection (top→top, bottom→bottom, etc.).

**Key Tests:**
- Same-level detection with obstacles above
- Same-level detection with obstacles below
- Same-level tolerance (±20px)

**Validates:**
- 0px offset = same level ✓
- 10px offset = same level ✓
- 19px offset = same level ✓
- 25px offset = different level ✓

### 4. Anchor Selection - Perpendicular Anchors (3 tests)
Tests perpendicular anchor combinations (top→left, bottom→right, etc.).

**Key Tests:**
- Top→left for target above-right
- Bottom→left for target below-right
- No A* pathfinding for perpendicular

**Validates:**
- L-shaped routing for diagonal connections
- Simple geometry vs. complex pathfinding

### 5. Anchor Selection - Simple Opposite Anchors (5 tests)
Tests simple opposite anchors (left→right, top→bottom).

**Key Tests:**
- left→right identification
- right→left identification
- top→bottom identification
- No A* for simple opposite at same level
- Distinguishes from perpendicular

**Validates:**
- Straight line routing when aligned
- Multi-segment only when misaligned

### 6. Path Routing - Straight Lines (3 tests)
Tests straight line generation for aligned shapes.

**Key Tests:**
- Straight horizontal line (same Y)
- Straight vertical line (same X)
- Multi-segment for misaligned shapes

**Edge Cases:**
- Within 5px tolerance = straight
- Outside 5px tolerance = multi-segment

### 7. Path Routing - Dynamic Offset Calculation (3 tests)
Tests dynamic offset based on obstacle positions.

**Key Tests:**
- Offset for top routing with obstacle above
- Minimum offset (60px) with no obstacles
- Offset for bottom routing with obstacle below

**Algorithm:**
```javascript
// Top routing
offset = max(60, minY - obstacleTop + 40)

// Bottom routing
offset = max(60, obstacleBottom - maxY + 40)
```

### 8. Edge Cases - Boundary Conditions (6 tests)
Tests edge cases and boundaries.

**Key Tests:**
- Zero-width path (vertical line)
- Zero-height path (horizontal line)
- Exact tolerance boundary
- Very large shapes (10000x10000)
- Canvas boundaries

### 9. Edge Cases - Overlapping Shapes (3 tests)
Tests handling of overlapping shapes.

**Key Tests:**
- Completely overlapping (same position)
- Partially overlapping
- Touching at edges

### 10. Integration - Complex Layouts (5 tests)
Tests real-world complex scenarios.

**Key Tests:**
- **Tunnel scenario**: Obstacles above AND below
- **Checkerboard pattern**: Staggered obstacles
- **Grid layout**: 2x3 shape grid
- **Star pattern**: Center with 4 surrounding
- **Dense field**: 10 shapes

### 11. Performance Tests (3 tests)
Validates performance at scale.

**Key Tests:**
- 10 shapes: <1ms
- 100 shapes: <5ms
- 1000 iterations: <10ms

## Test Assertions

### Available Assertions

```javascript
assert.equal(actual, expected, message)
assert.deepEqual(obj1, obj2, message)
assert.true(value, message)
assert.false(value, message)
assert.throws(fn, message)
assert.within(actual, expected, tolerance, message)
```

### Examples

```javascript
// Exact equality
assert.equal(result, 5, 'Should equal 5');

// Tolerance check
assert.within(distance, 200, 10, 'Distance ~200px ±10');

// Boolean checks
assert.true(blocked, 'Path should be blocked');
assert.false(needsAStar, 'Should not need A*');
```

## Adding New Tests

### Structure

```javascript
testFramework.suite('Suite Name', ({ test, beforeEach, afterEach }) => {
    beforeEach(() => {
        // Setup before each test
        testElements = [];
    });

    test('Test description', (assert) => {
        // Test code
        assert.equal(result, expected, 'Message');
    });
});
```

### Example: Adding a New Suite

```javascript
testFramework.suite('My New Feature', ({ test }) => {
    test('Handles edge case X', (assert) => {
        const result = myFunction(input);
        assert.true(result, 'Should return true');
    });

    test('Throws error for invalid input', (assert) => {
        assert.throws(() => {
            myFunction(invalidInput);
        }, 'Should throw for invalid input');
    });
});
```

## Test Organization

```
test-framework.html         Main test runner UI
test-definitions.js         All test suites and cases
TEST_FRAMEWORK.md          This documentation
test-obstacle-avoidance.html  Legacy standalone tests (deprecated)
```

## Interpreting Results

### Summary Bar

- **Total**: All tests executed
- **Passed**: Tests that succeeded (green)
- **Failed**: Tests with errors (red)
- **Duration**: Total execution time

### Progress Bar

Visual indicator of pass/fail ratio:
- Full green = 100% passed
- Partial = Some failures

### Suite Stats

Each suite shows:
- ✓ Number passed
- ✗ Number failed

### Failed Test Details

Failed tests show:
- Error message
- Expected vs actual values
- Stack trace (in browser console)

## Best Practices

### Writing Tests

1. **One assertion per concept**: Each test should validate one specific behavior
2. **Clear test names**: Use descriptive names that explain what's being tested
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Use helpers**: Leverage `createRect()` and other utilities

### Debugging Failed Tests

1. Click suite header to expand details
2. Read error message carefully
3. Check expected vs actual values
4. Add `console.log()` in test code if needed
5. Re-run specific suite by modifying test-definitions.js

### Performance

- Keep tests fast (<1ms each)
- Use `beforeEach` for setup to avoid state pollution
- Mock external dependencies
- Avoid unnecessary DOM operations

## Advanced Features

### Filtering Tests

```javascript
// Show only failed tests
filterTests('failed');

// Show all tests
filterTests('all');
```

### Exporting Results

Click "📥 Export Results" to download JSON:

```json
{
  "summary": {
    "total": 90,
    "passed": 88,
    "failed": 2,
    "duration": 45.2
  },
  "suites": [...],
  "timestamp": "2025-10-14T..."
}
```

### Programmatic Access

```javascript
// Access framework
const framework = window.testFramework;

// Run tests programmatically
const results = await framework.run();

// Get specific results
const passed = results.filter(s => s.passed);
```

## Continuous Integration

### Running Tests in CI

```bash
# Install dependencies
npm install -g http-server

# Start server
http-server -p 8080 &

# Run tests with Puppeteer
node run-tests.js
```

### Example CI Script

```javascript
// run-tests.js
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:8080/test-framework.html');
    await page.waitForSelector('#passed-tests');

    const results = await page.evaluate(() => {
        return {
            passed: document.getElementById('passed-tests').textContent,
            failed: document.getElementById('failed-tests').textContent,
            total: document.getElementById('total-tests').textContent
        };
    });

    console.log(JSON.stringify(results));

    if (results.failed !== '0') {
        process.exit(1);
    }

    await browser.close();
})();
```

## Troubleshooting

### Tests Not Running

1. Check browser console for errors
2. Verify `app.js` exists and loads
3. Clear browser cache
4. Try different browser

### Slow Test Execution

1. Check for infinite loops
2. Reduce dataset sizes
3. Remove unnecessary console.logs
4. Profile with browser DevTools

### Flaky Tests

1. Add explicit waits if timing-dependent
2. Avoid relying on external state
3. Use `beforeEach` for clean setup
4. Increase tolerance for timing-sensitive tests

## Contributing

### Adding Tests

1. Identify the feature/edge case
2. Create test in appropriate suite
3. Use descriptive name
4. Add clear assertions
5. Document expected behavior

### Modifying Framework

1. Keep UI responsive
2. Maintain backwards compatibility
3. Update documentation
4. Test with large datasets

## License

Part of the Andraw project.
