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
  const clearButton = document.getElementById("clear_button");
  const form = document.querySelector("form");
  clearButton.addEventListener("click", function () {
    document.getElementById("keyword").required = false;
    document.getElementById("keyword").value = "";
    document.getElementById("keyword").required = true;
    document.getElementById("from").value = "";
    document.getElementById("to").value = "";
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    document.getElementById("sort_by").value = "best_match";
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("search");
  const resultsContainer = document.getElementById("results");
  const totalResultsContainer = document.getElementById("totalResults");
  let buttonsContainer = document.createElement("div"); // Container for buttons
  let showMoreButton = null;
  let showLessButton = null;
  let showMore = false; // Flag to determine whether to show more results

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(form);

    fetch("/api/search?" + new URLSearchParams(formData).toString())
      .then((response) => response.json())
      .then((data) => {
        const totalResults = data.total_entries; // Access total entries from data
        const keywords = data.keywords; // Access keywords from data
        const items_info = showMore
          ? data.items_info
          : data.items_info.slice(0, 3);

        totalResultsContainer.textContent = `${totalResults} Results found for ${keywords}`;

        resultsContainer.innerHTML = ""; // Clear previous results
        items_info.forEach((item_info, index) => {
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
                      <h3>${item_info["Title"].slice(0, 50)}</h3>
                      <br />
                      <p>Category: ${
                        item_info["Category"]
                      }<a href=""><img style="height: 15px; width: 15px;opacity: 0.5;" src="https://www.csci571.com/hw/hw6/images/redirect.png" alt="redirect"></a></p>
                      <br />
                      <p>Condition: ${item_info["Condition"]}</p>
                      <br />
                      <p><b>Price: $${item_info["Price"]}</b></p>
                    </div>
                  </div>
                `;
          resultsContainer.innerHTML += itemHtml;
        });

        if (data.items_info.length > 3) {
          // If there are more than 3 items, show the buttons
          if (!buttonsContainer.parentElement) {
            // If the container is not appended, append it
            resultsContainer.appendChild(buttonsContainer);
          }

          if (!showMoreButton) {
            showMoreButton = createButton("Show More", toggleResults);
          }

          if (!showLessButton) {
            showLessButton = createButton("Show Less", toggleResults);
          }

          // Append buttons to buttonsContainer
          buttonsContainer.innerHTML = "";
          if (showMore) {
            buttonsContainer.appendChild(showLessButton);
          } else {
            buttonsContainer.appendChild(showMoreButton);
          }

          // Add some styling to center the buttons
          buttonsContainer.style.textAlign = "center";
        } else {
          // Otherwise, hide both buttons and remove buttonsContainer
          hideButton(showMoreButton);
          hideButton(showLessButton);
          if (buttonsContainer.parentElement) {
            resultsContainer.removeChild(buttonsContainer);
          }
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  function toggleResults() {
    showMore = !showMore; // Toggle the flag
    form.dispatchEvent(new Event("submit"));
  }

  function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  function hideButton(button) {
    if (button) {
      button.style.display = "none";
    }
  }
});
