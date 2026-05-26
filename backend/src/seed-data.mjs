const now = new Date().toISOString();

export const seedEvents = [
  {
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
    fields: [
      {
        id: "field-pala-cesenatico",
        name: "Pala Cesenatico",
        address: "Via Magellano 23, Cesenatico FC",
        mapUrl: ""
      },
      {
        id: "field-campo-centrale",
        name: "Campo Centrale",
        address: "Cesenatico FC",
        mapUrl: ""
      }
    ],
    teams: [
      { id: "team-u14-1", name: "PGS Aurora", category: "Under 14", city: "Bologna" },
      { id: "team-u16-1", name: "PGS Stella", category: "Under 16", city: "Parma" }
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
      }
    ],
    rankingColumns: ["SQUADRE", "GIOCATE", "PUNTI", "SET VINTI", "SET PERSI", "QUOZ SET", "PUNTI FATTI", "PUNTI SUBITI", "QUOZ PUNTI"],
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
          SQUADRE: "PGS DOMANI PESSANO BLU",
          GIOCATE: "2",
          PUNTI: "6",
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
          SQUADRE: "PGS PIANTA",
          GIOCATE: "2",
          PUNTI: "3",
          "SET VINTI": "2",
          "SET PERSI": "3",
          "QUOZ SET": "0.667",
          "PUNTI FATTI": "84",
          "PUNTI SUBITI": "109",
          "QUOZ PUNTI": "0.771"
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
      }
    ],
    createdAt: now,
    updatedAt: now
  }
];

export const seedComments = [
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
  }
];
