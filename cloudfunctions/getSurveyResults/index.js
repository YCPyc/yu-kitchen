const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Returns today's date as YYYY-MM-DD
function getTodayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.main = async (event, context) => {
  const date = getTodayDate();

  // Fetch all survey submissions for today
  const res = await db.collection("surveys")
    .where({ date })
    .orderBy("createdAt", "asc")
    .get();

  const records = res.data;

  // Group by meal
  const meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  for (const r of records) {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      if (r.meals && r.meals[meal] && r.meals[meal].attending) {
        meals[meal].push({
          name: r.name,
          time: r.meals[meal].time || "",
          food: r.meals[meal].food || "",
        });
      }
    }
  }

  // Deduplicate diners for totalDiners count
  const uniqueNames = new Set(records.map(r => r.name));

  return {
    date,
    meals,
    totalDiners: uniqueNames.size,
  };
};
