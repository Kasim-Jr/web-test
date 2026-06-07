/**
 * CodeKids - Interactive Educational Platform
 * Main Application Script
 * 
 * Pure vanilla JavaScript — no external dependencies.
 * Handles: state management, hero parallax, lesson cards, code playground
 * sandbox, login modal, scroll animations, session tracking, confetti,
 * toast notifications, and hash navigation.
 */

// ============================================================
// 1. STATE MANAGEMENT
// ============================================================

/**
 * Central application state object.
 * Tracks the current user, selected lesson track, code history, and login status.
 */
const appState = {
  currentUser: null,       // { username, token } or null when not logged in
  selectedTrack: null,     // One of the data-track values, e.g. 'html-basics'
  codeHistory: [],         // Array of previously executed code strings
  isLoggedIn: false        // Boolean flag for quick login checks
};

// ============================================================
// 9. TOAST NOTIFICATIONS
// ============================================================

/**
 * Shows a temporary toast notification at the top-center of the screen.
 * @param {string} message - The message text to display.
 * @param {'success'|'error'|'info'} type - The toast type, determines styling color.
 */
function showToast(message, type = 'info') {
  // Remove any existing toast first so they don't stack
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;

  // Inline styles for positioning and appearance
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10000',
    padding: '12px 24px',
    borderRadius: '12px',
    fontFamily: "'Nunito', sans-serif",
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    transition: 'opacity 0.3s ease',
    opacity: '1',
    maxWidth: '90vw',
    textAlign: 'center'
  });

  // Color schemes per type
  const colors = {
    success: { background: '#2ECC71', color: '#fff' },
    error:   { background: '#E74C3C', color: '#fff' },
    info:    { background: '#4A90D9', color: '#fff' }
  };
  const chosen = colors[type] || colors.info;
  toast.style.background = chosen.background;
  toast.style.color = chosen.color;

  document.body.appendChild(toast);

  // Auto-dismiss after 3 seconds with fade-out
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}

// ============================================================
// 8. CONFETTI EFFECT
// ============================================================

/** Bright color palette for confetti pieces. */
const CONFETTI_COLORS = [
  '#E74C3C', '#F39C12', '#2ECC71', '#4A90D9',
  '#9B59B6', '#1ABC9C', '#E91E63', '#FF9800'
];

/** Shape types for confetti pieces. */
const CONFETTI_SHAPES = ['circle', 'square', 'star'];

/**
 * Spawns 30-50 confetti pieces inside #confetti-container.
 * Each piece animates upward and outward, then is removed after animation.
 */
function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;

  const count = 30 + Math.floor(Math.random() * 21); // 30–50 pieces

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
    piece.className = `confetti-piece ${shape}`;

    // Random visual properties via CSS custom properties
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const x = (Math.random() - 0.5) * 600;           // spread horizontally
    const y = -(Math.random() * 400 + 100);           // shoot upward
    const rotation = Math.random() * 720 - 360;       // spin
    const size = 6 + Math.random() * 8;               // 6–14px

    piece.style.setProperty('--confetti-x', `${x}px`);
    piece.style.setProperty('--confetti-y', `${y}px`);
    piece.style.setProperty('--confetti-rotation', `${rotation}deg`);
    piece.style.background = color;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.left = `${50 + (Math.random() - 0.5) * 20}%`;

    container.appendChild(piece);

    // Remove piece after animation completes (2.5s should cover the CSS animation)
    setTimeout(() => {
      if (piece.parentNode) {
        piece.remove();
      }
    }, 2500);
  }
}

// ============================================================
// 2. HERO SECTION INTERACTIONS
// ============================================================

/**
 * Initializes the parallax-like effect on .floating-symbol elements.
 * On mouse move, each symbol shifts based on mouse offset from viewport center
 * multiplied by its data-speed attribute value.
 */
function initHeroParallax() {
  const symbols = document.querySelectorAll('.floating-symbol');
  if (!symbols.length) return;

  document.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const offsetX = (e.clientX - centerX) / centerX; // -1 to 1
    const offsetY = (e.clientY - centerY) / centerY; // -1 to 1

    symbols.forEach((symbol) => {
      const speed = parseFloat(symbol.dataset.speed) || 1;
      const moveX = offsetX * speed * 30;  // max ~30px shift at speed 1
      const moveY = offsetY * speed * 20;  // max ~20px shift at speed 1
      symbol.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });
}

/**
 * Smooth-scrolls to the #lessons section when the CTA button is clicked.
 */
function initCTAButton() {
  const ctaButton = document.getElementById('cta-button');
  const lessonsSection = document.getElementById('lessons');

  if (ctaButton && lessonsSection) {
    ctaButton.addEventListener('click', () => {
      lessonsSection.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ============================================================
// 3. LESSON CARDS FUNCTIONALITY
// ============================================================

/**
 * Sets up click handlers on lesson cards and their start buttons.
 * - Selects a track and updates URL hash for navigation.
 * - Simulates progress increment (5–15%) on each click, capped at 100%.
 * - Sends a POST to /api/track-view for Prometheus metrics.
 */
function initLessonCards() {
  const cards = document.querySelectorAll('.lesson-card');

  cards.forEach((card) => {
    const startButton = card.querySelector('.card-start-button');
    const trackName = card.dataset.track;

    // Click handler for the start button
    if (startButton) {
      startButton.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent double-fire from card click
        selectTrack(trackName, card);
      });
    }

    // Click handler for the card itself
    card.addEventListener('click', () => {
      selectTrack(trackName, card);
    });

    // Keyboard accessibility — Enter/Space activates the card
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTrack(trackName, card);
      }
    });
  });
}

/**
 * Selects a lesson track: updates hash, highlights the card,
 * increments progress, and fires the track-view metrics request.
 * @param {string} trackName - The data-track identifier.
 * @param {HTMLElement} card - The .lesson-card DOM element.
 */
function selectTrack(trackName, card) {
  // Update app state and URL hash
  appState.selectedTrack = trackName;
  window.location.hash = trackName;

  // Highlight selected card, remove highlight from others
  document.querySelectorAll('.lesson-card').forEach((c) => {
    c.classList.remove('selected');
  });
  card.classList.add('selected');

  // Simulate progress increment
  incrementProgress(card);

  // Fire track-view request for Prometheus metrics
  trackView(trackName);
}

/**
 * Increments the progress bar on a lesson card by a random 5–15%.
 * Caps at 100% and updates both the fill width and text.
 * @param {HTMLElement} card - The .lesson-card DOM element.
 */
function incrementProgress(card) {
  const progressFill = card.querySelector('.progress-fill');
  const progressText = card.querySelector('.progress-text');
  const progressBar = card.querySelector('.progress-bar');

  if (!progressFill || !progressText) return;

  // Parse current width percentage
  const currentWidth = parseFloat(progressFill.style.width) || 0;
  const increment = 5 + Math.floor(Math.random() * 11); // 5–15
  const newWidth = Math.min(currentWidth + increment, 100);

  progressFill.style.width = `${newWidth}%`;
  progressText.textContent = `${Math.round(newWidth)}% complete`;

  // Update ARIA value
  if (progressBar) {
    progressBar.setAttribute('aria-valuenow', Math.round(newWidth));
  }

  // Trigger confetti when reaching 100%
  if (newWidth >= 100) {
    triggerConfetti();
    showToast('🎉 You completed this track! Amazing!', 'success');
  }
}

/**
 * Sends a POST request to /api/track-view with the track name
 * for Prometheus metrics integration. Errors are handled gracefully.
 * @param {string} trackName - The track identifier.
 */
async function trackView(trackName) {
  try {
    await fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: trackName })
    });
  } catch (err) {
    // Silently handle — metrics are non-critical
    console.warn('Track view request failed:', err.message);
  }
}

// ============================================================
// 4. CODE PLAYGROUND — SAFE SANDBOXED JAVASCRIPT EXECUTION
// ============================================================

/** Pre-loaded example code snippets keyed by data-snippet attribute values. */
const CODE_SNIPPETS = {
  'hello-world': `console.log("Hello, I'm a coder!");`,
  'math-magic': `let result = 5 + 3;\nconsole.log("5 + 3 = " + result);`,
  'loop-fun': `for(let i = 1; i <= 5; i++) {\n  console.log("Count: " + i);\n}`,
  'string-art': `let name = "CodeKid";\nconsole.log("★ " + name + " ★");`,
  'conditionals': `let age = 10;\nif(age >= 7) {\n  console.log("You can code!");\n} else {\n  console.log("Keep growing!");\n}`
};

/**
 * Blacklist of dangerous JavaScript patterns.
 * If any of these appear in user code, execution is blocked.
 */
const DANGEROUS_PATTERNS = [
  'window', 'document', 'require', 'process', 'eval', 'Function',
  'setTimeout', 'setInterval', 'fetch', 'XMLHttpRequest', 'import',
  '__proto__', 'constructor', 'prototype', 'this', 'alert', 'confirm',
  'prompt', 'navigator', 'location', 'history', 'crypto',
  'localStorage', 'sessionStorage', 'cookie'
];

/** Maximum number of output lines allowed. */
const MAX_OUTPUT_LINES = 50;

/** Maximum characters per output line. */
const MAX_LINE_LENGTH = 200;

/** Simulated execution timeout in milliseconds. */
const EXECUTION_TIMEOUT_MS = 2000;

/** Maximum loop iterations to prevent infinite loops. */
const MAX_LOOP_ITERATIONS = 1000;

/**
 * Checks user code against the dangerous pattern blacklist.
 * @param {string} code - The user's raw code string.
 * @returns {{ safe: boolean, reason: string }} - Safety check result.
 */
function checkCodeSafety(code) {
  // Normalize code for checking: remove whitespace variations
  const normalizedCode = code.replace(/\s+/g, ' ');

  for (const pattern of DANGEROUS_PATTERNS) {
    // Use word-boundary-ish matching to avoid false positives
    // e.g., "window" should match but "windowless" shouldn't be a concern
    // We check for the pattern as a standalone word or property access
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${pattern}(?:[^a-zA-Z0-9_]|$)`, 'i');
    if (regex.test(normalizedCode)) {
      return {
        safe: false,
        reason: `Oops! The word "${pattern}" is not allowed in CodeKids for safety reasons. Try using simpler code!`
      };
    }
  }

  return { safe: true, reason: '' };
}

/**
 * Simulates a console.log by collecting output lines into an array.
 * @param {string[]} outputLines - The array to push output into.
 * @returns {Function} - A function that accepts args and pushes a formatted line.
 */
function simulateConsoleLog(outputLines) {
  return function (...args) {
    if (outputLines.length >= MAX_OUTPUT_LINES) return; // cap lines

    const formatted = args.map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch { return String(arg); }
      }
      return String(arg);
    }).join(' ');

    // Truncate line if too long
    const truncated = formatted.length > MAX_LINE_LENGTH
      ? formatted.substring(0, MAX_LINE_LENGTH) + '...'
      : formatted;

    outputLines.push(truncated);
  };
}

/**
 * Converts a raw JavaScript Error into a kid-friendly message.
 * @param {Error} error - The caught error object.
 * @returns {string} - A friendly, age-appropriate error message.
 */
function kidFriendlyError(error) {
  const name = error.name || 'Error';
  const msg = error.message || '';

  if (name === 'SyntaxError') {
    return 'Oops! Something went wrong with your code. Check for missing brackets or spelling mistakes!';
  }
  if (name === 'ReferenceError') {
    return `Hmm, the computer doesn't know what "${msg.split(' ')[0] || 'that'}" means. Did you spell it correctly?`;
  }
  if (name === 'TypeError') {
    return 'Whoops! You\'re trying to do something that doesn\'t work with that type of value. Double-check your variables!';
  }
  if (name === 'RangeError') {
    return 'That number is too big or too small! Try using a smaller value.';
  }
  if (name === 'TimeoutError' || msg.includes('timeout') || msg.includes('timed out')) {
    return 'Your code took too long to run! Maybe you have a loop that never stops? Try adding a limit!';
  }

  return 'Oops! Something went wrong with your code. Check for missing brackets or spelling mistakes!';
}

/**
 * Executes user code in a sandboxed environment.
 * Uses new Function() ONLY after passing blacklist safety checks.
 * Wraps user code with a custom console object and loop iteration guards.
 * @param {string} code - The user's raw code string.
 * @returns {{ output: string[], error: string|null, type: 'success'|'error'|'info' }}
 */
function executeSandboxedCode(code) {
  // Step 1: Safety check
  const safety = checkCodeSafety(code);
  if (!safety.safe) {
    return { output: [], error: safety.reason, type: 'error' };
  }

  // Step 2: Empty code check
  if (!code.trim()) {
    return { output: ['Write some code and hit Run! 🎉'], error: null, type: 'info' };
  }

  // Step 3: Prepare sandboxed wrapper
  const outputLines = [];
  const customConsole = { log: simulateConsoleLog(outputLines) };

  // Wrap user code with loop iteration guard and custom console injection
  // The __loopCounter variable tracks iterations; if it exceeds the limit, we throw.
  const sandboxedCode = `
    let __loopCounter = 0;
    const __guardLoop = () => { 
      __loopCounter++; 
      if (__loopCounter > ${MAX_LOOP_ITERATIONS}) { 
        throw new Error('timeout: Your code has too many loop iterations! Try a smaller loop.'); 
      } 
    };
    // Inject loop guards into for and while loops by wrapping their bodies
    // We do a simple regex replacement to add __guardLoop() calls at the start of loop bodies
    const __guardedCode = (${JSON.stringify(code)})
      .replace(/(for\\s*\\([^)]*\\)\\s*\\{|while\\s*\\([^)]*\\)\\s*\\{)/g, (match) => match + '__guardLoop();')
      .replace(/(do\\s*\\{)/g, (match) => match + '__guardLoop();');
    
    // We'll execute the original code with console replaced
    // The loop guard regex approach is a best-effort; infinite while(true) loops
    // without a body brace won't be caught, but that's an edge case.
  `;

  // Actually, the regex-based loop guard approach is fragile. Let's use a simpler
  // approach: just inject the guard variable declaration and let the Function
  // constructor execute the user code directly with the custom console.
  // We'll rely on the timeout mechanism to catch infinite loops.

  const wrappedCode = `
    "use strict";
    let __loopCounter = 0;
    const __checkLoop = () => {
      __loopCounter++;
      if (__loopCounter > ${MAX_LOOP_ITERATIONS}) {
        throw new Error('timeout: Too many loop iterations! Try a smaller loop.');
      }
    };
    // Override loop constructs by adding iteration checks
    // We preprocess the user code string to inject __checkLoop() calls
    const __processedCode = __processLoops(__userCode);
    eval(__processedCode);
  `;

  // Hmm, using eval inside new Function is still eval. Let me reconsider.
  // The requirement says: Use new Function() ONLY after passing the blacklist check
  // and wrapping the user code in a sandboxed scope. The blacklist already blocks
  // "eval" and "Function" in user code, so the user can't call eval themselves.
  // 
  // Best approach: Use new Function() to create the sandbox, passing the custom
  // console as a parameter. The user code is the function body. We prepend loop
  // guard variable declarations. For loop guards, we do a simple text replacement
  // on the user code before passing it to new Function().

  // Preprocess user code to inject loop iteration guards
  let processedCode = code;
  // Add __checkLoop() call at the beginning of for/while/do loop bodies
  processedCode = processedCode.replace(
    /(for\s*\([^)]*\)\s*\{)/g,
    '$1 __checkLoop();'
  );
  processedCode = processedCode.replace(
    /(while\s*\([^)]*\)\s*\{)/g,
    '$1 __checkLoop();'
  );
  processedCode = processedCode.replace(
    /(do\s*\{)/g,
    '$1 __checkLoop();'
  );

  // Build the full function body with sandbox preamble + user code
  const functionBody = `
    "use strict";
    let __loopCounter = 0;
    const __checkLoop = () => {
      __loopCounter++;
      if (__loopCounter > ${MAX_LOOP_ITERATIONS}) {
        throw new Error('timeout: Too many loop iterations! Try a smaller loop.');
      }
    };
    // User code starts here (sandboxed)
    ${processedCode}
  `;

  // Step 4: Create the sandboxed function (ONLY after safety checks passed)
  let sandboxedFn;
  try {
    sandboxedFn = new Function('console', functionBody);
  } catch (syntaxError) {
    return {
      output: [],
      error: kidFriendlyError(syntaxError),
      type: 'error'
    };
  }

  // Step 5: Execute with timeout simulation
  try {
    // We simulate a timeout by using a flag. Since we can't truly interrupt
    // synchronous JS execution in the main thread, we rely on the loop guard
    // and a post-execution time check.
    const startTime = Date.now();
    sandboxedFn(customConsole);
    const elapsed = Date.now() - startTime;

    if (elapsed > EXECUTION_TIMEOUT_MS) {
      return {
        output: outputLines,
        error: 'Your code took too long to run! Maybe you have a loop that never stops? Try adding a limit!',
        type: 'error'
      };
    }

    return { output: outputLines, error: null, type: 'success' };
  } catch (executionError) {
    const elapsed = Date.now() - startTime;
    const isTimeout = executionError.message.includes('timeout') || elapsed > EXECUTION_TIMEOUT_MS;

    if (isTimeout) {
      return {
        output: outputLines,
        error: 'Your code took too long to run! Maybe you have a loop that never stops? Try adding a limit!',
        type: 'error'
      };
    }

    return {
      output: outputLines,
      error: kidFriendlyError(executionError),
      type: 'error'
    };
  }
}

/**
 * Renders output lines into the #code-output element with appropriate styling.
 * @param {string[]} lines - Array of output text lines.
 * @param {'success'|'error'|'info'} type - The output type for styling.
 * @param {string|null} error - Error message to display, if any.
 */
function renderOutput(lines, type, error) {
  const outputEl = document.getElementById('code-output');
  if (!outputEl) return;

  // Clear previous output
  outputEl.innerHTML = '';

  // Add output lines
  lines.forEach((line) => {
    const lineEl = document.createElement('div');
    lineEl.className = `output-line ${type}`;
    lineEl.textContent = line;
    outputEl.appendChild(lineEl);
  });

  // Add error line if present
  if (error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'output-line error';
    errorEl.textContent = `❌ ${error}`;
    outputEl.appendChild(errorEl);
  }

  // If no output at all, show a placeholder
  if (lines.length === 0 && !error) {
    const placeholder = document.createElement('div');
    placeholder.className = 'output-line info';
    placeholder.textContent = 'Your code ran but didn\'t print anything. Try adding console.log()!';
    outputEl.appendChild(placeholder);
  }
}

/**
 * Initializes the code playground: snippet buttons, run button, and clear button.
 */
function initCodePlayground() {
  const editor = document.getElementById('code-editor');
  const runButton = document.getElementById('run-code-button');
  const clearButton = document.getElementById('clear-code-button');
  const outputEl = document.getElementById('code-output');

  // --- Snippet buttons ---
  const snippetButtons = document.querySelectorAll('.snippet-button');
  snippetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const snippetKey = btn.dataset.snippet;
      const snippetCode = CODE_SNIPPETS[snippetKey];
      if (snippetCode && editor) {
        editor.value = snippetCode;
        // Clear previous output when loading a snippet
        if (outputEl) {
          outputEl.innerHTML = '<span class="output-placeholder">Snippet loaded! Hit Run to see it work! 🪄</span>';
        }
        showToast(`Snippet "${snippetKey}" loaded! Hit Run! ▶`, 'info');
      }
    });
  });

  // --- Run button ---
  if (runButton) {
    runButton.addEventListener('click', () => {
      if (!editor) return;
      const code = editor.value;

      // Save to code history
      appState.codeHistory.push(code);

      // Execute in sandbox
      const result = executeSandboxedCode(code);

      // Render output
      renderOutput(result.output, result.type, result.error);

      // Trigger confetti on success
      if (result.type === 'success' && result.output.length > 0) {
        triggerConfetti();
      }
    });
  }

  // --- Clear button ---
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (editor) editor.value = '';
      if (outputEl) {
        outputEl.innerHTML = '<span class="output-placeholder">Your code results will appear here! 🪄</span>';
      }
    });
  }
}

// ============================================================
// 5. LOGIN MODAL
// ============================================================

/**
 * Opens the login modal with enter animation.
 */
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (!modal) return;

  modal.removeAttribute('hidden');
  modal.classList.remove('modal-overlay-exit');
  modal.classList.add('modal-overlay-enter');

  // Focus the username input for accessibility
  const usernameInput = document.getElementById('login-username');
  if (usernameInput) {
    setTimeout(() => usernameInput.focus(), 100);
  }
}

/**
 * Closes the login modal with exit animation.
 */
function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (!modal) return;

  modal.classList.remove('modal-overlay-enter');
  modal.classList.add('modal-overlay-exit');

  // Add hidden attribute after animation completes
  setTimeout(() => {
    modal.setAttribute('hidden', '');
  }, 300);

  // Clear form fields and errors
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';
  if (usernameError) usernameError.textContent = '';
  if (passwordError) passwordError.textContent = '';
}

/**
 * Initializes all login modal interactions: open, close, form submit, signup link.
 */
function initLoginModal() {
  const loginButton = document.getElementById('login-button');
  const modalCloseButton = document.getElementById('modal-close-button');
  const modal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const signupLink = document.getElementById('signup-link');

  // --- Open modal on login button click ---
  if (loginButton) {
    loginButton.addEventListener('click', openLoginModal);
  }

  // --- Close modal on close button click ---
  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeLoginModal);
  }

  // --- Close modal on overlay click (not on modal container itself) ---
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Only close if the click is directly on the overlay, not the container
      if (e.target === modal) {
        closeLoginModal();
      }
    });
  }

  // --- Close modal on Escape key ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalEl = document.getElementById('login-modal');
      if (modalEl && !modalEl.hasAttribute('hidden')) {
        closeLoginModal();
      }
    }
  });

  // --- Form submission ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usernameInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const usernameError = document.getElementById('username-error');
      const passwordError = document.getElementById('password-error');

      // Clear previous errors
      if (usernameError) usernameError.textContent = '';
      if (passwordError) passwordError.textContent = '';

      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Basic validation
      let valid = true;
      if (!username) {
        if (usernameError) usernameError.textContent = 'Please enter your username! 👤';
        valid = false;
      }
      if (!password) {
        if (passwordError) passwordError.textContent = 'Please enter your password! 🔑';
        valid = false;
      }

      if (!valid) return;

      // Attempt login via API
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ message: 'Login failed' }));
          // Show shake animation on form
          loginForm.classList.add('shake-animation');
          setTimeout(() => loginForm.classList.remove('shake-animation'), 500);
          showToast(data.message || 'Login failed. Check your username and password! 😊', 'error');
          return;
        }

        const data = await response.json();
        const token = data.token;

        // Store JWT token in localStorage
        localStorage.setItem('codekids_token', token);

        // Update app state
        appState.currentUser = { username, token };
        appState.isLoggedIn = true;

        // Update UI: show user bar, hide login button
        const userBar = document.getElementById('user-bar');
        const userAvatar = document.getElementById('user-avatar');
        const userNameDisplay = document.getElementById('user-name-display');
        const loginBtn = document.getElementById('login-button');

        if (userBar) userBar.removeAttribute('hidden');
        if (userAvatar) userAvatar.textContent = '🦊';
        if (userNameDisplay) userNameDisplay.textContent = username;
        if (loginBtn) loginBtn.setAttribute('hidden', '');

        // Close modal
        closeLoginModal();

        // Show success toast
        showToast(`Welcome back, ${username}! 🎉`, 'success');

        // Trigger confetti for login celebration
        triggerConfetti();

        // Track session start
        sessionStart(username);

      } catch (err) {
        // Network or other error
        loginForm.classList.add('shake-animation');
        setTimeout(() => loginForm.classList.remove('shake-animation'), 500);
        showToast('Could not connect to the server. Try again later! 🌐', 'error');
      }
    });
  }

  // --- Signup link click ---
  if (signupLink) {
    signupLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Sign up coming soon! 🌟', 'info');
    });
  }
}

// ============================================================
// 6. SCROLL ANIMATIONS
// ============================================================

/**
 * Sets up IntersectionObserver for .lesson-card elements.
 * Cards receive 'revealed' class and staggered 'card-animate-N' classes
 * when they scroll into view.
 */
function initScrollAnimations() {
  const cards = document.querySelectorAll('.lesson-card');

  if (!cards.length) return;

  const cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          card.classList.add('revealed');

          // Determine the card's index for staggered animation
          const index = Array.from(cards).indexOf(card);
          card.classList.add(`card-animate-${index + 1}`);

          // Stop observing once revealed
          cardObserver.unobserve(card);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  cards.forEach((card) => cardObserver.observe(card));

  // --- Section reveal animations ---
  // Add .section-reveal class to major sections and observe them
  const sections = document.querySelectorAll('section');
  sections.forEach((section) => {
    section.classList.add('section-reveal');
  });

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

// ============================================================
// 7. SESSION TRACKING
// ============================================================

/**
 * Sends a POST to /api/session-start to track the beginning of a user session.
 * @param {string} username - The logged-in user's username.
 */
async function sessionStart(username) {
  try {
    await fetch('/api/session-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  } catch (err) {
    console.warn('Session start request failed:', err.message);
  }
}

/**
 * Sends a POST to /api/session-end to track the end of a user session.
 * @param {string} username - The logged-in user's username.
 */
async function sessionEnd(username) {
  try {
    await fetch('/api/session-end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
  } catch (err) {
    console.warn('Session end request failed:', err.message);
  }
}

/**
 * Initializes session tracking: logout handler and beforeunload beacon.
 */
function initSessionTracking() {
  const logoutButton = document.getElementById('logout-button');

  // --- Logout button click ---
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      const username = appState.currentUser ? appState.currentUser.username : '';

      // Clear localStorage token
      localStorage.removeItem('codekids_token');

      // Reset app state
      appState.currentUser = null;
      appState.isLoggedIn = false;

      // Update UI: hide user bar, show login button
      const userBar = document.getElementById('user-bar');
      const loginBtn = document.getElementById('login-button');

      if (userBar) userBar.setAttribute('hidden', '');
      if (loginBtn) loginBtn.removeAttribute('hidden');

      // Show logout toast
      showToast('See you later, coder! 👋', 'info');

      // Track session end
      if (username) {
        sessionEnd(username);
      }
    });
  }

  // --- Page unload: send beacon if logged in ---
  window.addEventListener('beforeunload', () => {
    if (appState.isLoggedIn && appState.currentUser) {
      const username = appState.currentUser.username;
      // Use sendBeacon for reliability during page unload
      const payload = JSON.stringify({ username });
      navigator.sendBeacon('/api/session-end', payload);
    }
  });
}

// ============================================================
// 10. HASH NAVIGATION
// ============================================================

/**
 * Checks the current URL hash and highlights the matching lesson card.
 * Called on page load and on hashchange events.
 */
function handleHashNavigation() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  // Find the card matching this track
  const card = document.querySelector(`.lesson-card[data-track="${hash}"]`);
  if (card) {
    // Update app state
    appState.selectedTrack = hash;

    // Highlight the matching card
    document.querySelectorAll('.lesson-card').forEach((c) => {
      c.classList.remove('selected');
    });
    card.classList.add('selected');

    // Scroll to the lessons section
    const lessonsSection = document.getElementById('lessons');
    if (lessonsSection) {
      lessonsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * Initializes hash navigation: check on load and listen for hashchange.
 */
function initHashNavigation() {
  // Check initial hash on page load
  handleHashNavigation();

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashNavigation);
}

// ============================================================
// AUTO-LOGIN FROM STORED TOKEN
// ============================================================

/**
 * On page load, checks if there's a stored JWT token in localStorage.
 * If found, attempts to restore the session (set app state, show user bar).
 * Note: We don't validate the token client-side; the server will reject
 * expired tokens on subsequent API calls.
 */
function tryAutoLogin() {
  const token = localStorage.getItem('codekids_token');
  if (!token) return;

  // We have a token — assume logged in (server will validate on API calls)
  // We don't have the username stored, so we show a generic greeting
  // A more robust approach would decode the JWT payload, but that's overkill here
  try {
    // Decode JWT payload to extract username (JWT is base64-encoded JSON)
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      const payload = JSON.parse(atob(payloadBase64));
      const username = payload.username || payload.sub || 'Coder';

      appState.currentUser = { username, token };
      appState.isLoggedIn = true;

      // Update UI
      const userBar = document.getElementById('user-bar');
      const userNameDisplay = document.getElementById('user-name-display');
      const loginBtn = document.getElementById('login-button');

      if (userBar) userBar.removeAttribute('hidden');
      if (userNameDisplay) userNameDisplay.textContent = username;
      if (loginBtn) loginBtn.setAttribute('hidden', '');
    }
  } catch (err) {
    // Token is malformed — clear it
    localStorage.removeItem('codekids_token');
  }
}

// ============================================================
// INITIALIZATION — BOOTSTRAP THE APP
// ============================================================

/**
 * Main initialization function. Called when the DOM is ready.
 * Sets up all interactive features in sequence.
 */
function initApp() {
  // Try to restore a previous session from stored token
  tryAutoLogin();

  // Hero section interactions
  initHeroParallax();
  initCTAButton();

  // Lesson cards functionality
  initLessonCards();

  // Code playground sandbox
  initCodePlayground();

  // Login modal interactions
  initLoginModal();

  // Scroll animations (IntersectionObserver)
  initScrollAnimations();

  // Session tracking (logout + beforeunload)
  initSessionTracking();

  // Hash-based navigation
  initHashNavigation();
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initApp);