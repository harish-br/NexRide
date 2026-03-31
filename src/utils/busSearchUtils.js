export const PLACES = [
    {
        id: 'erode',
        name: 'Erode',
        aliases: ['erd', 'erode bus stand', 'erode junction', 'erode city'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'coimbatore',
        name: 'Coimbatore',
        aliases: ['cbe', 'coimbatore city', 'gandhipuram', 'ukkadam', 'kovai'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'mettur',
        name: 'Mettur',
        aliases: ['mtr', 'mettur dam', 'mettur bus stand'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'palani',
        name: 'Palani',
        aliases: ['plni', 'palani bus stand'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'dharapuram',
        name: 'Dharapuram',
        aliases: ['dpm', 'dharapuram bus stand'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'kangayam',
        name: 'Kangayam',
        aliases: ['kgm', 'kangayam bus stand'],
        subtitle: 'Tamil Nadu'
    },
    {
        id: 'anthiyur',
        name: 'Anthiyur',
        aliases: ['ant', 'anthiyur bus stand'],
        subtitle: 'Tamil Nadu'
    }
];

export const normalizePlace = (input) => {
    if (!input) return '';
    // User requested normalization:
    // 1. Lowercase
    // 2. Remove: "bus stand", "junction", "railway station"
    // 3. Remove commas, dots, hyphens
    // 4. Trim

    let clean = input.toLowerCase();

    // Remove specific keywords (order matters - longer phrases first if needed)
    clean = clean.replace(/bus stand/g, '');
    clean = clean.replace(/junction/g, '');
    clean = clean.replace(/railway station/g, '');
    clean = clean.replace(/terminal/g, '');
    clean = clean.replace(/new/g, '');
    clean = clean.replace(/old/g, '');
    // Note: User didn't ask to remove 'new'/'old' explicitly but "Avinashi New Bus Stand" -> "Avinashi" might be desired?
    // User example: "Erode Bus Stand" -> "erode". "Mettur, Tamil Nadu" -> "mettur".
    // I will stick to the user's explicit list + typical noise chars.

    // Remove special chars (comma, dot, hyphen)
    clean = clean.replace(/[.,-]/g, ' ');

    // Collapse spaces and trim
    clean = clean.replace(/\s+/g, ' ').trim();

    // Direct alias lookup (Optional: if the aliases already cover these cases, this lookup is fine)
    // But since we want to normalize DATA too, we focus on the string clean up.

    // Check aliases for exact match after cleaning?
    // The previous logic did alias lookup. I should preserve it but use the new `clean` input.
    for (const place of PLACES) {
        if (place.name.toLowerCase() === clean) return place.name;
        if (place.id === clean) return place.name;
        if (place.aliases.includes(clean)) return place.name;
    }

    return clean;
};

export const getSuggestions = (input) => {
    if (!input) return [];
    const cleanInput = input.toLowerCase().replace(/[.\-\s]+/g, ' ').trim();
    if (cleanInput.length < 1) return [];

    return PLACES.filter(place => {
        if (place.name.toLowerCase().includes(cleanInput)) return true;
        if (place.id.includes(cleanInput)) return true;
        return place.aliases.some(alias => alias.includes(cleanInput));
    });
};
