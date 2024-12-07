require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8ggzn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const reviewCollection = client.db("reviewDB").collection("reviews");
    const watchlistCollection = client.db("reviewDB").collection("watchlist");
    const trendingCollection = client.db("reviewDB").collection("trendingGames");
    const newsCollection = client.db("reviewDB").collection("latestGameNews");

    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/reviews/sortedReviews", async (req, res) => {
      const { sortBy } = req.query;
      let sortMethod = {};
      if (sortBy === "rating-ascending") {
        sortMethod = {rating: 1}
      } else if (sortBy === "rating-descending") {
        sortMethod = {rating: -1}
      } else if (sortBy === "year-ascending") {
        sortMethod = {year: 1}
      } else if (sortBy === "year-descending") {
        sortMethod = {year: -1}
      }
      const sortedReviews = await reviewCollection
        .find()
        .sort(sortMethod)
        .toArray();
      res.send(sortedReviews);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.get("/myReviews", async (req, res) => {
      const { email } = req.query;
      const query = { email: email };
      const reviews = await reviewCollection.find(query).toArray();
      res.send(reviews);
    });

    app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      console.log(newReview);
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    app.get("/highestRatedGames", async (req, res) => {
      const games = await reviewCollection
        .find({rating: {$gte: 0, $lte: 5}})
        .sort({ rating: -1 })
        .limit(6)
        .toArray();
      res.send(games);
    });

    // update
    app.get("/updateReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    app.put("/updateReview/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedReview = req.body;
      const review = {
        $set: {
          name: updatedReview.name,
          cover: updatedReview.cover,
          rating: updatedReview.rating,
          genres: updatedReview.genres,
          review: updatedReview.review,
          year: updatedReview.year,
        },
      };
      const result = await reviewCollection.updateOne(filter, review, options);
      res.send(result);
    });

    // Watchlist
    app.get("/myWatchlist", async (req, res) => {
      const { email } = req.query;
      const query = { email: email };
      const watchlist = await watchlistCollection.find(query).toArray();
      res.send(watchlist);
    });

    app.post("/myWatchlist", async (req, res) => {
      const newWatchlist = req.body;
      const result = await watchlistCollection.insertOne(newWatchlist);
      res.send(result);
    });

    // trending
    app.get("/trendingGames", async (req, res) => {
      const cursor = trendingCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // latest news
    app.get("/gameNews", async (req, res) => {
      const cursor = newsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    
    // delete
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/myWatchlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await watchlistCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
