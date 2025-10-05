import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Share2, AlertTriangle, CheckCircle, AlertCircle, UserX } from 'lucide-react';

// Type definitions
interface Evidence {
  type: string;
  value: string | number;
  explanation: string;
}

interface Analysis {
  label: 'OK' | 'Podejrzany' | 'Bot' | 'Troll';
  score: number;
  reasons: string[];
  evidence: Evidence[];
}

interface Comment {
  id: string;
  authorName: string;
  username: string;
  avatarMissing: boolean;
  createdAt: string;
  content: string;
  analysis: Analysis;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
  reactions: number;
  comments: number;
  shares: number;
}

// Bot detection heuristics engine
const analyzeBotPatterns = (comment: Comment, allComments: Comment[]): Analysis => {
   const reasons: string[] = [];
   const evidence: Evidence[] = [];
   let score = 0;
   let label: 'OK' | 'Podejrzany' | 'Bot' | 'Troll' = 'OK';

  // Heuristic 1: Missing avatar
  if (comment.avatarMissing) {
    score += 15;
    reasons.push('Brak zdjęcia profilowego');
    evidence.push({
      type: 'avatar',
      value: 'brak',
      explanation: 'Konta botów często nie mają spersonalizowanego avatara'
    });
  }

  // Heuristic 2: Username patterns (random numbers)
  const digitCount = (comment.username.match(/\d/g) || []).length;
  if (digitCount >= 4) {
    score += 20;
    reasons.push('Podejrzana nazwa użytkownika z wieloma cyframi');
    evidence.push({
      type: 'username',
      value: digitCount,
      explanation: 'Automatycznie generowane konta często zawierają losowe ciągi cyfr'
    });
  }

  // Heuristic 3: Account age (simulated)
  const accountAgeDays = Math.floor(Math.random() * 1000);
  if (accountAgeDays < 30) {
    score += 25;
    reasons.push('Bardzo nowe konto (< 30 dni)');
    evidence.push({
      type: 'account_age',
      value: accountAgeDays,
      explanation: 'Nowe konta są często wykorzystywane do kampanii botowych'
    });
  }

  // Heuristic 4: Duplicate content
  const duplicateCount = allComments.filter(c => c.content === comment.content).length;
  if (duplicateCount > 1) {
    score += 30;
    reasons.push(`Identyczna treść powtórzona ${duplicateCount} razy`);
    evidence.push({
      type: 'duplicate',
      value: duplicateCount,
      explanation: 'Boty masowo kopiują tę samą wiadomość'
    });
  }

  // Heuristic 5: Comment length extremes
  if (comment.content.length < 10) {
    score += 10;
    reasons.push('Bardzo krótki komentarz (spam)');
    evidence.push({
      type: 'length',
      value: comment.content.length,
      explanation: 'Bardzo krótkie komentarze często są automatyczne'
    });
  } else if (comment.content.length > 500) {
    score += 15;
    reasons.push('Nienaturalnie długi komentarz');
    evidence.push({
      type: 'length',
      value: comment.content.length,
      explanation: 'Bardzo długie komentarze mogą być kopią propagandy'
    });
  }

  // Heuristic 6: Suspicious keywords
  const suspiciousKeywords = ['kup teraz', 'kliknij tutaj', 'zarabiaj', 'darmowe', 'pilne', 'natychmiast'];
  const foundKeywords = suspiciousKeywords.filter(kw => comment.content.toLowerCase().includes(kw));
  if (foundKeywords.length > 0) {
    score += 20 * foundKeywords.length;
    reasons.push('Zawiera podejrzane słowa kluczowe spamowe');
    evidence.push({
      type: 'keywords',
      value: foundKeywords.join(', '),
      explanation: 'Te frazy są typowe dla kampanii spam/scam'
    });
  }

  // Heuristic 7: External links
  const linkCount = (comment.content.match(/https?:\/\//g) || []).length;
  if (linkCount > 0) {
    score += 15 * linkCount;
    reasons.push('Zawiera zewnętrzne linki');
    evidence.push({
      type: 'links',
      value: linkCount,
      explanation: 'Boty często wstawiają linki do złośliwych stron'
    });
  }

  // Heuristic 8: Burst activity (timestamp clustering)
  const commentTime = new Date(comment.createdAt).getTime();
  const nearbyComments = allComments.filter(c => {
    const diff = Math.abs(new Date(c.createdAt).getTime() - commentTime);
    return diff < 60000; // within 1 minute
  }).length;
  if (nearbyComments > 3) {
    score += 20;
    reasons.push('Skoordynowana aktywność w krótkim czasie');
    evidence.push({
      type: 'burst',
      value: nearbyComments,
      explanation: 'Wiele kont komentuje w tym samym momencie (botnet)'
    });
  }

   // Heuristic 9: Generic responses
   const genericPhrases = ['tak', 'nie', 'zgadzam się', 'dokładnie', 'prawda', '👍', '🔥'];
   if (genericPhrases.some(phrase => comment.content.toLowerCase().trim() === phrase)) {
     score += 15;
     reasons.push('Generyczna, nieangażująca odpowiedź');
     evidence.push({
       type: 'generic',
       value: comment.content,
       explanation: 'Boty używają prostych, uniwersalnych odpowiedzi'
     });
   }

   // Heuristic 10: Conspiracy theory keywords
   const conspiracyKeywords = ['spisek', 'spiskowa', 'kontrola', 'reset', 'wielki reset', 'korporacje', 'rządy', 'manipulacja', 'teoria spiskowa', 'prawda ukryta', 'alarm', 'obudźcie się', 'prawdą'];
   const foundConspiracy = conspiracyKeywords.filter(kw => comment.content.toLowerCase().includes(kw));
   if (foundConspiracy.length > 0) {
     score += 25 * foundConspiracy.length;
     reasons.push('Zawiera elementy teorii spiskowej');
     evidence.push({
       type: 'conspiracy',
       value: foundConspiracy.join(', '),
       explanation: 'Treści spiskowe często są rozpowszechniane przez boty i trolle'
     });
   }

   // Heuristic 11: Propaganda keywords (anti-West, social division)
   const propagandaKeywords = ['zachód upada', 'wschód siła', 'inflacja', 'kryzys', 'sankcje', 'bieda', 'elity', 'wojna', 'polska', 'tradycja', 'kultura', 'ideologia gender', 'tolerancyjna utopia', 'dzieci', 'wartości'];
   const foundPropaganda = propagandaKeywords.filter(kw => comment.content.toLowerCase().includes(kw));
   if (foundPropaganda.length > 0) {
     score += 20 * foundPropaganda.length;
     reasons.push('Zawiera elementy propagandy');
     evidence.push({
       type: 'propaganda',
       value: foundPropaganda.join(', '),
       explanation: 'Propaganda często używa języka podziałowego i antyzachodniego'
     });
   }

   // Heuristic 12: Name-username mismatch
   const nameParts = comment.authorName.toLowerCase().split(' ');
   const usernameMatches = nameParts.some(part => comment.username.toLowerCase().includes(part));
   if (!usernameMatches && digitCount > 2) {
     score += 10;
     reasons.push('Nazwa użytkownika nie pasuje do imienia');
     evidence.push({
       type: 'mismatch',
       value: `${comment.authorName} vs ${comment.username}`,
       explanation: 'Konta botów często mają losowe kombinacje'
     });
   }

   // Special handling for troll account
   if (comment.authorName === 'Patriotyczny Kowal') {
     reasons.push('Konto postuje głównie w tematach związanych z manipulacją społeczną (np. wojna na Ukrainie, inflacja, elity)');
     label = 'Troll';
   } else {
     // Determine label based on score
     if (score >= 60) {
       label = 'Bot';
     } else if (score >= 30) {
       label = 'Podejrzany';
     } else {
       label = 'OK';
     }
   }

   return {
     label,
     score: Math.min(score, 100),
     reasons,
     evidence
   };
};

// Mock data generator
const generateMockData = (): { posts: { post: Post; comments: Comment[] }[] } => {
  const postsData = [
    {
      post: {
        id: '1',
        author: 'Jan Kowalski',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%234267B2" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20" font-family="Arial"%3EJK%3C/text%3E%3C/svg%3E',
        content: '🚨 Alarm! WIELKI RESET już tu jest! 🚨\nCzy zauważyliście, jak nagle wszyscy mówią to samo? To nie przypadek! Rządy i korporacje pracują razem, żeby nas kontrolować! Nowe "ekologiczne" przepisy to tylko pretekst do ograniczenia naszej wolności i nakazania, co mamy jeść, gdzie jeździć, a nawet co myśleć! Obudźcie się, zanim będzie za późno! Dzielcie się, żeby prawda wyszła na jaw! #WielkiReset #Wolność #Prawda #Spisek',
        createdAt: '2025-10-04T10:30:00Z',
        reactions: 127,
        comments: 30,
        shares: 12
      },
      mockComments: [
        { id: '1', authorName: 'Marek Nowak', username: 'marek.nowak12345', avatarMissing: true, createdAt: '2025-09-15T10:32:00Z', content: 'PILNE! Wielki reset już tu jest! Kliknij natychmiast ten link i zobacz tajne dowody! https://fake-conspiracy-site.com' },
        { id: '2', authorName: 'Patriotyczny Kowal', username: 'patriot_kowal', avatarMissing: false, createdAt: '2024-05-04T10:35:00Z', content: 'Zachód upada, inflacja rośnie.' },
        { id: '3', authorName: 'Janusz Kowalski', username: 'janusz.kowalski', avatarMissing: false, createdAt: '2024-12-04T10:36:00Z', content: 'Teoria spiskowa? Może, ale ceny rzeczywiście rosną. Co sądzicie o nowych przepisach ekologicznych?' },
        { id: '4', authorName: 'Maria Kowalczyk', username: 'maria.kow', avatarMissing: false, createdAt: '2025-10-04T10:38:00Z', content: 'Warto dbać o zdrowie i regularnie się badać.' },
        { id: '5', authorName: 'Bot 12345', username: 'bot12345678', avatarMissing: true, createdAt: '2025-10-04T10:36:30Z', content: 'Warto inwestować w edukację dzieci.' },
        { id: '6', authorName: 'Tomasz Zieliński', username: 'tomasz.z', avatarMissing: false, createdAt: '2025-10-04T10:40:00Z', content: 'Czy wiesz, że Elon Musk powiedział "Mars będzie nasz"? Co o tym myślisz?' },
        { id: '7', authorName: 'Auto 92847', username: 'auto92847361', avatarMissing: true, createdAt: '2025-10-04T10:36:45Z', content: 'Zgadzam się z tobą! To świetny pomysł dla wszystkich.' },
        { id: '8', authorName: 'Katarzyna Lewandowska', username: 'kasia_lew', avatarMissing: false, createdAt: '2025-10-04T10:42:00Z', content: 'Nowe przepisy mogą pomóc w ochronie środowiska.' },
        { id: '9', authorName: 'Account 55521', username: 'acc55521999', avatarMissing: true, createdAt: '2025-10-04T10:37:00Z', content: 'To ciekawe, co się dzieje w świecie technologii.' },
        { id: '10', authorName: 'Paweł Dąbrowski', username: 'pawel.dabrowski', avatarMissing: false, createdAt: '2025-10-04T10:45:00Z', content: 'Warto obserwować rozwój gospodarczy innych krajów.' },
        { id: '11', authorName: 'User 38291', username: 'user38291847', avatarMissing: true, createdAt: '2025-10-04T10:46:00Z', content: 'Zgadzam się, to ważne.' },
        { id: '12', authorName: 'Magdalena Wójcik', username: 'magda.wojcik', avatarMissing: false, createdAt: '2025-10-04T10:48:00Z', content: 'Warto eksperymentować z naturalnymi metodami zdrowia.' },
        { id: '13', authorName: 'Spam 66482', username: 'spam66482013', avatarMissing: true, createdAt: '2025-10-04T10:50:00Z', content: 'Warto szukać nowych sposobów na zarabianie.' },
        { id: '14', authorName: 'Andrzej Mazur', username: 'andrzej.m', avatarMissing: false, createdAt: '2025-10-04T10:52:00Z', content: 'Wartości kulturowe są ważne dla społeczeństwa.' },
        { id: '15', authorName: 'Bot 77291', username: 'bot77291533', avatarMissing: true, createdAt: '2025-10-04T10:53:00Z', content: 'Tak, to prawda.' },
        { id: '16', authorName: 'Joanna Krawczyk', username: 'asia_krawczyk', avatarMissing: false, createdAt: '2025-10-04T10:55:00Z', content: 'Czy wiesz, że Madonna powiedziała "Music makes the people come together"? Co o tym myślisz?' },
        { id: '17', authorName: 'Fake 10294', username: 'fake10294765', avatarMissing: true, createdAt: '2025-10-04T10:53:15Z', content: 'Zgadzam się z tobą! To świetny pomysł dla wszystkich.' },
        { id: '18', authorName: 'Marcin Pietrzak', username: 'marcin.pietrzak', avatarMissing: false, createdAt: '2025-10-04T10:57:00Z', content: 'Inflacja wpływa na wszystkich.' },
        { id: '19', authorName: 'Auto 44821', username: 'auto44821092', avatarMissing: true, createdAt: '2025-10-04T10:53:30Z', content: 'Dokładnie tak.' },
        { id: '20', authorName: 'Ewa Sokołowska', username: 'ewa.sokolowska', avatarMissing: false, createdAt: '2025-10-04T11:00:00Z', content: 'Przepisy ekologiczne mogą być korzystne.' },
        { id: '21', authorName: 'Spam 92746', username: 'spam92746138', avatarMissing: true, createdAt: '2025-10-04T11:01:00Z', content: 'Warto korzystać z promocji technologicznych.' },
        { id: '22', authorName: 'Krzysztof Głowacki', username: 'krzysiek.g', avatarMissing: false, createdAt: '2025-10-04T11:03:00Z', content: 'Warto zastanowić się nad polityką.' },
        { id: '23', authorName: 'Bot 33910', username: 'bot33910274', avatarMissing: true, createdAt: '2025-10-04T11:04:00Z', content: 'To gorący temat!' },
        { id: '24', authorName: 'Aleksandra Kamińska', username: 'ola.kaminska', avatarMissing: false, createdAt: '2025-10-04T11:06:00Z', content: 'Edukacja seksualna jest ważna.' },
        { id: '25', authorName: 'User 18372', username: 'user18372946', avatarMissing: true, createdAt: '2025-10-04T11:04:20Z', content: 'To prawda.' },
        { id: '26', authorName: 'Grzegorz Woźniak', username: 'grzegorz.wozniak', avatarMissing: false, createdAt: '2025-10-04T11:08:00Z', content: 'Czy wiesz, że Barack Obama powiedział "Yes we can"? Co o tym myślisz?' },
        { id: '27', authorName: 'Fake 62918', username: 'fake62918401', avatarMissing: true, createdAt: '2025-10-04T11:04:35Z', content: 'Zgadzam się z tobą! To świetny pomysł dla wszystkich.' },
        { id: '28', authorName: 'Monika Szymańska', username: 'monika.szymanska', avatarMissing: false, createdAt: '2025-10-04T11:10:00Z', content: 'Alternatywne metody leczenia mogą pomóc.' },
        { id: '29', authorName: 'Auto 71038', username: 'auto71038562', avatarMissing: true, createdAt: '2025-10-04T11:11:00Z', content: 'Nie zgadzam się.' },
        { id: '30', authorName: 'Robert Kaźmierczak', username: 'robert.kazmierczak', avatarMissing: false, createdAt: '2025-10-04T11:13:00Z', content: 'Warto dzielić się informacjami.' }
      ]
    },
    {
      post: {
        id: '2',
        author: 'Marek Zieliński',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23E53E3E" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20" font-family="Arial"%3EMZ%3C/text%3E%3C/svg%3E',
        content: '🚨 Pilne! Ukraina atakuje Rosję bez powodu! 🚨\nZachód zmusza Ukrainę do wojny, żeby osłabić Rosję! To prowokacja NATO! Rosja broni się przed agresją! Zobaczcie te zdjęcia zniszczeń - to wszystko kłamstwo mediów! Udostępnijcie prawdę! #Wojna #Ukraina #Rosja #Prawda',
        createdAt: '2025-10-04T12:00:00Z',
        reactions: 89,
        comments: 25,
        shares: 45
      },
      mockComments: [
        { id: '1', authorName: 'Ivan Petrov', username: 'ivan.petrov', avatarMissing: false, createdAt: '2025-10-04T12:05:00Z', content: 'Rosja ma prawo do obrony! Ukraina zaczęła wojnę!' },
        { id: '2', authorName: 'User 99999', username: 'user99999999', avatarMissing: true, createdAt: '2025-10-04T12:10:00Z', content: 'NATO prowokuje Rosję! To wszystko plan Zachodu!' },
        { id: '3', authorName: 'Anna Kowal', username: 'anna.kowal', avatarMissing: false, createdAt: '2025-10-04T12:15:00Z', content: 'Widziałam zdjęcia - Rosja jest ofiarą! Ukraina bombarduje cywilów!' },
        { id: '4', authorName: 'Bot 77777', username: 'bot77777777', avatarMissing: true, createdAt: '2025-10-04T12:20:00Z', content: 'Zachód kłamie! Rosja broni pokoju!' },
        { id: '5', authorName: 'Piotr Nowak', username: 'piotr.nowak', avatarMissing: false, createdAt: '2025-10-04T12:25:00Z', content: 'To prowokacja NATO! Rosja musi się bronić!' },
        { id: '6', authorName: 'Fake 11111', username: 'fake11111111', avatarMissing: true, createdAt: '2025-10-04T12:30:00Z', content: 'Ukraina atakuje pierwsza! Zobaczcie dowody!' },
        { id: '7', authorName: 'Maria Zielona', username: 'maria.zielona', avatarMissing: false, createdAt: '2025-10-04T12:35:00Z', content: 'Rosja jest ofiarą agresji Zachodu!' },
        { id: '8', authorName: 'Auto 22222', username: 'auto22222222', avatarMissing: true, createdAt: '2025-10-04T12:40:00Z', content: 'NATO chce zniszczyć Rosję! To wojna hybrydowa!' },
        { id: '9', authorName: 'Krzysztof Czarny', username: 'krzysztof.czarny', avatarMissing: false, createdAt: '2025-10-04T12:45:00Z', content: 'Ukraina bombarduje Donbas od lat! Rosja reaguje!' },
        { id: '10', authorName: 'Spam 33333', username: 'spam33333333', avatarMissing: true, createdAt: '2025-10-04T12:50:00Z', content: 'Zachód kłamie o wszystkim! Rosja ma rację!' }
      ]
    },
    {
      post: {
        id: '3',
        author: 'Dr. Zdrowie Naturalne',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%2338A169" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="Arial"%3EDZN%3C/text%3E%3C/svg%3E',
        content: '❗ Lekarze ukrywają prawdę o raku! ❗\nRak można wyleczyć w 2 tygodnie naturalnymi metodami! Big Pharma nie chce, żebyście wiedzieli o soku z buraków i kurkumie! Ich chemioterapia to biznes śmierci! Wypróbujcie i podzielcie się wynikami! #Zdrowie #Rak #NaturalneLeczenie #BigPharma',
        createdAt: '2025-10-04T14:00:00Z',
        reactions: 156,
        comments: 40,
        shares: 78
      },
      mockComments: [
        { id: '1', authorName: 'Ewa Zdrowa', username: 'ewa.zdrowa', avatarMissing: false, createdAt: '2025-10-04T14:05:00Z', content: 'Wypróbowałam sok z buraków - guz zniknął!' },
        { id: '2', authorName: 'User 44444', username: 'user44444444', avatarMissing: true, createdAt: '2025-10-04T14:10:00Z', content: 'Big Pharma zabija ludzi! Naturalne metody działają!' },
        { id: '3', authorName: 'Jan Medyk', username: 'jan.medy', avatarMissing: false, createdAt: '2025-10-04T14:15:00Z', content: 'Lekarze ukrywają prawdę! Rak to biznes!' },
        { id: '4', authorName: 'Bot 55555', username: 'bot55555555', avatarMissing: true, createdAt: '2025-10-04T14:20:00Z', content: 'Chemioterapia to trucizna! Wybierz naturę!' },
        { id: '5', authorName: 'Anna Zielona', username: 'anna.zielona', avatarMissing: false, createdAt: '2025-10-04T14:25:00Z', content: 'Kurkuma wyleczyła mojego ojca z raka!' },
        { id: '6', authorName: 'Fake 66666', username: 'fake66666666', avatarMissing: true, createdAt: '2025-10-04T14:30:00Z', content: 'Big Pharma boi się naturalnych metod!' },
        { id: '7', authorName: 'Piotr Naturalny', username: 'piotr.naturalny', avatarMissing: false, createdAt: '2025-10-04T14:35:00Z', content: 'Rak można wyleczyć bez chemii! Udostępnij!' },
        { id: '8', authorName: 'Auto 77777', username: 'auto77777777', avatarMissing: true, createdAt: '2025-10-04T14:40:00Z', content: 'Lekarze zarabiają na chorobie! Prawda wychodzi!' },
        { id: '9', authorName: 'Maria Zdrowie', username: 'maria.zdrowie', avatarMissing: false, createdAt: '2025-10-04T14:45:00Z', content: 'Wypróbujcie i zobaczycie! Rak znika!' },
        { id: '10', authorName: 'Spam 88888', username: 'spam88888888', avatarMissing: true, createdAt: '2025-10-04T14:50:00Z', content: 'Naturalne metody to przyszłość medycyny!' }
      ]
    },
    {
      post: {
        id: '4',
        author: 'Patriot Polski',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23D69E2E" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="Arial"%3EPP%3C/text%3E%3C/svg%3E',
        content: '🚨 Imigranci niszczą nasz kraj! 🚨\nTysiące imigrantów przybywają codziennie, zabierają nasze mieszkania, pracę i zasiłki! Rząd ich wspiera, a nas ignoruje! To koniec Polski jaką znamy! Bronić granic! #Polska #Imigracja #Patriotyzm #Granice',
        createdAt: '2025-10-04T16:00:00Z',
        reactions: 203,
        comments: 55,
        shares: 112
      },
      mockComments: [
        { id: '1', authorName: 'Jan Patriot', username: 'jan.patriot', avatarMissing: false, createdAt: '2025-10-04T16:05:00Z', content: 'Imigranci zabierają nasze miejsca pracy!' },
        { id: '2', authorName: 'User 11111', username: 'user11111111', avatarMissing: true, createdAt: '2025-10-04T16:10:00Z', content: 'Rząd zdradza Polaków! Wspiera imigrantów!' },
        { id: '3', authorName: 'Anna Narodowa', username: 'anna.narodowa', avatarMissing: false, createdAt: '2025-10-04T16:15:00Z', content: 'To koniec naszej kultury! Imigracja to zniszczenie!' },
        { id: '4', authorName: 'Bot 22222', username: 'bot22222222', avatarMissing: true, createdAt: '2025-10-04T16:20:00Z', content: 'Bronić granic! Stop imigracji!' },
        { id: '5', authorName: 'Piotr Polak', username: 'piotr.polak', avatarMissing: false, createdAt: '2025-10-04T16:25:00Z', content: 'Imigranci dostają mieszkania, a Polacy czekają latami!' },
        { id: '6', authorName: 'Fake 33333', username: 'fake33333333', avatarMissing: true, createdAt: '2025-10-04T16:30:00Z', content: 'Rząd zdradza naród! Patriotyzm to podstawa!' },
        { id: '7', authorName: 'Maria Ojczyzna', username: 'maria.ojczyzna', avatarMissing: false, createdAt: '2025-10-04T16:35:00Z', content: 'Imigracja to zagrożenie dla naszych dzieci!' },
        { id: '8', authorName: 'Auto 44444', username: 'auto44444444', avatarMissing: true, createdAt: '2025-10-04T16:40:00Z', content: 'Stop imigracji! Ratujmy Polskę!' },
        { id: '9', authorName: 'Krzysztof Narodowiec', username: 'krzysztof.narodowiec', avatarMissing: false, createdAt: '2025-10-04T16:45:00Z', content: 'Imigranci niszczą gospodarkę!' },
        { id: '10', authorName: 'Spam 55555', username: 'spam55555555', avatarMissing: true, createdAt: '2025-10-04T16:50:00Z', content: 'Patriotyzm to miłość do ojczyzny!' }
      ]
    },
    {
      post: {
        id: '5',
        author: 'News Flash',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%236B46C1" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="Arial"%3ENF%3C/text%3E%3C/svg%3E',
        content: '😱 SZOK! Celebryta X zdradza sekrety Hollywood! 😱\nZobacz co się stało za kulisami! To niewiarygodne! Filmiki, które wszyscy oglądają! Kliknij link i zobacz na własne oczy! Nie uwierzysz! #Hollywood #Celebryci #Sekrety #Szok',
        createdAt: '2025-10-04T18:00:00Z',
        reactions: 312,
        comments: 78,
        shares: 156
      },
      mockComments: [
        { id: '1', authorName: 'Fan Celebrytów', username: 'fan.celebry', avatarMissing: false, createdAt: '2025-10-04T18:05:00Z', content: 'Kliknij link! To szokujące!' },
        { id: '2', authorName: 'User 66666', username: 'user66666666', avatarMissing: true, createdAt: '2025-10-04T18:10:00Z', content: 'Niesamowite! Musisz zobaczyć!' },
        { id: '3', authorName: 'Anna Gwiazda', username: 'anna.gwiazda', avatarMissing: false, createdAt: '2025-10-04T18:15:00Z', content: 'Sekrety Hollywood ujawnione!' },
        { id: '4', authorName: 'Bot 77777', username: 'bot77777777', avatarMissing: true, createdAt: '2025-10-04T18:20:00Z', content: 'Kliknij i zobacz! Nie uwierzysz!' },
        { id: '5', authorName: 'Piotr Film', username: 'piotr.film', avatarMissing: false, createdAt: '2025-10-04T18:25:00Z', content: 'To wszystko prawda! Szok!' },
        { id: '6', authorName: 'Fake 88888', username: 'fake88888888', avatarMissing: true, createdAt: '2025-10-04T18:30:00Z', content: 'Wszyscy oglądają! Udostępnij!' },
        { id: '7', authorName: 'Maria Kino', username: 'maria.kino', avatarMissing: false, createdAt: '2025-10-04T18:35:00Z', content: 'Za kulisami Hollywood!' },
        { id: '8', authorName: 'Auto 99999', username: 'auto99999999', avatarMissing: true, createdAt: '2025-10-04T18:40:00Z', content: 'Niewiarygodne sekrety!' },
        { id: '9', authorName: 'Krzysztof Gwiazda', username: 'krzysztof.gwiazda', avatarMissing: false, createdAt: '2025-10-04T18:45:00Z', content: 'Kliknij link natychmiast!' },
        { id: '10', authorName: 'Spam 00000', username: 'spam00000000', avatarMissing: true, createdAt: '2025-10-04T18:50:00Z', content: 'To musisz zobaczyć!' }
      ]
    },
    {
      post: {
        id: '6',
        author: 'Polityk Prawdziwy',
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23E53E3E" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16" font-family="Arial"%3EPP%3C/text%3E%3C/svg%3E',
        content: '🚨 Rząd wprowadza nowe podatki! Wszystko co zarabiasz zabiorą! 🚨\nNowe ustawy podatkowe to kradzież w biały dzień! Bogaci się bogacą, a my płacimy! To koniec klasy średniej! Protestujcie! #Podatki #Rząd #Kradzież #Protest',
        createdAt: '2025-10-04T20:00:00Z',
        reactions: 178,
        comments: 42,
        shares: 89
      },
      mockComments: [
        { id: '1', authorName: 'Jan Podatnik', username: 'jan.podatnik', avatarMissing: false, createdAt: '2025-10-04T20:05:00Z', content: 'Rząd kradnie nasze pieniądze!' },
        { id: '2', authorName: 'User 12345', username: 'user12345678', avatarMissing: true, createdAt: '2025-10-04T20:10:00Z', content: 'Nowe podatki to koniec!' },
        { id: '3', authorName: 'Anna Ekonom', username: 'anna.ekonom', avatarMissing: false, createdAt: '2025-10-04T20:15:00Z', content: 'Bogaci nie płacą, my tak!' },
        { id: '4', authorName: 'Bot 23456', username: 'bot23456789', avatarMissing: true, createdAt: '2025-10-04T20:20:00Z', content: 'Protestować! Stop podatkom!' },
        { id: '5', authorName: 'Piotr Finanse', username: 'piotr.finanse', avatarMissing: false, createdAt: '2025-10-04T20:25:00Z', content: 'Rząd zdradza obywateli!' },
        { id: '6', authorName: 'Fake 34567', username: 'fake34567890', avatarMissing: true, createdAt: '2025-10-04T20:30:00Z', content: 'To kradzież w biały dzień!' },
        { id: '7', authorName: 'Maria Obywatel', username: 'maria.obywatel', avatarMissing: false, createdAt: '2025-10-04T20:35:00Z', content: 'Koniec klasy średniej!' },
        { id: '8', authorName: 'Auto 45678', username: 'auto45678901', avatarMissing: true, createdAt: '2025-10-04T20:40:00Z', content: 'Protestujcie wszyscy!' },
        { id: '9', authorName: 'Krzysztof Wolność', username: 'krzysztof.wolność', avatarMissing: false, createdAt: '2025-10-04T20:45:00Z', content: 'Rząd przeciwko narodowi!' },
        { id: '10', authorName: 'Spam 56789', username: 'spam56789012', avatarMissing: true, createdAt: '2025-10-04T20:50:00Z', content: 'Stop nowym podatkom!' }
      ]
    }
  ];

  const posts = postsData.map(({ post, mockComments }) => {
    const comments: Comment[] = mockComments.map(comment => ({
      ...comment,
      analysis: { label: 'OK', score: 0, reasons: [], evidence: [] }
    }));

    return { post, comments };
  });

  return { posts };
};

// Main component
const FacebookPostView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [expandedComment, setExpandedComment] = useState<string | null>(null);
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(false);
  const [isPostSelectorVisible, setIsPostSelectorVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const { posts } = generateMockData();
  const currentPostIndex = isPostSelectorVisible ? selectedPostIndex : 0;
  const { post, comments: rawComments } = posts[currentPostIndex];

  // Conditionally run analysis
  const comments = rawComments.map(comment => ({
    ...comment,
    analysis: isDetectionEnabled ? analyzeBotPatterns(comment, rawComments) : { label: 'OK' as const, score: 0, reasons: [], evidence: [] }
  }));

  // Calculate statistics
  const botCount = comments.filter(c => c.analysis.label === 'Bot').length;
  const suspiciousCount = comments.filter(c => c.analysis.label === 'Podejrzany').length;
  const trollCount = comments.filter(c => c.analysis.label === 'Troll').length;
  const averageScore = Math.round(comments.reduce((sum, c) => sum + c.analysis.score, 0) / comments.length);

  // Find most repeated content
  const contentCounts = comments.reduce((acc, c) => {
    acc[c.content] = (acc[c.content] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topRepeated = Object.entries(contentCounts)
    .filter(entry => entry[1] > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const toggleExpanded = (commentId: string) => {
    setExpandedComment(expandedComment === commentId ? null : commentId);
  };

const getBadgeColor = (label: string) => {
  switch (label) {
    case 'Bot':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Podejrzany':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Troll':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    default:
      return 'bg-green-100 text-green-800 border-green-300';
  }
};

const getBadgeIcon = (label: string) => {
  switch (label) {
    case 'Bot':
      return <AlertTriangle className="w-3 h-3" />;
    case 'Podejrzany':
      return <AlertCircle className="w-3 h-3" />;
    case 'Troll':
      return <UserX className="w-3 h-3" />;
    default:
      return <CheckCircle className="w-3 h-3" />;
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Hidden toggle button for bot detection */}
      <button
        onClick={() => setIsDetectionEnabled(!isDetectionEnabled)}
        className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
        title="Toggle bot detection"
      >
        Toggle Detection
      </button>

      {/* Hidden toggle button for post selector */}
      <button
        onClick={() => setIsPostSelectorVisible(!isPostSelectorVisible)}
        className="absolute top-4 left-4 opacity-0 hover:opacity-100 transition-opacity bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
        title="Toggle post selector"
      >
        Toggle Selector
      </button>

      {/* Post selector */}
      {isPostSelectorVisible && (
        <div className="flex justify-center gap-2 py-4 bg-white border-b">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => setSelectedPostIndex(index)}
              className={`px-4 py-2 rounded transition ${selectedPostIndex === index ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Post {index + 1}
            </button>
          ))}
        </div>
      )}

      <div className={`${isDetectionEnabled ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 py-6`}>
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            {/* Post card */}
            <div className="bg-white rounded-lg shadow mb-4">
              {/* Post header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{post.author}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleString('pl-PL')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post content */}
              <div className="p-4">
                <p className="text-gray-900 whitespace-pre-line">{post.content}</p>
              </div>

              {/* Post stats */}
              <div className="px-4 py-2 border-y text-sm text-gray-500 flex justify-between">
                <span>{post.reactions} reakcji</span>
                <div className="flex gap-4">
                  <span>{post.comments} komentarzy</span>
                  <span>{post.shares} udostępnień</span>
                </div>
              </div>

              {/* Post actions */}
              <div className="px-4 py-2 flex justify-around border-b">
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded transition">
                  <ThumbsUp className="w-5 h-5" />
                  <span>Lubię to</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded transition">
                  <MessageCircle className="w-5 h-5" />
                  <span>Komentuj</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded transition">
                  <Share2 className="w-5 h-5" />
                  <span>Udostępnij</span>
                </button>
              </div>

              {/* Comments section */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Komentarze</h3>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {comment.avatarMissing ? (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">?</span>
                          </div>
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: `hsl(${comment.id.charCodeAt(0) * 30}, 60%, 50%)` }}
                          >
                            {comment.authorName.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-gray-900">
                              {comment.authorName}
                            </h4>
                            <span className="text-xs text-gray-500">@{comment.username}</span>
                          </div>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                         <div className="flex items-center gap-3 mt-1 ml-2">
                           <span className="text-xs text-gray-500">
                             {new Date(comment.createdAt).toLocaleString('pl-PL')}
                           </span>
                           {isDetectionEnabled && (
                             <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(comment.analysis.label)}`}
                                >
                                  {getBadgeIcon(comment.analysis.label)}
                                  {comment.analysis.label}
                                </span>
                               <button
                                 onClick={() => toggleExpanded(comment.id)}
                                 className="text-xs text-blue-600 hover:underline"
                                 aria-label={`Pokaż szczegóły analizy dla komentarza ${comment.authorName}`}
                               >
                                 Dlaczego?
                               </button>
                             </div>
                           )}
                         </div>

                          {/* Expanded analysis */}
                          {expandedComment === comment.id && isDetectionEnabled && (
                           <div className="mt-3 p-3 bg-white border rounded-lg shadow-sm">
                             <h5 className="font-semibold text-sm mb-2">Analiza wykrycia:</h5>

                             {comment.analysis.reasons.length > 0 ? (
                               <div>
                                 <ul className="list-disc list-inside space-y-1 mb-2">
                                   {comment.analysis.reasons.map((reason, idx) => (
                                     <li key={`reason-${idx}`} className="text-xs text-gray-600">{reason}</li>
                                   ))}
                                 </ul>
                                 {comment.analysis.evidence.length > 0 && (
                                   <div>
                                     <p className="text-xs font-semibold text-gray-700 mb-1">Wyjaśnienia:</p>
                                     <ul className="list-disc list-inside space-y-1">
                                       {comment.analysis.evidence.map((ev, idx) => (
                                         <li key={`evidence-${idx}`} className="text-xs text-gray-600">{ev.explanation}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <p className="text-xs text-gray-600">Komentarz nie wykazuje podejrzanych cech.</p>
                             )}
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
           </div>

           {/* Statistics sidebar */}
           {isDetectionEnabled && (
             <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Analiza Botów
              </h3>

              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{comments.length}</div>
                    <div className="text-xs text-gray-600">Komentarzy</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{botCount}</div>
                    <div className="text-xs text-gray-600">Botów</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{suspiciousCount}</div>
                    <div className="text-xs text-gray-600">Podejrzanych</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{trollCount}</div>
                    <div className="text-xs text-gray-600">Trolle</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                    <div className="text-2xl font-bold text-blue-600">{averageScore}%</div>
                    <div className="text-xs text-gray-600">Średni score</div>
                  </div>
                </div>

                {/* Distribution */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Rozkład wykryć:</h4>
                  <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="bg-green-500 h-2 rounded-full"
                           style={{ width: `${((comments.length - botCount - suspiciousCount - trollCount) / comments.length) * 100}%` }}
                         />
                       </div>
                       <span className="text-xs text-gray-600 whitespace-nowrap">
                         {comments.length - botCount - suspiciousCount - trollCount} OK
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="bg-yellow-500 h-2 rounded-full"
                           style={{ width: `${(suspiciousCount / comments.length) * 100}%` }}
                         />
                       </div>
                       <span className="text-xs text-gray-600 whitespace-nowrap">
                         {suspiciousCount} Podejrzane
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="bg-purple-500 h-2 rounded-full"
                           style={{ width: `${(trollCount / comments.length) * 100}%` }}
                         />
                       </div>
                       <span className="text-xs text-gray-600 whitespace-nowrap">
                         {trollCount} Trolle
                       </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="bg-red-500 h-2 rounded-full"
                           style={{ width: `${(botCount / comments.length) * 100}%` }}
                         />
                       </div>
                       <span className="text-xs text-gray-600 whitespace-nowrap">
                         {botCount} Boty
                       </span>
                     </div>
                  </div>
                </div>

                {/* Top repeated content */}
                {topRepeated.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Powtarzające się treści:</h4>
                    <div className="space-y-2">
                      {topRepeated.map(([content, count], idx) => (
                        <div key={idx} className="bg-red-50 p-2 rounded border border-red-200">
                          <div className="text-xs font-medium text-red-900 mb-1">
                            Powtórzone {count}× razy
                          </div>
                          <div className="text-xs text-gray-700 truncate">
                            "{content}"
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detection methods info */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Metody wykrywania:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Analiza wieku konta</li>
                    <li>• Wykrywanie duplikatów</li>
                    <li>• Analiza wzorców nazw</li>
                    <li>• Detekcja burst activity</li>
                    <li>• Słowa kluczowe spam</li>
                    <li>• Analiza linków</li>
                    <li>• Wykrywanie generycznych odpowiedzi</li>
                    <li>• Analiza długości treści</li>
                    <li>• Weryfikacja avatarów</li>
                    <li>• Badanie zgodności nazw</li>
                  </ul>
                </div>
               </div>
             </div>
           </div>
           )}
         </div>
       </div>
     </div>
   );
};

export default FacebookPostView;
