const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Returns YYYY-MM-DD for a given offset from today
function getDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function groupRecords(records) {
  const meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
  };

  for (const record of records) {
    for (const meal of ["breakfast", "lunch", "dinner"]) {
      if (record.meals && record.meals[meal] && record.meals[meal].attending) {
        meals[meal].push({
          name: record.name,
          time: record.meals[meal].time || "",
          food: record.meals[meal].food || "",
        });
      }
    }
  }

  const uniqueNames = new Set(records.map(record => record.name));

  return {
    meals,
    totalDiners: uniqueNames.size,
  };
}

exports.main = async (event, context) => {
  const today = getDateString(0);
  const tomorrow = getDateString(1);

  const [todayRes, tomorrowRes] = await Promise.all([
    db.collection("surveys")
      .where({ date: today })
      .orderBy("createdAt", "asc")
      .get(),
    db.collection("surveys")
      .where({ date: tomorrow })
      .orderBy("createdAt", "asc")
      .get(),
  ]);

  return {
    days: {
      today: {
        date: today,
        ...groupRecords(todayRes.data),
      },
      tomorrow: {
        date: tomorrow,
        ...groupRecords(tomorrowRes.data),
      },
    },
  };
};
