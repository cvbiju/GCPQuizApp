let originalQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let totalAnswered = 0;
let selectedOptions = new Set();
let isAnswerSubmitted = false;
let currentRange = { start: 1, end: 25 };

let selectedTags = new Set();
let timerInterval = null;
let secondsRemaining = 0;
let isExamMode = false;

const DOMElements = {
    loading: document.getElementById('loading'),
    quiz: document.getElementById('quiz'),
    summary: document.getElementById('summary'),
    setupView: document.getElementById('setup-view'),
    historyView: document.getElementById('history-view'),
    resumeCont: document.getElementById('resumeCont'),
    resumeDetails: document.getElementById('resumeDetails'),
    resumeBtn: document.getElementById('resumeBtn'),
    weaknessesCont: document.getElementById('weaknessesCont'),
    retakeMissedBtn: document.getElementById('retakeMissedBtn'),
    missedCount: document.getElementById('missedCount'),
    tagFilters: document.getElementById('tagFilters'),
    examModeToggle: document.getElementById('examModeToggle'),
    examTimer: document.getElementById('examTimer'),
    timerText: document.getElementById('timerText'),
    rangeStart: document.getElementById('rangeStart'),
    rangeEnd: document.getElementById('rangeEnd'),
    startNewBtn: document.getElementById('startNewBtn'),
    viewHistoryBtn: document.getElementById('viewHistoryBtn'),
    backFromHistoryBtn: document.getElementById('backFromHistoryBtn'),
    historyList: document.getElementById('historyList'),
    quizNotes: document.getElementById('quizNotes'),
    saveHistoryBtn: document.getElementById('saveHistoryBtn'),
    questionText: document.getElementById('questionText'),
    optionsCont: document.getElementById('optionsCont'),
    submitBtn: document.getElementById('submitBtn'),
    nextBtn: document.getElementById('nextBtn'),
    explanationCont: document.getElementById('explanationCont'),
    explanationBody: document.getElementById('explanationBody'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    finalScoreText: document.getElementById('finalScoreText'),
    restartBtn: document.getElementById('restartBtn'),
    scoreboard: document.getElementById('scoreboard'),
    liveCorrectScore: document.getElementById('liveCorrectScore'),
    liveIncorrectScore: document.getElementById('liveIncorrectScore'),
    liveAccuracyText: document.getElementById('liveAccuracyText'),
    hintToggleBtn: document.getElementById('hintToggleBtn'),
    hintTextCont: document.getElementById('hintTextCont'),
    hintText: document.getElementById('hintText'),
    askAiBtn: document.getElementById('askAiBtn'),
    chatPanel: document.getElementById('chatPanel'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    apiConfigView: document.getElementById('apiConfigView'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    chatActiveView: document.getElementById('chatActiveView'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    resetApiBtn: document.getElementById('resetApiBtn')
};

// Chat State
let chatApiKey = localStorage.getItem('gcp_quiz_gemini_key') || '';

// Initialize app
async function init() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Failed to load questions');
        
        const rawData = await response.json();
        // Keep questions that actually have explanations (up to 25)
        originalQuestions = rawData.filter(q => q.explanations);
        originalQuestions.forEach((q, idx) => q.originalIndex = idx + 1);
        
        if (originalQuestions.length === 0) {
            throw new Error('No valid questions found');
        }

        DOMElements.rangeEnd.max = originalQuestions.length;
        DOMElements.rangeEnd.value = originalQuestions.length;

        // Extract unique tags
        const allTags = new Set();
        originalQuestions.forEach(q => q.tags.forEach(t => allTags.add(t)));
        renderTagFilters(Array.from(allTags).sort());

        // Add small delay for UI smoothness
        setTimeout(() => {
            DOMElements.loading.classList.add('hidden');
            checkSavedSession();
            checkWeaknesses();
            DOMElements.setupView.classList.remove('hidden');
        }, 800);
        
    } catch (err) {
        console.error(err);
        DOMElements.loading.innerHTML = '<p style="color:var(--accent-red)">Error loading questions. Please ensure a local server is running.</p>';
    }
}

function checkSavedSession() {
    const saved = localStorage.getItem('quiz_active_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            DOMElements.resumeCont.classList.remove('hidden');
            DOMElements.resumeDetails.textContent = `Range: ${state.currentRange.start}-${state.currentRange.end} | Progress: Question ${state.currentQuestionIndex + 1} of ${state.questionsLength} | Score: ${state.userScore}/${state.totalAnswered}`;
        } catch(e) {
            localStorage.removeItem('quiz_active_state');
        }
    } else {
        DOMElements.resumeCont.classList.add('hidden');
    }
}

function startNewQuiz() {
    let start = parseInt(DOMElements.rangeStart.value) || 1;
    let end = parseInt(DOMElements.rangeEnd.value) || originalQuestions.length;
    
    if (start < 1) start = 1;
    if (end > originalQuestions.length) end = originalQuestions.length;
    if (start > end) {
        alert("Start question cannot be greater than end question.");
        return;
    }

    // Apply Tag Filters if any are selected
    let baseQuestions = originalQuestions;
    if (selectedTags.size > 0) {
        baseQuestions = originalQuestions.filter(q => q.tags.some(t => selectedTags.has(t)));
    }
    
    // Bounds check against filtered set
    if (end > baseQuestions.length) end = baseQuestions.length;
    if (start > end || baseQuestions.length === 0) {
        alert("No questions found for this range/filter combination.");
        return;
    }

    currentRange = { start, end };
    questions = baseQuestions.slice(start - 1, end);
    isExamMode = DOMElements.examModeToggle.checked;
    
    currentQuestionIndex = 0;
    userScore = 0;
    totalAnswered = 0;
    selectedOptions.clear();
    isAnswerSubmitted = false;

    saveActiveState();
    launchQuiz();
}

function startWeaknessesQuiz() {
    const weaknesses = JSON.parse(localStorage.getItem('quiz_weaknesses') || '[]');
    if (weaknesses.length === 0) return;
    
    questions = originalQuestions.filter(q => weaknesses.includes(q.originalIndex));
    currentRange = { start: 'Weaknesses', end: 'Retake' };
    isExamMode = DOMElements.examModeToggle.checked;
    
    currentQuestionIndex = 0;
    userScore = 0;
    totalAnswered = 0;
    selectedOptions.clear();
    isAnswerSubmitted = false;

    saveActiveState();
    launchQuiz();
}

function handleTagToggle(tag, isChecked) {
    if (isChecked) {
        selectedTags.add(tag);
    } else {
        selectedTags.delete(tag);
    }
}

function renderTagFilters(tagsToRender) {
    DOMElements.tagFilters.innerHTML = '';
    tagsToRender.forEach(tag => {
        const lbl = document.createElement('label');
        lbl.className = 'tag-lbl';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = tag;
        cb.addEventListener('change', (e) => handleTagToggle(tag, e.target.checked));
        
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.textContent = tag;
        
        lbl.appendChild(cb);
        lbl.appendChild(pill);
        DOMElements.tagFilters.appendChild(lbl);
    });
}

function checkWeaknesses() {
    const weaknesses = JSON.parse(localStorage.getItem('quiz_weaknesses') || '[]');
    if (weaknesses.length > 0) {
        DOMElements.weaknessesCont.classList.remove('hidden');
        DOMElements.missedCount.textContent = weaknesses.length;
    } else {
        DOMElements.weaknessesCont.classList.add('hidden');
    }
}

function updateWeaknesses(originalIndex, wasCorrect) {
    let weaknesses = JSON.parse(localStorage.getItem('quiz_weaknesses') || '[]');
    if (!wasCorrect && !weaknesses.includes(originalIndex)) {
        weaknesses.push(originalIndex);
    } else if (wasCorrect && weaknesses.includes(originalIndex)) {
        weaknesses = weaknesses.filter(id => id !== originalIndex);
    }
    localStorage.setItem('quiz_weaknesses', JSON.stringify(weaknesses));
}

function resumeQuiz() {
    const saved = localStorage.getItem('quiz_active_state');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentRange = state.currentRange;
            isExamMode = state.isExamMode || false;
            
            // Reconstruct the exact question array
            let baseArray = originalQuestions;
            if (state.resumeType === 'weaknesses') {
                 const weaknesses = JSON.parse(localStorage.getItem('quiz_weaknesses') || '[]');
                 baseArray = originalQuestions.filter(q => weaknesses.includes(q.originalIndex));
                 questions = baseArray;
            } else {
                 if (state.selectedTags && state.selectedTags.length > 0) {
                     baseArray = originalQuestions.filter(q => q.tags.some(t => state.selectedTags.includes(t)));
                 }
                 questions = baseArray.slice(currentRange.start - 1, currentRange.end);
            }

            currentQuestionIndex = state.currentQuestionIndex;
            userScore = state.userScore;
            totalAnswered = state.totalAnswered;
            
            if (isExamMode && state.secondsRemaining) {
                secondsRemaining = state.secondsRemaining;
            }

            
            if (currentQuestionIndex >= questions.length) {
                localStorage.removeItem('quiz_active_state');
                startNewQuiz();
                return;
            }
            
            launchQuiz();
        } catch(e) {
            startNewQuiz();
        }
    }
}

function launchQuiz() {
    DOMElements.setupView.classList.add('hidden');
    DOMElements.historyView.classList.add('hidden');
    DOMElements.summary.classList.add('hidden');
    DOMElements.quiz.classList.remove('hidden');
    DOMElements.scoreboard.classList.remove('hidden');
    
    if (isExamMode) {
        DOMElements.examTimer.classList.remove('hidden');
        if (secondsRemaining <= 0) {
            // ~2.4 mins per question = ~144 seconds
            secondsRemaining = questions.length * 144;
        }
        startTimer();
    } else {
        DOMElements.examTimer.classList.add('hidden');
    }

    updateSidebarScore();
    loadQuestion(currentQuestionIndex);
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        secondsRemaining--;
        updateTimerDisplay();
        
        if (secondsRemaining <= 60) {
            DOMElements.examTimer.style.borderColor = 'red';
            DOMElements.examTimer.style.color = 'red';
        }
        
        if (secondsRemaining % 5 === 0) saveActiveState(); // periodically save time

        if (secondsRemaining <= 0) {
            clearInterval(timerInterval);
            alert("⏰ Time's up! The exam is automatically submitting.");
            showSummary();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    DOMElements.timerText.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function saveActiveState() {
    if (currentRange.start === 'Weaknesses') {
         localStorage.setItem('quiz_active_state', JSON.stringify({
            resumeType: 'weaknesses',
            currentRange, currentQuestionIndex, userScore, totalAnswered,
            questionsLength: questions.length, isExamMode, secondsRemaining
         }));
    } else {
         localStorage.setItem('quiz_active_state', JSON.stringify({
            resumeType: 'range',
            selectedTags: Array.from(selectedTags),
            currentRange, currentQuestionIndex, userScore, totalAnswered,
            questionsLength: questions.length, isExamMode, secondsRemaining
        }));
    }
}

function saveHistory() {
    const notes = DOMElements.quizNotes.value.trim();
    const history = JSON.parse(localStorage.getItem('quiz_progress_history') || '[]');
    
    const record = {
        date: new Date().toISOString(),
        range: `${currentRange.start}-${currentRange.end}`,
        score: userScore,
        total: questions.length,
        notes: notes
    };
    
    history.unshift(record);
    localStorage.setItem('quiz_progress_history', JSON.stringify(history));
    DOMElements.quizNotes.value = ''; // clear
    
    // Switch to history view
    DOMElements.summary.classList.add('hidden');
    DOMElements.scoreboard.classList.add('hidden');
    showHistoryView();
}

function showHistoryView() {
    DOMElements.setupView.classList.add('hidden');
    DOMElements.summary.classList.add('hidden');
    DOMElements.scoreboard.classList.add('hidden');
    DOMElements.quiz.classList.add('hidden'); // fail safe
    DOMElements.historyView.classList.remove('hidden');
    
    const history = JSON.parse(localStorage.getItem('quiz_progress_history') || '[]');
    DOMElements.historyList.innerHTML = '';
    
    if (history.length === 0) {
        DOMElements.historyList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No history found.</p>';
        return;
    }
    
    history.forEach(item => {
        const d = new Date(item.date);
        const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Handle 0 total gracefully
        const accuracy = item.total ? Math.round((item.score / item.total) * 100) : 0;
        
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-header">
                <span class="history-date">${dateStr}</span>
                <span class="history-score">${item.score}/${item.total} (${accuracy}%)</span>
            </div>
            <div class="history-details">
                <strong>Range:</strong> Questions ${item.range}
            </div>
            ${item.notes ? `<div class="history-notes">"${item.notes}"</div>` : ''}
        `;
        DOMElements.historyList.appendChild(div);
    });
}

function loadQuestion(index) {
    if (index >= questions.length) {
        localStorage.removeItem('quiz_active_state');
        showSummary();
        return;
    }

    currentQuestionIndex = index;
    saveActiveState();
    
    const q = questions[index];
    isAnswerSubmitted = false;
    selectedOptions.clear();

    // Reset UI
    DOMElements.questionText.textContent = `${q.originalIndex}. ${q.question}`;
    DOMElements.optionsCont.innerHTML = '';
    DOMElements.explanationCont.classList.add('hidden');
    DOMElements.explanationBody.innerHTML = '';
    const aiActions = DOMElements.explanationCont.querySelector('.ai-deep-dive-actions');
    if (aiActions) aiActions.classList.add('hidden');

    DOMElements.submitBtn.classList.remove('hidden', 'submitted-state');
    DOMElements.submitBtn.disabled = true;
    DOMElements.submitBtn.textContent = 'Submit Answer';

    DOMElements.nextBtn.classList.add('hidden');
    DOMElements.nextBtn.classList.remove('highlighted');

    // Handle Hint Logic
    DOMElements.hintTextCont.classList.add('hidden');
    if (q.hint && q.hint.trim() !== '') {
        DOMElements.hintText.textContent = q.hint;
        DOMElements.hintToggleBtn.classList.remove('hidden');
    } else {
        DOMElements.hintToggleBtn.classList.add('hidden');
    }

    // Reset AI Chat
    DOMElements.chatPanel.classList.add('hidden');
    DOMElements.chatMessages.innerHTML = `
        <div class="chat-msg ai-msg">
            <p>Hi! I'm ready to help you deep dive into this question. What part would you like me to clarify?</p>
        </div>
    `;

    // Update Progress
    const progressPercent = ((index) / questions.length) * 100;
    DOMElements.progressBar.style.width = `${progressPercent}%`;
    DOMElements.progressText.textContent = `Question ${index + 1} / ${questions.length}`;

    // Expected correct answers (e.g. "AC" means multiple correct)
    const exactCorrect = q.answer.split('');
    const isMultipleChoice = exactCorrect.length > 1;

    // Render options
    Object.entries(q.options).forEach(([letter, text]) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.letter = letter;
        
        const spanL = document.createElement('span');
        spanL.className = 'option-letter';
        spanL.textContent = `${letter}.`;
        
        const spanT = document.createElement('span');
        spanT.className = 'option-text';
        spanT.textContent = text;
        
        btn.appendChild(spanL);
        btn.appendChild(spanT);

        btn.addEventListener('click', () => handleOptionClick(btn, letter, isMultipleChoice, exactCorrect.length));
        DOMElements.optionsCont.appendChild(btn);
    });
}

function handleOptionClick(btn, letter, isMultipleChoice, maxSelections) {
    if (isAnswerSubmitted) return;

    if (isMultipleChoice) {
        if (selectedOptions.has(letter)) {
            selectedOptions.delete(letter);
            btn.classList.remove('selected');
        } else {
            if (selectedOptions.size < maxSelections) {
                selectedOptions.add(letter);
                btn.classList.add('selected');
            }
        }
    } else {
        selectedOptions.clear();
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        selectedOptions.add(letter);
        btn.classList.add('selected');
    }

    DOMElements.submitBtn.disabled = selectedOptions.size === 0 || (isMultipleChoice && selectedOptions.size !== maxSelections);
}

function submitAnswer() {
    if (isAnswerSubmitted) return;
    
    isAnswerSubmitted = true;
    const q = questions[currentQuestionIndex];
    const correctAnswersSet = new Set(q.answer.split(''));
    let isCompletelyCorrect = true;

    // Evaluate
    document.querySelectorAll('.option-btn').forEach(btn => {
        const letter = btn.dataset.letter;
        const isSelected = selectedOptions.has(letter);
        const isActuallyCorrect = correctAnswersSet.has(letter);

        if (isActuallyCorrect) {
            btn.classList.add('correct');
        }

        if (isSelected && !isActuallyCorrect) {
            btn.classList.add('incorrect');
            isCompletelyCorrect = false;
        }

        if (!isSelected && isActuallyCorrect) {
            isCompletelyCorrect = false;
        }

        btn.disabled = true; // disable all clicks
    });

    totalAnswered++;
    if (isCompletelyCorrect) {
        userScore++;
    }
    
    updateWeaknesses(q.originalIndex, isCompletelyCorrect);

    updateSidebarScore();

    // Prepare explanation HTML
    let expHtml = '';
    if (q.explanations) {
        Object.entries(q.explanations).forEach(([letter, expText]) => {
            const isCorrectOption = correctAnswersSet.has(letter);
            const isSelected = selectedOptions.has(letter);
            const statusClass = isCorrectOption ? 'correct-exp' : 'incorrect-exp';
            const icon = isCorrectOption ? '✓' : '✗';
            
            let sourceHtml = '';
            if (isSelected && q.sources && q.sources[letter]) {
                const optSource = q.sources[letter];
                sourceHtml = `
                    <div style="margin-top: 0.5rem; font-size: 0.9em;">
                        <strong>📚 Source:</strong> 
                        <a href="${optSource}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-blue); text-decoration: underline; word-break: break-all;">
                            ${optSource}
                        </a>
                    </div>
                `;
            }

            expHtml += `
                <div class="exp-item ${statusClass}">
                    <strong>${icon} Option ${letter}</strong>
                    <p>${expText}</p>
                    ${sourceHtml}
                </div>
            `;
        });
    }
    DOMElements.explanationBody.innerHTML = expHtml;
    DOMElements.explanationCont.classList.remove('hidden');
    const aiActions = DOMElements.explanationCont.querySelector('.ai-deep-dive-actions');
    if (aiActions) aiActions.classList.remove('hidden');
    
    if (!isCompletelyCorrect) {
        DOMElements.explanationCont.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Change Submit button state instead of hiding it
    DOMElements.submitBtn.classList.add('submitted-state');
    DOMElements.submitBtn.textContent = 'Submitted ✓';
    DOMElements.submitBtn.disabled = true;

    // Show and highlight the next button
    DOMElements.nextBtn.classList.remove('hidden');
    // Add small delay for the animation start to draw the eye
    setTimeout(() => {
        DOMElements.nextBtn.classList.add('highlighted');
    }, 150);
}

function updateSidebarScore() {
    DOMElements.liveCorrectScore.textContent = userScore;
    const incorrect = totalAnswered - userScore;
    DOMElements.liveIncorrectScore.textContent = incorrect;
    
    if (totalAnswered === 0) {
        DOMElements.liveAccuracyText.textContent = "0%";
    } else {
        const accuracy = Math.round((userScore / totalAnswered) * 100);
        DOMElements.liveAccuracyText.textContent = accuracy + "%";
    }
}

function showSummary() {
    clearInterval(timerInterval);
    DOMElements.quiz.classList.add('hidden');
    DOMElements.summary.classList.remove('hidden');
    DOMElements.progressBar.style.width = `100%`;
    DOMElements.progressText.textContent = `Completed!`;
    DOMElements.finalScoreText.textContent = `${userScore} / ${totalAnswered}`;
    checkWeaknesses();
}

// Event Listeners
DOMElements.startNewBtn.addEventListener('click', startNewQuiz);
DOMElements.retakeMissedBtn.addEventListener('click', startWeaknessesQuiz);
DOMElements.resumeBtn.addEventListener('click', resumeQuiz);
DOMElements.viewHistoryBtn.addEventListener('click', showHistoryView);
DOMElements.backFromHistoryBtn.addEventListener('click', () => {
    DOMElements.historyView.classList.add('hidden');
    DOMElements.setupView.classList.remove('hidden');
    checkSavedSession();
});
DOMElements.saveHistoryBtn.addEventListener('click', saveHistory);
DOMElements.restartBtn.addEventListener('click', () => {
    DOMElements.summary.classList.add('hidden');
    DOMElements.scoreboard.classList.add('hidden');
    DOMElements.setupView.classList.remove('hidden');
    checkSavedSession();
});

DOMElements.submitBtn.addEventListener('click', submitAnswer);
DOMElements.nextBtn.addEventListener('click', () => loadQuestion(currentQuestionIndex + 1));
DOMElements.hintToggleBtn.addEventListener('click', () => {
    DOMElements.hintTextCont.classList.toggle('hidden');
});

// --- AI Chat Logic ---

function toggleChat() {
    DOMElements.chatPanel.classList.toggle('hidden');
    if (!DOMElements.chatPanel.classList.contains('hidden')) {
        checkApiKey();
    }
}

function checkApiKey() {
    if (chatApiKey) {
        DOMElements.apiConfigView.style.display = 'none';
        DOMElements.chatActiveView.style.display = 'flex';
        DOMElements.chatActiveView.classList.remove('hidden');
    } else {
        DOMElements.apiConfigView.style.display = 'flex';
        DOMElements.chatActiveView.style.display = 'none';
        DOMElements.chatActiveView.classList.add('hidden');
    }
}

function saveApiKey() {
    const key = DOMElements.apiKeyInput.value.trim();
    if (key) {
        chatApiKey = key;
        localStorage.setItem('gcp_quiz_gemini_key', key);
        DOMElements.apiKeyInput.value = '';
        checkApiKey();
    }
}

function resetApiKey() {
    chatApiKey = '';
    localStorage.removeItem('gcp_quiz_gemini_key');
    checkApiKey();
    // Clear chat history
    DOMElements.chatMessages.innerHTML = `
        <div class="chat-msg ai-msg">
            <p>Hi! I'm ready to help you deep dive into this question. What part would you like me to clarify?</p>
        </div>
    `;
}

function appendMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'ai-msg'}`;
    
    if (isUser) {
        msgDiv.textContent = text;
    } else {
        // Parse markdown for AI responses
        msgDiv.innerHTML = marked.parse(text);
    }
    
    DOMElements.chatMessages.appendChild(msgDiv);
    DOMElements.chatMessages.scrollTop = DOMElements.chatMessages.scrollHeight;
}

async function sendChat() {
    const prompt = DOMElements.chatInput.value.trim();
    if (!prompt || !chatApiKey) return;

    // UI setup
    appendMessage(prompt, true);
    DOMElements.chatInput.value = '';
    DOMElements.sendChatBtn.disabled = true;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-msg ai-msg';
    loadingDiv.innerHTML = '<p><i>Thinking <span class="ai-sparkle">✨</span>...</i></p>';
    DOMElements.chatMessages.appendChild(loadingDiv);
    DOMElements.chatMessages.scrollTop = DOMElements.chatMessages.scrollHeight;

    // Build context payload
    const q = questions[currentQuestionIndex];
    let contextStr = `Context:\nYou are a highly skilled Google Cloud architecture tutor.\nThe student is studying for the Professional Cloud Security Engineer exam.\n\nThey are currently looking at this question:\n${q.question}\n\nOptions:\n`;
    Object.entries(q.options).forEach(([k, v]) => {
        contextStr += `- ${k}: ${v}\n`;
    });
    contextStr += `\nThe strictly correct answer is: ${q.answer}\n`;
    if (q.explanations) {
        contextStr += `Official Explanations provided in the quiz:\n`;
        Object.entries(q.explanations).forEach(([k, exp]) => {
            contextStr += `- Option ${k}: ${exp.text}\n`;
        });
    }

    const fullPrompt = `${contextStr}\n\nThe student asks: "${prompt}"\n\nPlease provide a clear, concise, and helpful tutoring response. Ensure you use facts accurate to Google Cloud Platform.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${chatApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                systemInstruction: { parts: [{ text: "You are an expert Google Cloud Authorized Trainer tutoring a student. Keep answers focused, engaging, and strictly factual to GCP documentation. Format with markdown if needed for readability, but do not use massive headers that crowd the small chat window." }] },
                generationConfig: { temperature: 0.2 }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'API Error');
        }

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        loadingDiv.remove();
        appendMessage(aiText, false);

    } catch (error) {
        loadingDiv.remove();
        console.error(error);
        if (error.message.includes("API key not valid")) {
            appendMessage("⚠️ Error: The API key provided is invalid or expired. Please reset your API key and try again.");
        } else {
            appendMessage(`⚠️ Error: Could not connect to Gemini API. (${error.message})`);
        }
    } finally {
        DOMElements.sendChatBtn.disabled = false;
        DOMElements.chatInput.focus();
    }
}

// Chat event listeners
DOMElements.askAiBtn.addEventListener('click', toggleChat);
DOMElements.closeChatBtn.addEventListener('click', toggleChat);
DOMElements.saveApiKeyBtn.addEventListener('click', saveApiKey);
DOMElements.resetApiBtn.addEventListener('click', resetApiKey);
DOMElements.sendChatBtn.addEventListener('click', sendChat);
DOMElements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
    }
});

// Start
init();
