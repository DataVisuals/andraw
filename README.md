# Excalidraw Clone

A local drawing app inspired by Excalidraw with hand-drawn aesthetic.

## Features

- **Drawing Tools**: Rectangle, Circle, Line, Arrow, Pen, Text
- **Hand-drawn Style**: Rough, sketchy aesthetic like Excalidraw
- **Auto Text**: Drawing shapes automatically prompts for centered text
- **Selection & Manipulation**: Select, move, and resize elements
- **Customization**: Stroke color, fill color, fill toggle, background color, font selector (14 fonts), and line styles (solid, dashed, dotted). Selected elements can be recolored in real-time.
- **Templates**: Collapsible categories with visual previews
  - **Flowchart**: Process, Decision, Data, Terminator, Document
  - **UML**: Class, Actor, Package
  - **Cloud/AWS**: Server, Database, Cloud, Lambda, Storage, Queue
  - **AWS**: EC2, S3, RDS, DynamoDB, Athena, Redshift, SQS, SNS, API Gateway, CloudFront, Route 53, ECS, EKS, ELB, CloudWatch
  - **Shapes**: Hexagon, Triangle, Star, Note, Cylinder
  - **Network**: Router, Firewall, Switch
- **Export/Import**: Save as PNG, JPG, or SVG images, or save/load as JSON
- **Keyboard Shortcuts**:
  - `V` - Selection tool
  - `R` - Rectangle
  - `C` - Circle
  - `L` - Line
  - `A` - Arrow
  - `P` - Pen
  - `T` - Text
  - `Delete/Backspace` - Delete selected element

## Usage

1. Open `index.html` in a web browser (or run a local server: `python3 -m http.server 8000`)
2. Select a tool from the toolbar or use keyboard shortcuts
3. Draw on the canvas or click a template from the left panel
4. Use the selection tool (V) to move or resize elements
5. Export your work as PNG, JPG, or SVG, or save as JSON for later editing

## Controls

- **Draw**: Click and drag to create shapes
- **Templates**: Click any template button to add it to the center of the canvas. Click category headers to collapse/expand sections
- **Text**: Click to place text, type, and press Enter
- **Move**: Select an element and drag it
- **Resize**: Select an element and drag the corner handles
- **Delete**: Select an element and press Delete/Backspace
