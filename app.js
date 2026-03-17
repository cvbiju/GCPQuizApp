let originalQuestions = [];
let questions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let totalAnswered = 0;
let selectedOptions = new Set();
let isAnswerSubmitted = false;
let currentRange = { start: 1, end: null };

let selectedTags = new Set();
let timerInterval = null;
let secondsRemaining = 0;
let isExamMode = false;

const DOMElements = {
    globalHomeBtn: document.getElementById('globalHomeBtn'),
    appHeaderTitle: document.getElementById('appHeaderTitle'),
    appHeaderSubtitle: document.getElementById('appHeaderSubtitle'),
    loading: document.getElementById('loading'),
    quiz: document.getElementById('quiz'),
    summary: document.getElementById('summary'),
    libraryView: document.getElementById('library-view'),
    examGrid: document.getElementById('examGrid'),
    navCreateBtn: document.getElementById('navCreateBtn'),
    resetAppDataBtn: document.getElementById('resetAppDataBtn'),
    createView: document.getElementById('create-view'),
    createExamName: document.getElementById('createExamName'),
    createExamFile: document.getElementById('createExamFile'),
    triggerUploadBtn: document.getElementById('triggerUploadBtn'),
    uploadFileName: document.getElementById('uploadFileName'),
    createKeyContainer: document.getElementById('createKeyContainer'),
    editCreateKeyBtn: document.getElementById('editCreateKeyBtn'),
    createKeyInputArea: document.getElementById('createKeyInputArea'),
    createApiKeyInput: document.getElementById('createApiKeyInput'),
    saveCreateKeyBtn: document.getElementById('saveCreateKeyBtn'),
    createKeySuccess: document.getElementById('createKeySuccess'),
    createKeySuccess: document.getElementById('createKeySuccess'),
    createStep1: document.getElementById('createStep1'),
    extractMasterBtn: document.getElementById('extractMasterBtn'),
    cancelCreateBtn: document.getElementById('cancelCreateBtn'),
    aiGenerationStatus: document.getElementById('aiGenerationStatus'),
    aiGenerationText: document.getElementById('aiGenerationText'),
    setupView: document.getElementById('setup-view'),
    activeExamTitle: document.getElementById('activeExamTitle'),
    setupTotalCount: document.getElementById('setupTotalCount'),
    backToLibraryBtn: document.getElementById('backToLibraryBtn'),
    historyView: document.getElementById('history-view'),
    resumeCont: document.getElementById('resumeCont'),
    resumeDetails: document.getElementById('resumeDetails'),
    resumeBtn: document.getElementById('resumeBtn'),
    weaknessesCont: document.getElementById('weaknessesCont'),
    retakeMissedBtn: document.getElementById('retakeMissedBtn'),
    missedCount: document.getElementById('missedCount'),
    setupTopicFilters: document.getElementById('setupTopicFilters'),
    examModeToggle: document.getElementById('examModeToggle'),
    questionStatusBadge: document.getElementById('questionStatusBadge'),
    examTimer: document.getElementById('examTimer'),
    timerText: document.getElementById('timerText'),
    setupQuestionCount: document.getElementById('setupQuestionCount'),
    setupRandomizeGrid: document.getElementById('setupRandomizeGrid'),
    startNewBtn: document.getElementById('startNewBtn'),
    viewHistoryBtn: document.getElementById('viewHistoryBtn'),
    backFromHistoryBtn: document.getElementById('backFromHistoryBtn'),
    historyList: document.getElementById('historyList'),
    quizNotes: document.getElementById('quizNotes'),
    saveHistoryBtn: document.getElementById('saveHistoryBtn'),
    questionText: document.getElementById('questionText'),
    optionsCont: document.getElementById('optionsCont'),
    submitBtn: document.getElementById('submitBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    reviewQuizBtn: document.getElementById('reviewQuizBtn'),
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
    DOMElements.loading.classList.add('hidden');
    renderLibrary();
}

function renderLibrary() {
    DOMElements.setupView.classList.add('hidden');
    DOMElements.createView.classList.add('hidden');
    DOMElements.summary.classList.add('hidden');
    DOMElements.historyView.classList.add('hidden');
    DOMElements.quiz.classList.add('hidden');
    DOMElements.scoreboard.classList.add('hidden');
    
    DOMElements.libraryView.classList.remove('hidden');
    DOMElements.examGrid.innerHTML = '';

    // Render Custom Exams from LocalStorage
    const customExams = JSON.parse(localStorage.getItem('quiz_custom_exams') || '[]');
    
    if (customExams.length === 0) {
        DOMElements.examGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1 / -1;">No exams found. Click "Build Custom Exam" to generate your first study guide!</p>';
    } else {
        customExams.forEach((exam, idx) => {
            const card = createExamCard(exam.title, exam.questions.length, 'AI Generated', () => {
                // Re-map indices just in case
                exam.questions.forEach((q, i) => q.originalIndex = i + 1);
                loadExamToSetup(exam.title, exam.questions);
            });
            DOMElements.examGrid.appendChild(card);
        });
    }
}

function createExamCard(title, count, tagText, onClick) {
    const div = document.createElement('div');
    div.className = 'exam-card';
    div.innerHTML = `
        <span class="exam-tag">${tagText}</span>
        <h3 style="margin-bottom: 0.5rem; padding-right: 3rem; color: var(--text-primary); font-size: 1.1rem; line-height: 1.4;">${title}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">${count} Questions</p>
    `;
    div.addEventListener('click', onClick);
    return div;
}

function loadExamToSetup(title, examQuestionsArray) {
    DOMElements.libraryView.classList.add('hidden');
    DOMElements.activeExamTitle.textContent = title;
    
    // Update main application header
    DOMElements.appHeaderTitle.textContent = title;
    if (title === 'GCP Security Engineer') {
        DOMElements.appHeaderSubtitle.textContent = 'Exam Prep Topics';
    } else {
        DOMElements.appHeaderSubtitle.textContent = 'Custom AI Assessment';
    }
    
    originalQuestions = examQuestionsArray;
    
    DOMElements.setupQuestionCount.max = originalQuestions.length;
    DOMElements.setupQuestionCount.value = Math.min(50, originalQuestions.length);
    DOMElements.setupTotalCount.textContent = originalQuestions.length;

    // Extract unique tags for this specific exam
    const allTags = new Set();
    originalQuestions.forEach(q => {
        if (q.tags) q.tags.forEach(t => allTags.add(t));
    });
    renderTagFilters(Array.from(allTags).sort());

    checkSavedSession();
    checkWeaknesses();
    DOMElements.setupView.classList.remove('hidden');
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
    let count = parseInt(DOMElements.setupQuestionCount.value) || 50;

    // Apply Tag Filters if any are selected
    let baseQuestions = originalQuestions;
    if (selectedTags.size > 0) {
        baseQuestions = originalQuestions.filter(q => q.tags && q.tags.some(t => selectedTags.has(t)));
    }
    
    if (baseQuestions.length === 0) {
        alert("No questions found for the selected topics.");
        return;
    }

    if (count > baseQuestions.length) count = baseQuestions.length;
    if (count < 1) count = 1;

    let pool = [...baseQuestions];
    if (DOMElements.setupRandomizeGrid.checked) {
        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
    }

    questions = pool.slice(0, count);
    currentRange = { start: 1, end: count }; // Logic semantic placeholder
    
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
    DOMElements.setupTopicFilters.innerHTML = '';
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
        DOMElements.setupTopicFilters.appendChild(lbl);
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

// --- Phase 7 Deterministic Hashing Logic ---
function hashQuestion(text) {
    let hash = 5381;
    // Strip all non-alphanumeric to normalize the footprint
    let str = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return 'qhash_' + (hash >>> 0).toString(16);
}

function getQuestionHistory(hash) {
    const analytics = JSON.parse(localStorage.getItem('quiz_global_analytics') || '{}');
    return analytics[hash];
}

function saveQuestionHistory(hash, isCorrect) {
    const analytics = JSON.parse(localStorage.getItem('quiz_global_analytics') || '{}');
    if (!analytics[hash]) {
        analytics[hash] = { seen: true, correct: 0, incorrect: 0 };
    }
    if (isCorrect) analytics[hash].correct += 1;
    else analytics[hash].incorrect += 1;
    
    localStorage.setItem('quiz_global_analytics', JSON.stringify(analytics));
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
    
    // --- Phase 7: History Badge Analytics ---
    const qHash = hashQuestion(q.question);
    const qHistory = getQuestionHistory(qHash);
    
    DOMElements.questionStatusBadge.classList.remove('hidden');
    if (!qHistory) {
        DOMElements.questionStatusBadge.textContent = '✨ Brand New';
        DOMElements.questionStatusBadge.style.backgroundColor = 'rgba(46, 160, 67, 0.2)';
        DOMElements.questionStatusBadge.style.color = '#3fb950';
        DOMElements.questionStatusBadge.style.borderColor = '#3fb950';
    } else {
        const totalAttempts = qHistory.correct + qHistory.incorrect;
        if (qHistory.incorrect > 0 || qHistory.correct < 3) {
            DOMElements.questionStatusBadge.textContent = `👀 Seen Before (${qHistory.correct}/${totalAttempts} Correct)`;
            DOMElements.questionStatusBadge.style.backgroundColor = 'rgba(210, 153, 34, 0.2)';
            DOMElements.questionStatusBadge.style.color = '#d29922';
            DOMElements.questionStatusBadge.style.borderColor = '#d29922';
        } else {
            DOMElements.questionStatusBadge.textContent = `✅ Mastered (${qHistory.correct}/${totalAttempts} Correct)`;
            DOMElements.questionStatusBadge.style.backgroundColor = 'rgba(88, 166, 255, 0.2)';
            DOMElements.questionStatusBadge.style.color = '#58a6ff';
            DOMElements.questionStatusBadge.style.borderColor = '#58a6ff';
        }
    }

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
    
    // Phase 8: Previous Navigation
    if (index > 0) {
        DOMElements.prevBtn.classList.remove('hidden');
    } else {
        DOMElements.prevBtn.classList.add('hidden');
    }

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

    // Phase 8: Restore Answered State for Review Mode
    if (q.userSelected) {
        q.userSelected.forEach(letter => {
            selectedOptions.add(letter);
            const btn = DOMElements.optionsCont.querySelector(`[data-letter="${letter}"]`);
            if (btn) btn.classList.add('selected');
        });
        
        // Temporarily adjust totalAnswered and userScore so submitAnswer() doesn't double-count
        totalAnswered--;
        if (q.isCorrect) userScore--;
        
        submitAnswer(); 
    }
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

    // Phase 8: Persist Answer State
    q.userSelected = Array.from(selectedOptions);

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
    
    q.isCorrect = isCompletelyCorrect;
    
    updateWeaknesses(q.originalIndex, isCompletelyCorrect);
    
    // Phase 7: Global Hash Analytics
    saveQuestionHistory(hashQuestion(q.question), isCompletelyCorrect);

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

DOMElements.navCreateBtn.addEventListener('click', () => {
    DOMElements.libraryView.classList.add('hidden');
    DOMElements.createView.classList.remove('hidden');
    
    // Manage inline API Key Setup
    DOMElements.createKeyContainer.classList.remove('hidden');
    if (chatApiKey) {
        DOMElements.createKeyInputArea.classList.add('hidden');
        DOMElements.createKeySuccess.classList.remove('hidden');
        DOMElements.editCreateKeyBtn.classList.remove('hidden');
    } else {
        DOMElements.createKeyInputArea.classList.remove('hidden');
        DOMElements.createKeySuccess.classList.add('hidden');
        DOMElements.editCreateKeyBtn.classList.add('hidden');
        DOMElements.createApiKeyInput.value = '';
    }
});

DOMElements.editCreateKeyBtn.addEventListener('click', () => {
    DOMElements.createKeyInputArea.classList.remove('hidden');
    DOMElements.createKeySuccess.classList.add('hidden');
    DOMElements.editCreateKeyBtn.classList.add('hidden');
    DOMElements.createApiKeyInput.value = chatApiKey || '';
});

DOMElements.saveCreateKeyBtn.addEventListener('click', () => {
    const key = DOMElements.createApiKeyInput.value.trim();
    if (!key) return;
    
    chatApiKey = key;
    localStorage.setItem('gcp_quiz_gemini_key', key);
    DOMElements.createKeyInputArea.classList.add('hidden');
    DOMElements.createKeySuccess.classList.remove('hidden');
    DOMElements.editCreateKeyBtn.classList.remove('hidden');
});

DOMElements.cancelCreateBtn.addEventListener('click', () => {
    DOMElements.createView.classList.add('hidden');
    DOMElements.libraryView.classList.remove('hidden');
    DOMElements.createExamName.value = '';
    DOMElements.uploadFileName.textContent = '';
    DOMElements.createExamFile.value = '';
    DOMElements.triggerUploadBtn.textContent = 'Select PDF File';
    DOMElements.extractMasterBtn.disabled = true;
    
    // Reset UI
    DOMElements.extractMasterBtn.innerHTML = '<span>⚡</span> Extract Master Bank';
    DOMElements.aiGenerationStatus.classList.add('hidden');
    customPdfText = '';
});

DOMElements.backToLibraryBtn.addEventListener('click', () => {
    DOMElements.setupView.classList.add('hidden');
    renderLibrary();
});

DOMElements.globalHomeBtn.addEventListener('click', () => {
    // If currently taking a quiz, save the state before navigating away
    if (!DOMElements.quiz.classList.contains('hidden')) {
        clearInterval(timerInterval);
        saveActiveState();
    }
    renderLibrary();
});

DOMElements.viewHistoryBtn.addEventListener('click', showHistoryView);
DOMElements.backFromHistoryBtn.addEventListener('click', () => {
    DOMElements.historyView.classList.add('hidden');
    DOMElements.setupView.classList.remove('hidden');
    checkSavedSession();
});

// --- Phase 6 Custom Exam Two-Step Creation Logic ---

let customPdfText = '';

DOMElements.triggerUploadBtn.addEventListener('click', () => {
    DOMElements.createExamFile.click();
});

DOMElements.createExamFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        DOMElements.uploadFileName.textContent = '';
        DOMElements.extractMasterBtn.disabled = true;
        customPdfText = '';
        return;
    }

    if (file.type !== 'application/pdf') {
        alert("Please select a valid PDF file.");
        DOMElements.createExamFile.value = '';
        return;
    }

    DOMElements.uploadFileName.textContent = `Attached: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    DOMElements.extractMasterBtn.disabled = false;
});

async function extractTextFromPDF(pdfDataUrl) {
    DOMElements.aiGenerationText.textContent = 'Reading PDF structure...';
    try {
        const loadingTask = pdfjsLib.getDocument(pdfDataUrl);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
            DOMElements.aiGenerationText.textContent = `Extracting text: Page ${i} of ${numPages}`;
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        return fullText;
    } catch (err) {
        console.error("PDF Extraction Error:", err);
        throw new Error("Unable to read PDF file. It might be corrupted or protected.");
    }
}

// STEP 1: Master Extraction Logic
DOMElements.extractMasterBtn.addEventListener('click', async () => {
    const file = DOMElements.createExamFile.files[0];
    const title = DOMElements.createExamName.value.trim();
    if (!file || !title) {
        alert("Please provide both an Exam Name and a PDF file.");
        return;
    }

    if (!chatApiKey) {
        alert("Please configure your Gemini API Key in the setup box before extracting.");
        return;
    }

    try {
        DOMElements.extractMasterBtn.disabled = true;
        DOMElements.extractMasterBtn.innerHTML = '<span>⏳</span> Extracting Master Bank...';
        DOMElements.aiGenerationStatus.classList.remove('hidden');
        DOMElements.cancelCreateBtn.disabled = true;

        // 1. Read PDF locally
        const pdfDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        customPdfText = await extractTextFromPDF(pdfDataUrl);
        
        if (customPdfText.length < 50) {
            throw new Error("Could not extract enough text. The PDF might be scanned images instead of text.");
        }

        // Chunking
        const chunkSize = 40000; // characters
        const chunks = [];
        for (let i = 0; i < customPdfText.length; i += chunkSize) {
            chunks.push(customPdfText.substring(i, i + chunkSize));
        }

        let allQuestions = [];
        
        const systemPrompt = `You are a strict data structuring AI. Your job is to extract multiple choice questions from the following educational document chunk.
        
        CRITICAL INSTRUCTIONS:
        1. DO NOT change the language, rephrase, or rewrite the questions/options. Extract the raw text exactly VERBATIM as it appears in the text.
        2. Extract ALL distinct multiple choice questions found in this chunk.
        3. DO NOT output conversational text or markdown. Output ONLY a raw JSON array. If no questions are found, output an empty array [].
        4. Make sure 'answer' is simply the correct letter.
        5. You MUST write a custom 'hint' for every single question to help guide the student.
        
        SCHEMA STUCTURE PER QUESTION:
        {
          "question": "The question text verbatim...",
          "options": {
            "A": "Option text verbatim",
            "B": "Option text verbatim"
          },
          "answer": "B",
          "explanations": {
            "A": "Why A is wrong...",
            "B": "Why B is correct..."
          },
          "hint": "A subtle clue...",
          "tags": ["Applicable Category Name"]
        }`;

        for (let i = 0; i < chunks.length; i++) {
            DOMElements.aiGenerationText.textContent = `Analyzing Chunk ${i + 1} of ${chunks.length} via AI (${Math.round(((i)/chunks.length)*100)}%)`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${chatApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: "Extract questions per instructions:\n\n" + chunks[i] }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                console.warn(`Chunk ${i+1} failed API response`);
                continue;
            }

            const data = await response.json();
            const aiJsonStr = data.candidates[0].content.parts[0].text;
            
            try {
                const chunkQuestions = JSON.parse(aiJsonStr);
                if (Array.isArray(chunkQuestions)) {
                    allQuestions = allQuestions.concat(chunkQuestions);
                }
            } catch(e) {
                console.warn(`Failed to parse chunk ${i+1} JSON`);
            }
        }
        
        if (allQuestions.length === 0) {
            throw new Error("AI failed to find valid questions in the text.");
        }

        const tagCounts = {};
        allQuestions.forEach((q, idx) => {
            q.originalIndex = idx + 1;
            if (!q.tags || !Array.isArray(q.tags) || q.tags.length === 0) {
                q.tags = ["General"];
            }
            q.tags.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1);
        });

        const customExamObj = {
            id: 'exam_' + Date.now(),
            title: title + ` (${allQuestions.length} Qs)`,
            questions: allQuestions
        };

        const existingCustoms = JSON.parse(localStorage.getItem('quiz_custom_exams') || '[]');
        existingCustoms.push(customExamObj);
        localStorage.setItem('quiz_custom_exams', JSON.stringify(existingCustoms));

        // Format summary alert
        let successMsg = `Success! Extracted ${allQuestions.length} master questions.\n\nTopic Breakdown:\n`;
        Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).forEach(([tag, count]) => {
            successMsg += `- ${tag}: ${count}\n`;
        });
            
        alert(successMsg);
        
        // Reset and return
        DOMElements.cancelCreateBtn.disabled = false;
        DOMElements.extractMasterBtn.disabled = false;
        DOMElements.extractMasterBtn.innerHTML = '<span>⚡</span> Extract Master Bank';
        DOMElements.aiGenerationStatus.classList.add('hidden');
        DOMElements.cancelCreateBtn.click(); // Uses existing navigation cleaner
        renderLibrary(); // Re-draw library

    } catch (err) {
        console.error(err);
        alert(`Extraction Failed: ${err.message}`);
        DOMElements.cancelCreateBtn.disabled = false;
        DOMElements.extractMasterBtn.disabled = false;
        DOMElements.extractMasterBtn.innerHTML = '<span>⚡</span> Extract Master Bank';
        DOMElements.aiGenerationStatus.classList.add('hidden');
    }
});

// ------------------------------------------

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

// Phase 8: Previous Navigation
DOMElements.prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
});

// Phase 8: Review Responses Navigation
DOMElements.reviewQuizBtn.addEventListener('click', () => {
    DOMElements.summary.classList.add('hidden');
    DOMElements.quiz.classList.remove('hidden');
    isExamMode = false; // Disable any active timers
    loadQuestion(0);
});

// App Data Management
DOMElements.resetAppDataBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all generated exams, progress history, and AI configurations? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
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
