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
    // Cache the latest stats data dynamically (Option B)
    currentStatsData = stats;

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

    // Update Reset button display state and sync input fields
    const budgetResetAction = document.getElementById("budgetResetAction");
    if (budgetResetAction) {
        budgetResetAction.style.display = stats.budget_amount > 0 ? "block" : "none";
    }
    
    // Sync current budget category selection value
    onBudgetCategoryChange();

    // Re-render Category budget items list (Option B)
    const categoryBudgetsList = document.getElementById("categoryBudgetsList");
    if (categoryBudgetsList) {
        let listHtml = "";
        const catKeys = Object.keys(stats.category_budgets);
        if (catKeys.length === 0) {
            listHtml = `
                <div class="cat-budget-empty" id="catBudgetEmptyPlaceholder">
                    <p class="text-muted text-sm">No category-specific budgets set yet.</p>
                </div>`;
        } else {
            catKeys.forEach(cat => {
                const limit = stats.category_budgets[cat];
                const spent = stats.category_totals[cat] || 0;
                const percentage = limit > 0 ? (spent / limit * 100) : 0;
                const fillPercent = Math.min(percentage, 100);
                
                let stateClass = "healthy";
                if (percentage >= 100) {
                    stateClass = "danger";
                } else if (percentage >= stats.threshold) {
                    stateClass = "warning";
                }
                
                listHtml += `
                <div class="cat-budget-item" id="cat-budget-${cat}">
                    <div class="cat-budget-info">
                        <span class="cat-name"><strong>${cat}</strong></span>
                        <span class="cat-values">₹${spent} of ₹${limit}</span>
                    </div>
                    <div class="cat-progress-bg">
                        <div class="cat-progress-fill ${stateClass}" style="width: ${fillPercent}%"></div>
                    </div>
                </div>`;
            });
        }
        categoryBudgetsList.innerHTML = listHtml;
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
    
    // Update AI Spending projections curve (Version 12)
    updateAIForecast();
}

// AJAX - Adding Expense
function setupAjaxAddExpense() {
    const addForm = document.getElementById("ajaxAddExpenseForm");
    if (!addForm) return;

    addForm.addEventListener("submit", function(e) {
        e.preventDefault();
        showLoader();
        
        const formData = new FormData(addForm);
        
        // Handle offline submission caching (Version 12 PWA)
        if (!navigator.onLine) {
            const dataObj = {
                name: formData.get("name"),
                amount: parseInt(formData.get("amount")),
                category: formData.get("category"),
                date: formData.get("date") || new Date().toISOString().split('T')[0],
                notes: formData.get("notes") || "Offline logged entry"
            };
            saveExpenseOffline(dataObj);
            hideLoader();
            addForm.reset();
            closeTransactionDrawer();
            return;
        }
        
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
    const select = document.getElementById("budgetCategorySelect");
    const category = select ? select.value : "global";
    const displayName = category === "global" ? "Overall Monthly" : category;
    
    if (!confirm(`Delete budget limit for ${displayName} category?`)) return;
    
    showLoader();
    fetch(`/delete_budget?category=${category}`, {
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
    const select = document.getElementById("budgetCategorySelect");
    const category = select ? select.value : "global";
    const displayName = category === "global" ? "Overall Monthly" : category;
    
    if (!confirm(`Reset budget limit for ${displayName} category?`)) return;
    
    showLoader();
    fetch(`/reset_budget?category=${category}`, {
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

// Global stats cache for category budget selection (Option B)
let currentStatsData = null;

// Triggered when budget category selection changes
function onBudgetCategoryChange() {
    const select = document.getElementById("budgetCategorySelect");
    const input = document.getElementById("budget");
    const resetBtn = document.getElementById("budgetResetBtn");
    if (!select || !input || !currentStatsData) return;
    
    const selectedScope = select.value;
    let amount = 0;
    
    if (selectedScope === "global") {
        amount = currentStatsData.budget_amount;
    } else {
        amount = currentStatsData.category_budgets[selectedScope] || 0;
    }
    
    input.value = amount || "";
    if (resetBtn) {
        resetBtn.textContent = selectedScope === "global" 
            ? "Reset Budget to ₹0" 
            : `Reset ${selectedScope} Budget to ₹0`;
    }
}

// Setup account Settings forms submissions via AJAX
function setupSettingsForms() {
    const forms = ["profileForm", "securityForm", "preferencesForm"];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            showLoader();
            
            const formData = new FormData(form);
            const actionUrl = form.getAttribute("action");
            
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
                    showToast(data.message);
                    if (formId === "securityForm") {
                        form.reset();
                    }
                } else {
                    alert(data.message || "Failed to save settings.");
                }
            })
            .catch(err => {
                hideLoader();
                console.error("Settings saving error:", err);
            });
        });
    });
}

// Fetch stats on load to populate budget inputs
function fetchStatsOnLoad() {
    const budgetSettingForm = document.getElementById("budgetSettingForm");
    if (!budgetSettingForm) return;
    
    fetch("/", {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.stats) {
            currentStatsData = data.stats;
            onBudgetCategoryChange();
        }
    })
    .catch(err => {
        console.error("Error pre-fetching stats on load:", err);
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
    setupSettingsForms();
    
    // Hook OCR receipt scanner
    initReceiptScanner();
    
    // Hook CSV Importer statement (Version 12)
    initCSVImporter();
    
    // Fetch initial stats dynamically
    fetchStatsOnLoad();
    
    // Trigger AI forecast predictions graph (Version 12)
    updateAIForecast();
    
    // Sync offline queued transactions if online (Version 12)
    syncOfflineExpenses();
    
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

// --------------------------------------------------------------------------
// PWA Service Worker Registration (Version 12)
// --------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(reg => console.log('Service Worker registered successfully! Scope:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}

// --------------------------------------------------------------------------
// AI Spending Forecast & Trend line (Version 12)
// --------------------------------------------------------------------------
let forecastSparklineObj = null;

function updateAIForecast() {
    const projectedSpendEl = document.getElementById("forecastProjectedSpend");
    const statusBoxEl = document.getElementById("forecastStatusBox");
    const statusTextEl = document.getElementById("forecastStatusText");
    const canvas = document.getElementById("forecastSparkline");
    
    if (!projectedSpendEl || !canvas) return;
    
    fetch("/api/ai/forecast")
        .then(res => res.json())
        .then(data => {
            if (!data.success) return;
            
            projectedSpendEl.textContent = "₹" + data.projected_spend.toLocaleString("en-IN");
            
            let msg = "";
            let statusClass = "healthy";
            
            if (data.budget_limit === 0) {
                msg = "Please set a monthly budget limit to analyze warning thresholds.";
            } else if (data.budget_status === "danger") {
                statusClass = "danger";
                msg = `⚠️ Projected to exceed budget! Expected limit breach around Day ${data.exceeded_on_day || 'N/A'} of this month.`;
            } else if (data.budget_status === "warning") {
                statusClass = "warning";
                msg = `⚡ Projected to reach over 80% of your budget limit. Stay alert!`;
            } else {
                msg = `✅ On Track: Month-end spending is projected to stay safely within your limit.`;
            }
            
            statusBoxEl.className = "forecast-status-box " + statusClass;
            statusTextEl.textContent = msg;
            
            if (forecastSparklineObj) forecastSparklineObj.destroy();
            
            const labels = Array.from({length: data.days_in_month}, (_, i) => i + 1);
            const actualData = Array(data.days_in_month).fill(null);
            
            data.actual_coords.forEach(pt => {
                actualData[pt.x - 1] = pt.y;
            });
            
            const projectedData = data.projected_coords.map(pt => pt.y);
            
            forecastSparklineObj = new Chart(canvas, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Actual Spend",
                            data: actualData,
                            borderColor: "#4f46e5",
                            backgroundColor: "rgba(99, 102, 241, 0.05)",
                            borderWidth: 2,
                            pointRadius: 1,
                            tension: 0.2,
                            fill: false
                        },
                        {
                            label: "AI Projected",
                            data: projectedData,
                            borderColor: "#94a3b8",
                            borderWidth: 1.5,
                            borderDash: [4, 4],
                            pointRadius: 0,
                            tension: 0.1,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { mode: "index", intersect: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        })
        .catch(err => {
            console.error("AI Forecasting retrieval error:", err);
        });
}

// --------------------------------------------------------------------------
// CSV Statement Importer & Column Mapper (Version 12)
// --------------------------------------------------------------------------
let parsedCSVData = [];
let csvHeaders = [];

function openImportDrawer() {
    const drawer = document.getElementById("importStatementDrawer");
    if (drawer) drawer.classList.add("open");
}

function closeImportDrawer() {
    const drawer = document.getElementById("importStatementDrawer");
    if (drawer) {
        drawer.classList.remove("open");
        resetCSVImporter();
    }
}

function resetCSVImporter() {
    document.getElementById("csvFileInput").value = "";
    document.getElementById("csvMapperContainer").style.display = "none";
    document.getElementById("csvPreviewContainer").style.display = "none";
    parsedCSVData = [];
    csvHeaders = [];
}

function initCSVImporter() {
    const dropzone = document.getElementById("csvDropzone");
    const fileInput = document.getElementById("csvFileInput");
    
    if (!dropzone || !fileInput) return;
    
    dropzone.addEventListener("click", () => fileInput.click());
    
    ["dragenter", "dragover"].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add("dragover");
        });
    });
    
    ["dragleave", "drop"].forEach(name => {
        dropzone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove("dragover");
        });
    });
    
    dropzone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleCSVFile(files[0]);
    });
    
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) handleCSVFile(fileInput.files[0]);
    });
}

function handleCSVFile(file) {
    if (!file.name.endsWith(".csv")) {
        alert("Please upload a valid CSV file statement.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseRawCSV(text);
    };
    reader.readAsText(file);
}

function parseRawCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i+1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push('');
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += char;
        }
    }
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    
    if (lines.length < 2) {
        alert("The uploaded CSV file is empty or invalid.");
        return;
    }
    
    csvHeaders = lines[0].map(h => h.trim());
    parsedCSVData = lines.slice(1).filter(l => l.length === csvHeaders.length);
    
    const dateSel = document.getElementById("csvDateCol");
    const descSel = document.getElementById("csvDescCol");
    const amtSel = document.getElementById("csvAmountCol");
    
    [dateSel, descSel, amtSel].forEach(sel => {
        sel.innerHTML = "";
        csvHeaders.forEach((h, idx) => {
            const opt = document.createElement("option");
            opt.value = idx;
            opt.textContent = h || `Column ${idx + 1}`;
            sel.appendChild(opt);
        });
    });
    
    csvHeaders.forEach((h, idx) => {
        const headerLower = h.toLowerCase();
        if (headerLower.includes("date")) dateSel.value = idx;
        if (headerLower.includes("desc") || headerLower.includes("particular") || headerLower.includes("narration") || headerLower.includes("payee")) descSel.value = idx;
        if (headerLower.includes("amount") || headerLower.includes("value") || headerLower.includes("withdrawal") || headerLower.includes("debit")) amtSel.value = idx;
    });
    
    document.getElementById("csvMapperContainer").style.display = "block";
    document.getElementById("csvPreviewContainer").style.display = "none";
}

function parseCSVWithMapping() {
    const dateIdx = parseInt(document.getElementById("csvDateCol").value);
    const descIdx = parseInt(document.getElementById("csvDescCol").value);
    const amtIdx = parseInt(document.getElementById("csvAmountCol").value);
    
    const previewBody = document.getElementById("csvPreviewBody");
    const previewContainer = document.getElementById("csvPreviewContainer");
    const countEl = document.getElementById("csvRecordCount");
    
    if (!previewBody) return;
    previewBody.innerHTML = "";
    
    let validCount = 0;
    
    parsedCSVData.forEach((row, rowIdx) => {
        let rawDate = row[dateIdx] ? row[dateIdx].trim() : "";
        let description = row[descIdx] ? row[descIdx].trim() : "Imported transaction";
        let rawAmount = row[amtIdx] ? row[amtIdx].replace(/[^0-9.-]/g, "") : "";
        
        let amount = Math.abs(parseInt(rawAmount));
        if (isNaN(amount) || amount === 0) return;
        
        let formattedDate = "";
        if (rawDate) {
            const parts = rawDate.split(/[\/\-]/);
            if (parts.length === 3) {
                if (parts[2].length === 4) {
                    formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts[0].length === 4) {
                    formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
        }
        if (!formattedDate) {
            formattedDate = new Date().toISOString().split('T')[0];
        }
        
        let category = "Other";
        const descLower = description.toLowerCase();
        if (descLower.includes("swiggy") || descLower.includes("zomato") || descLower.includes("restaurant") || descLower.includes("food") || descLower.includes("hotel") || descLower.includes("cafe")) {
            category = "Food";
        } else if (descLower.includes("uber") || descLower.includes("ola") || descLower.includes("irctc") || descLower.includes("metro") || descLower.includes("cab") || descLower.includes("flight") || descLower.includes("fuel")) {
            category = "Travel";
        } else if (descLower.includes("rent") || descLower.includes("landlord") || descLower.includes("pg")) {
            category = "Rent";
        } else if (descLower.includes("amazon") || descLower.includes("myntra") || descLower.includes("flipkart") || descLower.includes("groceries") || descLower.includes("blinkit") || descLower.includes("zepto")) {
            category = "Shopping";
        } else if (descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("cinema") || descLower.includes("movie") || descLower.includes("game") || descLower.includes("pub")) {
            category = "Fun";
        }
        
        validCount++;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="checkbox" class="csv-row-checkbox" checked data-idx="${rowIdx}"></td>
            <td><input type="date" value="${formattedDate}" class="csv-row-date" style="border:1px solid var(--border); border-radius:4px; font-size:0.75rem; padding:2px 4px;"></td>
            <td><input type="text" value="${description}" class="csv-row-name" style="border:1px solid var(--border); border-radius:4px; font-size:0.75rem; padding:2px 4px; width:95%;"></td>
            <td><strong>₹${amount}</strong><input type="hidden" value="${amount}" class="csv-row-amount"></td>
            <td>
                <select class="csv-row-category" style="border:1px solid var(--border); border-radius:4px; font-size:0.75rem; padding:2px 4px;">
                    <option value="Food" ${category === 'Food' ? 'selected' : ''}>Food</option>
                    <option value="Travel" ${category === 'Travel' ? 'selected' : ''}>Travel</option>
                    <option value="Rent" ${category === 'Rent' ? 'selected' : ''}>Rent</option>
                    <option value="Shopping" ${category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                    <option value="Fun" ${category === 'Fun' ? 'selected' : ''}>Fun</option>
                    <option value="Other" ${category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </td>
        `;
        previewBody.appendChild(tr);
    });
    
    countEl.textContent = `${validCount} valid records found`;
    previewContainer.style.display = "block";
}

function toggleSelectAllImportCSV(master) {
    const checkboxes = document.querySelectorAll(".csv-row-checkbox");
    checkboxes.forEach(cb => cb.checked = master.checked);
}

function saveImportedCSV() {
    const rows = document.querySelectorAll("#csvPreviewBody tr");
    const transactions = [];
    
    rows.forEach(tr => {
        const checkbox = tr.querySelector(".csv-row-checkbox");
        if (checkbox && checkbox.checked) {
            const date = tr.querySelector(".csv-row-date").value;
            const name = tr.querySelector(".csv-row-name").value;
            const amount = parseInt(tr.querySelector(".csv-row-amount").value);
            const category = tr.querySelector(".csv-row-category").value;
            
            transactions.push({ name, amount, category, date });
        }
    });
    
    if (transactions.length === 0) {
        alert("Please select at least one transaction to import.");
        return;
    }
    
    showLoader();
    fetch("/api/expenses/import", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ transactions })
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            showToast(data.message);
            updateDOMStats(data.stats);
            closeImportDrawer();
        } else {
            alert(data.message || "Failed to import statement.");
        }
    })
    .catch(err => {
        hideLoader();
        console.error("CSV import saving error:", err);
    });
}

// --------------------------------------------------------------------------
// Offline Sync Queue (Version 12 PWA)
// --------------------------------------------------------------------------
function saveExpenseOffline(expenseData) {
    let queue = JSON.parse(localStorage.getItem("offlineExpensesQueue") || "[]");
    queue.push(expenseData);
    localStorage.setItem("offlineExpensesQueue", JSON.stringify(queue));
    showToast("💾 Saved offline! Transaction will be synced when internet returns.");
}

function syncOfflineExpenses() {
    let queue = JSON.parse(localStorage.getItem("offlineExpensesQueue") || "[]");
    if (queue.length === 0) return;
    
    console.log(`Syncing ${queue.length} offline transactions...`);
    showLoader();
    
    fetch("/api/expenses/import", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ transactions: queue })
    })
    .then(res => res.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            localStorage.setItem("offlineExpensesQueue", "[]");
            showToast(`🔄 Synced ${queue.length} offline transactions!`);
            updateDOMStats(data.stats);
        }
    })
    .catch(err => {
        hideLoader();
        console.error("Offline synchronization error:", err);
    });
}

window.addEventListener("online", syncOfflineExpenses);