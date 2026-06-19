"use strict";

import { fetchData } from "./api.js";
import { $skeletonCard } from "./global.js";

/**
 * Accordion
 */

const $accordions = document.querySelectorAll("[data-accordion]");

const initAccordion = function ($element) {
  const $button = $element.querySelector("[data-accordion-btn]");

  let isExpanded = false;
  $button.addEventListener("click", function () {
    isExpanded = !isExpanded;
    this.setAttribute("aria-expanded", isExpanded);
  });
};

$accordions.forEach(initAccordion);

/**
 * Filter bar toggle for mobile screen
 */

const $filterBar = document.querySelector("[data-filter-bar]");
const $filterTogglers = document.querySelectorAll("[data-filter-toggler]");
const $overlay = document.querySelector("[data-overlay]");

const toggleFilterBar = () => {
  $filterBar.classList.toggle("active");
  $overlay.classList.toggle("active");
  document.body.style.overflow =
    document.body.style.overflow === "hidden" ? "visible" : "hidden";
};

addEventOnElements($filterTogglers, "click", toggleFilterBar);

/**
 * Filter submit and clear
 *
 * NOTE: TheMealDB's free tier only supports filtering by ONE dimension at a
 * time (name search OR category OR area/cuisine OR ingredient — never a
 * combination). Search, Cuisine, Meal type and Dish type are wired up to
 * real data below (see resolveRequest). Time, Calories, Diet and Health
 * stay in the UI for now but have no effect on results — there's no free
 * data source for them.
 */

const $filterSubmit = document.querySelector("[data-filter-submit]");
const $filterClear = document.querySelector("[data-filter-clear]");
const $filterSearch = document.querySelector("input[type='search']");

const getCheckedCheckboxes = () => $filterBar.querySelectorAll("input:checked");

const buildFilterQueries = () => {
  const $filterCheckBoxes = getCheckedCheckboxes();
  const queries = [];

  if ($filterSearch.value) queries.push(["q", $filterSearch.value]);

  if ($filterCheckBoxes.length) {
    for (const checkbox of $filterCheckBoxes) {
      const key = checkbox.parentElement.parentElement.dataset.filter;
      queries.push([key, checkbox.value]);
    }
  }

  return queries;
};

const updateLocationWithQueries = (queries) => {
  window.location = queries.length
    ? `?${queries.map((query) => query.join("=")).join("&")}`
    : "/recipes.html";
};

$filterSubmit.addEventListener("click", () => {
  const queries = buildFilterQueries();
  updateLocationWithQueries(queries);
});

$filterSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    $filterSubmit.click();
  }
});

$filterClear.addEventListener("click", () => {
  const $filterCheckBoxes = getCheckedCheckboxes();

  $filterCheckBoxes?.forEach((checkbox) => (checkbox.checked = false));
  $filterSearch.value &&= "";
});

const queryStr = window.location.search.slice(1);
const queries = queryStr ? queryStr.split("&").map((i) => i.split("=")) : [];

const $filterCount = document.querySelector("[data-filter-count]");

if (queries.length) {
  $filterCount.style.display = "block";
  $filterCount.innerHTML = queries.length;
} else {
  $filterCount.style.display = "none";
}

queryStr &&
  queryStr.split("&").forEach((i) => {
    const [key, rawValue] = i.split("=");
    const value = decodeURIComponent(rawValue ?? "").replace(/\+/g, " ");

    if (key === "q") {
      $filterBar.querySelector("input[type='search']").value = value;
    } else {
      const $checkbox = $filterBar.querySelector(`[value="${value}"]`);
      if ($checkbox) $checkbox.checked = true;
    }
  });

const $filterBtn = document.querySelector("[data-filter-btn]");

window.addEventListener("scroll", () => {
  $filterBtn.classList[window.scrollY >= 120 ? "add" : "remove"]("active");
});

/**
 * Request recipe and render
 */

const $gridList = document.querySelector("[data-grid-list]");
const $loadMore = document.querySelector("[data-load-more]");

$gridList.innerHTML = $skeletonCard.repeat(12);

const renderRecipe = (meals) => {
  meals.forEach((meal, index) => {
    const { idMeal: recipeId, strMeal: title, strMealThumb: image } = meal;
    const isSaved = window.localStorage.getItem(`cookio-recipe${recipeId}`);

    const $card = document.createElement("div");
    $card.classList.add("card");
    $card.style.animationDelay = `${100 * index}ms`;

    $card.innerHTML = `
        <figure class="card-media img-holder">
          <img
            src="${image}"
            width="195"
            height="195"
            loading="lazy"
            alt="${title}"
            class="img-cover"
          />
        </figure>
        <div class="card-body">
          <h3 class="title-small">
            <a 
              href="./detail.html?recipe=${recipeId}" 
              class="card-link">
              ${title ?? "Untitled"}
            </a>
          </h3>
          <div class="meta-wrapper">
            <button class="icon-btn has-state ${
              isSaved ? "saved" : "removed"
            }" aria-label="Add to save recipes"
            onclick="saveRecipe(this, '${recipeId}')">
              <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
              <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
            </button>
          </div>
        </div>
    `;

    $gridList.appendChild($card);
  });
};

/**
 * TheMealDB only has 14 food categories (Beef, Breakfast, Chicken, Dessert,
 * Goat, Lamb, Miscellaneous, Pasta, Pork, Seafood, Side, Starter, Vegan,
 * Vegetarian) — no concept of meal-time (breakfast/lunch/dinner/snack/
 * teatime) or fine-grained dish type. These maps are the closest available
 * approximation; some values (main course, preps, preserve, drinks,
 * condiments and sauces) fall back to "Miscellaneous" since there's no
 * matching category at all.
 */
const MEAL_CATEGORY_MAP = {
  breakfast: "Breakfast",
  lunch: "Chicken",
  dinner: "Beef",
  snack: "Starter",
  teatime: "Dessert",
};

const DISH_CATEGORY_MAP = {
  "biscuits and cookies": "Dessert",
  bread: "Side",
  cereals: "Breakfast",
  "condiments and sauces": "Miscellaneous",
  desserts: "Dessert",
  drinks: "Miscellaneous",
  "main course": "Miscellaneous",
  pancake: "Breakfast",
  preps: "Miscellaneous",
  preserve: "Miscellaneous",
  salad: "Vegetarian",
  sandwiches: "Side",
  "side dish": "Side",
  soup: "Starter",
  starter: "Starter",
  sweets: "Dessert",
};

/**
 * Maps the current query params to a single TheMealDB request.
 * Supported, in priority order: "q" (search), "cuisineType" (area),
 * "category" (direct category, used by tag links from detail.js/home.js),
 * "mealType" and "dishType" (both mapped to the nearest category above).
 * Time, Calories, Diet and Health checkboxes are still cosmetic — there's
 * no free data source for them.
 */
const resolveRequest = (queries) => {
  const searchEntry = queries.find(([key]) => key === "q");
  if (searchEntry) {
    return {
      endpoint: "https://www.themealdb.com/api/json/v1/1/search.php",
      param: ["s", decodeURIComponent(searchEntry[1]).replace(/\+/g, " ")],
    };
  }

  const cuisineEntry = queries.find(([key]) => key === "cuisineType");
  if (cuisineEntry) {
    return {
      endpoint: "https://www.themealdb.com/api/json/v1/1/filter.php",
      param: ["a", decodeURIComponent(cuisineEntry[1]).replace(/\+/g, " ")],
    };
  }

  const categoryEntry = queries.find(([key]) => key === "category");
  if (categoryEntry) {
    return {
      endpoint: "https://www.themealdb.com/api/json/v1/1/filter.php",
      param: ["c", decodeURIComponent(categoryEntry[1]).replace(/\+/g, " ")],
    };
  }

  const mealEntry = queries.find(([key]) => key === "mealType");
  if (mealEntry) {
    const value = decodeURIComponent(mealEntry[1]).replace(/\+/g, " ");
    return {
      endpoint: "https://www.themealdb.com/api/json/v1/1/filter.php",
      param: ["c", MEAL_CATEGORY_MAP[value] ?? value],
    };
  }

  const dishEntry = queries.find(([key]) => key === "dishType");
  if (dishEntry) {
    const value = decodeURIComponent(dishEntry[1]).replace(/\+/g, " ");
    return {
      endpoint: "https://www.themealdb.com/api/json/v1/1/filter.php",
      param: ["c", DISH_CATEGORY_MAP[value] ?? value],
    };
  }

  // Default: TheMealDB returns its whole free test dataset for s=""
  return {
    endpoint: "https://www.themealdb.com/api/json/v1/1/search.php",
    param: ["s", ""],
  };
};

const { endpoint, param } = resolveRequest(queries);
window.ACCESS_POINT = endpoint;

fetchData([param], (data) => {
  $gridList.innerHTML = "";

  const meals = data.meals ?? [];

  if (meals.length) {
    renderRecipe(meals);
    $loadMore.innerHTML = `<p class="body-medium info-text">No more recipes</p>`;
  } else {
    $loadMore.innerHTML = `<p class="body-medium info-text">No recipe found</p>`;
  }
});

// NOTE: TheMealDB's free tier has no pagination, so the old infinite-scroll
// "load more" behaviour (which relied on Edamam's _links.next) was removed.
// All matching results are rendered in a single request above.