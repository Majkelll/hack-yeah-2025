// Mocked Facebook Scam Detector Content Script

// Global overlay element to block background interaction
let overlay = null;
let currentPopup = null;

// Nowa, bogatsza lista analiz
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
    
    // Click on overlay removes the popup
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
  // If a popup is already open, close it first
  if (currentPopup) {
    removePopup();
  }
  
  // 1. Create overlay
  createOverlay();

  // 2. Create and position popup
  const popup = document.createElement('div');
  popup.className = 'scam-popup';
  popup.style.display = 'block';
  
  const statusClass = colorClass.replace('scam-', 'status-');
  const progressClass = colorClass.replace('scam-', '');
  const botProbability = rating * 20;
  
  // Generowanie listy analiz
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
  // Find the comment container
  const commentContainer = commentElement.closest('[data-testid="UFI2Comment"]') ||
                           commentElement.closest('[role="article"]') ||
                           commentElement.parentElement;

  if (commentContainer.querySelector('.scam-badge')) return; // Avoid duplicates

  // Find the user name element
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
  if (!actorElement) return; // No actor found, skip

  const rating = Math.floor(Math.random() * 5) + 1; // Random 1-5
  const explanations = [
    "Konto utworzone niedawno, zwiększone ryzyko oszustwa.",
    "Komentarz zawiera podejrzane linki prowadzące do phishingu.",
    "Użyty język jest zbyt promocyjny lub pilny.",
    "Post obiecuje nierealistyczne nagrody lub możliwości.",
    "Źródło wydaje się niezweryfikowane lub anonimowe.",
    "Wysokie podobieństwo do znanych schematów oszustw."
  ];
  const explanation = explanations[Math.floor(Math.random() * explanations.length)];

  // Losowanie statusu: 1/5 (20%) na Trolla, 2/5 (40%) na Bota, 1/5 (20%) na Nie Wiem, 1/5 (20%) na Legit
  const statusRoll = Math.floor(Math.random() * 5); // 0, 1, 2, 3, 4
  let finalRating; // Używamy innej nazwy, aby uniknąć konfliktu z ratingiem losowanym wcześniej

  let label, emoji, colorClass, highlightClass;

  if (statusRoll === 0) { // 20% szans
      label = 'Russian Troll';
      emoji = '🔥'; // Zmienione na Ogień
      colorClass = 'scam-troll';
      highlightClass = 'scam-highlight-troll';
      finalRating = 5; // Najwyższe prawdopodobieństwo bota
  } else {
      finalRating = rating; // Używamy ratingu z losowania 1-5
      
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
  
  // Add event listeners for popup and overlay
  // Używamy click, aby pop-up był stabilny i można było go zamknąć kliknięciem w overlay
  badge.addEventListener('click', (e) => {
    e.preventDefault(); // Zablokuj domyślne działanie (np. przejście do linku)
    e.stopPropagation(); // Zablokuj propagację do nadrzędnych elementów
    showPopup(badge, label, emoji, explanation, finalRating, colorClass);
  });
  
  // Dodajemy podświetlenie komentarza
  commentContainer.classList.add(highlightClass);

  // 1. Tworzymy kontener Flexbox
  const wrapper = document.createElement('span');
  wrapper.style.display = 'inline-flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '5px'; // Mały odstęp

  // 2. Wstawiamy wrapper w miejsce actorElement
  actorElement.parentNode.insertBefore(wrapper, actorElement);

  // 3. Przenosimy actorElement i badge do wrappera
  wrapper.appendChild(actorElement);
  wrapper.appendChild(badge);
}

function scanComments() {
  // Facebook comment selectors (may need adjustment based on FB updates)
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

// Initial scan
scanComments();

// Observe for new comments
const observer = new MutationObserver(scanComments);
observer.observe(document.body, { childList: true, subtree: true });
