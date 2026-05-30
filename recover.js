const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\farra\\.gemini\\antigravity\\brain\\94ae09ba-4681-462b-8114-f94c7e54fd9f\\.system_generated\\logs\\transcript.jsonl';

async function recover() {
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let roadmapHtmlContent = [];
    let roadmapCssContent = [];
    let roadmapJsContent = [];
    
    let currentFile = null;

    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            if (entry.type === 'ACTION_RESULT' || entry.type === 'TOOL_CALL_RESULT') {
                const output = entry.content || (entry.tool_calls && entry.tool_calls[0] && entry.tool_calls[0].output) || '';
                
                if (output.includes('File Path: `file:///d:/AI/public/roadmap.html`')) {
                    if (roadmapHtmlContent.length === 0) extractLines(output, roadmapHtmlContent);
                } else if (output.includes('File Path: `file:///d:/AI/public/css/roadmap.css`')) {
                    if (roadmapCssContent.length === 0) extractLines(output, roadmapCssContent);
                } else if (output.includes('File Path: `file:///d:/AI/public/js/roadmap.js`')) {
                    if (roadmapJsContent.length === 0) extractLines(output, roadmapJsContent);
                }
            }
        } catch (e) {
            // ignore
        }
    }
    
    function extractLines(output, arr) {
        const lines = output.split('\n');
        let isCode = false;
        for (let l of lines) {
            if (l.includes('The following code has been modified')) {
                isCode = true;
                continue;
            }
            if (l.includes('The above content does NOT show the entire file contents') || l.includes('The above content shows the entire, complete file contents')) {
                isCode = false;
            }
            if (isCode) {
                const match = l.match(/^\d+:\s(.*)$/);
                if (match) {
                    arr.push(match[1]);
                } else if (l.match(/^\d+:/)) {
                    arr.push('');
                }
            }
        }
    }
    
    // Write out the recovered files
    if (roadmapHtmlContent.length > 0) {
        fs.writeFileSync('d:\\AI\\public\\roadmap_old.html', roadmapHtmlContent.join('\n'));
        console.log("Recovered roadmap_old.html");
    }
    if (roadmapCssContent.length > 0) {
        fs.writeFileSync('d:\\AI\\public\\css\\roadmap_old.css', roadmapCssContent.join('\n'));
        console.log("Recovered roadmap_old.css");
    }
    if (roadmapJsContent.length > 0) {
        fs.writeFileSync('d:\\AI\\public\\js\\roadmap_old.js', roadmapJsContent.join('\n'));
        console.log("Recovered roadmap_old.js");
    }
    
    console.log("Done");
}

recover();
