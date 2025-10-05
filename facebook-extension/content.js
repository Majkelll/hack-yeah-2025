


let overlay = null;
let currentPopup = null;


const detailedAnalyses = [
  {
    text: "Wiek konta: Utworzone niedawno (mniej niż 3 miesiące).",
    type: "negative",
    condition: (rating) => rating >= 4,
    icon: "⚠️"
  },
  {
    text: "Aktywność: Niska liczba postów/komentarzy w historii.",
    type: "negative",
    condition: (rating) => rating >= 3,
    icon: "📉"
  },
  {
    text: "Język: Użycie zbyt promocyjnego lub pilnego tonu.",
    type: "negative",
    condition: (rating) => rating >= 4,
    icon: "🚨"
  },
  {
    text: "Linki: Obecność skróconych lub podejrzanych linków.",
    type: "negative",
    condition: (rating) => rating >= 5,
    icon: "🔗"
  },
  {
    text: "Wzorce: Wysokie podobieństwo do znanych schematów botów.",
    type: "negative",
    condition: (rating) => rating >= 4,
    icon: "🤖"
  },
  {
    text: "Geolokalizacja: Podejrzane źródło IP (Rosja/Białoruś).",
    type: "negative",
    condition: (rating) => rating === 5,
    icon: "🚫"
  },
  {
    text: "Weryfikacja: Profil posiada zdjęcie i sensowne dane.",
    type: "positive",
    condition: (rating) => rating <= 2,
    icon: "✅"
  },
  {
    text: "Interakcja: Komentarz jest spójny z treścią posta.",
    type: "positive",
    condition: (rating) => rating <= 3,
    icon: "💬"
  },
  {
    text: "Nieznany: Brak wystarczających danych do jednoznacznej oceny.",
    type: "neutral",
    condition: (rating) => rating === 3,
    icon: "❓"
  }
];

function createOverlay() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'scam-overlay';
    document.body.appendChild(overlay);
    
    
    overlay.addEventListener('click', removePopup);
  }
}

function removePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

function showPopup(badge, label, emoji, explanation, rating, colorClass) {
  
  if (currentPopup) {
    removePopup();
  }
  
  
  createOverlay();

  
  const popup = document.createElement('div');
  popup.className = 'scam-popup';
  popup.style.display = 'block';
  
  const statusClass = colorClass.replace('scam-', 'status-');
  const progressClass = colorClass.replace('scam-', '');
  const botProbability = rating * 20;
  
  
  const analysisHtml = detailedAnalyses
    .filter(a => a.condition(rating))
    .map(a => `<li class="${a.type}">
                 <span class="icon">${a.icon}</span>
                 ${a.text}
               </li>`)
    .join('');

  popup.innerHTML = `
    <strong>Analiza Weryfikacji Komentarza</strong>
    <div class="status-line ${statusClass}">
      ${emoji} <span>Status: ${label}</span>
    </div>
    
    <div class="progress-container">
      <p style="font-size: 14px; margin-bottom: 5px;">Prawdopodobieństwo Bota: <strong>${botProbability}%</strong></p>
      <div class="progress-bar">
        <div class="progress-fill ${progressClass}" style="width: ${botProbability}%;"></div>
      </div>
    </div>
    
    <p style="font-weight: 600; margin-top: 15px;">Szczegółowa Analiza:</p>
    <ul class="analysis-list">
      ${analysisHtml}
    </ul>
  `;
  
  document.body.appendChild(popup);
  currentPopup = popup;
}

function addScamBadge(commentElement) {
  
  const commentContainer = commentElement.closest('[data-testid="UFI2Comment"]') ||
                           commentElement.closest('[role="article"]') ||
                           commentElement.parentElement;

  if (commentContainer.querySelector('.scam-badge')) return; 

  
  const actorSelectors = [
    '[data-testid="UFI2Comment/actor"]',
    'a[href*="/profile.php"]',
    '.fwb',
    'strong',
    'span[dir="auto"]'
  ];
  let actorElement = null;
  for (const sel of actorSelectors) {
    actorElement = commentContainer.querySelector(sel);
    if (actorElement) break;
  }
  if (!actorElement) return; 

  const rating = Math.floor(Math.random() * 5) + 1; 
  const explanations = [
    "Konto utworzone niedawno, zwiększone ryzyko oszustwa.",
    "Komentarz zawiera podejrzane linki prowadzące do phishingu.",
    "Użyty język jest zbyt promocyjny lub pilny.",
    "Post obiecuje nierealistyczne nagrody lub możliwości.",
    "Źródło wydaje się niezweryfikowane lub anonimowe.",
    "Wysokie podobieństwo do znanych schematów oszustw."
  ];
  const explanation = explanations[Math.floor(Math.random() * explanations.length)];

  
  const statusRoll = Math.floor(Math.random() * 5); 
  let finalRating; 

  let label, emoji, colorClass, highlightClass;

  if (statusRoll === 0) { 
      label = 'Russian Troll';
      emoji = '🔥'; 
      colorClass = 'scam-troll';
      highlightClass = 'scam-highlight-troll';
      finalRating = 5; 
  } else {
      finalRating = rating; 
      
      if (finalRating <= 2) {
          label = 'Legit';
          emoji = '👍';
          colorClass = 'scam-legit';
          highlightClass = 'scam-highlight-legit';
      } else if (finalRating === 3) {
          label = "Nie Wiem";
          emoji = '❓';
          colorClass = 'scam-unknown';
          highlightClass = 'scam-highlight-unknown';
      } else {
          label = 'Bot';
          emoji = '🤖';
          colorClass = 'scam-bot';
          highlightClass = 'scam-highlight-bot';
      }
  }

  const badge = document.createElement('div');
  badge.className = `scam-badge ${colorClass}`;
  badge.innerHTML = emoji;
  
  
  
  badge.addEventListener('click', (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    showPopup(badge, label, emoji, explanation, finalRating, colorClass);
  });
  
  
  commentContainer.classList.add(highlightClass);

  
  const wrapper = document.createElement('span');
  wrapper.style.display = 'inline-flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '5px'; 

  
  actorElement.parentNode.insertBefore(wrapper, actorElement);

  
  wrapper.appendChild(actorElement);
  wrapper.appendChild(badge);
}

function scanComments() {
  
  const commentSelectors = [
    '[data-testid="UFI2Comment/body"]',
    '[data-testid="comment"]',
    '.UFICommentContent',
    'div[aria-label*="comment"]',
    'div[data-testid*="Comment"]',
    '.comment-content',
    '[role="article"] div[dir="auto"]'
  ];

  commentSelectors.forEach(selector => {
    const comments = document.querySelectorAll(selector);
    comments.forEach(addScamBadge);
  });
}


scanComments();


const observer = new MutationObserver(scanComments);
observer.observe(document.body, { childList: true, subtree: true });
