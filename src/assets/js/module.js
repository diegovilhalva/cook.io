"use strict";

/**
 * Kept for backwards compatibility — no longer used since TheMealDB doesn't
 * provide cooking time data, but harmless to leave here.
 *
 * @param {Number} minute Cooking time
 * @returns {String}
 */
export const getTime = (minute) => {
  const /** {Number} */ hour = Math.floor(minute / 60);
  const /** {Number} */ day = Math.floor(hour / 24);

  const /** {Number} */ time = day || hour || minute;
  const /** {Number} */ unitIndex = [day, hour, minute].lastIndexOf(time);
  const /** {String} */ timeUnit = ["days", "hours", "minutes"][unitIndex];

  return { time, timeUnit };
};

/**
 * TheMealDB returns ingredients/measures as 20 flat fields
 * (strIngredient1..20 / strMeasure1..20) instead of an array. This collapses
 * them into a clean list of "amount + ingredient" strings.
 *
 * @param {Object} meal A meal object from TheMealDB
 * @returns {Array<String>}
 */
export const getMealIngredients = (meal) => {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      const measureText = measure && measure.trim() ? `${measure.trim()} ` : "";
      ingredients.push(`${measureText}${ingredient.trim()}`);
    }
  }

  return ingredients;
};

/**
 * Builds a tag list from category, area (cuisine) and the free-text tags
 * field TheMealDB provides, mirroring the cuisineType/dietLabels/dishType
 * tag chips the Edamam version used.
 *
 * @param {Object} meal A meal object from TheMealDB
 * @returns {Array<{type: "category"|"area"|"tag", value: String}>}
 */
export const getMealTags = (meal) => {
  const tags = [];

  if (meal.strCategory) tags.push({ type: "category", value: meal.strCategory });
  if (meal.strArea) tags.push({ type: "area", value: meal.strArea });

  if (meal.strTags) {
    meal.strTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => tags.push({ type: "tag", value: tag }));
  }

  return tags;
};