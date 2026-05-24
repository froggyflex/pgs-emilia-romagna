import type { Comment, EventRecord } from "./types";

const now = new Date().toISOString();

export const seedEvent: EventRecord = {
  slug: "don-bosco-cup-2026",
  title: "Don Bosco Cup 2026",
  subtitle: "Finali Nazionali Pallavolo Femminile Under 14-16",
  description:
    "La sezione dedicata alla manifestazione con calendario partite, classifiche in tempo reale, contenuti media, commenti e streaming live.",
  status: "published",
  startsAt: "2026-05-28T09:00:00.000Z",
  endsAt: "2026-05-31T20:00:00.000Z",
  location: "Cesenatico (FC)",
  coverImage: "/assets/finali-nazionali-u14-u16.jpeg",
  logoImage: "/assets/dbc-2026-logo-white-outline.png",
  streamUrl: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID",
  sections: [
    {
      id: "section-campionato",
      slug: "campionato",
      type: "campionato",
      title: "Campionato Don Bosco Cup",
      subtitle: "Partite, risultati e classifiche ufficiali",
      description: "Calendario gare, punteggi live, classifiche importate dalla segreteria e feed operativo.",
      startsAt: "2026-05-28T09:00:00.000Z",
      endsAt: "2026-05-31T18:00:00.000Z",
      location: "Palazzetti e campi gara di Cesenatico",
      heroImage: "/assets/finali-nazionali-u14-u16.jpeg"
    },
    {
      id: "section-serata-inaugurale",
      slug: "serata-inaugurale",
      type: "intrattenimento",
      title: "Serata inaugurale",
      subtitle: "Apertura ufficiale della manifestazione",
      description: "Un momento pubblico per accogliere squadre, famiglie e staff con presentazioni, saluti e animazione.",
      startsAt: "2026-05-28T18:30:00.000Z",
      endsAt: "2026-05-28T22:30:00.000Z",
      location: "Piazza centrale evento",
      heroImage: "/assets/finali-nazionali-u14-u16.jpeg",
      programItems: [
        { id: "program-1", time: "18:30", title: "Accoglienza squadre", description: "Arrivo delegazioni e apertura area evento.", location: "Ingresso principale" },
        { id: "program-2", time: "19:15", title: "Presentazione ufficiale", description: "Sfilata delle squadre e saluto degli organizzatori.", location: "Palco centrale" },
        { id: "program-3", time: "20:15", title: "Apertura Don Bosco Cup", description: "Avvio ufficiale delle finali nazionali.", location: "Palco centrale" },
        { id: "program-4", time: "21:00", title: "Musica e animazione", description: "Intrattenimento per atleti, famiglie e pubblico.", location: "Area festa" }
      ]
    }
  ],
  categories: ["Under 14", "Under 16"],
  teams: [
    { id: "team-u14-1", name: "PGS Aurora", category: "Under 14", city: "Bologna" },
    { id: "team-u14-2", name: "PGS San Paolo", category: "Under 14", city: "Modena" },
    { id: "team-u14-3", name: "PGS Valsamoggia", category: "Under 14", city: "Bologna" },
    { id: "team-u16-1", name: "PGS Stella", category: "Under 16", city: "Parma" },
    { id: "team-u16-2", name: "PGS Mare", category: "Under 16", city: "Rimini" },
    { id: "team-u16-3", name: "PGS Ravenna", category: "Under 16", city: "Ravenna" }
  ],
  matches: [
    {
      id: "match-1",
      category: "Under 14",
      homeTeam: "PGS Aurora",
      awayTeam: "PGS San Paolo",
      court: "Pala Cesenatico",
      startsAt: "2026-05-28T10:00:00.000Z",
      status: "finished",
      homeScore: 2,
      awayScore: 0
    },
    {
      id: "match-2",
      category: "Under 16",
      homeTeam: "PGS Stella",
      awayTeam: "PGS Mare",
      court: "Campo Centrale",
      startsAt: "2026-05-28T12:00:00.000Z",
      status: "live",
      homeScore: 1,
      awayScore: 1,
      streamUrl: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID"
    },
    {
      id: "match-3",
      category: "Under 14",
      homeTeam: "PGS Valsamoggia",
      awayTeam: "PGS Aurora",
      court: "Campo Riviera",
      startsAt: "2026-05-29T09:30:00.000Z",
      status: "scheduled"
    },
    {
      id: "match-4",
      category: "Under 16",
      homeTeam: "PGS Ravenna",
      awayTeam: "PGS Stella",
      court: "Campo Centrale",
      startsAt: "2026-05-29T14:30:00.000Z",
      status: "scheduled"
    }
  ],
  rankingColumns: [
    "SQUADRE",
    "GIOCATE",
    "PUNTI",
    "SET VINTI",
    "SET PERSI",
    "QUOZ SET",
    "PUNTI FATTI",
    "PUNTI SUBITI",
    "QUOZ PUNTI"
  ],
  rankings: [
    {
      id: "rank-1",
      category: "Generale",
      team: "PGS DOMANI PESSANO BLU",
      played: 2,
      wins: 0,
      losses: 0,
      points: 6,
      values: {
        "SQUADRE": "PGS DOMANI PESSANO BLU",
        "GIOCATE": "2",
        "PUNTI": "6",
        "SET VINTI": "4",
        "SET PERSI": "1",
        "QUOZ SET": "4",
        "PUNTI FATTI": "105",
        "PUNTI SUBITI": "75",
        "QUOZ PUNTI": "1.4"
      }
    },
    {
      id: "rank-2",
      category: "Generale",
      team: "PGS PIANTA",
      played: 2,
      wins: 0,
      losses: 0,
      points: 3,
      values: {
        "SQUADRE": "PGS PIANTA",
        "GIOCATE": "2",
        "PUNTI": "3",
        "SET VINTI": "2",
        "SET PERSI": "3",
        "QUOZ SET": "0.667",
        "PUNTI FATTI": "84",
        "PUNTI SUBITI": "109",
        "QUOZ PUNTI": "0.771"
      }
    },
    {
      id: "rank-3",
      category: "Generale",
      team: "PGS FREEDOM",
      played: 2,
      wins: 0,
      losses: 0,
      points: 2,
      values: {
        "SQUADRE": "PGS FREEDOM",
        "GIOCATE": "2",
        "PUNTI": "2",
        "SET VINTI": "2",
        "SET PERSI": "4",
        "QUOZ SET": "0.5",
        "PUNTI FATTI": "112",
        "PUNTI SUBITI": "117",
        "QUOZ PUNTI": "0.957"
      }
    }
  ],
  media: [
    {
      id: "media-1",
      type: "photo",
      title: "Locandina ufficiale",
      url: "/assets/finali-nazionali-u14-u16.jpeg",
      caption: "Finali Nazionali U14-U16 a Cesenatico.",
      commentsEnabled: true,
      likes: 18,
      createdAt: now
    },
    {
      id: "media-2",
      type: "photo",
      title: "Logo Don Bosco Cup",
      url: "/assets/dbc-2026-logo.png",
      caption: "Identita ufficiale della manifestazione.",
      commentsEnabled: true,
      likes: 11,
      createdAt: now
    },
    {
      id: "media-3",
      type: "photo",
      title: "PGS Emilia-Romagna",
      url: "/assets/pgs-emilia-romagna.png",
      caption: "Organizzazione regionale e staff evento.",
      commentsEnabled: true,
      likes: 7,
      createdAt: now
    },
    {
      id: "media-4",
      type: "video",
      title: "Diretta campo centrale",
      url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID",
      caption: "Streaming TV della partita in corso.",
      commentsEnabled: true,
      likes: 24,
      createdAt: now
    }
  ],
  feed: [
    {
      id: "feed-1",
      eventId: "don-bosco-cup-2026",
      title: "Manifestazione pubblicata",
      body: "Calendari, classifiche e contenuti live saranno aggiornati durante l'evento.",
      type: "announcement",
      createdAt: now
    },
    {
      id: "feed-2",
      eventId: "don-bosco-cup-2026",
      title: "PGS Stella - PGS Mare live",
      body: "Secondo set in corso sul Campo Centrale. Lo streaming e il punteggio sono aggiornati dalla regia.",
      type: "live",
      createdAt: now
    },
    {
      id: "feed-3",
      eventId: "don-bosco-cup-2026",
      title: "Classifica U14 aggiornata",
      body: "PGS Aurora sale a 3 punti dopo la vittoria nella gara di apertura.",
      type: "ranking",
      createdAt: now
    }
  ],
  createdAt: now,
  updatedAt: now
};

export const seedEvents: EventRecord[] = [
  seedEvent,
  {
    ...JSON.parse(JSON.stringify(seedEvent)),
    slug: "memorial-primavera-2026",
    title: "Memorial Primavera 2026",
    subtitle: "Giornata sportiva PGS con tornei giovanili e contenuti live",
    description:
      "Evento dimostrativo per testare piu pagine pubbliche, gestione media, calendario, feed e commenti.",
    status: "published",
    startsAt: "2026-06-14T08:30:00.000Z",
    endsAt: "2026-06-14T18:30:00.000Z",
    location: "Bologna",
    streamUrl: "",
    sections: [
      {
        id: "spring-section-campionato",
        slug: "campionato",
        type: "campionato",
        title: "Torneo sportivo",
        subtitle: "Calendario e risultati della giornata",
        description: "Programma gare, risultati e classifiche della manifestazione.",
        startsAt: "2026-06-14T08:30:00.000Z",
        endsAt: "2026-06-14T18:30:00.000Z",
        location: "Bologna",
        heroImage: "/assets/dbc-2026-logo-white-outline.png"
      },
      {
        id: "spring-section-festa",
        slug: "festa-finale",
        type: "intrattenimento",
        title: "Festa finale",
        subtitle: "Premiazioni e saluti conclusivi",
        description: "Chiusura della giornata con premiazioni, foto e momento conviviale.",
        startsAt: "2026-06-14T17:00:00.000Z",
        endsAt: "2026-06-14T18:30:00.000Z",
        location: "Palestra Don Bosco",
        heroImage: "/assets/dbc-2026-logo-white-outline.png",
        programItems: [
          { id: "spring-program-1", time: "17:00", title: "Finali e saluti", description: "Ultime gare e preparazione premiazioni." },
          { id: "spring-program-2", time: "17:45", title: "Premiazioni", description: "Consegna riconoscimenti alle squadre." }
        ]
      }
    ],
    categories: ["Volley", "Basket", "Calcio a 5"],
    teams: [
      { id: "spring-team-1", name: "PGS Bologna", category: "Volley", city: "Bologna" },
      { id: "spring-team-2", name: "PGS Modena", category: "Volley", city: "Modena" }
    ],
    matches: [
      {
        id: "spring-match-1",
        category: "Volley",
        homeTeam: "PGS Bologna",
        awayTeam: "PGS Modena",
        court: "Palestra Don Bosco",
        startsAt: "2026-06-14T09:30:00.000Z",
        status: "scheduled"
      }
    ],
    rankings: [
      { id: "spring-rank-1", category: "Volley", team: "PGS Bologna", played: 0, wins: 0, losses: 0, points: 0 },
      { id: "spring-rank-2", category: "Volley", team: "PGS Modena", played: 0, wins: 0, losses: 0, points: 0 }
    ],
    media: [
      {
        id: "spring-media-1",
        type: "photo",
        title: "Logo manifestazione",
        url: "/assets/dbc-2026-logo-white-outline.png",
        caption: "Mock media per verificare card, like e commenti.",
        commentsEnabled: true,
        likes: 5,
        createdAt: now
      }
    ],
    feed: [
      {
        id: "spring-feed-1",
        eventId: "memorial-primavera-2026",
        title: "Evento demo pronto",
        body: "Questo evento serve per verificare la navigazione tra piu manifestazioni.",
        type: "announcement",
        createdAt: now
      }
    ],
    createdAt: now,
    updatedAt: now
  },
  {
    ...JSON.parse(JSON.stringify(seedEvent)),
    slug: "torneo-estate-bozza",
    title: "Torneo Estate 2026",
    subtitle: "Evento in preparazione non ancora visibile al pubblico",
    description: "Bozza di lavoro per testare filtri, stati e pubblicazione dall'area admin.",
    status: "draft",
    startsAt: "2026-07-05T08:00:00.000Z",
    endsAt: "2026-07-05T19:00:00.000Z",
    location: "Rimini",
    sections: [],
    matches: [],
    rankings: [],
    media: [],
    feed: [],
    createdAt: now,
    updatedAt: now
  }
];

export const seedComments: Comment[] = [
  {
    id: "comment-event-1",
    eventId: "don-bosco-cup-2026",
    targetType: "event",
    targetId: "don-bosco-cup-2026",
    authorName: "Marta R.",
    authorEmail: "marta@example.com",
    body: "Bellissima pagina, molto comodo vedere calendario e classifica insieme.",
    hidden: false,
    createdAt: now
  },
  {
    id: "comment-media-1",
    eventId: "don-bosco-cup-2026",
    targetType: "media",
    targetId: "media-1",
    authorName: "Luca Staff",
    authorEmail: "luca@example.com",
    body: "Locandina approvata e pronta per la stampa dei QR.",
    hidden: false,
    createdAt: now
  },
  {
    id: "comment-media-2",
    eventId: "don-bosco-cup-2026",
    targetType: "media",
    targetId: "media-2",
    authorName: "Sara P.",
    authorEmail: "sara@example.com",
    body: "Ottima resa del logo anche su mobile.",
    hidden: false,
    createdAt: now
  },
  {
    id: "comment-media-3",
    eventId: "don-bosco-cup-2026",
    targetType: "media",
    targetId: "media-4",
    authorName: "Andrea",
    authorEmail: "andrea@example.com",
    body: "Da sostituire con il link reale dello streaming appena disponibile.",
    hidden: false,
    createdAt: now
  },
  {
    id: "comment-spring-1",
    eventId: "memorial-primavera-2026",
    targetType: "media",
    targetId: "spring-media-1",
    authorName: "Admin test",
    authorEmail: "local-admin@example.com",
    body: "Commento demo sul media del secondo evento.",
    hidden: false,
    createdAt: now
  }
];
