import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import axios from 'axios';
// Import light build and registerLanguage
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
// Import specific languages needed
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
// Import a style (using hljs style now since we're using Light build based on highlight.js)
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // Example: VS 2015 style
import { FaEdit, FaTrash } from 'react-icons/fa'; // Import icons
import './App.css';


// Register the languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('cpp', cpp);


// Define the base URL for the backend API
// Make sure the backend server is running on port 5001 (or adjust if different)
const API_URL = 'http://localhost:5001/api/flashcards';

function App() {
  const [question, setQuestion] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [category, setCategory] = useState(''); // State for category input
  const [flashcards, setFlashcards] = useState([]);
  const [error, setError] = useState(''); // To display potential errors
  const [expandedCardId, setExpandedCardId] = useState(null); // State for expanded card
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [expandedCategories, setExpandedCategories] = useState({}); // State for expanded categories { categoryName: boolean }
  const [theme, setTheme] = useState('light'); // State for theme ('light' or 'dark')
  // Add state for editing later if needed

  // Fetch flashcards from the backend when the component mounts
  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      setError(''); // Clear previous errors
      const response = await axios.get(API_URL);
      setFlashcards(response.data);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError('Failed to load flashcards. Is the backend server running?');
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    setError(''); // Clear previous errors

    if (!question.trim() || !codeSnippet.trim()) {
      setError('Both Question and Code Snippet are required.');
      return;
    }

    try {
      // Include category in the new flashcard data
      const newFlashcard = { question, codeSnippet, category };
      const response = await axios.post(API_URL, newFlashcard);

      // Add the new flashcard to the top of the list locally
      setFlashcards([response.data, ...flashcards]);

      // Clear the form fields
      setQuestion('');
      setCodeSnippet('');
      setCategory(''); // Clear category field
    } catch (err) {
      console.error('Error saving flashcard:', err);
      setError('Failed to save flashcard. Please try again.');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme; // Set body class directly
  }, [theme]);


  // Toggle expanded state for a card
  const handleCardClick = (cardId) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId); // Toggle: set to null if already expanded
  };

  // Toggle expanded state for a category
  const handleCategoryClick = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName] // Toggle the boolean value
    }));
  };

  // --- Edit & Delete Handlers (Implement actual logic later) ---
  const handleEdit = (e, cardId) => {
    e.stopPropagation(); // Prevent card click toggle when clicking icon
    console.log("Edit card:", cardId);
    // TODO: Implement edit functionality (e.g., open modal, set editing state)
  };

  const handleDelete = async (e, cardId) => {
    e.stopPropagation(); // Prevent card click toggle when clicking icon
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await axios.delete(`${API_URL}/${cardId}`);
        // Remove card from local state
        setFlashcards(flashcards.filter(card => card._id !== cardId));
      } catch (err) {
        console.error('Error deleting flashcard:', err);
        setError('Failed to delete flashcard. Please try again.');
      }
    }
  };

  // --- Filtering Logic ---
  const filteredFlashcards = useMemo(() => {
    if (!searchTerm) {
      return flashcards; // No search term, return all
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return flashcards.filter(card =>
      card.question.toLowerCase().includes(lowerSearchTerm) ||
      card.codeSnippet.toLowerCase().includes(lowerSearchTerm) ||
      card.category.toLowerCase().includes(lowerSearchTerm)
    );
  }, [flashcards, searchTerm]);

  // --- Grouping Logic ---
  const groupedFlashcards = useMemo(() => {
    return filteredFlashcards.reduce((acc, card) => {
      const category = card.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(card);
      return acc;
    }, {});
  }, [filteredFlashcards]);

  // Function to guess language from category
  const guessLanguage = (category) => {
    const lowerCategory = category?.toLowerCase() || '';
    if (lowerCategory.includes('python')) return 'python';
    if (lowerCategory.includes('java')) return 'java';
    if (lowerCategory.includes('c++') || lowerCategory.includes('cpp')) return 'cpp';
    if (lowerCategory.includes('javascript') || lowerCategory.includes('js')) return 'javascript';
    // Add more guesses as needed
    return 'javascript'; // Default guess
  };


  return (
    // Add theme class to the main container as well for potential component-specific overrides
    <div className={`app-container ${theme}`}>

      {/* Theme Toggle Switch */}
      <label className="theme-switch" htmlFor="theme-checkbox">
        <input
          type="checkbox"
          id="theme-checkbox"
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
        <div className="slider round"></div>
      </label>

      {/* Form Column */}
      <div className="form-column">
        <h1>Create Flashcard</h1> {/* Update title */}
        <div className="form-container">
          <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="question">Question</label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is a binary search?"
            />
          </div>
          <div>
            <label htmlFor="category">Category</label> {/* Add Category Label */}
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., DSA, JavaScript, Sorting"
            />
          </div>
          <div>
            <label htmlFor="codeSnippet">Code Snippet</label>
            <textarea
              id="codeSnippet"
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder={`def binary_search(arr, target):\n  left, right = 0, len(arr) - 1\n  while left <= right:\n    mid = (left + right) // 2\n    # ...`}
            />
          </div>
          <button type="submit">Save</button>
        </form>
          {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>

      {/* List Column */}
      <div className="list-column">
        <h2>Flashcards</h2> {/* Update title */}
         {/* Search Bar */}
         <div className="search-container">
           <input
             type="text"
             placeholder="Search flashcards..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="search-input"
           />
         </div>
        <div className="list-container">
          {/* Render grouped flashcards */}
          {Object.keys(groupedFlashcards).length === 0 && !error && <p>{searchTerm ? 'No matching flashcards found.' : 'No flashcards saved yet.'}</p>}

          {Object.entries(groupedFlashcards)
            // Optional: Sort categories alphabetically
            .sort(([catA], [catB]) => catA.localeCompare(catB))
            .map(([categoryName, cardsInCategory]) => {
              const isCategoryExpanded = expandedCategories[categoryName] ?? true; // Default to expanded

              return (
                <div key={categoryName} className="category-group">
                  <div className="category-header" onClick={() => handleCategoryClick(categoryName)}>
                    <span>{categoryName} ({cardsInCategory.length})</span>
                    <span>{isCategoryExpanded ? '▼' : '▶'}</span> {/* Simple expand/collapse indicator */}
                  </div>
                  {isCategoryExpanded && (
                    <ul className="flashcard-list category-cards">
                      {cardsInCategory.map((card) => (
                        <li
                          key={card._id}
                          className="flashcard-item"
                          onClick={() => handleCardClick(card._id)} // Keep click handler for expansion
                        >
                          <div className="card-header"> {/* Container for title and icons */}
                            <h3>{card.question}</h3>
                            <div className="card-actions">
                              <FaEdit className="icon edit-icon" onClick={(e) => handleEdit(e, card._id)} />
                              <FaTrash className="icon delete-icon" onClick={(e) => handleDelete(e, card._id)} />
                            </div>
                          </div>
                          {/* Category tag is redundant here as it's grouped */}
                          {/* Conditionally render code snippet with SyntaxHighlighter */}
                          {expandedCardId === card._id && (
                            <SyntaxHighlighter
                              language={guessLanguage(card.category)} // Pass guessed language
                              style={vs2015} // Use the imported hljs style
                              wrapLongLines={true}
                              showLineNumbers={true} // Optional: Add line numbers
                              customStyle={{
                                margin: '12px 0 0 0', // Adjust margin
                                padding: '15px',
                                borderRadius: '4px',
                                fontSize: '0.9em' // Slightly smaller font for code
                              }}
                            >
                              {card.codeSnippet}
                            </SyntaxHighlighter>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
// Removed duplicated code block from previous rendering logic
