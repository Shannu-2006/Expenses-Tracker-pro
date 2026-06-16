function searchExpenses() {

    let searchValue =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    let categoryValue =
        document.getElementById("categoryFilter")
        .value
        .toLowerCase();

    let rows =
        document.querySelectorAll(".expense-row");

    rows.forEach(row => {

        let expenseName =
            row.dataset.name.toLowerCase();

        let expenseCategory =
            row.dataset.category.toLowerCase();

        let matchesSearch =
            expenseName.includes(searchValue);

        let matchesCategory =
            categoryValue === "all" ||
            expenseCategory === categoryValue;

        if (matchesSearch && matchesCategory) {
            row.style.display = "";
        }
        else {
            row.style.display = "none";
        }

    });

}

function confirmDelete() {

    return confirm(
        "Are you sure you want to delete this expense?"
    );

}

function openEditModal(id, name, amount, category) {

    document.getElementById("editModal").style.display = "block";

    document.getElementById("editName").value = name;
    document.getElementById("editAmount").value = amount;
    document.getElementById("editCategory").value = category;

    document.getElementById("editForm").action =
        "/update/" + id;

}

function closeEditModal() {

    document.getElementById("editModal").style.display = "none";

}

window.onclick = function(event) {

    let modal =
        document.getElementById("editModal");

    if (event.target === modal) {
        modal.style.display = "none";
    }

}

function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        localStorage.setItem(
            "theme",
            "dark"
        );

    }
    else {

        localStorage.setItem(
            "theme",
            "light"
        );

    }

}

window.onload = function() {

    let savedTheme =
        localStorage.getItem("theme");

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    }

    createExpenseChart();
    createBarChart();

}

function createExpenseChart() {

    const chartCanvas =
        document.getElementById("expenseChart");

    if (!chartCanvas) {
        return;
    }

    const food =
        Number(chartValues[0]);

    const travel =
        Number(chartValues[1]);

    const rent =
        Number(chartValues[2]);

    const shopping =
        Number(chartValues[3]);

    const fun =
        Number(chartValues[4]);

    const other =
        Number(chartValues[5]);

    new Chart(chartCanvas, {

        type: "pie",

        data: {

            labels: chartLabels,

            datasets: [{

                data: [
                    food,
                    travel,
                    rent,
                    shopping,
                    fun,
                    other
                ],

                backgroundColor: [
                    "#16a34a",
                    "#2563eb",
                    "#dc2626",
                    "#9333ea",
                    "#f97316",
                    "#6b7280"
                ]

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}
function createBarChart() {

    const chartCanvas =
        document.getElementById("barChart");

    if (!chartCanvas) {
        return;
    }

    new Chart(chartCanvas, {

        type: "bar",

        data: {

            labels: chartLabels,

            datasets: [{

                label: "Amount Spent",

                data: chartValues,

                backgroundColor: [
                    "#16a34a",
                    "#2563eb",
                    "#dc2626",
                    "#9333ea",
                    "#f97316",
                    "#6b7280"
                ]

            }]

        },

        options: {

            responsive: true,

            scales: {

                y: {
                    beginAtZero: true
                }

            }

        }

    });

}