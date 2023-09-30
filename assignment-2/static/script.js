document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");

  form.addEventListener("submit", function (event) {
    const fromInput = document.getElementById("from");
    const toInput = document.getElementById("to");

    const fromValue = parseFloat(fromInput.value) || 0;
    const toValue = parseFloat(toInput.value) || 0;

    if (fromValue < 0 || toValue < 0) {
      alert(
        "Price Range values cannot be negative! Please try a value greater than or equal to 0.0"
      );
      event.preventDefault();
      return;
    }

    if (fromValue > toValue) {
      alert(
        "Oops! Lower price limit cannot be greater than upper price limit! Please try again."
      );
      event.preventDefault();
      return;
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const resultsContainer = document.getElementById("results");
  const totalResultsContainer = document.getElementById("totalResults");
  let buttonsContainer = document.createElement("div");
  let showMoreButton = null;
  let showLessButton = null;
  let showMore = false;
  let initialTotalResults = 0;
  let initialKeywords = "";
  let hrElement = null;
  let cachedData = null; // Variable to store cached data

  form.addEventListener("submit", function (event) {
    const formData = new FormData(form);

    fetch("/api/search?" + new URLSearchParams(formData).toString())
      .then((response) => response.json())
      .then((data) => {
        cachedData = data; // Cache the data
        showMore = false; // Reset showMore state
        initialTotalResults = cachedData.total_entries; // Update total entries
        initialKeywords = cachedData.keywords; // Update keywords
        updateResults(); // Update the results using the new data
      })
      .catch((error) => console.error("Error:", error));

    // Prevent the form from actually submitting, as we are handling the submission via AJAX
    event.preventDefault();
  });

  // Add the following line to reset cachedData to null when a new search is initiated
  form.addEventListener("reset", function () {
    cachedData = null;
  });

  function updateResults() {
    const items_info = showMore
      ? cachedData.items_info
      : cachedData.items_info.slice(0, 3);

    totalResultsContainer.textContent = `${initialTotalResults} Results found for `;
    const italicKeywords = document.createElement("i");
    italicKeywords.textContent = initialKeywords;
    totalResultsContainer.appendChild(italicKeywords);

    if (hrElement) {
      hrElement.remove();
    }

    hrElement = document.createElement("hr");
    resultsContainer.appendChild(hrElement);

    resultsContainer.innerHTML = "";
    items_info.forEach((item_info, index) => {
      const isTopRated = item_info["Top_Rated"] == "true";
      console.log(isTopRated);
      const topRatedImage = isTopRated
        ? '<img style="height: 30px; width: 20px;position: absolute; top: -7px;left:5px;" src="https://www.csci571.com/hw/hw6/images/topRatedImage.png" alt="Top Rated">'
        : "";
      const slicedTitle =
        item_info["Title"].length > 50
          ? item_info["Title"].slice(0, 50) + "..."
          : item_info["Title"];
      const itemHtml = `
        <div class="ind_result">
          <div class="item-image-dim">
            <div class="image-container">
              <img id="item-image" src="${
                item_info["Image URL"]
              }" alt="item-image">
            </div>
          </div>
          <div>
            <br>
            <h3>${slicedTitle}</h3>
            <br />
            <p>Category: ${
              item_info["Category"]
            }<a href=""><img style="height: 15px; width: 15px;opacity: 0.5;" src="https://www.csci571.com/hw/hw6/images/redirect.png" alt="redirect"></a></p>
            <br />
            <div style="display:flex;"><p>Condition: ${
              item_info["Condition"]
            } <div style="position:relative;"> ${
        isTopRated ? topRatedImage : ""
      } </div></p></div>
            <br />
            <p><b>Price: $${item_info["Price"]}</b></p>
          </div>
        </div>
      `;

      resultsContainer.innerHTML += itemHtml;
    });

    if (cachedData.items_info.length > 3) {
      if (!buttonsContainer.parentElement) {
        resultsContainer.appendChild(buttonsContainer);
      }

      if (!showMoreButton) {
        showMoreButton = createButton("Show More", toggleResults);
      }

      if (!showLessButton) {
        showLessButton = createButton("Show Less", toggleResults);
      }

      buttonsContainer.innerHTML = "";
      if (showMore) {
        buttonsContainer.appendChild(showLessButton);
      } else {
        buttonsContainer.appendChild(showMoreButton);
      }

      buttonsContainer.style.textAlign = "center";
      buttonsContainer.style.paddingTop = "4px";
      buttonsContainer.style.paddingBottom = "8px";
    } else {
      hideButton(showMoreButton);
      hideButton(showLessButton);
      if (buttonsContainer.parentElement) {
        resultsContainer.removeChild(buttonsContainer);
      }
    }
  }

  function toggleResults() {
    showMore = !showMore;
    updateResults(); // Update the results using the new data
  }

  function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", onClick);
    button.style.padding = "5px 10px";
    button.style.fontSize = "13px";
    return button;
  }

  function hideButton(button) {
    if (button) {
      button.style.display = "none";
    }
  }
});
