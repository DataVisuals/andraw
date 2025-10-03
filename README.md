# Andraw

A local drawing app with hand-drawn aesthetic and comprehensive AWS architecture templates.

## Features

- **Drawing Tools**: Rectangle, Circle, Line, Arrow, Pen, Text
- **Hand-drawn Style**: Rough, sketchy aesthetic like Excalidraw
- **Auto Text**: Drawing shapes automatically prompts for centered text with auto-incrementing labels ("Thing 1", "Thing 2", etc.)
- **Selection & Manipulation**: Select, move, and resize elements
- **Connect Mode**: Press 'C' to enter connect mode - drag a rectangle to select multiple elements and automatically connect them with arrows (left-to-right or top-to-bottom based on layout)
- **Customization**: Stroke color, fill color, fill toggle, background color, font selector (14 fonts), line styles (solid, dashed, dotted), and line routing (straight, stepped). Selected elements can be recolored in real-time.
- **Templates**: Collapsible categories with visual previews
  - **Flowchart**: Process, Decision, Data, Terminator, Document
  - **UML**: Class, Actor, Package
  - **Cloud**: Server, Database, Cloud, Lambda, Storage, Queue
  - **AWS**: 44 AWS services organized in 9 subcategories (Compute, Storage, Database, Networking, Security, Dev Tools, Integration, Analytics & ML, Management)
  - **Shapes**: Hexagon, Triangle, Star, Note, Cylinder
  - **Network**: Router, Firewall, Switch
- **Export/Import**: Save as PNG, JPG, or SVG images, or save/load as JSON
- **Keyboard Shortcuts**:
  - `V` - Selection tool
  - `R` - Rectangle (opens dropdown)
  - `C` - Connect mode (drag to select elements and auto-connect with arrows)
  - `L` - Line
  - `A` - Arrow
  - `P` - Pen
  - `T` - Text
  - `H` - Hand/Pan tool
  - `Delete/Backspace` - Delete selected element(s)

## Usage

1. Open `index.html` in a web browser (or run a local server: `python3 -m http.server 8000`)
2. Select a tool from the toolbar or use keyboard shortcuts
3. Draw on the canvas or click a template from the left panel
4. Use the selection tool (V) to move or resize elements
5. Export your work as PNG, JPG, or SVG, or save as JSON for later editing

## Controls

- **Draw**: Click and drag to create shapes
- **Templates**: Click any template button to add it to the center of the canvas. Click category headers to collapse/expand sections
- **Text**: Click to place text, type, and press Enter. Shapes auto-prompt with "Thing 1", "Thing 2", etc.
- **Move**: Select an element and drag it
- **Resize**: Select an element and drag the corner handles
- **Delete**: Select an element and press Delete/Backspace
- **Connect**: Press `C`, then drag a rectangle around multiple elements to auto-connect them with arrows

## Development History

This project was developed iteratively with Claude Code. Here's the progression of prompts that shaped Andraw:

### Initial Foundation
- Started as an Excalidraw-inspired drawing app with basic shapes and hand-drawn aesthetic
- Built template system with collapsible categories
- Added arrow snapping to shape edges
- Implemented live color editing for selected elements
- Added multiple export formats (PNG, JPG, SVG)

### AWS Architecture Templates
1. **"Can we position the text for the AWS icons underneath rather than in the middle and also fix the ambiguity in the panel sections 2 use AWS"**
   - Modified text positioning for AWS templates to appear below icons
   - Renamed "Cloud/AWS" section to "Cloud" to avoid confusion

2. **Using official AWS Architecture Icons**
   - Switched from CDN to official AWS Architecture Icons from aws.amazon.com
   - Downloaded icon package and hosted locally
   - Created aws-icons/ directory with SVG files

3. **"Add all of these under subpanels by type"**
   - Expanded from 15 to 44 AWS services
   - Organized across 9 categories: Compute, Storage, Database, Networking, Security, Dev Tools, Integration, Analytics & ML, Management
   - Added drawing functions for each new service

4. **"No all the AWS icons should appear as sub sub sections not siblings of other non AWS sections"**
   - Restructured HTML to create nested hierarchy
   - Created parent "AWS" category with 9 subcategories underneath
   - Added CSS for subcategory styling with proper indentation
   - Implemented JavaScript event handlers for subcategory toggling

### Branding & Publishing
5. **"Change the name of the project to Andraw and commit to github"**
   - Rebranded from "Excalidraw Clone" to "Andraw"
   - Updated title, README, and documentation
   - Created GitHub repository: DataVisuals/andraw
   - Pushed all commits to remote

### Advanced Features
6. **"Can we add support for stepped connector lines"**
   - Added line routing selector (Straight/Stepped)
   - Implemented orthogonal routing with 3-segment paths
   - Created drawSteppedLine() and drawSteppedArrow() functions
   - Updated both canvas rendering and SVG export
   - Arrowheads correctly orient based on final segment direction

### UI Consistency & Polish
7. **"Make the dropdown choices consistent across font, line style, stepped and the choice of image export in the popup"**
   - Replaced export format prompt dialog with dropdown
   - Changed "Image" button to "Export"
   - Standardized all toolbar controls to use dropdowns

8. **"We still have different styles across the dropdowns and let's put all the buttons on the right"**
   - Applied consistent styling to all dropdowns (padding, borders, hover states)
   - Added toolbar-spacer to push action buttons to the right
   - Reorganized layout: tools/controls on left, action buttons on right
   - Moved Clear button to far right

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Icons**: Official AWS Architecture Icons (SVG), Font Awesome
- **Architecture**: No dependencies, runs entirely in browser
- **Export**: Canvas API for PNG/JPG, custom SVG generation

## License

This project was created with assistance from Claude Code (Anthropic).
