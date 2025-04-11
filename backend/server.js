require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema and Model ---
const flashcardSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  codeSnippet: {
    type: String,
    required: true,
    trim: true
  },
  category: { // Add category field
    type: String,
    trim: true,
    default: 'Uncategorized' // Default category if none provided
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

// --- API Routes ---

// GET all flashcards
app.get('/api/flashcards', async (req, res) => {
  try {
    const flashcards = await Flashcard.find().sort({ createdAt: -1 }); // Get newest first
    res.json(flashcards);
  } catch (err) {
    console.error("Error fetching flashcards:", err);
    res.status(500).json({ message: 'Error fetching flashcards', error: err.message });
  }
});

// POST a new flashcard
app.post('/api/flashcards', async (req, res) => {
  try {
    // Include category in destructuring
    const { question, codeSnippet, category } = req.body;

    if (!question || !codeSnippet) {
      return res.status(400).json({ message: 'Question and Code Snippet are required' });
    }

    const newFlashcard = new Flashcard({
      question,
      codeSnippet,
      category: category || 'Uncategorized' // Use provided category or default
    });

    const savedFlashcard = await newFlashcard.save();
    res.status(201).json(savedFlashcard); // 201 Created
  } catch (err) {
    console.error("Error saving flashcard:", err);
    res.status(500).json({ message: 'Error saving flashcard', error: err.message });
  }
});

// PUT (update) a flashcard by ID
app.put('/api/flashcards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, codeSnippet, category } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid flashcard ID format' });
    }

    if (!question || !codeSnippet) {
      return res.status(400).json({ message: 'Question and Code Snippet are required' });
    }

    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      id,
      { question, codeSnippet, category: category || 'Uncategorized' },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedFlashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    res.json(updatedFlashcard);
  } catch (err) {
    console.error("Error updating flashcard:", err);
    res.status(500).json({ message: 'Error updating flashcard', error: err.message });
  }
});

// DELETE a flashcard by ID
app.delete('/api/flashcards/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid flashcard ID format' });
        }

        const deletedFlashcard = await Flashcard.findByIdAndDelete(id);

        if (!deletedFlashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        res.json({ message: 'Flashcard deleted successfully', id: id }); // Send back id to help frontend update state
    } catch (err) {
        console.error("Error deleting flashcard:", err);
        res.status(500).json({ message: 'Error deleting flashcard', error: err.message });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
