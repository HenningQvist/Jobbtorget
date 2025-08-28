// routes/documents.js
import express from "express";
import pool from "../db.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // lagrar filer i minnet

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.documents ORDER BY date DESC");

    const docs = result.rows.map((doc) => {
      let tags = [];

      // Om tags är null/undefined, default till tom array
      if (doc.tags == null) {
        tags = [];
      } else if (Array.isArray(doc.tags)) {
        tags = doc.tags;
      } else if (typeof doc.tags === "string") {
        try {
          tags = JSON.parse(doc.tags);
          if (!Array.isArray(tags)) {
            // Om det inte blev en array, fallback
            tags = [];
          }
        } catch (e) {
          tags = [];
        }
      }

      return { ...doc, tags };
    });

    res.json(docs);
  } catch (err) {
    console.error("Fel vid hämtning av dokument:", err);
    res.status(500).json({ error: "Kunde inte hämta dokument" });
  }
});



// Lägg till dokument med fil
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { file } = req;
    const { name, type, tags } = req.body;

    if (!file) {
      return res.status(400).json({ error: "Ingen fil uppladdad" });
    }

    const parsedTags = tags ? JSON.parse(tags) : [];

    await pool.query(
      "INSERT INTO documents (name, type, tags, file_data) VALUES ($1, $2, $3, $4)",
      [name || file.originalname, type || file.mimetype, parsedTags, file.buffer]
    );

    // Returnera hela listan istället för ett objekt
    const result = await pool.query("SELECT * FROM documents ORDER BY date DESC");
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ladda upp dokument" });
  }
});


// Uppdatera taggar
router.put("/:id/tags", async (req, res) => {
  const { id } = req.params;
  let { tags } = req.body;

  // ⚠️ Om tags är en sträng, omslut i array
  if (!Array.isArray(tags)) {
    tags = [tags];
  }

  try {
    const result = await pool.query(
      "UPDATE documents SET tags = $1 WHERE id = $2 RETURNING *",
      [JSON.stringify(tags), id] // serialisera som JSON
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering av taggar:", err);
    res.status(500).json({ error: "Kunde inte uppdatera taggar" });
  }
});





// Ta bort dokument
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM documents WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte ta bort dokument" });
  }
});

export default router;
