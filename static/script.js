/* ==========================================================================
   Expense Tracker Pro - Modern Client Interactions
   ========================================================================== */

let expenseChart = null;
let categoryBarChart = null;
let monthlyTrendChartObj = null;
let weeklyTrendChartObj = null;
let comparisonChartObj = null;
let yearlyChartObj = null;

// Pagination variables
let currentPage = 1;
const itemsPerPage = 10;
let visibleRows = [];

// Loading spinner controls
function showLoader() {
    const loader = document.getElementById("loadingOverlay");
    if (loader) {
        loader.style.display = "flex";
    }
}

function hideLoader() {
    const loader = document.getElementById("loadingOverlay");
    if (loader) {
        loader.style.display = "none";
    }
}

// Search and Advanced Filters (Version 5.7)
function searchExpenses() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const categoryValue = document.getElementById("categoryFilter").value.toLowerCase();
    
    // Range Filters
    const dateStart = document.getElementById("dateStartFilter").value;
    const dateEnd = document.getElementById("dateEndFilter").value;
    const amountMinVal = document.getElementById("amountMinFilter").value;
    const amountMaxVal = document.getElementById("amountMaxFilter").value;
    
    const amountMin = amountMinVal !== "" ? Number(amountMinVal) : null;
    const amountMax = amountMaxVal !== "" ? Number(amountMaxVal) : null;

    const rows = document.querySelectorAll(".expense-row");
    visibleRows = []; // Reset visible rows

    rows.forEach(row => {
        const expenseName = row.dataset.name.toLowerCase();
        const expenseCategory = row.dataset.category.toLowerCase();
        const expenseDate = row.dataset.date || "";
        const expenseAmount = Number(row.dataset.amount) || 0;

        // 1. Text & Category Matches
        const matchesSearch = expenseName.includes(searchValue);
        const matchesCategory = categoryValue === "all" || expenseCategory === categoryValue;

        // 2. Date Range Matches
        let matchesDate = true;
        if (expenseDate) {
            if (dateStart && expenseDate < dateStart) matchesDate = false;
            if (dateEnd && expenseDate > dateEnd) matchesDate = false;
        } else if (dateStart || dateEnd) {
            matchesDate = false; // No date value but a filter is set
        }

        // 3. Amount Range Matches
        let matchesAmount = true;
        if (amountMin !== null && expenseAmount < amountMin) matchesAmount = false;
        if (amountMax !== null && expenseAmount > amountMax) matchesAmount = false;

        // If passes all filters, add to visible list
        if (matchesSearch && matchesCategory && matchesDate && matchesAmount) {
            visibleRows.push(row);
        } else {
            row.style.display = "none";
        }
    });

    currentPage = 1;
    applyPagination();
}

// Reset filters
function clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "all";
    document.getElementById("dateStartFilter").value = "";
    document.getElementById("dateEndFilter").value = "";
    document.getElementById("amountMinFilter").value = "";
    document.getElementById("amountMaxFilter").value = "";
    searchExpenses();
}

// Client-side Pagination Renderer
function applyPagination() {
    const totalPages = Math.ceil(visibleRows.length / itemsPerPage) || 1;

    // Boundary protection
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    // Toggle pagination bar visibility
    const pagBar = document.getElementById("paginationBar");
    if (pagBar) {
        pagBar.style.display = visibleRows.length > itemsPerPage ? "flex" : "none";
    }

    // Hide all table rows first
    const rows = document.querySelectorAll(".expense-row");
    rows.forEach(r => r.style.display = "none");

    // Display rows for the active page index
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;

    for (let i = startIdx; i < endIdx && i < visibleRows.length; i++) {
        visibleRows[i].style.display = "";
    }

    // Update pagination labels
    const info = document.getElementById("paginationInfo");
    if (info) {
        info.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Disable buttons at boundaries
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
}

function changePage(direction) {
    currentPage += direction;
    applyPagination();
}

// Confirmation Dialog for Delete
function confirmDelete() {
    return confirm("Are you sure you want to delete this expense? This action cannot be undone.");
}

// Edit Modal Handlers (Version 5.8 Date/Notes)
function openEditModal(id, name, amount, category, date, notes) {
    const modal = document.getElementById("editModal");
    if (!modal) return;

    modal.style.display = "block";
    document.getElementById("editName").value = name;
    document.getElementById("editAmount").value = amount;
    document.getElementById("editCategory").value = category;
    
    // Bind date or default to today
    document.getElementById("editDate").value = date || new Date().toISOString().split('T')[0];
    document.getElementById("editNotes").value = notes || "";
    
    document.getElementById("editForm").action = "/update/" + id;
}

function closeEditModal() {
    const modal = document.getElementById("editModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Global modal click handler to close if clicked outside content
window.onclick = function(event) {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

// Theme management (Light / Dark mode)
function toggleDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    
    // Update theme toggle icon
    const themeIcon = document.querySelector(".theme-icon");
    if (themeIcon) {
        themeIcon.textContent = isDark ? "☀️" : "🌙";
    }

    // Recreate charts to pick up the new colors matching dark mode
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

// Render dynamic Client-side Date
function displayCurrentDate() {
    const dateEl = document.getElementById("currentDate");
    if (!dateEl) return;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString("en-US", options);
}

// Pre-fill form dates to today
function prefillFormDates() {
    const todayStr = new Date().toISOString().split('T')[0];
    const addDateInput = document.getElementById("expenseDate");
    if (addDateInput) {
        addDateInput.value = todayStr;
    }
}

// Animate Budget Progress Bar
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

    // 1. Pie Chart
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

    // 2. Bar Chart
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
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: config.textColor
                        }
                    },
                    y: {
                        grid: {
                            color: config.gridColor
                        },
                        ticks: {
                            color: config.textColor
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 3. Monthly Spending Trend Chart (Line)
    const monthlyCanvas = document.getElementById("monthlyTrendChart");
    if (monthlyCanvas && typeof monthlyValues !== 'undefined') {
        if (monthlyTrendChartObj) monthlyTrendChartObj.destroy();
        monthlyTrendChartObj = new Chart(monthlyCanvas, {
            type: "line",
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: "Monthly Spending (₹)",
                    data: monthlyValues,
                    borderColor: "#4f46e5",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
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

    // 4. Weekly Spending Trend Chart (Bar)
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
                    borderRadius: 4
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
                        borderRadius: 4
                    },
                    {
                        label: `${typeof currentMonthName !== 'undefined' ? currentMonthName : 'This Month'} (₹)`,
                        data: currentMonthValues,
                        backgroundColor: "#4f46e5",
                        borderRadius: 4
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

// Auto-dismiss Flash Message Toast after 4 seconds
function setupFlashDismiss() {
    const toast = document.getElementById("toastMessage");
    if (toast) {
        setTimeout(() => {
            toast.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-10px)";
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }
}

// Window Load Handler
document.addEventListener("DOMContentLoaded", () => {
    loadSavedTheme();
    displayCurrentDate();
    prefillFormDates();
    animateProgressBar();
    
    // Initial search to kick off pagination visible rows lists
    const rows = document.querySelectorAll(".expense-row");
    visibleRows = Array.from(rows);
    applyPagination();
    
    renderCharts();
    setupFlashDismiss();
    
    // Complete loader dismiss
    hideLoader();
});