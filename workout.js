document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "workouts";
  const unitKey = "unitPreference";
  const KG_TO_LB = 2.20462;

  const workoutForm = document.getElementById("workout-form");
  const workoutTableBody = document.getElementById("workout-table-body");
  const unitToggleBtn = document.getElementById("unit-toggle");
  const exerciseSelect = document.getElementById("exercise-select");
  const ctx = document.getElementById("progressChart")?.getContext("2d");

  const dateInput = document.getElementById("date");
  const exerciseInput = document.getElementById("exercise");
  const repsInput = document.getElementById("reps");
  const weightInput = document.getElementById("weight");
  const weightUnitSpan = document.getElementById("weight-unit");
  const pendingSetsUl = document.getElementById("pending-sets");
  const addSetBtn = document.getElementById("add-set");

  let workouts = JSON.parse(localStorage.getItem(storageKey)) || [];
  let unit = localStorage.getItem(unitKey) || "kg";
  let pendingSets = [];
  let chart = null;
  let lastDate = new Date().toISOString().split("T")[0];

  dateInput.value = lastDate;
  updateUnitLabels();
  renderTable();
  updateExerciseDropdown();

  // --- Add a single set to pending ---
  addSetBtn?.addEventListener("click", () => {
    const reps = parseInt(repsInput.value, 10);
    let weight = parseFloat(weightInput.value);
    if (!reps || isNaN(weight)) return;

    // Convert input to kg if currently in lbs
    if (unit === "lb") weight = weight / KG_TO_LB;

    const set = { reps, weight };
    pendingSets.push(set);
    renderPendingSets();

    repsInput.value = "";
    weightInput.value = "";
  });

  // --- Save workout ---
  workoutForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const exercise = exerciseInput.value.trim();
    const date = dateInput.value || lastDate;
    lastDate = date;

    if (!exercise || pendingSets.length === 0) return;

    const newWorkout = {
      date,
      exercise,
      sets: [...pendingSets] // stored internally in kg
    };

    workouts.push(newWorkout);
    localStorage.setItem(storageKey, JSON.stringify(workouts));

    pendingSets = [];
    pendingSetsUl.innerHTML = "";
    workoutForm.reset();
    dateInput.value = lastDate;

    renderTable();
    updateExerciseDropdown();
    if (exerciseSelect.value) renderChart(exerciseSelect.value);
  });

  // --- Toggle units ---
  unitToggleBtn?.addEventListener("click", () => {
    unit = unit === "kg" ? "lb" : "kg";
    localStorage.setItem(unitKey, unit);

    // Convert current pending weight input
    if (weightInput.value) {
      let val = parseFloat(weightInput.value);
      if (!isNaN(val)) {
        weightInput.value = unit === "kg" ? (val / KG_TO_LB).toFixed(1) : (val * KG_TO_LB).toFixed(1);
      }
    }

    renderPendingSets();
    updateUnitLabels();
    renderTable();
    if (exerciseSelect.value) renderChart(exerciseSelect.value);
  });

  // --- Exercise dropdown change ---
  exerciseSelect?.addEventListener("change", (e) => {
    renderChart(e.target.value);
  });

  // --- Render Table ---
  function renderTable() {
    if (!workoutTableBody) return;
    workoutTableBody.innerHTML = "";

    workouts.forEach((w, idx) => {
      const tr = document.createElement("tr");
      const total = w.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
      const convertedTotal = convertWeight(total);

      tr.innerHTML = `
        <td>${w.date}</td>
        <td>${w.exercise}</td>
        <td>${w.sets.map(s => `${s.reps} reps @ ${convertWeight(s.weight)} ${unit}`).join("<br>")}</td>
        <td>${convertedTotal} ${unit} total</td>
        <td><button class="delete-btn" data-index="${idx}">❌</button></td>
      `;
      workoutTableBody.appendChild(tr);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = parseInt(e.target.dataset.index, 10);
        workouts.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(workouts));
        renderTable();
        updateExerciseDropdown();
        if (exerciseSelect.value) renderChart(exerciseSelect.value);
      });
    });
  }

  // --- Render Pending Sets ---
  function renderPendingSets() {
    pendingSetsUl.innerHTML = "";
    pendingSets.forEach((s, i) => {
      const li = document.createElement("li");
      li.textContent = `${s.reps} reps @ ${convertWeight(s.weight)} ${unit}`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        pendingSets.splice(i, 1);
        renderPendingSets();
      });
      li.appendChild(removeBtn);
      pendingSetsUl.appendChild(li);
    });
  }

  // --- Update Exercise Dropdown ---
  function updateExerciseDropdown() {
    if (!exerciseSelect) return;
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
    if (!ctx) return;
    const data = workouts
      .filter(w => w.exercise === exercise)
      .sort((a,b) => new Date(a.date) - new Date(b.date));

    if (data.length === 0) {
      if (chart) chart.destroy();
      return;
    }

    const labels = data.map(w => w.date);
    const values = data.map(w => w.sets.reduce((sum,s) => sum + s.reps * s.weight,0)).map(convertWeight);

    const minVal = Math.min(...values);
    const suggestedMin = Math.floor(minVal / 10) * 10;

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
            suggestedMin,
            ticks: { stepSize: 10 },
            title: { display: true, text: `Total Volume (${unit})` }
          }
        }
      }
    });
  }

  // --- Helpers ---
  function convertWeight(value) {
    return unit === "kg" ? +value.toFixed(1) : +(value * KG_TO_LB).toFixed(1);
  }

  function updateUnitLabels() {
    unitToggleBtn.textContent = `Switch to ${unit === "kg" ? "lb" : "kg"}`;
    if (weightUnitSpan) weightUnitSpan.textContent = unit;
    const weightLabel = document.getElementById("weight-label");
    if (weightLabel) weightLabel.textContent = `Weight (${unit})`;
  }
});

