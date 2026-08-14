// Curriculum for a five-year-old French speaker starting Spanish from zero.
// Latin American Spanish (es-MX).
//
// Every item needs an `emoji` that reads unambiguously on its own, because the
// child cannot read: the picture carries the meaning, the text is decoration.
// `slug` is the stable key for generated audio and illustrations — never rename
// one, or its media silently falls back to emoji and browser speech.
window.CURRICULUM = [
  {
    id: "animales",
    title: "Los animales",
    titleFr: "Les animaux",
    icon: "🐾",
    items: [
      { slug: "gato",    es: "el gato",    fr: "le chat",    emoji: "🐱" },
      { slug: "perro",   es: "el perro",   fr: "le chien",   emoji: "🐶" },
      { slug: "pajaro",  es: "el pájaro",  fr: "l'oiseau",   emoji: "🐦" },
      { slug: "pez",     es: "el pez",     fr: "le poisson", emoji: "🐟" },
      { slug: "caballo", es: "el caballo", fr: "le cheval",  emoji: "🐴" },
      { slug: "vaca",    es: "la vaca",    fr: "la vache",   emoji: "🐮" },
    ],
  },
  {
    id: "colores",
    title: "Los colores",
    titleFr: "Les couleurs",
    icon: "🎨",
    items: [
      { slug: "rojo",     es: "rojo",     fr: "rouge", emoji: "🟥", color: "#e11d48" },
      { slug: "azul",     es: "azul",     fr: "bleu",  emoji: "🟦", color: "#2563eb" },
      { slug: "verde",    es: "verde",    fr: "vert",  emoji: "🟩", color: "#16a34a" },
      { slug: "amarillo", es: "amarillo", fr: "jaune", emoji: "🟨", color: "#facc15" },
      { slug: "negro",    es: "negro",    fr: "noir",  emoji: "⬛", color: "#1f2937" },
      { slug: "blanco",   es: "blanco",   fr: "blanc", emoji: "⬜", color: "#f8fafc" },
    ],
  },
  {
    id: "numeros",
    title: "Los números",
    titleFr: "Les nombres",
    icon: "🔢",
    // `count` drives the counting exercise: that many objects to tally.
    items: [
      { slug: "uno",    es: "uno",    fr: "un",     emoji: "1️⃣", count: 1 },
      { slug: "dos",    es: "dos",    fr: "deux",   emoji: "2️⃣", count: 2 },
      { slug: "tres",   es: "tres",   fr: "trois",  emoji: "3️⃣", count: 3 },
      { slug: "cuatro", es: "cuatro", fr: "quatre", emoji: "4️⃣", count: 4 },
      { slug: "cinco",  es: "cinco",  fr: "cinq",   emoji: "5️⃣", count: 5 },
      { slug: "seis",   es: "seis",   fr: "six",    emoji: "6️⃣", count: 6 },
    ],
  },
  {
    id: "comida",
    title: "La comida",
    titleFr: "La nourriture",
    icon: "🍎",
    items: [
      { slug: "manzana", es: "la manzana", fr: "la pomme",   emoji: "🍎" },
      { slug: "pan",     es: "el pan",     fr: "le pain",    emoji: "🍞" },
      { slug: "leche",   es: "la leche",   fr: "le lait",    emoji: "🥛" },
      { slug: "queso",   es: "el queso",   fr: "le fromage", emoji: "🧀" },
      { slug: "huevo",   es: "el huevo",   fr: "l'œuf",      emoji: "🥚" },
      { slug: "agua",    es: "el agua",    fr: "l'eau",      emoji: "💧" },
    ],
  },
  {
    id: "familia",
    title: "La familia",
    titleFr: "La famille",
    icon: "👨‍👩‍👦",
    items: [
      { slug: "mama",    es: "la mamá",    fr: "la maman",    emoji: "👩" },
      { slug: "papa",    es: "el papá",    fr: "le papa",     emoji: "👨" },
      { slug: "hermano", es: "el hermano", fr: "le frère",    emoji: "👦" },
      { slug: "hermana", es: "la hermana", fr: "la sœur",     emoji: "👧" },
      { slug: "abuela",  es: "la abuela",  fr: "la grand-mère", emoji: "👵" },
      { slug: "abuelo",  es: "el abuelo",  fr: "le grand-père", emoji: "👴" },
    ],
  },
  {
    id: "saludos",
    title: "Los saludos",
    titleFr: "Les salutations",
    icon: "👋",
    // Every other unit teaches nouns, where the picture IS the meaning: 🐱 is
    // el gato. Greetings are not things, so a bare ☀️ for "buenos días" taught
    // the wrong lesson -- a sun is el sol, and the child said so.
    //
    // So each greeting starts with 👋, meaning "this is something you say",
    // and the second glyph says when. Plain 👋 is hola: the greeting with no
    // particular moment attached.
    //
    // This is a patch on the real problem, not a solution to it. The honest
    // fix is a reply exercise -- someone says "¿Hola?" and the child picks the
    // answer -- which is what replyTo below is for. Nothing reads it yet.
    items: [
      { slug: "hola",         es: "hola",         fr: "salut",     emoji: "👋",
        replyTo: "¿Hola?", prompt: "hola" },
      { slug: "buenos-dias",  es: "buenos días",  fr: "bonjour",   emoji: "👋☀️" },
      { slug: "buenas-noches",es: "buenas noches",fr: "bonne nuit",emoji: "👋🌙" },
      { slug: "adios",        es: "adiós",        fr: "au revoir", emoji: "👋🚶" },
      // gracias is not a moment, so the 👋 + when pattern does not fit it.
      // It stays a bare glyph until the reply exercise exists.
      { slug: "gracias",      es: "gracias",      fr: "merci",     emoji: "🙏" },
      { slug: "si",           es: "sí",           fr: "oui",       emoji: "✅" },
    ],
  },
];
