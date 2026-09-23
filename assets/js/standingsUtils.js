/**
 * Calculate standings ranks with proper tie handling
 * @param {Array} drivers - Array of driver objects with driver, points, wins properties
 * @returns {Array} - Array of driver objects with calculated pos property
 */
function calculateStandingsRanks(drivers) {
  // Sort by points (descending), then by wins (descending), then by driver name (ascending)
  const sorted = [...drivers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.driver.localeCompare(b.driver);
  });

  let currentRank = 1;
  let previousPoints = null;
  let driversAtCurrentRank = 1;

  return sorted.map((driver, index) => {
    // First driver always gets rank 1
    if (index === 0) {
      previousPoints = driver.points;
      return { ...driver, pos: 1 };
    }

    // Check if tied with previous driver
    if (driver.points === previousPoints) {
      driversAtCurrentRank++;
      // Same rank as previous driver
      return { ...driver, pos: currentRank };
    } else {
      // Not tied - calculate new rank by skipping tied positions
      currentRank = currentRank + driversAtCurrentRank;
      previousPoints = driver.points;
      driversAtCurrentRank = 1;
      return { ...driver, pos: currentRank };
    }
  });
}
