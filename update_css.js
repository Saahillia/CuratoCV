const fs = require('fs');
const cssPath = '/home/saahillia/Desktop/projects/Resume_Builder/frontend/src/index.css';

let css = fs.readFileSync(cssPath, 'utf8');

const replacement = `/* Memo Workspace Card Silhouettes & Distinct Visual Hierarchy */
.folder-card-container {
    position: relative;
    padding-top: 0.75rem;
    width: 95%;
    margin-inline: auto;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.folder-card-container.group:hover {
    transform: translateY(-4px);
}

/* Layer 1: Rectangle Tab (Bottom/Back) */
.folder-tab {
    position: absolute;
    top: -1px;
    left: -1px;
    width: 48%;
    height: 16px;
    background: linear-gradient(180deg, #bfdbfe 0%, #93c5fd 50%, #60a5fa 100%);
    border: 1px solid #2563eb;
    border-bottom: none;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    z-index: 1;
    transition: background 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 -2px 6px rgba(59, 130, 246, 0.15);
}

.group:hover .folder-tab {
    background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%);
    border-color: #2563eb;
    box-shadow: 0 -2px 8px rgba(59, 130, 246, 0.25);
}

/* Layer 2: Cards (Middle) */
.folder-paper-sheet {
    position: absolute;
    top: 4px;
    height: 60px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #cbd5e1;
    border-top: 2px solid #94a3b8;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
    opacity: 0;
    transform: translateY(16px) rotate(0deg);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
    z-index: 2;
    pointer-events: none;
    padding: 6px 10px;
}

.folder-paper-sheet.sheet-1 {
    left: 10%;
    width: 80%;
    z-index: 2;
}

.folder-paper-sheet.sheet-2 {
    left: 14%;
    width: 72%;
    z-index: 3;
}

.folder-paper-sheet .sheet-line {
    height: 3px;
    background: #e2e8f0;
    border-radius: 2px;
    margin-bottom: 4px;
}

.group:hover .folder-paper-sheet.sheet-1 {
    opacity: 1;
    transform: translateY(-16px) rotate(-1.5deg);
}

.group:hover .folder-paper-sheet.sheet-2 {
    opacity: 0.95;
    transform: translateY(-12px) rotate(1.5deg);
}

/* Layer 3: Blue Square Box (Top/Front) */
.folder-shape {
    position: relative;
    background: linear-gradient(180deg, #93c5fd 0%, #60a5fa 35%, #3b82f6 70%, #1d4ed8 100%);
    border: 1px solid #2563eb;
    border-radius: 12px;
    border-top-left-radius: 0;
    box-shadow: 0 4px 14px rgba(59,130,246,0.22), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -10px 20px rgba(29,78,216,0.25);
    z-index: 10;
    transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.folder-shape::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.03) 100%);
    pointer-events: none;
    z-index: 3;
}`;

css = css.replace(/\/\* Memo Workspace Card Silhouettes & Distinct Visual Hierarchy \*\/[\s\S]*?\/\* Document Card Silhouette & Multi-Sheet Paper Stack Hover \*\//, replacement + '\n\n/* Document Card Silhouette & Multi-Sheet Paper Stack Hover */');

fs.writeFileSync(cssPath, css);
console.log('updated css');
