document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("listing_id");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const bookingForm = document.getElementById("bookingForm");

  if (!listingId) {
    showMessage("No listing_id was provided.");
    return;
  }

  document.getElementById("startDate").value = startDate || "";
  document.getElementById("endDate").value = endDate || "";

  loadListing(listingId);

  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();
    createBooking();
  });
});

async function loadListing(listingId) {
  try {
    const response = await fetch("/api/listing/" + encodeURIComponent(listingId));
    const listing = await response.json();

    if (!response.ok) {
      throw new Error(listing.error || "Could not load listing.");
    }

    document.getElementById("listing_id").value = listing._id;
    document.getElementById("listing_name").value = listing.name;
    document.getElementById("listingIdText").textContent = listing._id;
    document.getElementById("listingNameText").textContent = listing.name;

    document.getElementById("listingDetails").hidden = false;
    document.getElementById("bookingForm").hidden = false;
    showMessage("");
  } catch (error) {
    showMessage(error.message);
  }
}

async function createBooking() {
  const booking = {
    listing_id: document.getElementById("listing_id").value,
    listing_name: document.getElementById("listing_name").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    clientName: document.getElementById("clientName").value,
    email: document.getElementById("email").value,
    daytimePhone: document.getElementById("daytimePhone").value,
    mobilePhone: document.getElementById("mobilePhone").value,
    postalAddress: document.getElementById("postalAddress").value,
    residentialAddress: document.getElementById("residentialAddress").value
  };

  showMessage("Creating booking...");

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(booking)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Could not create booking.");
    }

    goToConfirmation("success", "Booking successfully created.");
  } catch (error) {
    goToConfirmation("failure", error.message);
  }
}

function showMessage(message) {
  document.getElementById("message").textContent = message;
}

function goToConfirmation(status, message) {
  const params = new URLSearchParams();
  params.append("status", status);
  params.append("message", message);
  window.location.href = "confirmation.html?" + params.toString();
}
