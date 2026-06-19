/**
 * Cook.io — Data layer
 * Originally built against the Edamam Recipe Search API.
 * Migrated to TheMealDB (https://www.themealdb.com/api.php), which has a
 * genuinely free, client-side-friendly tier (test key "1").
 */

"use strict";

// Base URL. Individual files override window.ACCESS_POINT before calling
// fetchData() to hit the right TheMealDB endpoint (search.php, filter.php,
// lookup.php, etc).
window.ACCESS_POINT = "https://www.themealdb.com/api/json/v1/1/search.php";

/**
 * @param {Array<[string, string]>} queries Array of [key, value] query pairs
 * @param {Function} successCallback Success callback function
 */
export const fetchData = async function (queries, successCallback) {
  const params = new URLSearchParams();

  queries?.forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, value);
  });

  const queryStr = params.toString();
  const url = `${ACCESS_POINT}${queryStr ? `?${queryStr}` : ""}`;

  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
    successCallback(data);
  }
};