let questions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let totalAnswered = 0;
let selectedOptions = new Set();
let isAnswerSubmitted = false;

const DOMElements = {
    loading: document.getElementById('loading'),
    quiz: document.getElementById('quiz'),
    summary: document.getElementById('summary'),
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
        questions = rawData.filter(q => q.explanations);
        
        if (questions.length === 0) {
            throw new Error('No valid questions found');
        }

        // Add small delay for UI smoothness
        setTimeout(() => {
            DOMElements.loading.classList.add('hidden');
            DOMElements.quiz.classList.remove('hidden');
            DOMElements.scoreboard.classList.remove('hidden');
            updateSidebarScore();
            loadQuestion(0);
        }, 800);
        
    } catch (err) {
        console.error(err);
        DOMElements.loading.innerHTML = '<p style="color:var(--accent-red)">Error loading questions. Please ensure a local server is running.</p>';
    }
}

function loadQuestion(index) {
    if (index >= questions.length) {
        showSummary();
        return;
    }

    const q = questions[index];
    currentQuestionIndex = index;
    isAnswerSubmitted = false;
    selectedOptions.clear();

    // Reset UI
    DOMElements.questionText.textContent = `${index + 1}. ${q.question}`;
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
    DOMElements.quiz.classList.add('hidden');
    DOMElements.summary.classList.remove('hidden');
    DOMElements.progressBar.style.width = `100%`;
    DOMElements.progressText.textContent = `Completed!`;
    DOMElements.finalScoreText.textContent = `${userScore} / ${questions.length}`;
}

// Event Listeners
DOMElements.submitBtn.addEventListener('click', submitAnswer);
DOMElements.nextBtn.addEventListener('click', () => loadQuestion(currentQuestionIndex + 1));
DOMElements.restartBtn.addEventListener('click', () => {
    userScore = 0;
    totalAnswered = 0;
    updateSidebarScore();
    DOMElements.summary.classList.add('hidden');
    DOMElements.quiz.classList.remove('hidden');
    loadQuestion(0);
});

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
