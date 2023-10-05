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
  const form = document.getElementById("search");

  const clearButton = document.getElementById("clear_button");
  clearButton.addEventListener("click", function () {
    form.reset();
    const resultsContainer = document.getElementById("results");
    const totalResultsContainer = document.getElementById("totalResults");
    const noResultsMessage = document.getElementById("noResultsMessage");
    const itemDetails = document.getElementById("itemDetails");
    itemDetails.style.display = "none";
    resultsContainer.innerHTML = "";
    totalResultsContainer.textContent = "";
    noResultsMessage.style.display = "none";
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
  let cachedData = null;

  form.addEventListener("submit", function (event) {
    const formData = new FormData(form);

    fetch("/api/search?" + new URLSearchParams(formData).toString())
      .then((response) => response.json())
      .then((data) => {
        if (data.total_entries == "0") {
          document.getElementById("noResultsMessage").style.display = "block";
          const resultsContainer = document.getElementById("results");
          const totalResultsContainer = document.getElementById("totalResults");
          resultsContainer.innerHTML = "";
          totalResultsContainer.textContent = "";
        } else {
          document.getElementById("noResultsMessage").style.display = "none";
          resultsContainer.style.display = "block";
          totalResultsContainer.style.display = "block";
          cachedData = data;
          showMore = false;
          initialTotalResults = cachedData.total_entries;
          initialKeywords = cachedData.keywords;
          updateResults();
        }
      })
      .catch((error) => console.error("Error:", error));

    event.preventDefault();
  });

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
    hrElement.classList.add("hr");
    hrElement.style.width = "40%";
    hrElement.style.margin = "auto";
    hrElement.style.marginTop = "10px";
    hrElement.style.marginBottom = "-3px";
    totalResultsContainer.appendChild(hrElement);

    resultsContainer.innerHTML = "";
    items_info.forEach((item_info, index) => {
      const isTopRated = item_info["Top_Rated"] == "true";
      console.log(isTopRated);
      const topRatedImage = isTopRated
        ? '<img style="height: 30px; width: 20px;position: absolute; top: -7px;left:5px;" src="https://csci571.com/hw/hw6/images/topRatedImage.png" alt="Top Rated">'
        : "";
      const slicedTitle =
        item_info["Title"].length > 50
          ? item_info["Title"].slice(0, 50) + "..."
          : item_info["Title"];
      const itemHtml = `
        <div class="ind_result" data-itemid="${item_info["Item_ID"]}">
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
            <p>Category: ${item_info["Category"]}<a href="${item_info["Item URL"]}" target="_blank">
            <img style="height: 15px; width: 15px;opacity: 0.5;" src="https://csci571.com/hw/hw6/images/redirect.png" alt="redirect"></a></p>
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
    updateResults();
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

  const indResults = document.getElementById("results");

  indResults.addEventListener("click", function (event) {
    const clickedCard = event.target.closest(".ind_result");

    if (clickedCard) {
      const itemId = clickedCard.getAttribute("data-itemid");
      console.log(itemId);
      fetch(`/api/getItem?itemId=${itemId}`)
        .then((response) => response.json())
        .then((data) => {
          // console.log(data);
          handleItemDetails(data);
        })
        .catch((error) => console.error("Error:", error));
    }
  });
  function handleItemDetails(data) {
    const item = data.Item;
    const photoURL = item.PictureURL[0];
    const eBayLink = item.ViewItemURLForNaturalSearch;
    const title = item.Title;
    const subTitle = item.SubTitle || "N/A";
    const price = item.CurrentPrice.Value;
    const location = `${item.Location}, ${item.PostalCode}`;
    const seller = item.Seller.UserID;
    const returnPolicy = item.ReturnPolicy.ReturnsAccepted;
    const itemSpecifics = item.ItemSpecifics.NameValueList.map((spec) => ({
      name: spec.Name,
      values: spec.Value,
    }));

    const modal = document.getElementById("itemDetails");
    const table = document.getElementById("itemDetailsTable");
    table.innerHTML = "";
    modal.style.display = "block";

    const details = [
      {
        label: "Image",
        value: `<img src="${photoURL}" alt="Product Image" style="max-width: 100%;">`,
      },
      {
        label: "eBay Link",
        value: `<a href="${eBayLink}" target="_blank">eBay Product Link</a>`,
      },
      { label: "Title", value: title },
      { label: "SubTitle", value: subTitle },
      { label: "Price", value: `$${price}` },
      { label: "Location", value: location },
      { label: "Seller", value: seller },
      { label: "Return Policy", value: returnPolicy },
    ];
    details.forEach((detail) => {
      const row = table.insertRow();
      const labelCell = row.insertCell(0);
      const valueCell = row.insertCell(1);

      labelCell.innerHTML = `<strong>${detail.label}:</strong>`;
      valueCell.innerHTML = detail.value;
    });

    itemSpecifics.forEach((spec) => {
      const row = table.insertRow();
      const labelCell = row.insertCell();
      const valueCell = row.insertCell();

      labelCell.innerHTML = `<strong>${spec.name}:</strong>`;
      valueCell.innerHTML = spec.values.join(", ");
    });

    modal.style.display = "block";
    toggleVisibility("totalResults", false);
    toggleVisibility("results", false);
  }

  document.getElementById("backBtn").addEventListener("click", function () {
    console.log("Back button clicked");
    const modal = document.getElementById("itemDetails");
    modal.style.display = "none";
    toggleVisibility("totalResults", true);
    toggleVisibility("results", true);
  });

  function toggleVisibility(elementId, visible) {
    const element = document.getElementById(elementId);
    element.style.display = visible ? "block" : "none";
  }
});
