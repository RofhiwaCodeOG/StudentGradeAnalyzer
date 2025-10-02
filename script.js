document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const moduleResultsDiv = document.getElementById('moduleResults');
    const overallStatusSpan = document.getElementById('overallStatus');
    const historyTableBody = document.querySelector('#historyTable tbody');
    
    // Define the module names and IDs
    const MODULES = [
        { id: 'AIADY4A', name: 'ADVANCED DATABASES' },
        { id: 'ASAIY4A', name: 'ARTIFICIAL INTELLIGENCE' },
        { id: 'AIRMY4A', name: 'RESEARCH METHODOLOGY FOR IS' },
        { id: 'AIUEY4A', name: 'USER EXPERIENCE DESIGN (UXD)' },
        { id: 'ADVSOFT', name: 'ADVANCED SOFTWARE DESIGN' },
        { id: 'EMERGTECH', name: 'EMERGING TECHNOLOGIES' },
        { id: 'ITMNGMNT', name: 'IT MANAGEMENT' },
        { id: 'STATIT', name: 'STATISTICS FOR IT' }
    ];

    loadHistory();

    calculateBtn.addEventListener('click', calculateModuleStatus);
    exportCsvBtn.addEventListener('click', exportToCsv);
    clearHistoryBtn.addEventListener('click', clearHistory);

    /**
     * Determines the status based on the average mark.
     * @param {number} average - The average mark.
     * @returns {object} { status: 'PASS'|'FAIL', color: 'color' }
     */
    function getStatus(average) {
        if (average >= 50) {
            return { status: 'PASS', color: 'var(--color-pass, #4CAF50)' };
        }
        return { status: 'FAIL', color: 'var(--color-fail, #F44336)' };
    }

    /**
     * Calculates the module averages and overall status.
     */
    function calculateModuleStatus() {
        const name = document.getElementById('studentName').value.trim();
        if (!name) {
            alert('Please enter the student\'s Full Name.');
            return;
        }

        moduleResultsDiv.innerHTML = '';
        let allPassed = true;
        let totalAverageSum = 0;
        let validModuleCount = 0;
        const historyEntry = { name, averages: {} };

        MODULES.forEach(mod => {
            const group = document.querySelector(`.module-group[data-module-id="${mod.id}"]`);
            const inputs = group.querySelectorAll('input[type="number"]');
            
            let marks = [];
            let isValid = true;
            
            inputs.forEach(input => {
                const mark = parseInt(input.value);
                if (isNaN(mark) || mark < 0 || mark > 100) {
                    isValid = false;
                }
                marks.push(mark);
            });
            
            if (!isValid) {
                alert(`Please ensure all three test marks for ${mod.name} are valid numbers between 0 and 100.`);
                allPassed = false; // Prevents saving history if validation fails
                return; // Continue to the next module
            }

            const sum = marks.reduce((acc, curr) => acc + curr, 0);
            const average = sum / 3;
            const statusObj = getStatus(average);

            historyEntry.averages[mod.id] = { average: average.toFixed(2), status: statusObj.status };

            // Display result for this module
            const p = document.createElement('p');
            p.innerHTML = `
                ${mod.name}: 
                Average: <strong>${average.toFixed(2)}</strong>, 
                Status: <span class="${statusObj.status}">${statusObj.status}</span>
                (Tests: ${marks.join(', ')})
            `;
            moduleResultsDiv.appendChild(p);

            // Track overall status
            if (statusObj.status === 'FAIL') {
                allPassed = false;
            }

            totalAverageSum += average;
            validModuleCount++;
        });

        if (!allPassed) {
            overallStatusSpan.className = 'FAIL';
            overallStatusSpan.textContent = 'MODULE FAILURE(S)';
        } else if (validModuleCount === MODULES.length) {
            overallStatusSpan.className = 'PASS';
            overallStatusSpan.textContent = 'ALL MODULES PASSED 🎉';
        } else {
            // Handle case where some module validation failed and allPassed was set to false
            overallStatusSpan.className = 'FAIL';
            overallStatusSpan.textContent = 'INCOMPLETE/INVALID DATA 🛑';
            return;
        }

        // Calculate Overall Average
        const overallAverage = validModuleCount > 0 ? (totalAverageSum / validModuleCount).toFixed(2) : 0;
        const overallStatus = getStatus(overallAverage).status;
        
        historyEntry.overallAverage = overallAverage;
        historyEntry.overallStatus = overallStatus;

        document.getElementById('overallAverage').innerHTML = `
            <br>Overall Weighted Average: <strong>${overallAverage}</strong>.
        `;

        // Save history only if all data was valid for all modules
        if (validModuleCount === MODULES.length) {
            saveToHistory(historyEntry);
        }
    }


    // --- History Management (Local Storage & CSV) ---

    function saveToHistory(entry) {
        const history = JSON.parse(localStorage.getItem('itGradeHistory') || '[]');
        history.push(entry);
        localStorage.setItem('itGradeHistory', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('itGradeHistory') || '[]');
        historyTableBody.innerHTML = '';
        
        history.slice(-10).forEach(entry => { // Display last 10 entries for brevity
            const row = historyTableBody.insertRow();
            row.insertCell().textContent = entry.name;
            
            // Insert average/status for the 4 core modules in the history table
            MODULES.slice(0, 4).forEach(mod => {
                const modData = entry.averages[mod.id];
                const cell = row.insertCell();
                cell.innerHTML = `${modData.average} (<span class="${modData.status}">${modData.status[0]}</span>)`;
            });

            row.insertCell().textContent = '...'; // Placeholder for remaining modules
            row.insertCell().textContent = entry.overallAverage;
            row.insertCell().innerHTML = `<span class="${entry.overallStatus}">${entry.overallStatus}</span>`;
        });
    }
    
    function clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            localStorage.removeItem('itGradeHistory');
            loadHistory();
            alert('History cleared.');
        }
    }

    function exportToCsv() {
        const history = JSON.parse(localStorage.getItem('itGradeHistory') || '[]');
        if (history.length === 0) {
            alert('No history to export.');
            return;
        }

        // CSV Header: Name, Mod1_Avg, Mod1_Status, Mod2_Avg, Mod2_Status, ..., Overall_Avg, Overall_Status
        let header = ["Name"];
        MODULES.forEach(mod => {
            header.push(`${mod.name}_Average`, `${mod.name}_Status`);
        });
        header.push("Overall_Average", "Overall_Status");
        let csvContent = header.join(',') + "\n";

        // CSV Rows
        history.forEach(entry => {
            let row = [entry.name.replace(/,/g, '')]; // Remove commas from name to avoid breaking CSV
            MODULES.forEach(mod => {
                const modData = entry.averages[mod.id];
                row.push(modData.average, modData.status);
            });
            row.push(entry.overallAverage, entry.overallStatus);
            csvContent += row.join(',') + "\n";
        });

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'it_student_grades_history.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
