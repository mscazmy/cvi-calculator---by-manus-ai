document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('resultsSection');
    const downloadTemplate = document.getElementById('downloadTemplate');
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    let processedData = [];
    let validityChart = null;

    // Lawshe's Critical Values Table
    const lawsheTable = {
        5: 0.99, 6: 0.99, 7: 0.99, 8: 0.75, 9: 0.78, 10: 0.62,
        11: 0.59, 12: 0.56, 13: 0.54, 14: 0.51, 15: 0.49,
        20: 0.42, 25: 0.37, 30: 0.33, 35: 0.31, 40: 0.29
    };

    function getLawsheCriticalValue(n) {
        if (lawsheTable[n]) return lawsheTable[n];
        // Simple interpolation/closest value logic
        const keys = Object.keys(lawsheTable).map(Number).sort((a, b) => a - b);
        if (n < keys[0]) return 0.99;
        if (n > keys[keys.length - 1]) return 0.29;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (n >= keys[i] && n <= keys[i+1]) {
                return lawsheTable[keys[i]]; // Conservative approach: use the threshold for the smaller N
            }
        }
        return 0.5;
    }

    // Template Generation
    downloadTemplate.addEventListener('click', (e) => {
        e.preventDefault();
        const wsData = [
            ["Item_ID", "Expert_1_CVR", "Expert_1_CVI", "Expert_1_FVI", "Expert_2_CVR", "Expert_2_CVI", "Expert_2_FVI", "Expert_3_CVR", "Expert_3_CVI", "Expert_3_FVI"],
            ["Item 1", 3, 4, 4, 3, 3, 4, 2, 4, 3],
            ["Item 2", 3, 4, 4, 3, 4, 4, 3, 4, 4]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Validity_Data");
        XLSX.writeFile(wb, "Validity_Data_Template.xlsx");
    });

    calculateBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Please upload a file first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            processValidityData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    });

    function processValidityData(data) {
        if (data.length === 0) return;

        // Identify expert count based on columns
        const sampleRow = data[0];
        const columns = Object.keys(sampleRow);
        const cvrCols = columns.filter(c => c.toLowerCase().includes('cvr'));
        const cviCols = columns.filter(c => c.toLowerCase().includes('cvi'));
        const fviCols = columns.filter(c => c.toLowerCase().includes('fvi'));
        
        const numExperts = cvrCols.length;
        const criticalCVR = getLawsheCriticalValue(numExperts);

        processedData = data.map(row => {
            const itemId = row['Item_ID'] || row['item_id'] || 'Unknown';
            
            // CVR Calculation: ne is number of experts rating "3" (Essential)
            const ne = cvrCols.reduce((sum, col) => sum + (parseInt(row[col]) === 3 ? 1 : 0), 0);
            const cvr = (ne - (numExperts / 2)) / (numExperts / 2);

            // CVI Calculation: Number of experts rating 3 or 4
            const cviCount = cviCols.reduce((sum, col) => sum + (parseInt(row[col]) >= 3 ? 1 : 0), 0);
            const icvi = cviCount / numExperts;

            // FVI Calculation: Number of experts rating 3 or 4
            const fviCount = fviCols.reduce((sum, col) => sum + (parseInt(row[col]) >= 3 ? 1 : 0), 0);
            const ifvi = fviCount / numExperts;

            // Decision
            let decision = "Keep";
            if (icvi < 0.79 || cvr < criticalCVR) decision = "Revise/Remove";

            return { itemId, icvi, ifvi, cvr, decision };
        });

        updateUI();
    }

    function updateUI() {
        resultsSection.classList.remove('hidden');

        // Stats
        const sCviAve = processedData.reduce((s, r) => s + r.icvi, 0) / processedData.length;
        const sFviAve = processedData.reduce((s, r) => s + r.ifvi, 0) / processedData.length;
        const meanCvr = processedData.reduce((s, r) => s + r.cvr, 0) / processedData.length;

        document.getElementById('sCviAve').textContent = sCviAve.toFixed(3);
        document.getElementById('sFviAve').textContent = sFviAve.toFixed(3);
        document.getElementById('meanCvr').textContent = meanCvr.toFixed(3);

        // Table
        const tbody = document.querySelector('#resultsTable tbody');
        tbody.innerHTML = '';
        processedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium">${row.itemId}</td>
                <td class="px-6 py-4 text-center">${row.icvi.toFixed(3)}</td>
                <td class="px-6 py-4 text-center">${row.ifvi.toFixed(3)}</td>
                <td class="px-6 py-4 text-center">${row.cvr.toFixed(3)}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 rounded text-xs font-bold ${row.decision === 'Keep' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${row.decision}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Chart
        renderChart();
    }

    function renderChart() {
        const ctx = document.getElementById('validityChart').getContext('2d');
        if (validityChart) validityChart.destroy();

        validityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: processedData.map(r => r.itemId),
                datasets: [
                    {
                        label: 'I-CVI',
                        data: processedData.map(r => r.icvi),
                        backgroundColor: 'rgba(3, 105, 161, 0.7)',
                        borderColor: '#0369a1',
                        borderWidth: 1
                    },
                    {
                        label: 'I-FVI',
                        data: processedData.map(r => r.ifvi),
                        backgroundColor: 'rgba(14, 165, 233, 0.7)',
                        borderColor: '#0ea5e9',
                        borderWidth: 1
                    },
                    {
                        label: 'CVR',
                        data: processedData.map(r => r.cvr),
                        backgroundColor: 'rgba(186, 230, 253, 0.7)',
                        borderColor: '#bae6fd',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1.1,
                        title: { display: true, text: 'Index Value' }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        
        doc.setFontSize(20);
        doc.setTextColor(3, 105, 161);
        doc.text("Validity Index Analysis Report", 40, 50);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);

        // Summary
        doc.setFontSize(12);
        doc.setTextColor(30);
        doc.text(`S-CVI/Ave: ${document.getElementById('sCviAve').textContent}`, 40, 100);
        doc.text(`S-FVI/Ave: ${document.getElementById('sFviAve').textContent}`, 40, 120);
        doc.text(`Mean CVR: ${document.getElementById('meanCvr').textContent}`, 40, 140);

        // Table
        doc.autoTable({
            html: '#resultsTable',
            startY: 170,
            headStyles: { fillColor: [3, 105, 161] },
            theme: 'striped'
        });

        doc.save("Validity_Analysis_Report.pdf");
    });
});
