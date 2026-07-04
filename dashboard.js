// Core Application State
let appData = [];
let numericColumns = [];
let categoricalColumns = [];
let correlationMatrix = {};
let currentScatterChart = null;

// Pagination state
let currentPage = 1;
const rowsPerPage = 10;

// Default Synthetic Data Generator (LCG + Box-Muller with linear combinations)
function generateSampleDataset() {
    const data = [];
    let rSeed = 42;
    
    // LCG Random Generator for reproducibility
    function random() {
        const x = Math.sin(rSeed++) * 10000;
        return x - Math.floor(x);
    }
    
    // Box-Muller for standard normal distribution N(0, 1)
    function randomNormal() {
        let u = 0, v = 0;
        while (u === 0) u = random();
        while (v === 0) v = random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    
    for (let i = 0; i < 500; i++) {
        const z0 = randomNormal(); // Age
        const z1 = randomNormal(); // Income
        const z2 = randomNormal(); // Spend Score
        const z3 = randomNormal(); // Savings
        const z4 = randomNormal(); // Visits
        const z5 = randomNormal(); // Years As Member
        const z6 = randomNormal(); // Debt
        
        // 1. Age (Mean: 40, SD: 12)
        const age = Math.round(Math.max(18, Math.min(80, 40 + z0 * 12)));
        
        // 2. Years As Member (Mean: 5, SD: 3) - Correlated with Age (r = 0.66)
        const ageEffect = (age - 40) / 12;
        const yearsAsMember = Math.round(Math.max(0, Math.min(age - 18, 5 + (0.65 * ageEffect + 0.76 * z5) * 3)));
        
        // 3. Annual Income (Mean: 75, SD: 25)
        const annualIncome = Math.round(Math.max(15, Math.min(200, 75 + z1 * 25)));
        
        // 4. Spending Score (Mean: 50, SD: 22) - Correlated with Income (r = 0.38)
        const incomeEffect = (annualIncome - 75) / 25;
        const spendingScore = Math.round(Math.max(1, Math.min(100, 50 + (0.38 * incomeEffect + 0.925 * z2) * 22)));
        
        // 5. Monthly Visits (Mean: 12, SD: 5) - Correlated with Spending Score (r = 0.73)
        const spendEffect = (spendingScore - 50) / 22;
        const monthlyVisits = Math.round(Math.max(0, Math.min(30, 12 + (0.73 * spendEffect + 0.68 * z4) * 5)));
        
        // 6. Savings (Mean: 45, SD: 20) - Pos correlation with Income (r = 0.59), Neg with Spend Score (r = -0.43)
        const savingsVal = 45 + (0.59 * incomeEffect - 0.43 * spendEffect + 0.68 * z3) * 20;
        const savings = Math.max(0, Math.min(150, savingsVal));
        
        // 7. Debt (Mean: 20, SD: 12) - Neg correlation with Savings (r = -0.32)
        const savingsEffect = (savings - 45) / 20;
        const debtVal = 20 + (-0.32 * savingsEffect + 0.22 * incomeEffect + 0.91 * z6) * 12;
        const debt = Math.max(0, Math.min(100, debtVal));
        
        const gender = random() > 0.52 ? 'Female' : 'Male';
        
        data.push({
            Customer_ID: `CUST_${(i + 1).toString().padStart(4, '0')}`,
            Age: age,
            Annual_Income: parseFloat(annualIncome.toFixed(1)),
            Spending_Score: spendingScore,
            Savings: parseFloat(savings.toFixed(1)),
            Monthly_Visits: monthlyVisits,
            Years_As_Member: yearsAsMember,
            Debt: parseFloat(debt.toFixed(1)),
            Gender: gender
        });
    }
    return data;
}

// Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation routing
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.dashboard-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle active menu class
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Toggle visible sections
            const targetId = item.getAttribute('href').substring(1);
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active-section');
                } else {
                    sec.classList.remove('active-section');
                }
            });
        });
    });

    // Control Elements
    const btnLoadDemo = document.getElementById('btn-load-demo');
    const csvUploadInput = document.getElementById('csv-upload');
    const dropzone = document.getElementById('dropzone');
    const chkMaskUpper = document.getElementById('chk-mask-upper');
    const chkShowAnnot = document.getElementById('chk-show-annot');
    const selColorMap = document.getElementById('sel-color-map');
    
    const selScatterX = document.getElementById('sel-scatter-x');
    const selScatterY = document.getElementById('sel-scatter-y');
    const selScatterColor = document.getElementById('sel-scatter-color');
    const chkShowTrend = document.getElementById('chk-show-trend');
    
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');

    // Load Demo Action
    btnLoadDemo.addEventListener('click', () => {
        loadDataset(generateSampleDataset());
    });

    // CSV File Upload Action
    csvUploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    // Drag & Drop Handlers
    dropzone.addEventListener('click', () => csvUploadInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUploadedFile(e.dataTransfer.files[0]);
        }
    });

    // Heatmap Styling Updates
    chkMaskUpper.addEventListener('change', renderHeatmap);
    chkShowAnnot.addEventListener('change', renderHeatmap);
    selColorMap.addEventListener('change', renderHeatmap);

    // Scatter Axis Updates
    selScatterX.addEventListener('change', renderScatterPlot);
    selScatterY.addEventListener('change', renderScatterPlot);
    selScatterColor.addEventListener('change', renderScatterPlot);
    chkShowTrend.addEventListener('change', renderScatterPlot);

    // Pagination Click Handlers
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderDataTable();
        }
    });
    btnNextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(appData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderDataTable();
        }
    });
    
    // Auto load demo on start so the dashboard looks loaded and premium right away
    loadDataset(generateSampleDataset());
});

// CSV Parsing Logic
function handleUploadedFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csvText = e.target.result;
            const parsedData = parseCSV(csvText);
            if (parsedData.length === 0) {
                alert("The CSV file is empty or formatted incorrectly.");
                return;
            }
            loadDataset(parsedData);
        } catch (err) {
            console.error(err);
            alert("Error parsing CSV: " + err.message);
        }
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    // Direct character parser for CSV format (robust against comma in quotes)
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];
        
        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') i++;
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    
    const headers = lines[0].map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.length !== headers.length) continue; // Skip mismatch rows
        
        const obj = {};
        let hasData = false;
        for (let j = 0; j < headers.length; j++) {
            const val = line[j].trim();
            if (val !== "") hasData = true;
            
            // Try numeric conversion
            const num = Number(val);
            obj[headers[j]] = (!isNaN(num) && val !== "") ? num : val;
        }
        if (hasData) data.push(obj);
    }
    return data;
}

// Load and process loaded datasets
function loadDataset(data) {
    appData = data;
    currentPage = 1;
    
    // Identify columns
    const firstRow = data[0];
    numericColumns = [];
    categoricalColumns = [];
    
    Object.keys(firstRow).forEach(key => {
        if (typeof firstRow[key] === 'number') {
            numericColumns.push(key);
        } else {
            categoricalColumns.push(key);
        }
    });

    if (numericColumns.length < 2) {
        alert("The dataset must contain at least 2 numeric columns for correlation analysis.");
        return;
    }

    // Update controls
    updateControlsSelectors();
    
    // Calculate Pearson correlation matrix
    calculateCorrelations();
    
    // Update summary metrics
    updateSummaryMetrics();
    
    // Render components
    renderHeatmap();
    renderScatterPlot();
    renderDataTable();
    
    // UI states
    document.getElementById('data-status-badge').innerText = "Active";
    document.getElementById('data-status-badge').classList.add('data-active');
}

function updateControlsSelectors() {
    const selScatterX = document.getElementById('sel-scatter-x');
    const selScatterY = document.getElementById('sel-scatter-y');
    const selScatterColor = document.getElementById('sel-scatter-color');

    // Populate Scatter X/Y Selectors
    selScatterX.innerHTML = '';
    selScatterY.innerHTML = '';
    
    numericColumns.forEach((col, idx) => {
        const optX = document.createElement('option');
        optX.value = col;
        optX.innerText = col.replace(/_/g, ' ');
        selScatterX.appendChild(optX);

        const optY = document.createElement('option');
        optY.value = col;
        optY.innerText = col.replace(/_/g, ' ');
        // Set default Y to different from X if possible
        if (idx === 2 || (idx === 1 && numericColumns.length === 2)) optY.selected = true;
        selScatterY.appendChild(optY);
    });

    // Populate Scatter Color (Categorical) Selector
    selScatterColor.innerHTML = '<option value="">None (Single Color)</option>';
    categoricalColumns.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.innerText = col.replace(/_/g, ' ');
        // Auto select Gender for demo synthetic data
        if (col.toLowerCase() === 'gender') opt.selected = true;
        selScatterColor.appendChild(opt);
    });
}

// Mathematics Engine: Pearson Correlations
function calculateCorrelations() {
    correlationMatrix = {};
    const n = appData.length;
    
    // Compute mean values for all numeric columns
    const means = {};
    numericColumns.forEach(col => {
        let sum = 0;
        appData.forEach(row => sum += row[col]);
        means[col] = sum / n;
    });

    // Compute standard deviations & covariances
    numericColumns.forEach(col1 => {
        correlationMatrix[col1] = {};
        numericColumns.forEach(col2 => {
            if (col1 === col2) {
                correlationMatrix[col1][col2] = 1.0;
                return;
            }

            let num = 0;
            let den1 = 0;
            let den2 = 0;

            appData.forEach(row => {
                const diff1 = row[col1] - means[col1];
                const diff2 = row[col2] - means[col2];
                num += diff1 * diff2;
                den1 += diff1 * diff1;
                den2 += diff2 * diff2;
            });

            const denom = Math.sqrt(den1 * den2);
            correlationMatrix[col1][col2] = denom === 0 ? 0 : num / denom;
        });
    });
}

function updateSummaryMetrics() {
    const listPos = [];
    const listNeg = [];
    
    // Extract pairwise elements
    for (let i = 0; i < numericColumns.length; i++) {
        for (let j = i + 1; j < numericColumns.length; j++) {
            const col1 = numericColumns[i];
            const col2 = numericColumns[j];
            const val = correlationMatrix[col1][col2];
            
            const item = {
                pair: `${col1.replace(/_/g, ' ')} ↔ ${col2.replace(/_/g, ' ')}`,
                val: val,
                col1, col2
            };
            
            if (val > 0) listPos.push(item);
            else if (val < 0) listNeg.push(item);
        }
    }

    // Sort relationships
    listPos.sort((a, b) => b.val - a.val);
    listNeg.sort((a, b) => a.val - b.val); // Most negative first (e.g. -0.8 < -0.2)

    // Set top metrics cards
    const topPos = listPos[0];
    const topNeg = listNeg[0];

    if (topPos) {
        document.getElementById('top-positive-val').innerText = `+${topPos.val.toFixed(3)}`;
        document.getElementById('top-positive-pair').innerText = topPos.pair;
    } else {
        document.getElementById('top-positive-val').innerText = '-';
        document.getElementById('top-positive-pair').innerText = 'None';
    }

    if (topNeg) {
        document.getElementById('top-negative-val').innerText = `${topNeg.val.toFixed(3)}`;
        document.getElementById('top-negative-pair').innerText = topNeg.pair;
    } else {
        document.getElementById('top-negative-val').innerText = '-';
        document.getElementById('top-negative-pair').innerText = 'None';
    }

    document.getElementById('dataset-shape').innerText = `${appData.length} Rows`;
    document.getElementById('dataset-features').innerText = `Numeric: ${numericColumns.length} | Categorical: ${categoricalColumns.length}`;

    // Render positive relationships list
    const posListUl = document.getElementById('positive-relationships-list');
    posListUl.innerHTML = '';
    if (listPos.length === 0) {
        posListUl.innerHTML = '<li class="empty-list">No positive relationships found</li>';
    } else {
        listPos.slice(0, 5).forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.pair}</span> <span class="val text-success">+${item.val.toFixed(3)}</span>`;
            posListUl.appendChild(li);
        });
    }

    // Render negative relationships list
    const negListUl = document.getElementById('negative-relationships-list');
    negListUl.innerHTML = '';
    if (listNeg.length === 0) {
        negListUl.innerHTML = '<li class="empty-list">No negative relationships found</li>';
    } else {
        listNeg.slice(0, 5).forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.pair}</span> <span class="val text-danger">${item.val.toFixed(3)}</span>`;
            negListUl.appendChild(li);
        });
    }
}

// Vector/SVG Heatmap Rendering Engine
function renderHeatmap() {
    const container = document.getElementById('heatmap-render-area');
    container.innerHTML = '';
    
    if (numericColumns.length === 0) return;

    const showAnnot = document.getElementById('chk-show-annot').checked;
    const maskUpper = document.getElementById('chk-mask-upper').checked;
    const colorMap = document.getElementById('sel-color-map').value;

    const cellSize = 60;
    const margin = { top: 120, right: 30, bottom: 30, left: 140 };
    
    const size = numericColumns.length;
    const width = size * cellSize + margin.left + margin.right;
    const height = size * cellSize + margin.top + margin.bottom;

    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.classList.add('heatmap-svg');

    // Create Tooltip hover trigger
    const tooltip = document.getElementById('heatmap-tooltip');

    // Generate Cell Colors
    function getColor(val) {
        if (colorMap === 'coolwarm') {
            // Diverging Red (Positive) to Blue (Negative)
            if (val >= 0) {
                // Red color ramp
                const alpha = val;
                return `rgba(244, 63, 94, ${alpha})`;
            } else {
                // Blue color ramp
                const alpha = Math.abs(val);
                return `rgba(56, 189, 248, ${alpha})`;
            }
        } else if (colorMap === 'spectral') {
            // Purple-Orange-Red
            const hue = ((1.0 - val) / 2.0) * 240; // 0 (Red) to 240 (Blue)
            return `hsla(${hue}, 80%, 55%, 0.95)`;
        } else if (colorMap === 'viridis') {
            // Standard viridis: Purple (low) to Yellow (high)
            const factor = (val + 1.0) / 2.0; // 0 to 1
            const r = Math.round(70 - factor * 45 + factor * 225);
            const g = Math.round(20 - factor * 10 + factor * 215);
            const b = Math.round(90 + factor * 10 - factor * 80);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Monochromatic Cobalt Cyan
            const alpha = (val + 1.0) / 2.0; // Scale from -1..1 to 0..1
            return `rgba(56, 189, 248, ${alpha})`;
        }
    }

    // Grid cells
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Mask upper triangle
            if (maskUpper && c > r) continue;

            const col1 = numericColumns[r];
            const col2 = numericColumns[c];
            const val = correlationMatrix[col1][col2];
            
            const x = margin.left + c * cellSize;
            const y = margin.top + r * cellSize;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', cellSize - 2);
            rect.setAttribute('height', cellSize - 2);
            rect.setAttribute('rx', 4);
            rect.setAttribute('fill', getColor(val));
            rect.classList.add('heatmap-cell');

            // Interactive Tooltips
            rect.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = `
                    <div class="title">${col1.replace(/_/g, ' ')} vs ${col2.replace(/_/g, ' ')}</div>
                    <div>Correlation: <span class="val" style="color:${val >= 0 ? '#34d399' : '#f43f5e'}">${val.toFixed(4)}</span></div>
                `;
                tooltip.style.opacity = '1';
            });

            rect.addEventListener('mousemove', (e) => {
                const xOffset = 15;
                const yOffset = 15;
                tooltip.style.left = `${e.pageX + xOffset}px`;
                tooltip.style.top = `${e.pageY + yOffset}px`;
            });

            rect.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });

            // Make cell clickable to select scatter plot axes
            rect.addEventListener('click', () => {
                document.getElementById('sel-scatter-x').value = col2;
                document.getElementById('sel-scatter-y').value = col1;
                // Navigate to scatter plot tab
                document.getElementById('btn-pairwise').click();
                renderScatterPlot();
            });

            svg.appendChild(rect);

            // Add value annotations
            if (showAnnot) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x + cellSize / 2);
                text.setAttribute('y', y + cellSize / 2 + 4);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', Math.abs(val) > 0.45 ? '#ffffff' : '#cbd5e1');
                text.setAttribute('font-size', '10px');
                text.setAttribute('font-weight', '700');
                text.setAttribute('pointer-events', 'none');
                text.textContent = val.toFixed(2);
                svg.appendChild(text);
            }
        }
    }

    // X Axis Labels (top rotated)
    for (let c = 0; c < size; c++) {
        const labelText = numericColumns[c].replace(/_/g, ' ');
        const x = margin.left + c * cellSize + cellSize / 2;
        const y = margin.top - 10;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'start');
        text.setAttribute('transform', `rotate(-35, ${x}, ${y})`);
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', '500');
        text.textContent = labelText;
        svg.appendChild(text);
    }

    // Y Axis Labels
    for (let r = 0; r < size; r++) {
        const labelText = numericColumns[r].replace(/_/g, ' ');
        const x = margin.left - 12;
        const y = margin.top + r * cellSize + cellSize / 2 + 4;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', '500');
        text.textContent = labelText;
        svg.appendChild(text);
    }

    container.appendChild(svg);
}

// Chart.js High Performance Scatter Plot Engine
function renderScatterPlot() {
    const xCol = document.getElementById('sel-scatter-x').value;
    const yCol = document.getElementById('sel-scatter-y').value;
    const hueCol = document.getElementById('sel-scatter-color').value;
    const showTrend = document.getElementById('chk-show-trend').checked;
    
    const canvas = document.getElementById('scatter-chart');
    const emptyState = document.getElementById('scatter-empty-state');

    // Destroy previous Chart instance to prevent memory leaks
    if (currentScatterChart) {
        currentScatterChart.destroy();
        currentScatterChart = null;
    }

    if (!xCol || !yCol || appData.length === 0) {
        canvas.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    canvas.style.display = 'block';
    emptyState.style.display = 'none';

    // Prepare datasets
    const datasets = [];
    const colors = {
        'Male': '#38bdf8',
        'Female': '#f43f5e',
        'SingleColor': '#818cf8',
        'Trendline': '#fbbf24',
        'DefaultCategories': ['#34d399', '#fbbf24', '#c084fc', '#f472b6', '#22d3ee']
    };

    if (hueCol) {
        // Group points by categorical groups
        const groups = {};
        appData.forEach(row => {
            const groupVal = row[hueCol] || 'Unknown';
            if (!groups[groupVal]) groups[groupVal] = [];
            groups[groupVal].push({ x: row[xCol], y: row[yCol] });
        });

        let colorIndex = 0;
        Object.keys(groups).forEach(groupName => {
            let color = colors[groupName] || colors.DefaultCategories[colorIndex % colors.DefaultCategories.length];
            colorIndex++;
            
            datasets.push({
                label: `${hueCol.replace(/_/g, ' ')}: ${groupName}`,
                data: groups[groupName],
                backgroundColor: color,
                borderColor: 'transparent',
                pointRadius: 4.5,
                pointHoverRadius: 7,
                type: 'scatter'
            });
        });
    } else {
        // Single color scatter plot
        const points = appData.map(row => ({ x: row[xCol], y: row[yCol] }));
        datasets.push({
            label: 'Customer Points',
            data: points,
            backgroundColor: colors.SingleColor,
            borderColor: 'transparent',
            pointRadius: 4.5,
            pointHoverRadius: 7,
            type: 'scatter'
        });
    }

    // Add linear regression trendline
    if (showTrend) {
        const xValues = appData.map(row => row[xCol]);
        const yValues = appData.map(row => row[yCol]);
        
        // Linear regression: y = mx + c
        const n = appData.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += xValues[i];
            sumY += yValues[i];
            sumXY += xValues[i] * yValues[i];
            sumXX += xValues[i] * xValues[i];
        }
        
        const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const c = (sumY - m * sumX) / n;

        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        
        const trendData = [
            { x: minX, y: m * minX + c },
            { x: maxX, y: m * maxX + c }
        ];

        datasets.push({
            label: `Trendline (y = ${m.toFixed(2)}x + ${c.toFixed(2)})`,
            data: trendData,
            borderColor: colors.Trendline,
            borderWidth: 2.5,
            fill: false,
            pointRadius: 0,
            showLine: true,
            type: 'line'
        });
    }

    // Create chart
    currentScatterChart = new Chart(canvas, {
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#cbd5e1',
                        font: { family: 'Inter', weight: '500' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.type === 'line') return context.dataset.label;
                            return `X: ${context.raw.x.toFixed(1)}, Y: ${context.raw.y.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xCol.replace(/_/g, ' '),
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 13, weight: '600' }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    title: {
                        display: true,
                        text: yCol.replace(/_/g, ' '),
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 13, weight: '600' }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

// Data Viewer Datatable
function renderDataTable() {
    const table = document.getElementById('dataset-table');
    const tableRowCountLbl = document.getElementById('table-row-count');
    const pageNumLbl = document.getElementById('lbl-page-num');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (appData.length === 0) {
        table.innerHTML = `<thead><tr><th>No Columns</th></tr></thead><tbody><tr><td>No data loaded</td></tr></tbody>`;
        tableRowCountLbl.innerText = "Showing 0 rows";
        pageNumLbl.innerText = "Page 1 of 1";
        btnPrev.disabled = true;
        btnNext.disabled = true;
        return;
    }

    const totalRows = appData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    
    // Safety check
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Slice data
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRows);
    const paginatedSlice = appData.slice(start, end);

    // Render headers
    const cols = Object.keys(appData[0]);
    let theadHtml = '<tr>';
    cols.forEach(col => {
        theadHtml += `<th>${col.replace(/_/g, ' ')}</th>`;
    });
    theadHtml += '</tr>';

    // Render rows
    let tbodyHtml = '';
    paginatedSlice.forEach(row => {
        tbodyHtml += '<tr>';
        cols.forEach(col => {
            const val = row[col];
            if (typeof val === 'number') {
                tbodyHtml += `<td>${val.toFixed(1).replace(/\.0$/, '')}</td>`;
            } else {
                tbodyHtml += `<td>${val}</td>`;
            }
        });
        tbodyHtml += '</tr>';
    });

    table.querySelector('thead').innerHTML = theadHtml;
    table.querySelector('tbody').innerHTML = tbodyHtml;

    // Update pagination labels
    tableRowCountLbl.innerText = `Showing ${start + 1} to ${end} of ${totalRows} rows`;
    pageNumLbl.innerText = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable navigation buttons
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
}
