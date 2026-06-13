document.addEventListener("DOMContentLoaded", function () {
  const searchForm = document.getElementById("searchForm");

  loadRandomListings();

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    searchListings();
  });
});

async function loadRandomListings() {
  clearResults();
  showStatus("Loading random listings...");

  try {
    const response = await fetch("/api/random-listings");
    const listings = await response.json();

    if (!response.ok) {
      throw new Error(listings.error || "Could not load random listings.");
    }

    renderListings(listings);
  } catch (error) {
    showStatus(error.message);
  }
}

async function searchListings() {
  const location = document.getElementById("location").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const propertyType = document.getElementById("propertyType").value;
  const bedrooms = document.getElementById("bedrooms").value;

  const params = new URLSearchParams();
  params.append("location", location);
  params.append("startDate", startDate);
  params.append("endDate", endDate);

  if (propertyType) {
    params.append("property_type", propertyType);
  }

  if (bedrooms) {
    params.append("bedrooms", bedrooms);
  }

  clearResults();
  showStatus("Searching listings...");

  try {
    const response = await fetch("/api/search-listings?" + params.toString());
    const listings = await response.json();

    if (!response.ok) {
      throw new Error(listings.error || "Could not search listings.");
    }

    renderListings(listings, {
      startDate: startDate,
      endDate: endDate
    });
  } catch (error) {
    showStatus(error.message);
  }
}

function renderListings(listings, selectedDates) {
  const results = document.getElementById("results");
  clearResults();

  if (!listings || listings.length === 0) {
    showStatus("No listings match your search criteria.");
    return;
  }

  showStatus("");

  listings.forEach(function (listing) {
    const card = document.createElement("article");
    card.className = "listing-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");
    const linkParams = new URLSearchParams();
    linkParams.append("listing_id", listing._id);

    if (selectedDates && selectedDates.startDate && selectedDates.endDate) {
      linkParams.append("startDate", selectedDates.startDate);
      linkParams.append("endDate", selectedDates.endDate);
    }

    link.href = "booking.html?" + linkParams.toString();
    link.textContent = listing.name || "Unnamed listing";
    title.appendChild(link);

    const summary = document.createElement("p");
    summary.textContent = listing.summary || "No summary available.";

    const price = document.createElement("p");
    price.className = "listing-detail";
    price.textContent = "Daily price: " + formatPrice(listing.price);

    const rating = document.createElement("p");
    rating.className = "listing-detail";
    rating.textContent = "Review score rating: " + formatRating(listing);

    card.appendChild(title);
    card.appendChild(summary);
    card.appendChild(price);
    card.appendChild(rating);
    results.appendChild(card);
  });
}

function clearResults() {
  document.getElementById("results").innerHTML = "";
}

function showStatus(message) {
  document.getElementById("statusMessage").textContent = message;
}

function formatPrice(price) {
  if (price === undefined || price === null) {
    return "Not available";
  }

  if (typeof price === "object" && price.$numberDecimal) {
    return "$" + price.$numberDecimal;
  }

  return "$" + price;
}

function formatRating(listing) {
  if (
    listing.review_scores &&
    listing.review_scores.review_scores_rating !== undefined &&
    listing.review_scores.review_scores_rating !== null
  ) {
    return listing.review_scores.review_scores_rating;
  }

  return "Not available";
}
