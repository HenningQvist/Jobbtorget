// routes/documents.js
import express from "express";
import pool from "../db.js";
import multer from "multer";

const router = express.Router();

// ⚡️ Lagrar filer i minnet, med maxstorlek 20 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// -----------------------------
// GET ALL DOCUMENTS (metadata only)
// -----------------------------
router.get("/", async (req, res) => {
  try {
    // Hämta bara metadata, ej fil_data
    const result = await pool.query(
      "SELECT id, name, type, tags, date FROM documents ORDER BY date DESC"
    );

    const docs = result.rows.map((doc) => {
      let tags = [];
      if (doc.tags == null) {
        tags = [];
      } else if (Array.isArray(doc.tags)) {
        tags = doc.tags;
      } else if (typeof doc.tags === "string") {
        try {
          tags = JSON.parse(doc.tags);
          if (!Array.isArray(tags)) tags = [];
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

// -----------------------------
// DOWNLOAD DOCUMENT
// -----------------------------
router.get("/:id/download", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT name, type, file_data FROM documents WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dokumentet hittades inte" });
    }

    const doc = result.rows[0];
    res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);
    res.setHeader("Content-Type", doc.type || "application/octet-stream");
    res.send(doc.file_data);
  } catch (err) {
    console.error("Fel vid nedladdning:", err);
    res.status(500).json({ error: "Kunde inte ladda ner dokument" });
  }
});

// -----------------------------
// UPLOAD DOCUMENT
// -----------------------------
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

    // Returnera endast metadata
    const result = await pool.query(
      "SELECT id, name, type, tags, date FROM documents ORDER BY date DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fel vid uppladdning:", err);
    res.status(500).json({ error: "Kunde inte ladda upp dokument" });
  }
});

// -----------------------------
// UPDATE TAGS
// -----------------------------
router.put("/:id/tags", async (req, res) => {
  const { id } = req.params;
  let { tags } = req.body;

  if (!Array.isArray(tags)) tags = [tags];

  try {
    const result = await pool.query(
      "UPDATE documents SET tags = $1 WHERE id = $2 RETURNING id, name, type, tags, date",
      [JSON.stringify(tags), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dokumentet hittades inte" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fel vid uppdatering av taggar:", err);
    res.status(500).json({ error: "Kunde inte uppdatera taggar" });
  }
});

// -----------------------------
// DELETE DOCUMENT
// -----------------------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM documents WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Fel vid borttagning av dokument:", err);
    res.status(500).json({ error: "Kunde inte ta bort dokument" });
  }
});

export default router;
