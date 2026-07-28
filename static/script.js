/* ==========================================================================
   Expense Tracker Pro - Modern Client Interactions & AJAX Engine
   ========================================================================== */

let expenseChart = null;
let categoryBarChart = null;
let monthlyTrendChartObj = null;
let weeklyTrendChartObj = null;
let comparisonChartObj = null;
let yearlyChartObj = null;

// Pagination variables
let currentPage = 1;
const rowsPerPage = 10;
let visibleRows = [];

// Show Loading Spinner Page Screen Overlay
function showLoader() {
    const loader = document.getElementById("loadingOverlay");
    if (loader) {
        loader.style.display = "flex";
        loader.style.opacity = "1";
    }
}

// Hide Loading Spinner Screen Overlay
function hideLoader() {
    const loader = document.getElementById("loadingOverlay");
    if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
            loader.style.display = "none";
        }, 200);
    }
}

// Sidebar Drawer Collapsible Trigger
function toggleSidebar() {
    const sidebar = document.getElementById("sidebarNav");
    if (sidebar) {
        sidebar.classList.toggle("collapsed");
        
        // Let Chart.js resize smoothly after transition completes
        setTimeout(() => {
            if (expenseChart) expenseChart.resize();
            if (categoryBarChart) categoryBarChart.resize();
            if (monthlyTrendChartObj) monthlyTrendChartObj.resize();
            if (weeklyTrendChartObj) weeklyTrendChartObj.resize();
            if (comparisonChartObj) comparisonChartObj.resize();
            if (yearlyChartObj) yearlyChartObj.resize();
        }, 300);
    }
}

// Slide-out Drawer Actions
function openTransactionDrawer() {
    const drawer = document.getElementById("transactionDrawer");
    if (drawer) {
        drawer.classList.add("open");
    }
}

function closeTransactionDrawer() {
    const drawer = document.getElementById("transactionDrawer");
    if (drawer) {
        drawer.classList.remove("open");
    }
}

// Display dynamically generated success toasts
function showToast(message) {
    // Remove existing toast if visible
    const existingToast = document.getElementById("toastMessage");
    if (existingToast) existingToast.remove();

    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "alert alert-success toast";
    toast.id = "toastMessage";
    toast.innerHTML = `
        <span class="alert-icon"><i data-lucide="sparkles"></i></span>
        <span class="alert-text">${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    
    // Trigger Lucide icons inside the new toast
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        toast.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// Ledger filtering search engine (advanced filtering client-side)
function searchExpenses() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value.toLowerCase();
    
    const startVal = document.getElementById("dateStartFilter").value;
    const endVal = document.getElementById("dateEndFilter").value;
    
    const minVal = parseFloat(document.getElementById("amountMinFilter").value) || 0;
    const maxVal = parseFloat(document.getElementById("amountMaxFilter").value) || Infinity;
    
    const rows = document.querySelectorAll(".expense-row");
    visibleRows = [];
    
    rows.forEach(row => {
        const name = row.getAttribute("data-name").toLowerCase();
        const cat = row.getAttribute("data-category").toLowerCase();
        const dateStr = row.getAttribute("data-date");
        const amount = parseFloat(row.getAttribute("data-amount")) || 0;
        
        let match = true;
        
        if (query && !name.includes(query)) match = false;
        if (category !== "all" && cat !== category) match = false;
        if (startVal && dateStr < startVal) match = false;
        if (endVal && dateStr > endVal) match = false;
        if (amount < minVal || amount > maxVal) match = false;
        
        if (match) {
            visibleRows.push(row);
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
    
    currentPage = 1;
    applyPagination();
}

function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("dateStartFilter").value = "";
    document.getElementById("dateEndFilter").value = "";
    document.getElementById("amountMinFilter").value = "";
    document.getElementById("amountMaxFilter").value = "";
    searchExpenses();
}

// Client-side Ledger pagination
function applyPagination() {
    const totalPages = Math.ceil(visibleRows.length / rowsPerPage) || 1;
    const pagBar = document.getElementById("paginationBar");
    const info = document.getElementById("paginationInfo");
    
    if (visibleRows.length <= rowsPerPage) {
        if (pagBar) pagBar.style.display = "none";
        visibleRows.forEach(row => row.style.display = "");
        return;
    }
    
    if (pagBar) pagBar.style.display = "flex";
    
    visibleRows.forEach((row, index) => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        if (index >= start && index < end) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
    
    if (info) info.textContent = `Page ${currentPage} of ${totalPages}`;
    
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;
    applyPagination();
}

// Modal Handlers (AJAX version)
function openEditModal(id, name, amount, category, date, notes) {
    const modal = document.getElementById("editModal");
    if (!modal) return;

    modal.style.display = "block";
    document.getElementById("editName").value = name;
    document.getElementById("editAmount").value = amount;
    document.getElementById("editCategory").value = category;
    document.getElementById("editDate").value = date || new Date().toISOString().split('T')[0];
    document.getElementById("editNotes").value = notes || "";
    
    document.getElementById("ajaxEditForm").setAttribute("action", "/update/" + id);
}

function closeEditModal() {
    const modal = document.getElementById("editModal");
    if (modal) {
        modal.style.display = "none";
    }
}

window.onclick = function(event) {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Theme management
function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    
    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
    
    renderCharts();
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    const themeIcon = document.querySelector(".theme-icon");
    
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeIcon) themeIcon.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeIcon) themeIcon.textContent = "🌙";
    }
}

function displayCurrentDate() {
    const dateEl = document.getElementById("currentDate");
    if (!dateEl) return;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString("en-US", options);
}

function prefillFormDates() {
    const todayStr = new Date().toISOString().split('T')[0];
    const addDateInput = document.getElementById("expenseDate");
    if (addDateInput) {
        addDateInput.value = todayStr;
    }
}

function animateProgressBar() {
    const progressFill = document.querySelector(".progress-bar-fill");
    if (progressFill) {
        setTimeout(() => {
            const percentage = progressFill.dataset.progress || 0;
            progressFill.style.width = percentage + "%";
        }, 150);
    }
}

// Get Theme Colors for Chart.js Styling
function getThemeChartConfig() {
    const isDark = document.body.classList.contains("dark-mode");
    return {
        textColor: isDark ? "hsl(215, 20%, 65%)" : "hsl(215, 16%, 47%)",
        gridColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
        fontFamily: "'Outfit', sans-serif"
    };
}

// Initialize and render Chart.js
function renderCharts() {
    const config = getThemeChartConfig();

    // Chart.js global defaults
    Chart.defaults.color = config.textColor;
    Chart.defaults.font.family = config.fontFamily;
    Chart.defaults.font.size = 11;

    // Destroy existing chart instances if they exist
    if (expenseChart) expenseChart.destroy();
    if (categoryBarChart) categoryBarChart.destroy();

    // 1. Pie Chart (Distribution)
    const pieCanvas = document.getElementById("expenseChart");
    if (pieCanvas && typeof chartValues !== 'undefined') {
        const parsedValues = chartValues.map(val => Number(val) || 0);
        
        expenseChart = new Chart(pieCanvas, {
            type: "pie",
            data: {
                labels: chartLabels,
                datasets: [{
                    data: parsedValues,
                    backgroundColor: [
                        "#10b981", // Food (Emerald)
                        "#3b82f6", // Travel (Blue)
                        "#f43f5e", // Rent (Rose)
                        "#a855f7", // Shopping (Purple)
                        "#f97316", // Fun (Orange)
                        "#6b7280"  // Other (Grey)
                    ],
                    borderWidth: document.body.classList.contains("dark-mode") ? 2 : 1,
                    borderColor: document.body.classList.contains("dark-mode") ? "#1e293b" : "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            padding: 12,
                            boxWidth: 12,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // 2. Bar Chart (Category spending)
    const barCanvas = document.getElementById("barChart");
    if (barCanvas && typeof chartValues !== 'undefined') {
        categoryBarChart = new Chart(barCanvas, {
            type: "bar",
            data: {
                labels: chartLabels,
                datasets: [{
                    label: "Amount Spent (₹)",
                    data: chartValues.map(val => Number(val) || 0),
                    backgroundColor: [
                        "rgba(16, 185, 129, 0.85)",
                        "rgba(59, 130, 246, 0.85)",
                        "rgba(244, 63, 94, 0.85)",
                        "rgba(168, 85, 247, 0.85)",
                        "rgba(249, 115, 22, 0.85)",
                        "rgba(107, 114, 128, 0.85)"
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: config.textColor }
                    },
                    y: {
                        grid: { color: config.gridColor },
                        ticks: { color: config.textColor },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Monthly Spending Trend Chart (Line with linear gradients fill)
    const monthlyCanvas = document.getElementById("monthlyTrendChart");
    if (monthlyCanvas && typeof monthlyValues !== 'undefined') {
        if (monthlyTrendChartObj) monthlyTrendChartObj.destroy();
        const ctx = monthlyCanvas.getContext("2d");
        const gradientFill = ctx.createLinearGradient(0, 0, 0, 250);
        gradientFill.addColorStop(0, "rgba(99, 102, 241, 0.45)");
        gradientFill.addColorStop(1, "rgba(99, 102, 241, 0)");

        monthlyTrendChartObj = new Chart(monthlyCanvas, {
            type: "line",
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: "Monthly Spending (₹)",
                    data: monthlyValues,
                    borderColor: "#4f46e5",
                    backgroundColor: gradientFill,
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: config.textColor }
                    },
                    y: {
                        grid: { color: config.gridColor },
                        ticks: { color: config.textColor },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 4. Weekly Spending Trend Chart (Bar with rounded borders)
    const weeklyCanvas = document.getElementById("weeklyTrendChart");
    if (weeklyCanvas && typeof weeklyValues !== 'undefined') {
        if (weeklyTrendChartObj) weeklyTrendChartObj.destroy();
        weeklyTrendChartObj = new Chart(weeklyCanvas, {
            type: "bar",
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: "Weekly Spend (₹)",
                    data: weeklyValues,
                    backgroundColor: "#3b82f6",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: config.textColor }
                    },
                    y: {
                        grid: { color: config.gridColor },
                        ticks: { color: config.textColor },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 5. Month-over-Month Category Comparison Chart (Grouped Bar)
    const compCanvas = document.getElementById("categoryComparisonChart");
    if (compCanvas && typeof currentMonthValues !== 'undefined') {
        if (comparisonChartObj) comparisonChartObj.destroy();
        comparisonChartObj = new Chart(compCanvas, {
            type: "bar",
            data: {
                labels: categoryLabels,
                datasets: [
                    {
                        label: `${typeof prevMonthName !== 'undefined' ? prevMonthName : 'Last Month'} (₹)`,
                        data: prevMonthValues,
                        backgroundColor: "#9ca3af",
                        borderRadius: 6
                    },
                    {
                        label: `${typeof currentMonthName !== 'undefined' ? currentMonthName : 'This Month'} (₹)`,
                        data: currentMonthValues,
                        backgroundColor: "#4f46e5",
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: config.textColor }
                    },
                    y: {
                        grid: { color: config.gridColor },
                        ticks: { color: config.textColor },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 6. Yearly Spending Chart (Doughnut)
    const yearlyCanvas = document.getElementById("yearlyComparisonChart");
    if (yearlyCanvas && typeof yearlyValues !== 'undefined') {
        if (yearlyChartObj) yearlyChartObj.destroy();
        yearlyChartObj = new Chart(yearlyCanvas, {
            type: "doughnut",
            data: {
                labels: yearlyLabels,
                datasets: [{
                    data: yearlyValues,
                    backgroundColor: [
                        "#4f46e5",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444"
                    ],
                    borderWidth: document.body.classList.contains("dark-mode") ? 2 : 1,
                    borderColor: document.body.classList.contains("dark-mode") ? "#1e293b" : "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            padding: 12,
                            color: config.textColor
                        }
                    }
                }
            }
        });
    }
}

// --------------------------------------------------------------------------
// AJAX Operations (Version 7.5 Single Page App Interactions)
// --------------------------------------------------------------------------

// Re-compile HTML values and update the Dashboard elements dynamically
function updateDOMStats(stats) {
    // 1. Update KPI Values
    const kpiTotal = document.getElementById("kpiTotal");
    if (kpiTotal) kpiTotal.textContent = "₹" + stats.total;

    const kpiBudget = document.getElementById("kpiBudget");
    if (kpiBudget) kpiBudget.textContent = "₹" + stats.budget_amount;

    const kpiRemaining = document.getElementById("kpiRemaining");
    if (kpiRemaining) {
        kpiRemaining.textContent = "₹" + stats.remaining_budget;
        kpiRemaining.className = "kpi-value status-color-" + stats.budget_status;
    }

    const kpiAverage = document.getElementById("kpiAverage");
    if (kpiAverage) {
        kpiAverage.innerHTML = "₹" + stats.average_expense + " <span class='kpi-subtext'>(" + stats.transaction_count + " tx)</span>";
    }

    // 2. Update Header elements
    const monthNameText = document.getElementById("monthNameText");
    if (monthNameText) monthNameText.textContent = stats.month_name;

    const budgetStateText = document.getElementById("budgetStateText");
    if (budgetStateText) {
        budgetStateText.textContent = stats.budget_state;
        budgetStateText.className = "pill-value status-" + stats.budget_status;
    }

    // 3. Update Progress bars and text status
    const progressBarFill = document.getElementById("progressBarFill");
    if (progressBarFill) {
        progressBarFill.className = "progress-bar-fill " + stats.budget_status;
        progressBarFill.style.width = stats.budget_percentage + "%";
        progressBarFill.dataset.progress = stats.budget_percentage;
    }

    const progressBarPercentage = document.getElementById("progressBarPercentage");
    if (progressBarPercentage) {
        progressBarPercentage.textContent = stats.actual_budget_percentage.toFixed(1) + "%";
        progressBarPercentage.className = "progress-percent-badge status-bg-" + stats.budget_status;
    }

    const budgetStatusMsgContainer = document.getElementById("budgetStatusMsgContainer");
    if (budgetStatusMsgContainer) {
        let msgHtml = "";
        if (stats.budget_status === "healthy") {
            msgHtml = `<p class="status-msg status-msg-healthy"><span class="msg-icon"><i data-lucide="check-circle-2"></i></span> Budget Healthy: Keep staying under control!</p>`;
        } else if (stats.budget_status === "warning") {
            msgHtml = `<p class="status-msg status-msg-warning"><span class="msg-icon"><i data-lucide="alert-triangle"></i></span> Warning: You're approaching your monthly budget limit!</p>`;
        } else if (stats.budget_status === "danger") {
            msgHtml = `<p class="status-msg status-msg-danger"><span class="msg-icon"><i data-lucide="skull"></i></span> Danger: Budget Exceeded! Limit your spendings immediately.</p>`;
        }
        budgetStatusMsgContainer.innerHTML = msgHtml;
    }

    // Update delete budget triggers
    const budgetDeleteAction = document.getElementById("budgetDeleteAction");
    if (budgetDeleteAction) {
        if (stats.budget_amount > 0) {
            budgetDeleteAction.innerHTML = `<button onclick="ajaxDeleteBudget()" class="btn-danger-link btn-xs border-none bg-none cursor-pointer">Delete Budget</button>`;
        } else {
            budgetDeleteAction.innerHTML = "";
        }
    }

    // Update Reset button display state
    const budgetResetAction = document.getElementById("budgetResetAction");
    const budgetInput = document.getElementById("budget");
    if (budgetInput) {
        budgetInput.value = stats.budget_amount;
    }
    if (budgetResetAction) {
        budgetResetAction.style.display = stats.budget_amount > 0 ? "block" : "none";
    }

    // 4. Update Category list values
    const catFood = document.getElementById("catTotalFood");
    if (catFood) catFood.textContent = "₹" + stats.category_totals.Food;
    
    const catTravel = document.getElementById("catTotalTravel");
    if (catTravel) catTravel.textContent = "₹" + stats.category_totals.Travel;

    const catRent = document.getElementById("catTotalRent");
    if (catRent) catRent.textContent = "₹" + stats.category_totals.Rent;

    const catShopping = document.getElementById("catTotalShopping");
    if (catShopping) catShopping.textContent = "₹" + stats.category_totals.Shopping;

    const catFun = document.getElementById("catTotalFun");
    if (catFun) catFun.textContent = "₹" + stats.category_totals.Fun;

    const catOther = document.getElementById("catTotalOther");
    if (catOther) catOther.textContent = "₹" + stats.category_totals.Other;

    // 5. Update chart variables and trigger redrawing
    if (typeof chartValues !== 'undefined') {
        chartValues[0] = stats.category_totals.Food;
        chartValues[1] = stats.category_totals.Travel;
        chartValues[2] = stats.category_totals.Rent;
        chartValues[3] = stats.category_totals.Shopping;
        chartValues[4] = stats.category_totals.Fun;
        chartValues[5] = stats.category_totals.Other;
        renderCharts();
    }

    // 6. Regenerate Expense List Rows in Table
    const tableBody = document.getElementById("tableBody");
    if (tableBody) {
        if (stats.expenses.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-records-row" id="noRecordsPlaceholder">
                    <td colspan="6" class="text-center">No expenses recorded yet. Click Add Transaction to start tracking!</td>
                </tr>`;
        } else {
            let rowsHtml = "";
            stats.expenses.forEach(e => {
                const notesCell = e.notes 
                    ? `<span class="notes-preview" title="${e.notes.replace(/"/g, '&quot;')}">📝 <span class="notes-truncated">${e.notes}</span></span>`
                    : `<span class="text-muted">-</span>`;
                
                rowsHtml += `
                <tr class="expense-row" id="row-${e.id}"
                    data-name="${e.name.replace(/"/g, '&quot;')}" 
                    data-category="${e.category}"
                    data-date="${e.date}"
                    data-amount="${e.amount}">
                    <td class="td-date">${e.date}</td>
                    <td class="td-name"><strong>${e.name}</strong></td>
                    <td>
                        <span class="badge badge-category badge-${e.category.toLowerCase()}">
                            ${e.category}
                        </span>
                    </td>
                    <td class="td-amount">₹${e.amount}</td>
                    <td class="td-notes">${notesCell}</td>
                    <td class="text-right">
                        <div class="row-actions">
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="openEditModal('${e.id}', '${e.name.replace(/'/g, "\\'")}', '${e.amount}', '${e.category}', '${e.date}', '${e.notes.replace(/'/g, "\\'")}')">
                                <i data-lucide="edit-3"></i> Edit
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="ajaxDeleteExpense('${e.id}')">
                                <i data-lucide="trash-2"></i> Delete
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            });
            tableBody.innerHTML = rowsHtml;
        }
        
        // Re-read visible rows lists
        const rows = document.querySelectorAll(".expense-row");
        visibleRows = Array.from(rows);
        applyPagination();
    }

    // Refresh Lucide Vector SVGs inside dynamic blocks
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// AJAX - Adding Expense
function setupAjaxAddExpense() {
    const addForm = document.getElementById("ajaxAddExpenseForm");
    if (!addForm) return;

    addForm.addEventListener("submit", function(e) {
        e.preventDefault();
        showLoader();
        
        const formData = new FormData(addForm);
        
        fetch("/", {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
        .then(res => res.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                closeTransactionDrawer();
                addForm.reset();
                prefillFormDates();
                showToast(data.message);
                updateDOMStats(data.stats);
            } else {
                alert(data.message || "Failed to add expense.");
            }
        })
        .catch(err => {
            hideLoader();
            console.error("AJAX adding error:", err);
        });
    });
}

// AJAX - Editing Expense
function setupAjaxEditExpense() {
    const editForm = document.getElementById("ajaxEditForm");
    if (!editForm) return;

    editForm.addEventListener("submit", function(e) {
        e.preventDefault();
        showLoader();
        
        const formData = new FormData(editForm);
        const actionUrl = editForm.getAttribute("action");
        
        fetch(actionUrl, {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
        .then(res => res.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                closeEditModal();
                showToast(data.message);
                updateDOMStats(data.stats);
            } else {
                alert(data.message || "Failed to update expense.");
            }
        })
        .catch(err => {
            hideLoader();
            console.error("AJAX editing error:", err);
        });
    });
}

// AJAX - Deleting Expense
function ajaxDeleteExpense(id) {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;
    
    showLoader();
    fetch("/delete/" + id, {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showToast(data.message);
            updateDOMStats(data.stats);
        } else {
            alert(data.message || "Failed to delete expense.");
        }
    })
    .catch(err => {
        hideLoader();
        console.error("AJAX deleting error:", err);
    });
}

// AJAX - Set Budget
function setupAjaxBudgetController() {
    const budgetForm = document.getElementById("budgetSettingForm");
    if (!budgetForm) return;

    budgetForm.addEventListener("submit", function(e) {
        e.preventDefault();
        showLoader();
        
        const formData = new FormData(budgetForm);
        
        fetch("/set_budget", {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        })
        .then(res => res.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                showToast(data.message);
                updateDOMStats(data.stats);
            } else {
                alert(data.message || "Failed to save budget.");
            }
        })
        .catch(err => {
            hideLoader();
            console.error("AJAX budget saving error:", err);
        });
    });
}

// AJAX - Delete Budget
function ajaxDeleteBudget() {
    if (!confirm("Delete budget limit for this month?")) return;
    
    showLoader();
    fetch("/delete_budget", {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showToast(data.message);
            updateDOMStats(data.stats);
        } else {
            alert(data.message || "Failed to delete budget.");
        }
    })
    .catch(err => {
        hideLoader();
        console.error("AJAX budget deleting error:", err);
    });
}

// AJAX - Reset Budget to ₹0
function ajaxResetBudget() {
    if (!confirm("Reset budget limit to ₹0 for this month?")) return;
    
    showLoader();
    fetch("/reset_budget", {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showToast(data.message);
            updateDOMStats(data.stats);
        } else {
            alert(data.message || "Failed to reset budget.");
        }
    })
    .catch(err => {
        hideLoader();
        console.error("AJAX budget resetting error:", err);
    });
}

// OCR Receipt Scanner Interactions (Version 8)
function initReceiptScanner() {
    const dropzone = document.getElementById("receiptDropzone");
    const fileInput = document.getElementById("receiptFileInput");
    const loader = document.getElementById("ocrLoader");
    const helperCard = document.getElementById("ocrHelperCard");

    if (!dropzone || !fileInput) return;

    // Trigger input browse window on click
    dropzone.addEventListener("click", () => fileInput.click());

    // Drag-and-drop handlers
    ["dragenter", "dragover"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add("dragover");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove("dragover");
        }, false);
    });

    dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleReceiptUpload(files[0]);
        }
    });

    fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files.length > 0) {
            handleReceiptUpload(fileInput.files[0]);
        }
    });

    function handleReceiptUpload(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image receipt file (PNG, JPG, JPEG).");
            return;
        }

        // Show OCR scanning loader, hide errors
        loader.style.display = "flex";
        helperCard.style.display = "none";

        const formData = new FormData();
        formData.append("receipt", file);

        fetch("/receipt/scan", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            loader.style.display = "none";
            fileInput.value = ""; // Clear input for future selections

            if (data.success) {
                // Populate forms
                document.getElementById("expenseName").value = data.data.name || "";
                document.getElementById("expenseAmount").value = data.data.amount || "";
                document.getElementById("expenseCategory").value = data.data.category || "";
                document.getElementById("expenseDate").value = data.data.date || new Date().toISOString().split('T')[0];
                document.getElementById("expenseNotes").value = data.data.notes || "";
                
                showToast("Receipt parsed successfully! Review form fields.");
            } else {
                if (data.error_type === "TESSERACT_NOT_FOUND") {
                    helperCard.style.display = "flex";
                    showToast("Tesseract OCR not found. Review setup instructions.");
                } else {
                    showToast("Error scanning: " + (data.message || "Unknown error"));
                }
            }
        })
        .catch(err => {
            loader.style.display = "none";
            fileInput.value = "";
            console.error("OCR Scanner Error:", err);
            showToast("Network error parsing receipt.");
        });
    }
}

// Window Load Handler
document.addEventListener("DOMContentLoaded", () => {
    loadSavedTheme();
    displayCurrentDate();
    prefillFormDates();
    animateProgressBar();
    
    // Initial search to kick off pagination
    const rows = document.querySelectorAll(".expense-row");
    visibleRows = Array.from(rows);
    applyPagination();
    
    renderCharts();
    
    // Hook asynchronous forms triggers
    setupAjaxAddExpense();
    setupAjaxEditExpense();
    setupAjaxBudgetController();
    
    // Hook OCR receipt scanner
    initReceiptScanner();
    
    // Fetch notifications badge & list on load (Version 9)
    fetchNotifications();
    
    // Auto-dismiss notification dropdown when clicking outside
    document.addEventListener("click", (e) => {
        const wrapper = document.querySelector(".header-notifications-wrapper");
        const panel = document.getElementById("notifDropdown");
        if (wrapper && panel && panel.classList.contains("open") && !wrapper.contains(e.target)) {
            panel.classList.remove("open");
        }
    });
    
    // Auto-dismiss standard Flash message Toast on load if visible
    const stdToast = document.getElementById("toastMessage");
    if (stdToast) {
        setTimeout(() => {
            stdToast.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
            stdToast.style.opacity = "0";
            stdToast.style.transform = "translateY(-10px)";
            setTimeout(() => stdToast.remove(), 500);
        }, 4000);
    }
    
    // Initialize crisp SVG vector Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Dismiss loading overlay on complete load
    hideLoader();
});

// --------------------------------------------------------------------------
// Notification Center & Dropdown Functions (Version 9)
// --------------------------------------------------------------------------
function toggleNotificationsDropdown(event) {
    if (event) {
        event.stopPropagation();
    }
    const panel = document.getElementById("notifDropdown");
    if (!panel) return;
    panel.classList.toggle("open");
    
    if (panel.classList.contains("open")) {
        fetchNotifications();
    }
}

function fetchNotifications() {
    fetch("/notifications")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateNotificationsUI(data.notifications, data.unread_count);
            }
        })
        .catch(err => console.error("Error fetching notifications:", err));
}

function updateNotificationsUI(notifications, unreadCount) {
    const badge = document.getElementById("notifBadge");
    const container = document.getElementById("notifListContainer");
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }
    
    if (container) {
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="notif-empty-state">
                    <i data-lucide="bell-off" style="width: 20px; height: 20px; color: var(--text-muted);"></i>
                    <span>No notifications yet</span>
                </div>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        let notifHtml = "";
        notifications.forEach(n => {
            const unreadClass = n.is_read ? "" : "unread";
            notifHtml += `
                <div class="notif-item ${unreadClass}">
                    <p class="notif-message">${n.message}</p>
                    <span class="notif-time">${n.timestamp}</span>
                </div>`;
        });
        container.innerHTML = notifHtml;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function ajaxReadAllNotifications() {
    fetch("/notifications/read-all")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fetchNotifications();
                showToast("All notifications marked as read.");
            }
        })
        .catch(err => console.error("Error reading all notifications:", err));
}

function ajaxEmailStatement() {
    showLoader();
    fetch("/notifications/email-summary")
        .then(res => res.json())
        .then(data => {
            hideLoader();
            if (data.success) {
                showToast(data.message);
                fetchNotifications(); // Refresh list to show statement emailed alert
            } else {
                alert(data.message || "Failed to dispatch statement email.");
            }
        })
        .catch(err => {
            hideLoader();
            console.error("Error emailing statement:", err);
            showToast("Network error emailing statement.");
        });
}