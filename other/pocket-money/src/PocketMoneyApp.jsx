import React, { useState, useEffect } from "react";

// --- Backend config ---
const BACKEND_URL = "/api/state";

// Normalise to start of day
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Key like "2025-02-03"
function dateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

// Mondays from beginning of this year up to the current week, most recent first
function getMondaysThisYearUpToCurrentWeek() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const currentMonday = startOfDay(now);
  const day = currentMonday.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift so Monday is first day
  currentMonday.setDate(currentMonday.getDate() + diff);

  const mondays = [];
  let cursor = new Date(currentMonday);

  while (cursor.getFullYear() === currentYear) {
    mondays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 7);
  }

  return mondays;
}

const DEFAULT_CHILDREN = [
  { id: "thea", name: "Thea", withdrawals: [] },
  { id: "eddie", name: "Eddie", withdrawals: [] },
  { id: "james", name: "James", withdrawals: [] },
];

function PocketMoneyApp() {
  // Three fixed children as columns
  const [children, setChildren] = useState(DEFAULT_CHILDREN);

  // Mondays (rows), most recent first
  const [weeks, setWeeks] = useState([]);

  // childId -> { dateKey -> didChores }
  const [choreStatus, setChoreStatus] = useState({});

  // Same weekly allowance for each child
  const [weeklyAmount, setWeeklyAmount] = useState(5);

  // Pending withdrawal input per child
  const [pendingWithdrawal, setPendingWithdrawal] = useState({});

  // Load persisted state from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(BACKEND_URL);
        if (!res.ok) return;
        const data = await res.json();

        if (data.children) setChildren(data.children);
        if (data.choreStatus) setChoreStatus(data.choreStatus);
        if (typeof data.weeklyAmount === "number") {
          setWeeklyAmount(data.weeklyAmount);
        }
      } catch (e) {
        console.error("Failed to load backend state", e);
      }
    }

    load();
  }, []);

  // Weeks are derived from the calendar year
  useEffect(() => {
    setWeeks(getMondaysThisYearUpToCurrentWeek());
  }, []);

  // Persist key state to backend whenever it changes
  useEffect(() => {
    async function save() {
      try {
        await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            children,
            choreStatus,
            weeklyAmount,
          }),
        });
      } catch (e) {
        console.error("Failed to save backend state", e);
      }
    }

    save();
  }, [children, choreStatus, weeklyAmount]);

  const toggleChores = (childId, weekDate) => {
    const key = dateKey(weekDate);
    setChoreStatus((prev) => {
      const childMap = prev[childId] || {};
      const current = !!childMap[key];

      return {
        ...prev,
        [childId]: {
          ...childMap,
          [key]: !current,
        },
      };
    });
  };

  const addWithdrawal = (childId) => {
    const child = children.find((c) => c.id === childId);
    if (!child) return;

    const raw = pendingWithdrawal[childId];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) return;

    setChildren((prev) =>
      prev.map((c) =>
        c.id === childId
          ? {
              ...c,
              withdrawals: [
                ...c.withdrawals,
                { id: crypto.randomUUID(), amount },
              ],
            }
          : c
      )
    );

    // Clear the input for that child
    setPendingWithdrawal((prev) => ({ ...prev, [childId]: "" }));
  };

  const totalEarnedForChild = (childId) => {
    const map = choreStatus[childId] || {};
    let weeksWithChores = 0;

    weeks.forEach((week) => {
      const key = dateKey(week);
      if (map[key]) {
        weeksWithChores += 1;
      }
    });

    return weeksWithChores * weeklyAmount;
  };

  const totalWithdrawnForChild = (child) =>
    child.withdrawals.reduce((sum, w) => sum + w.amount, 0);

  const owedForChild = (child) =>
    totalEarnedForChild(child.id) - totalWithdrawnForChild(child);

  const formatWeek = (date) =>
    date.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-2">Pocket Money Tracker</h1>

      {/* Weekly amount control */}
      <div className="p-4 rounded-2xl shadow bg-white inline-flex items-center gap-3">
        <label className="font-semibold" htmlFor="weekly-amount">
          Weekly amount per child (£)
        </label>
        <input
          id="weekly-amount"
          type="number"
          min={0}
          className="p-2 rounded border w-24"
          value={weeklyAmount}
          onChange={(e) => setWeeklyAmount(Number(e.target.value) || 0)}
        />
      </div>

      {/* Per-child money summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {children.map((child) => {
          const earned = totalEarnedForChild(child.id);
          const withdrawn = totalWithdrawnForChild(child);
          const owed = owedForChild(child);

          return (
            <div
              key={child.id}
              className="p-4 rounded-2xl shadow bg-white space-y-2"
            >
              <div className="flex justify-between items-center mb-1 gap-2">
                <div className="font-semibold">{child.name}</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    className="p-1 rounded border w-20 text-xs"
                    placeholder="£"
                    value={pendingWithdrawal[child.id] ?? ""}
                    onChange={(e) =>
                      setPendingWithdrawal((prev) => ({
                        ...prev,
                        [child.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="px-2 py-1 text-xs rounded-lg bg-red-600 text-white"
                    onClick={() => addWithdrawal(child.id)}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>Earned: £{earned.toFixed(2)}</div>
              <div>Withdrawn: £{withdrawn.toFixed(2)}</div>
              <div className="font-semibold">Owed: £{owed.toFixed(2)}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: weeks x children */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100 text-left">Week starting</th>
              {children.map((child) => (
                <th
                  key={child.id}
                  className="border p-2 bg-gray-100 text-center"
                >
                  {child.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={dateKey(week)}>
                <td className="border p-2 font-medium whitespace-nowrap">
                  {formatWeek(week)}
                </td>
                {children.map((child) => {
                  const key = dateKey(week);
                  const checked = !!choreStatus[child.id]?.[key];

                  return (
                    <td
                      key={child.id + key}
                      className="border p-2 text-center align-middle"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChores(child.id, week)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PocketMoneyApp;
