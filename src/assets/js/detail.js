"use strict";

/**
 * Import
 */

import { fetchData } from "./api.js";
import { getMealIngredients, getMealTags } from "./module.js";

/**
 * Render data
 */

const $detailContainer = document.querySelector("[data-detail-container]");

const recipeId = window.location.search.slice(
  window.location.search.indexOf("=") + 1
);

window.ACCESS_POINT = "https://www.themealdb.com/api/json/v1/1/lookup.php";

fetchData([["i", recipeId]], (data) => {
  const meal = data.meals?.[0];

  if (!meal) {
    $detailContainer.innerHTML = `<p class="body-large">Recipe not found.</p>`;
    return;
  }

  const {
    idMeal,
    strMeal: title,
    strMealThumb: bannerUrl,
    strCategory: category,
    strArea: area,
    strInstructions: instructions,
    strYoutube: youtube,
  } = meal;

  document.title = `${title} Cook-io`;

  const ingredients = getMealIngredients(meal);
  const tags = getMealTags(meal);

  const isSaved = window.localStorage.getItem(`cookio-recipe${idMeal}`);

  let tagElements = "";

  tags.forEach(({ type, value }) => {
    const filterKey =
      type === "category" ? "category" : type === "area" ? "cuisineType" : "tag";

    tagElements += `
      <a href="./recipes.html?${filterKey}=${value.toLowerCase()}" class="filter-chip label-large has-state">
        ${value}
      </a>`;
  });

  let ingredientItems = "";

  ingredients.forEach((ingredient) => {
    ingredientItems += `<li class="ingr-item">${ingredient}</li>`;
  });

  $detailContainer.innerHTML = `
    <figure class="detail-banner img-holder">
      <img
        src="${bannerUrl}"
        width="600"
        height="600"
        alt="${title}"
        class="img-cover"
      />
    </figure>
    <div class="detail-content">
      <div class="title-wrapper">
        <h1 class="display-small">${title ?? "Untitled"}</h1>
        <button class="btn btn-secondary has-state has-icon 
        ${isSaved ? "saved" : "removed"}"
        onclick="saveRecipe(this, '${idMeal}')">
          <span class="material-symbols-outlined bookmark-add" aria-hidden="true">
            bookmark_add
          </span>
          <span class="material-symbols-outlined bookmark" aria-hidden="true">
            bookmark
          </span>
          <span class="label-large save-text">Saved</span>
          <span class="label-large unsaved-text">Unsaved</span>
        </button>
      </div>
      <div class="detail-author label-large">
        <span class="span">cuisine</span> ${area ?? "Unknown"}
      </div>
      <div class="detail-stats">
        <div class="stats-item">
          <span class="display-medium">${ingredients.length}</span>
          <span class="label-medium">Ingredients</span>
        </div>
        <div class="stats-item">
          <span class="display-medium">${category ?? "-"}</span>
          <span class="label-medium">Category</span>
        </div>
        <div class="stats-item">
          <span class="display-medium">${area ?? "-"}</span>
          <span class="label-medium">Cuisine</span>
        </div>
      </div>
      ${tagElements ? `<div class="tag-list">${tagElements}</div>` : ""}
      <h2 class="title-medium ingr-title">
        Ingredients
      </h2>
      ${
        ingredientItems
          ? `<ul class="body-large ingr-list">
        ${ingredientItems}
      </ul>`
          : ""
      }
      ${
        instructions
          ? `<h2 class="title-medium ingr-title">Instructions</h2>
             <p class="body-large">${instructions.replace(/\r?\n/g, "<br>")}</p>`
          : ""
      }
      ${
        youtube
          ? `<a href="${youtube}" target="_blank" class="btn btn-secondary has-state" style="margin-top:16px;">
              Watch on YouTube
            </a>`
          : ""
      }
    </div>`;
});