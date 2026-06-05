const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// The starting line of the prototypes block
const startStr = `) : activeTab === "Prototypes" ? (`

// The end of the block is right before the Flowcharts block
const endStr = `) : (activeTab === "Flowcharts" || activeTab === "UML Diagrams") ? (`

// The string we want to replace Wireframes with
const wireframesStr = `) : activeTab === "Wireframes" ? (`

let startIndex = content.indexOf(startStr);
let endIndex = content.indexOf(endStr);
let wireframesIndex = content.indexOf(wireframesStr);

if (startIndex !== -1 && endIndex !== -1 && wireframesIndex !== -1) {
    // 1. First replace wireframes to include prototypes
    content = content.replace(wireframesStr, `) : (activeTab === "Wireframes" || activeTab === "Prototypes") ? (`);
    
    // 2. We need to recalculate the start/end indexes after string modification
    startIndex = content.indexOf(startStr);
    endIndex = content.indexOf(endStr);
    
    // 3. Remove the prototypes block
    content = content.substring(0, startIndex) + content.substring(endIndex);
    
    fs.writeFileSync('src/app/page.tsx', content);
    console.log('Success!');
} else {
    console.log('Failed to find strings.');
    console.log('start', startIndex);
    console.log('end', endIndex);
    console.log('wire', wireframesIndex);
}
