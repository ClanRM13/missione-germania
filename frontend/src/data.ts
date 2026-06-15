const assetBaseUrl = import.meta.env.BASE_URL;

export const apiBaseUrl =
  "https://7342l4r814.execute-api.eu-west-1.amazonaws.com";

export const routeStops = [
  { id: "pirna", date: "01/08", name: "Pirna" },
  { id: "weibig", date: "02/08", name: "Weibig" },
  { id: "konigstein", date: "03/08", name: "Königstein" },
  { id: "altendorf", date: "04/08", name: "Altendorf" },
  { id: "hohnstein", date: "05/08", name: "Hohnstein" },
  { id: "stadt-wehlen", date: "06/08", name: "Stadt Wehlen" },
  { id: "dresda", date: "07/08", name: "Dresda" },
];

export const missions = [
  {
    id: "duolingo-base",
    stopId: "pirna",
    category: "language",
    title: "Accendi il fuoco",
    description:
      "Completa 3 lezioni Duolingo di tedesco e carica uno screenshot del progresso.",
    difficulty: "Facile",
    completed: false,
  },
  {
    id: "presentazione",
    stopId: "pirna",
    category: "language",
    title: "Ich heiße...",
    description:
      "Scrivi su un foglio 3 frasi per presentarti in tedesco e carica una foto.",
    difficulty: "Facile",
    completed: false,
  },
  {
    id: "numeri",
    stopId: "pirna",
    category: "language",
    title: "Conta il materiale",
    description:
      "Scrivi i numeri da 1 a 20 in tedesco su un foglio e carica una foto.",
    difficulty: "Facile",
    completed: false,
  },

  {
    id: "acqua",
    stopId: "weibig",
    category: "food",
    title: "Acqua per la cambusa",
    description:
      "Scrivi come chiederesti una bottiglia d'acqua in tedesco e carica una foto.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "panino",
    stopId: "weibig",
    category: "food",
    title: "Missione Bäckerei",
    description:
      "Scrivi una frase per ordinare qualcosa in panetteria in tedesco e carica una foto.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "prezzo",
    stopId: "weibig",
    category: "shopping",
    title: "Quanto costa?",
    description:
      "Scrivi 3 modi utili per chiedere il prezzo di qualcosa in tedesco e carica una foto.",
    difficulty: "Media",
    completed: false,
  },

  {
    id: "fortezza",
    stopId: "konigstein",
    category: "navigation",
    title: "Verso la fortezza",
    description:
      "Disegna una mini-mappa e scrivi 2 indicazioni in tedesco per raggiungere Königstein.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "biglietto",
    stopId: "konigstein",
    category: "shopping",
    title: "Un biglietto, bitte",
    description:
      "Scrivi una frase per chiedere un biglietto o un ingresso in tedesco e carica una foto.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "sentinella",
    stopId: "konigstein",
    category: "language",
    title: "Saluto alla sentinella",
    description:
      "Scrivi 3 saluti diversi in tedesco, con traduzione italiana, e carica una foto.",
    difficulty: "Facile",
    completed: false,
  },

  {
    id: "strada-altendorf",
    stopId: "altendorf",
    category: "navigation",
    title: "Dov'è Altendorf?",
    description:
      "Scrivi una domanda per chiedere indicazioni e una possibile risposta in tedesco.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "meteo-zaino",
    stopId: "altendorf",
    category: "language",
    title: "Meteo da zaino",
    description:
      "Scrivi 3 frasi sul meteo in tedesco, ad esempio sole, pioggia, freddo o caldo.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "cambusa-frutta",
    stopId: "altendorf",
    category: "food",
    title: "Frutta per la route",
    description:
      "Scrivi almeno 5 alimenti o frutti utili per la cambusa in tedesco e carica una foto.",
    difficulty: "Media",
    completed: false,
  },

  {
    id: "checkin",
    stopId: "hohnstein",
    category: "language",
    title: "Check-in del clan",
    description:
      "Scrivi una mini-conversazione di check-in in tedesco tra un rover e un ostello.",
    difficulty: "Difficile",
    completed: false,
  },
  {
    id: "sentiero",
    stopId: "hohnstein",
    category: "navigation",
    title: "Sentiero nel bosco",
    description:
      "Scrivi 4 parole o frasi utili per orientarti su un sentiero in tedesco.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "aiuto",
    stopId: "hohnstein",
    category: "language",
    title: "Serve aiuto",
    description:
      "Scrivi 3 frasi utili in caso di bisogno o emergenza durante la route.",
    difficulty: "Difficile",
    completed: false,
  },

  {
    id: "traghetto",
    stopId: "stadt-wehlen",
    category: "transport",
    title: "Attraversa l'Elba",
    description:
      "Scrivi una frase per chiedere informazioni su traghetto, orario o direzione.",
    difficulty: "Media",
    completed: false,
  },
  {
    id: "gelato",
    stopId: "stadt-wehlen",
    category: "food",
    title: "Gelato premio",
    description:
      "Scrivi come ordineresti un gelato in tedesco, scegliendo gusto e quantità.",
    difficulty: "Facile",
    completed: false,
  },
  {
    id: "cartolina",
    stopId: "stadt-wehlen",
    category: "language",
    title: "Cartolina dal campo",
    description:
      "Scrivi una breve cartolina in tedesco da mandare a casa e carica una foto.",
    difficulty: "Media",
    completed: false,
  },

  {
    id: "museo",
    stopId: "dresda",
    category: "culture",
    title: "Dresda culturale",
    description:
      "Scegli un museo o monumento di Dresda e scrivi una domanda semplice in tedesco.",
    difficulty: "Difficile",
    completed: false,
  },
  {
    id: "binario",
    stopId: "dresda",
    category: "transport",
    title: "Binario giusto",
    description:
      "Scrivi una frase per chiedere da quale binario parte un treno e carica una foto.",
    difficulty: "Difficile",
    completed: false,
  },
  {
    id: "missione-finale",
    stopId: "dresda",
    category: "language",
    title: "Missione finale",
    description:
      "Scrivi un breve messaggio finale in tedesco per il clan e carica una foto.",
    difficulty: "Difficile",
    completed: false,
  },
];

export const clanBadges = [
  {
    id: "fuochista",
    title: "Fuochista",
    emoji: "🔥",
    imageUrl:`${assetBaseUrl}achivements/fuochista.png`,
    description: "Hai acceso il primo fuoco della missione.",
    unlockHint: "Completa e fai approvare la tua prima missione.",
  },
  {
    id: "gufo-clan",
    title: "Gufo del Clan",
    emoji: "🌙",
    imageUrl: `${assetBaseUrl}achivements/gufo.png`,
    description:
      "Per chi studia tedesco quando il campo dorme e la route si prepara in silenzio.",
    unlockHint: "Carica una prova dopo le 22:00 o prima delle 6:00.",
  },
  {
    id: "paparazzo-pirna",
    title: "Paparazzo di Pirna",
    emoji: "📸",
    imageUrl: `${assetBaseUrl}achivements/fotografo.png`,
    description:
      "Documentare tutto è uno stile di vita: prove, screenshot, dettagli e missioni.",
    unlockHint: "Carica almeno 5 prove.",
  },
  {
    id: "kaiser-cambusa",
    title: "Kaiser della Cambusa",
    emoji: "👨‍🍳",
    imageUrl: `${assetBaseUrl}achivements/kaiser.png`,
    description:
      "Domini le missioni dedicate al cibo, alla spesa e alla sopravvivenza linguistica in cambusa.",
    unlockHint: "Completa tutte le missioni della categoria food.",
  },
  {
    id: "zaino-pronto",
    title: "Zaino Sempre Pronto",
    emoji: "🎒",
    imageUrl: `${assetBaseUrl}achivements/zaino.png`,
    description:
      "Hai dimostrato continuità e preparazione: lo zaino linguistico inizia a pesare.",
    unlockHint: "Completa 6 missioni.",
  },
  {
    id: "kaiser-clan",
    title: "Kaiser del Clan",
    emoji: "👑",
    imageUrl: `${assetBaseUrl}achivements/kaiser-clan.png`,
    description:
      "Hai quasi completato il viaggio e guidato il tuo passaporto fino alla fase finale.",
    unlockHint: "Completa 18 missioni.",
  },
  {
    id: "aquila-sassonia",
    title: "Aquila di Sassonia",
    emoji: "🦅",
    imageUrl: `${assetBaseUrl}achivements/aquila.png`,
    description:
      "Hai completato tutto il percorso e conquistato la Sassonia missione dopo missione.",
    unlockHint: "Completa tutte le 21 missioni.",
  },
];