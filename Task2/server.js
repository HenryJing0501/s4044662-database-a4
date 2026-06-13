const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const port = 3000;

const uri = "mongodb+srv://s4044662_db_user:Kb05011301@cluster0.llurfyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let client;
let db;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

async function connectToDatabase() {
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
  throw new Error("MongoDB connection string must start with mongodb:// or mongodb+srv://");
}

  if (!db) {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000
      });
    }

    await client.connect();
    db = client.db("sample_airbnb");
    console.log("Connected to MongoDB Atlas");
  }

  return db;
}

function listingProjection() {
  return {
    _id: 1,
    name: 1,
    summary: 1,
    price: 1,
    "review_scores.review_scores_rating": 1,
    "address.market": 1,
    property_type: 1,
    bedrooms: 1
  };
}

function errorMessage(error, fallbackMessage) {
  if (error.message === "Cannot connect to MongoDB Atlas string in server.js.") {
    return error.message;
  }

  return fallbackMessage + " " + error.message;
}

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/random-listings", async function (req, res) {
  try {
    const database = await connectToDatabase();
    const listings = await database
      .collection("listingsAndReviews")
      .aggregate([
        { $sample: { size: 10 } },
        { $project: listingProjection() }
      ])
      .toArray();

    res.json(listings);
  } catch (error) {
    console.error("Error loading random listings:", error);
    res.status(500).json({ error: errorMessage(error, "Could not load random listings.") });
  }
});

app.get("/api/search-listings", async function (req, res) {
  try {
    const location = req.query.location;
    const propertyType = req.query.property_type;
    const bedrooms = req.query.bedrooms;

    if (!location) {
      return res.status(400).json({ error: "Location is required." });
    }

    const query = {
      "address.market": location
    };

    if (propertyType) {
      query.property_type = propertyType;
    }

    if (bedrooms) {
      const bedroomsNumber = Number(bedrooms);

      if (Number.isNaN(bedroomsNumber)) {
        return res.status(400).json({ error: "Bedrooms must be a number." });
      }

      query.bedrooms = bedroomsNumber;
    }

    const database = await connectToDatabase();
    const listings = await database
      .collection("listingsAndReviews")
      .find(query)
      .project(listingProjection())
      .limit(20)
      .toArray();

    res.json(listings);
  } catch (error) {
    console.error("Error searching listings:", error);
    res.status(500).json({ error: errorMessage(error, "Could not search listings.") });
  }
});

app.get("/api/listing/:id", async function (req, res) {
  try {
    const database = await connectToDatabase();
    const listing = await database.collection("listingsAndReviews").findOne(
      { _id: req.params.id },
      {
        projection: {
          _id: 1,
          name: 1
        }
      }
    );

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    res.json(listing);
  } catch (error) {
    console.error("Error loading listing:", error);
    res.status(500).json({ error: errorMessage(error, "Could not load listing.") });
  }
});

app.post("/api/bookings", async function (req, res) {
  try {
    const requiredFields = [
      "listing_id",
      "listing_name",
      "startDate",
      "endDate",
      "clientName",
      "email",
      "mobilePhone",
      "postalAddress",
      "residentialAddress"
    ];

    const missingFields = requiredFields.filter(function (field) {
      return !req.body[field];
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields: " + missingFields.join(", ")
      });
    }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: "Start date and end date must be valid dates." });
    }

    const booking = {
      listing_id: req.body.listing_id,
      listing_name: req.body.listing_name,
      startDate: startDate,
      endDate: endDate,
      clientName: req.body.clientName,
      email: req.body.email,
      daytimePhone: req.body.daytimePhone || "",
      mobilePhone: req.body.mobilePhone,
      postalAddress: req.body.postalAddress,
      residentialAddress: req.body.residentialAddress,
      createdAt: new Date()
    };

    const database = await connectToDatabase();
    const result = await database.collection("bookings").insertOne(booking);

    res.json({
      success: true,
      insertedId: result.insertedId
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: errorMessage(error, "Could not create booking.") });
  }
});

app.listen(port, function () {
  console.log("Server running at http://localhost:" + port);
});
