"use strict";

import { fetchData } from "./api.js";

/**
 *
 * @param {NodeList} $elements NodeList
 * @param {String} eventType Event type string
 * @param {Function} callback Callback function
 */

window.addEventOnElements = ($elements, eventType, callback) => {
  for (const $element of $elements) {
    $element.addEventListener(eventType, callback);
  }
};

/**
 * Skeleton card
 */
export const /** {String} */ $skeletonCard = `
<div class="card skeleton-card">

        <div class="skeleton card-banner"></div>

            <div class="card-body">
              <div class="skeleton card-title">
            </div>

            <div class="skeleton card-text"></div>
        </div>

</div>
`;

const /** {String} */ LOOKUP_ENDPOINT =
    "https://www.themealdb.com/api/json/v1/1/lookup.php";

window.saveRecipe = function (element, recipeId) {
  const /** {String} */ isSaved = window.localStorage.getItem(
      `cookio-recipe${recipeId}`
    );

  if (!isSaved) {
    window.ACCESS_POINT = LOOKUP_ENDPOINT;

    fetchData([["i", recipeId]], function (data) {
      const meal = data.meals?.[0];

      if (!meal) return;

      window.localStorage.setItem(
        `cookio-recipe${recipeId}`,
        JSON.stringify(meal)
      );
      element.classList.toggle("saved");
      element.classList.toggle("removed");
      showNotification("Added to Recipe book");
    });
  } else {
    window.localStorage.removeItem(`cookio-recipe${recipeId}`);
    element.classList.toggle("saved");
    element.classList.toggle("removed");
    showNotification("Removed from Recipe book");
  }
};

const /** {NodeElement} */ $snackbarContainer = document.createElement("div");
$snackbarContainer.classList.add("snackbar-container");
document.body.appendChild($snackbarContainer);

function showNotification(message) {
  const /** {NodeElement} */ $snackbar = document.createElement("div");
  $snackbar.classList.add("snackbar");
  $snackbar.innerHTML = ` <p class="body-medium">${message}</p>`;
  $snackbarContainer.appendChild($snackbar);
  $snackbar.addEventListener("animationend", (e) =>
    $snackbarContainer.removeChild($snackbar)
  );
}