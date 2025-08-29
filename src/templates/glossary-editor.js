const vscode = acquireVsCodeApi();
let allTerms = {{TERMS_DATA}};
let filteredTerms = [...allTerms];

// Search functionality
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterTerms(searchTerm, getActiveFilter());
});

// Filter functionality
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        filterTerms(document.getElementById('searchInput').value.toLowerCase(), this.dataset.filter);
    });
});

function getActiveFilter() {
    const activeButton = document.querySelector('.filter-button.active');
    return activeButton ? activeButton.dataset.filter : 'all';
}

function filterTerms(searchTerm, filterType) {
    filteredTerms = allTerms.filter(term => {
        const matchesSearch = !searchTerm ||
            term.term.toLowerCase().includes(searchTerm) ||
            term.definition.toLowerCase().includes(searchTerm);

        if (!matchesSearch) return false;

        switch (filterType) {
            case 'high':
                return (term.confidence || 0) >= 0.8;
            case 'medium':
                return (term.confidence || 0) >= 0.6 && (term.confidence || 0) < 0.8;
            case 'low':
                return (term.confidence || 0) < 0.6;
            default:
                return true;
        }
    });

    renderTerms();
}

function renderTerms() {
    const container = document.getElementById('termsContainer');
    if (filteredTerms.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No Matching Terms</h2>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredTerms.map(term => renderTermCard(term)).join('');
    }
}

function renderTermCard(term) {
    const confidence = term.confidence || 0;
    const confidenceClass = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
    const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';

    return `
        <div class="term-card" data-term-id="${term.id}">
            <div class="term-header">
                <div>
                    <div class="term-title">${term.term}</div>
                    <div class="term-meta">
                        <span>From: ${term.sourceFileUri.split('/').pop()}</span>
                        ${term.scope ? `<span> • Scope: ${term.scope}</span>` : ''}
                        <span class="confidence-badge confidence-${confidenceClass}">${confidenceLabel}</span>
                        ${term.pattern ? `<span class="pattern-badge">${term.pattern}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="term-definition">${term.definition}</div>
            <div class="term-actions">
                <button class="action-button primary" onclick="acceptTerm('${term.id}')">Accept</button>
                <button class="action-button secondary" onclick="editTerm('${term.id}')">Edit</button>
                <button class="action-button danger" onclick="rejectTerm('${term.id}')">Reject</button>
            </div>
        </div>
    `;
}

function acceptTerm(termId) {
    vscode.postMessage({
        type: 'acceptTerm',
        data: { termId }
    });
}

function editTerm(termId) {
    vscode.postMessage({
        type: 'editTerm',
        data: { termId }
    });
}

function rejectTerm(termId) {
    vscode.postMessage({
        type: 'rejectTerm',
        data: { termId }
    });
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
        case 'updateTerms':
            allTerms = message.data.terms;
            filterTerms(document.getElementById('searchInput').value.toLowerCase(), getActiveFilter());
            break;
        case 'termUpdated':
            // Refresh the specific term card
            const termCard = document.querySelector(`[data-term-id="${message.data.termId}"]`);
            if (termCard) {
                // Update the term in our local data
                const index = allTerms.findIndex(t => t.id === message.data.termId);
                if (index !== -1) {
                    allTerms[index] = message.data.term;
                    filterTerms(document.getElementById('searchInput').value.toLowerCase(), getActiveFilter());
                }
            }
            break;
    }
});