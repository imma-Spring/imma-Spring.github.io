// === workout.js ===
document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "workouts";
  const unitKey = "unitPreference";
  const KG_TO_LB = 2.20462;

  const workoutForm = document.getElementById("workout-form");
  const workoutTableBody = document.getElementById("workout-table-body");
  const unitToggleBtn = document.getElementById("unit-toggle");
  const exerciseSelect = document.getElementById("exercise-select");
  const ctx = document.getElementById("progressChart").getContext("2d");

  let workouts = JSON.parse(localStorage.getItem(storageKey)) || [];
  let unit = localStorage.getItem(unitKey) || "kg";
  let chart = null;
  let lastDate = new Date().toISOString().split("T")[0]; // for defaulting the date input

  updateUnitLabels();
  renderTable();
  updateExerciseDropdown();

  // --- Add Workout ---
  workoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const dateInput = document.getElementById("date");
    const exercise = document.getElementById("exercise").value.trim();
    const sets = parseInt(document.getElementById("sets").value, 10);
    const reps = parseInt(document.getElementById("reps").value, 10);
    const weight = parseFloat(document.getElementById("weight").value);

    if (!exercise || isNaN(sets) || isNaN(reps) || isNaN(weight)) return;

    const date = dateInput.value || lastDate;
    lastDate = date; // keep this as "preset" for next entry

    const newWorkout = {
      date,
      exercise,
      sets: [{ sets, reps, weight }]
    };

    workouts.push(newWorkout);
    localStorage.setItem(storageKey, JSON.stringify(workouts));

    renderTable();
    updateExerciseDropdown();

    // Reset fields, keep date preset
    workoutForm.reset();
    dateInput.value = lastDate;
  });

  // --- Toggle Units ---
  unitToggleBtn.addEventListener("click", () => {
    unit = (unit === "kg") ? "lb" : "kg";
    localStorage.setItem(unitKey, unit);
    updateUnitLabels();
    renderTable();
    if (exerciseSelect.value) renderChart(exerciseSelect.value);
  });

  // --- Exercise Dropdown Change ---
  exerciseSelect.addEventListener("change", (e) => {
    renderChart(e.target.value);
  });

  // --- Render Table ---
  function renderTable() {
    workoutTableBody.innerHTML = "";

    workouts.forEach((w, idx) => {
      const tr = document.createElement("tr");

      const total = w.sets.reduce((sum, s) => sum + (s.sets * s.reps * s.weight), 0);
      const convertedTotal = convertWeight(total);

      tr.innerHTML = `
        <td>${w.date}</td>
        <td>${w.exercise}</td>
        <td>${w.sets.map(s => `${s.sets}x${s.reps} @ ${convertWeight(s.weight)} ${unit}`).join("<br>")}</td>
        <td>${convertedTotal} ${unit} total</td>
        <td><button class="delete-btn" data-index="${idx}">❌</button></td>
      `;

      workoutTableBody.appendChild(tr);
    });

    // Add delete button listeners
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        workouts.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(workouts));
        renderTable();
        updateExerciseDropdown();
        if (exerciseSelect.value) renderChart(exerciseSelect.value);
      });
    });
  }

  // --- Update Exercise Dropdown ---
  function updateExerciseDropdown() {
    const exercises = [...new Set(workouts.map(w => w.exercise))];
    exerciseSelect.innerHTML = `<option value="">-- Select Exercise --</option>`;
    exercises.forEach(ex => {
      const opt = document.createElement("option");
      opt.value = ex;
      opt.textContent = ex;
      exerciseSelect.appendChild(opt);
    });
  }

  // --- Render Chart ---
  function renderChart(exercise) {
    const exerciseData = workouts
      .filter(w => w.exercise === exercise)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (exerciseData.length === 0) {
      if (chart) chart.destroy();
      return;
    }

    const labels = exerciseData.map(w => w.date);
    const values = exerciseData.map(w => {
      return w.sets.reduce((sum, s) => sum + (s.sets * s.reps * s.weight), 0);
    }).map(convertWeight);

    const minValue = Math.min(...values);
    const suggestedMin = Math.floor(minValue / 10) * 10;

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: `${exercise} progression (${unit})`,
          data: values,
          borderColor: "blue",
          fill: false,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            suggestedMin: suggestedMin,
            ticks: {
              stepSize: 10
            },
            title: {
              display: true,
              text: `Total Volume (${unit})`
            }
          }
        }
      }
    });
  }

  // --- Helpers ---
  function convertWeight(value) {
    return unit === "kg" ? +(value).toFixed(1) : +(value * KG_TO_LB).toFixed(1);
  }

  function updateUnitLabels() {
    unitToggleBtn.textContent = `Switch to ${unit === "kg" ? "lb" : "kg"}`;
    document.getElementById("weight-label").textContent = `Weight (${unit})`;
  }
});

