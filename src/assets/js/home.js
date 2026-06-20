"use strict";

/**
 * IMPORT
 */
import { fetchData } from "./api.js";
import { $skeletonCard } from "./global.js";

// Home Page Search

const /**{NodeElement}*/ $searchField = document.querySelector("[data-search-field]");
const /** {NodeElement} */ $searchBtn = document.querySelector("[data-search-btn]");

$searchBtn.addEventListener("click", function () {
  if ($searchField.value) window.location = `/recipes.html?q=${$searchField.value}`;
});

/**
 * Search Submit when press "Enter" key
 */

$searchField.addEventListener("keydown", (e) => {
  if (e.key == "Enter") $searchBtn.click();
});

/**
 * Tab Pannel Navigation
 */

const /** [NodeList] */ $tabBtns = document.querySelectorAll("[data-tab-btn]");
const /** [NodeList] */ $tabPanels = document.querySelectorAll("[data-tab-panel]");

let /** NodeElement */ [$lastActiveTabPanel] = $tabPanels;
let /** NodeElement */ [$lastActiveTabBtn] = $tabBtns;

addEventOnElements($tabBtns, "click", function () {
  $lastActiveTabPanel.setAttribute("hidden", "");
  $lastActiveTabBtn.setAttribute("aria-selected", false);
  $lastActiveTabBtn.setAttribute("tabindex", -1);

  const /** {NodeElement} */ $currentTabPanel = document.querySelector(
      `#${this.getAttribute("aria-controls")}`
    );

  $currentTabPanel.removeAttribute("hidden");

  this.setAttribute("aria-selected", true);
  this.setAttribute("tabindex", 0);

  $lastActiveTabPanel = $currentTabPanel;
  $lastActiveTabBtn = this;

  addTabContent(this, $currentTabPanel);
});

/**
 * Navigate Tab with arrow key
 */

addEventOnElements($tabBtns, "keydown", function (e) {
  const /** {NodeElement} */ $nextElement = this.nextElementSibling;
  const /** {NodeElement} */ $previousElement = this.previousElementSibling;

  if (e.key === "ArrowRight" && $nextElement) {
    this.setAttribute("tabindex", -1);
    $nextElement.setAttribute("tabindex", 0);
    $nextElement.focus();
  } else if (e.key === "ArrowLeft" && $previousElement) {
    this.setAttribute("tabindex", -1);
    $previousElement.setAttribute("tabindex", 0);
    $previousElement.focus();
  } else if (e.key === "Tab") {
    this.setAttribute("tabindex", -1);
    $lastActiveTabBtn.setAttribute("tabindex", 0);
  }
});

/**
 * WORK WITH API
 * fetch data for tab content
 *
 * NOTE: TheMealDB has no breakfast/lunch/dinner/snack/teatime concept like
 * Edamam's mealType — only food categories (Beef, Chicken, Dessert, etc).
 * These are the closest approximations available on the free tier; swap
 * them out later if you want a more accurate mapping.
 */

const TAB_CATEGORY_MAP = {
  Breakfast: "Breakfast",
  Lunch: "Chicken",
  Dinner: "Beef",
  Snack: "Starter",
  Teatime: "Dessert",
};

const addTabContent = ($currentTabBtn, $currentTabPanel) => {
  const /** {NodeElement} */ $gridList = document.createElement("div");
  $gridList.classList.add("grid-list");

  $currentTabPanel.innerHTML = `
    <div class="grid-list">
    ${$skeletonCard.repeat(12)}
    </div>
    `;

  const tabLabel = $currentTabBtn.textContent.trim();
  const category = TAB_CATEGORY_MAP[tabLabel] ?? tabLabel;

  window.ACCESS_POINT = "https://www.themealdb.com/api/json/v1/1/filter.php";

  fetchData([["c", category]], function (data) {
    $currentTabPanel.innerHTML = "";

    const meals = (data.meals ?? []).slice(0, 12);

    meals.forEach((meal, i) => {
      const { idMeal: recipeId, strMeal: title, strMealThumb: image } = meal;

      const /** {undefined || String} */ isSaved = window.localStorage.getItem(
          `cookio-recipe${recipeId}`
        );

      const /** {NodeElement} */ $card = document.createElement("div");
      $card.classList.add("card");
      $card.style.animationDelay = `${100 * i}ms`;

      $card.innerHTML = `
            <figure class="card-media img-holder">
            <img src="${image}" width="195" height="195" loading="lazy" alt="${title}" class="img-cover">
          </figure>

          <div class="card-body">

            <h3 class="title-small">
              <a href="./detail.html?recipe=${recipeId}" class="card-link">${title ?? "Untitled"}</a>
            </h3>
            
            <div class="meta-wrapper">

              <button class="icon-btn has-state ${
                isSaved ? "saved" : "removed"
              }" aria-label="Add to saved recipes" onclick="saveRecipe(this, '${recipeId}')">
                <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
                <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
              </button>

            </div>

          </div>
            `;
      $gridList.appendChild($card);
    });

    $currentTabPanel.appendChild($gridList);

    $currentTabPanel.innerHTML += `
        <a href="./recipes.html?category=${category.toLowerCase()}" 
        class="btn btn-secondary label-large has-state">Show more</a>
        `;
  });
};

addTabContent($lastActiveTabBtn, $lastActiveTabPanel);

/**
 * Fetch data for slider card
 */

let /** {Array} */ cuisineType = ["Italian", "Mexican"];

const /** {NodeList} */ $sliderSections = document.querySelectorAll("[data-slider-section]");

for (const [index, $sliderSection] of $sliderSections.entries()) {
  $sliderSection.innerHTML = `
  
  <div class="container">

  <h2 class="section-title headline-small" id="slider-label-1">Latest ${cuisineType[index]} Recipes</h2>
  
  <div class="slider">

  <ul class="slider-wrapper" data-slider-wrapper>
  ${`<li class="slider-item">${$skeletonCard}</li>`.repeat(10)}
  </ul>

  </div>

  </div>
  `;

  const /** {NodeElement} */ $sliderWrapper = $sliderSection.querySelector(
      "[data-slider-wrapper]"
    );

  window.ACCESS_POINT = "https://www.themealdb.com/api/json/v1/1/filter.php";

  fetchData([["a", cuisineType[index]]], function (data) {
    $sliderWrapper.innerHTML = "";

    const meals = (data.meals ?? []).slice(0, 10);

    meals.forEach((meal) => {
      const { idMeal: recipeId, strMeal: title, strMealThumb: image } = meal;

      const /** {undefined || String} */ isSaved = window.localStorage.getItem(
          `cookio-recipe${recipeId}`
        );

      const /** {NodeElement} */ $sliderItem = document.createElement("li");
      $sliderItem.classList.add("slider-item");

      $sliderItem.innerHTML = `
                <div class="card">

                <figure class="card-media img-holder">
                <img src="${image}" width="195" height="195" loading="lazy" alt="${title}" class="img-cover">
              </figure>
    
              <div class="card-body">
    
                <h3 class="title-small">
                  <a href="./detail.html?recipe=${recipeId}" class="card-link">${title ?? "Untitled"}</a>
                </h3>
                
                <div class="meta-wrapper">

                  <button class="icon-btn has-state ${
                    isSaved ? "saved" : "removed"
                  }" aria-label="Add to saved recipes" onclick="saveRecipe(this, '${recipeId}')">
                    <span class="material-symbols-outlined bookmark-add" aria-hidden="true">bookmark_add</span>
                    <span class="material-symbols-outlined bookmark" aria-hidden="true">bookmark</span>
                  </button>
    
                </div>
    
              </div>
      
                </div>
      `;

      $sliderWrapper.appendChild($sliderItem);
    });

    $sliderWrapper.innerHTML += `
    <li class="slider-item" data-slider-item>
    <a href="./recipes.html?cuisineType=${cuisineType[index].toLowerCase()}" class="load-more-card has-state">
      <span class="label-large">Show more</span>

      <span class="material-symbols-outlined" aria-hidden="true">navigate_next</span>
    </a>
    </li>
    `;
  });
}