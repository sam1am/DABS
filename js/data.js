// DABS - game content: districts, bars, bosses, violations, upgrades, achievements, story
(function () {
  const D = DABS.data = {};
  const G = DABS.gfx;

  D.CHARACTERS = {
    commissioner: { name: 'Commissioner Temperance Stone', color: '#f5c542', bg1: '#2a2f55', bg2: '#0d1326', mood: 'angry', look: { skin: '#e9b58c', hair: '#d8d3c8', hairStyle: 4, shirt: '#1e293b', pants: '#0f172a', glasses: true, accessory: 'pearls', badge: true, medals: 3 } },
    agent: { name: 'You', color: '#60a5fa', look: G.AGENT_LOOK },
    radio: { name: 'DABS Dispatch', color: '#a3e635', look: { skin: '#b07a4f', hair: '#1a1a1a', hairStyle: 6, shirt: '#14532d', pants: '#0f172a', hat: 'headphones' } },
    baron: { name: 'Baron Von Brewster', color: '#ef4444', bg1: '#3b0a0e', bg2: '#12040a', mood: 'angry', holding: 'wine', look: { skin: '#f6d3b3', hair: '#1a1a1a', hairStyle: 3, shirt: '#7a1c24', pants: '#111', hat: 'tophat', monocle: true, bigMustache: true, accessory: 'chain', jacket: '#4a0d12' } },
    sal: { name: 'Big Sal Suds', color: '#f59e0b', mood: 'angry', holding: 'mug', look: { skin: '#e9b58c', hair: '#1a1a1a', hairStyle: 3, shirt: '#f8fafc', pants: '#374151', apron: 'black', beard: true, mustache: true } },
    dj: { name: 'DJ Blackout', color: '#22d3ee', mood: 'happy', look: { skin: '#8d5a3a', hair: '#22d3ee', hairStyle: 5, shirt: '#111827', pants: '#111827', hat: 'headphones', glasses: 'sun', accessory: 'chain' } },
    chad: { name: 'Chad Kegstand III', color: '#ec4899', mood: 'happy', holding: 'beer', look: { skin: '#f1c8a8', hair: '#e0b34b', hairStyle: 1, shirt: '#ec4899', pants: '#f8fafc', glasses: 'sun', hat: 'cap', hatColor: '#3b82f6' } },
    grog: { name: 'Captain Grog', color: '#38bdf8', mood: 'angry', holding: 'bottle', look: { skin: '#d19a6b', hair: '#8e8e8e', hairStyle: 2, beard: true, shirt: '#1a2a4a', pants: '#111', hat: 'captain', eyepatch: true, medals: 2 } },
    countess: { name: 'Countess Cabernet', color: '#c084fc', mood: 'neutral', holding: 'wine', look: { skin: '#f6d3b3', hair: '#c1352b', hairStyle: 4, shirt: '#7c3aed', pants: '#4c1d95', hat: 'tiara', accessory: 'pearls' } },
    mayor: { name: 'Mayor Bartholomew Pickles', color: '#a3e635', mood: 'happy', look: { skin: '#f6d3b3', hair: '#b5762f', hairStyle: 0, shirt: '#334155', pants: '#1e293b', accessory: 'tie', tieColor: '#22c55e', mustache: true } },
  };

  D.VIOLATIONS = {
    UNDERAGE: { name: 'Serving a Minor', short: 'Underage', points: 600, code: '§21-A', target: 'patron', desc: 'A patron under 21 is consuming alcohol.' },
    FAKE_ID: { name: 'Possession of a Fake ID', short: 'Fake ID', points: 700, code: '§21-F', target: 'patron', desc: 'That hologram is a sticker of a dolphin.' },
    OVERSERVED: { name: 'Over-Service', short: 'Over-served', points: 500, code: '§44-B', target: 'patron', desc: 'Patron is visibly intoxicated and still being served.' },
    ON_DUTY: { name: 'Drinking on Duty', short: 'Drinking on duty', points: 550, code: '§12-D', target: 'staff', desc: 'Staff member consuming alcohol while working.' },
    NO_ID_CHECK: { name: 'Failure to Check ID', short: 'No ID check', points: 650, code: '§21-C', target: 'bartender', desc: 'Bartender served a youthful patron without checking ID.' },
    OPEN_CONTAINER: { name: 'Open Container Exit', short: 'Open container', points: 500, code: '§31-O', target: 'patron', desc: 'Patron attempting to leave with an open drink.' },
    EXPIRED_LICENSE: { name: 'Expired Liquor License', short: 'Expired license', points: 800, code: '§01-L', target: 'object', desc: 'The license on the wall expired before you were born.' },
    ILLEGAL_PROMO: { name: 'Illegal Drink Promotion', short: 'Illegal promo', points: 600, code: '§55-P', target: 'object', desc: 'Bottomless anything is illegal. And unwise.' },
    UNTAXED_KEG: { name: 'Untaxed Contraband Keg', short: 'Contraband keg', points: 900, code: '§77-K', target: 'object', desc: 'No tax stamp. Smells like the high seas.' },
    WATERED_DOWN: { name: 'Adulterated Spirits', short: 'Watered down', points: 850, code: '§66-W', target: 'object', desc: 'Label says 40%. Bottle says tap water.' },
  };
  D.PATRON_CITES = ['UNDERAGE', 'FAKE_ID', 'OVERSERVED', 'OPEN_CONTAINER', 'ON_DUTY'];
  D.BARTENDER_CITES = ['NO_ID_CHECK', 'ON_DUTY'];

  D.RANKS = [
    { name: 'Cadet', xp: 0 }, { name: 'Junior Agent', xp: 2500 }, { name: 'Agent', xp: 6000 }, { name: 'Senior Agent', xp: 12000 }, { name: 'Inspector', xp: 20000 },
    { name: 'Chief Inspector', xp: 30000 }, { name: 'Deputy Director', xp: 45000 }, { name: 'Director', xp: 65000 }, { name: 'Grand Sommelier of Justice', xp: 90000 },
  ];
  D.rankFor = (xp) => { let r = D.RANKS[0], i = 0; D.RANKS.forEach((rk, k) => { if (xp >= rk.xp) { r = rk; i = k; } }); return { rank: r, index: i, next: D.RANKS[i + 1] || null }; };

  D.UPGRADES = [
    { id: 'engines', name: 'Turbo Props', cat: 'BLIMP', desc: 'Thrust and top speed +25% per level. Feel the (mild) G-forces.', costs: [300, 700, 1400] },
    { id: 'armor', name: 'Kevlar Envelope', cat: 'BLIMP', desc: 'Hull integrity +50 per level. Pigeon-resistant.', costs: [250, 600, 1200] },
    { id: 'cannon', name: 'Citation Cannon', cat: 'BLIMP', desc: 'Faster fire rate and heavier paperwork. Two barrels at level 3.', costs: [350, 800, 1500] },
    { id: 'radar', name: 'Tip Radar', cat: 'BLIMP', desc: 'Wider rappel zone, violation counts on approach, folders on the minimap.', costs: [300, 700, 1300] },
    { id: 'rope', name: 'Kevlar Rope', cat: 'AGENT', desc: 'Quicker, steadier descents and shorter stuns when you bonk something.', costs: [250, 550, 1100] },
    { id: 'shift', name: 'Overtime Authorization', cat: 'AGENT', desc: '+10 seconds per inspection per level. Paid in exposure.', costs: [400, 900, 1800] },
    { id: 'scanner', name: 'ID Scanner', cat: 'AGENT', desc: 'ID checks are much faster. Reads holograms, dolphins included.', costs: [300, 700, 1400] },
    { id: 'boots', name: 'Regulation Boots', cat: 'AGENT', desc: 'Move faster and sprint longer inside bars and arenas.', costs: [250, 600, 1200] },
    { id: 'tackle', name: 'Tackle Training', cat: 'AGENT', desc: 'Longer tackle lunge. Fleeing suspects hate this one trick.', costs: [300, 650, 1300] },
    { id: 'badge', name: 'Shinier Badge', cat: 'AGENT', desc: 'Suspects are less likely to bolt, and your combo window is longer.', costs: [350, 800, 1600] },
    { id: 'vest', name: 'Padded Vest', cat: 'COMBAT', desc: '+1 heart in kingpin showdowns per level.', costs: [400, 900, 1800] },
    { id: 'forms', name: 'Triplicate Forms', cat: 'COMBAT', desc: 'Thrown citations hit harder and fly faster. Paper cuts of justice.', costs: [400, 900, 1800] },
  ];

  D.ACHIEVEMENTS = [
    { id: 'first_bust', name: 'First Bust', desc: 'Bust your first bar.', icon: '🍺' },
    { id: 'perfect_entry', name: 'Through The Looking Glass', desc: 'Make a Perfect window entry.', icon: '🪟' },
    { id: 'gold', name: 'Gold Standard', desc: 'Earn a Gold rating on a bar.', icon: '🥇' },
    { id: 'clean_sweep', name: 'Clean Sweep', desc: 'Gold rating on every required bar in a district.', icon: '🧹' },
    { id: 'drones10', name: 'Drone Ranger', desc: 'Shoot down 10 Big Booze drones.', icon: '🛸' },
    { id: 'tackle10', name: 'Tackle Dummy', desc: 'Tackle 10 fleeing suspects.', icon: '🏈' },
    { id: 'folders25', name: 'Paper Pusher', desc: 'Collect 25 evidence folders.', icon: '📁' },
    { id: 'bythebook', name: 'By The Book', desc: 'Cite every violation in a bar with zero complaints.', icon: '📖' },
    { id: 'id50', name: 'Papers, Please', desc: 'Check 50 IDs.', icon: '🪪' },
    { id: 'boss1', name: "Party's Over", desc: 'Defeat your first kingpin.', icon: '🎉' },
    { id: 'untouchable', name: 'Untouchable', desc: 'Defeat a kingpin without taking damage.', icon: '🛡️' },
    { id: 'fly10', name: 'Frequent Flyer', desc: 'Fly 10 km in the blimp.', icon: '✈️' },
    { id: 'crash', name: 'Oh, The Humanity', desc: 'Crash the blimp. It happens to everyone.', icon: '💥' },
    { id: 'oops', name: 'Oops', desc: 'Cite an innocent patron.', icon: '😬' },
    { id: 'combo4', name: 'Combo Cop', desc: 'Reach a x4 citation combo.', icon: '🔥' },
    { id: 'cite100', name: 'Century Citation', desc: 'Issue 100 citations.', icon: '💯' },
    { id: 'pigeons20', name: 'Rats With Wings', desc: 'Splat 20 pigeons.', icon: '🐦' },
    { id: 'speedrun', name: 'Speed Reader', desc: 'Clear every violation with 20+ seconds left.', icon: '⚡' },
    { id: 'fullkit', name: 'Fully Equipped', desc: 'Buy every upgrade.', icon: '🧰' },
    { id: 'allbars', name: 'No Bar Left Behind', desc: 'Bust every bar in the city, optional ones included.', icon: '🏙️' },
    { id: 'rank_director', name: 'Top Brass', desc: 'Reach the rank of Director.', icon: '⭐' },
    { id: 'win', name: 'Last Call', desc: 'Cite the Baron and save Port Tipsy.', icon: '🏆' },
  ];

  D.FIRST = ['Gary', 'Brenda', 'Tyler', 'Maddie', 'Doug', 'Priya', 'Kevin', 'Ashley', 'Trevor', 'Linda', 'Jamal', 'Chelsea', 'Bruno', 'Sofia', 'Dale', 'Megan', 'Rick', 'Tanya', 'Hank', 'Zoe', 'Marcus', 'Bethany', 'Skyler', 'Gus', 'Wanda', 'Percy', 'Nadia', 'Clyde', 'Ruth', 'Kai', 'Bianca', 'Ernie', 'Lupe', 'Chip', 'Dolores', 'Rocco', 'Ingrid', 'Dexter', 'Fern'];
  D.LAST = ['McSwiggins', 'Fizzle', 'Lager', 'Tankard', 'Bottomsworth', 'Hopkins', 'Stein', 'Guzzle', 'Pilsner', 'Corkwood', 'Barley', 'Malt', 'Sipperton', 'Tumbler', 'Tipsington', 'Flagon', 'Draught', 'Bung', 'Jigger', 'Highball', 'Shandy', 'Porter', 'Stout', 'Chugg', 'Bubbles', 'Swizzle', 'Nightcap', 'Vermouth', 'Rummage', 'Quaff'];
  D.PATRON_LINES = ['Another round!', 'I love this song!', "It's my birthday! (it isn't)", 'Cheers!', 'Do you validate parking?', 'Best. Night. Ever.', 'Who ordered the nachos?', 'Is that a blimp outside?', "I'm just here for the trivia.", 'My uber is 40 minutes away.', 'Hic!', 'Wanna see a magic trick?', "I'm totally fine.", 'One more and I go home. Promise.', 'This is a water. Mostly.', "Where's the bathroom?", 'Karaoke time!', 'You look like a cop.', 'I tip in compliments.'];
  D.YOUNG_LINES = ["I'm 21, I swear!", 'My mom said I could.', 'Is this the study group?', "Don't tell coach.", 'I have a note.', "It's root beer! ...ish.", 'I left my ID in my other backpack.'];
  D.FLEE_LINES = ["YOU'LL NEVER TAKE ME!", "I'm not even drunk!", 'Free bird!', 'Run, legs, run!', "It's a fake fake ID!", 'MY DAD IS A LAWYER!', 'Catch me if you can, narc!'];
  D.BARTENDER_LINES = ['What can I get ya?', "ID? Nah, you're good.", 'Last call was an hour ago... just kidding!', "Don't tell the boss.", 'This one is on the house.', 'You look... old enough.', "I've seen you here since you were 12!"];
  D.CITED_LINES = ['This is an outrage!', "I'll see you in court!", 'Can I still finish this?', 'Worth it.', 'My lawyer is also drunk.', 'Ugh, fine.', 'Do you take Venmo?'];
  D.INNOCENT_LINES = ["I'm THIRTY-FOUR!", 'I run a hospice!', "It's cranberry juice!", "I'm the designated driver!", 'I want to speak to your manager!', 'This is a SODA WATER.'];

  // Palettes per district: sky top/bottom, far/mid/near building tints, neon accent, ground
  D.DISTRICTS = [
    {
      id: 'sudsrow', name: 'SUDS ROW', sub: 'Old Town — where the beer is flat and the morals are flatter', width: 5600, music: 'city',
      sky: ['#0b0f2e', '#2a1d4a', '#5a2d3a'], far: '#1a1a3a', mid: '#23233f', near: '#2e2a45', neon: ['#ff3cac', '#ffd166', '#06d6a0'], ground: '#1a1826', fog: 'rgba(90,60,90,0.25)',
      hazards: { pigeons: 1, drones: 0, choppers: 0, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK'], patrons: [5, 7], time: 50, folders: 10,
      bars: [
        { name: 'The Rusty Tap', tag: 'Est. 1974. Cleaned 1974.' }, { name: "Mabel's Dive", tag: 'Mabel is 90 and does not check IDs' }, { name: 'The Leaning Stein', tag: 'Structurally questionable' }, { name: "Frothy McGee's", tag: 'Home of the 64oz "Tuesday"' },
        { name: "Uncle Barnaby's Pretzel Hut", tag: 'Pretzels are a garnish here', opt: true }, { name: 'The Hiccup Room', tag: 'Hic', opt: true },
      ],
      boss: { id: 'sal', lair: "SAL'S KEG KINGDOM", name: 'Big Sal Suds', hp: 24, title: 'The Keg Baron of Old Town' },
    },
    {
      id: 'neon', name: 'THE NEON STRIP', sub: 'Downtown — every night is Saturday, every Saturday is a crime', width: 6400, music: 'city',
      sky: ['#070a24', '#1b1650', '#7a1f7a'], far: '#141838', mid: '#1d1f4a', near: '#27234f', neon: ['#00f5d4', '#f15bb5', '#fee440', '#9b5de5'], ground: '#141226', fog: 'rgba(150,60,160,0.22)',
      hazards: { pigeons: 1, drones: 1, choppers: 0, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY'], patrons: [6, 8], time: 52, folders: 12,
      bars: [
        { name: 'Club Voltage', tag: 'Two-drink minimum, zero-brain maximum' }, { name: 'The Velvet Hangover', tag: 'Bottle service, no bottle inspection' }, { name: 'Bassdrop Lounge', tag: 'You can feel the violations' }, { name: 'Lazer Lounge', tag: 'Pew pew (the lasers, not you)' }, { name: 'Neon Nectar', tag: 'Glow-in-the-dark cocktails, glow-in-the-dark IDs' },
        { name: 'Karaoke Katastrophe', tag: "Everyone's a star. A very drunk star.", opt: true }, { name: 'The Glow Stick', tag: 'Rave responsibly. They do not.', opt: true },
      ],
      boss: { id: 'dj', lair: 'CLUB ECLIPSE', name: 'DJ Blackout', hp: 30, title: 'Master of the Midnight Blackout' },
    },
    {
      id: 'frat', name: 'FRAT ROW', sub: 'University District — higher learning, lower standards', width: 6800, music: 'city',
      sky: ['#0a1a2e', '#123a5a', '#2c6a7a'], far: '#0f2238', mid: '#173049', near: '#1f3a55', neon: ['#ffd60a', '#ff4d6d', '#4cc9f0'], ground: '#0f1c2a', fog: 'rgba(60,120,150,0.22)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER'], patrons: [7, 9], time: 55, folders: 12,
      bars: [
        { name: 'Kappa Kegga Brew', tag: 'Rush week is every week' }, { name: 'The Study Hall', tag: 'No studying has ever occurred here' }, { name: "Prof. Pilsner's", tag: 'Office hours: 9pm to 4am' }, { name: 'Beer Pong Palace', tag: 'Olympic-level cup arrangement' }, { name: 'The All-Nighter', tag: 'Sponsored by regret' },
        { name: 'Campus Corner', tag: 'Half-price with student ID (any ID)', opt: true }, { name: "The Dean's Basement", tag: 'The Dean does not know about this', opt: true },
      ],
      boss: { id: 'chad', lair: 'DELTA CHUGGA HOUSE', name: 'Chad Kegstand III', hp: 36, title: 'Undefeated Beer Pong Champion' },
    },
    {
      id: 'docks', name: 'THE DOCKS', sub: 'Waterfront — rum, rum, and additional rum', width: 7000, music: 'city',
      sky: ['#04101a', '#0a2a3a', '#1d5a5a'], far: '#082030', mid: '#0d2a3d', near: '#123548', neon: ['#00b4d8', '#ff9f1c', '#e63946'], ground: '#061218', fog: 'rgba(40,110,120,0.3)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 1, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG'], patrons: [7, 10], time: 58, folders: 14,
      bars: [
        { name: 'The Salty Barnacle', tag: 'Everything is salty. Especially the bartender.' }, { name: "Rum Runner's Rest", tag: 'The rum never rests' }, { name: 'The Drunken Gull', tag: 'The gull is, in fact, drunk' }, { name: "Cap'n Sloshbeard's", tag: 'Yarr, no tax stamps' }, { name: 'Grog Harbor', tag: 'Grog: it is a harbor' },
        { name: 'Bait & Booze', tag: 'Two great tastes', opt: true }, { name: 'The Dock Rat', tag: 'Named after the owner', opt: true },
      ],
      boss: { id: 'grog', lair: 'THE S.S. BLACKOUT', name: 'Captain Grog', hp: 42, title: 'Admiral of the Untaxed Fleet' },
    },
    {
      id: 'heights', name: 'CHAMPAGNE HEIGHTS', sub: 'Uptown — old money, older wine, oldest violations', width: 7200, music: 'city',
      sky: ['#100a2e', '#3a1a5a', '#8a3a7a'], far: '#1b1238', mid: '#2a1a4a', near: '#37245a', neon: ['#f5c542', '#e0aaff', '#ff7aa2'], ground: '#160f2a', fog: 'rgba(140,90,170,0.25)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 1, storm: 1 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG', 'WATERED_DOWN'], patrons: [8, 11], time: 60, folders: 14,
      bars: [
        { name: 'Le Snoot', tag: 'Reservations required, IDs optional' }, { name: 'The Gilded Goblet', tag: 'Gold-plated over-service' }, { name: 'Château Bubbly', tag: 'Corks fly. So do lawsuits.' }, { name: 'Monocle & Cork', tag: 'They will judge your shoes' }, { name: 'The Trust Fund', tag: 'Daddy pays the citations' },
        { name: 'Caviar Cellar', tag: 'Fish eggs and fake IDs', opt: true }, { name: 'The Velvet Rope', tag: 'You are not on the list. Rappel in anyway.', opt: true },
      ],
      boss: { id: 'countess', lair: 'CHÂTEAU CABERNET', name: 'Countess Cabernet', hp: 48, title: 'Sommelier of Sin' },
    },
    {
      id: 'distillery', name: 'DISTILLERY DISTRICT', sub: 'Industrial — the Baron\'s lair. Final shift.', width: 7600, music: 'city',
      sky: ['#0a0508', '#2a0a12', '#5a1a1a'], far: '#1a0a10', mid: '#25101a', near: '#301622', neon: ['#ff2a2a', '#ffb703', '#8ac926'], ground: '#120609', fog: 'rgba(120,40,40,0.3)',
      hazards: { pigeons: 1, drones: 2, choppers: 1, fireworks: 1, storm: 1 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG', 'WATERED_DOWN'], patrons: [9, 12], time: 62, folders: 16,
      bars: [
        { name: 'The Still', tag: 'Nothing here is still' }, { name: 'Barrel House 9', tag: 'Houses 1-8 were condemned' }, { name: "Moonshine Mike's", tag: 'Mike is a legend. Legally, a fugitive.' }, { name: 'The Boiler Room', tag: 'Pressure is building' }, { name: 'Copper Coil', tag: 'Proof: yes' }, { name: 'The Mash Tun', tag: 'Last stop before the Baron' },
        { name: 'Pipe & Proof', tag: 'Employees only. Employees are all drunk.', opt: true },
      ],
      boss: { id: 'baron', lair: 'THE FLYING SPEAKEASY', name: 'Baron Von Brewster', hp: 64, title: 'CEO of Big Booze Inc.', airship: true },
    },
  ];
  D.DISTRICTS.forEach((d, i) => { d.index = i; d.required = d.bars.filter(b => !b.opt).length; });

  // ---------- Story ----------
  D.INTRO_CARDS = [
    { title: 'PORT TIPSY', text: 'Population: 2 million. Blood alcohol content: also 2 million. A city that never sleeps, mostly because it never stops drinking.', art: 'city' },
    { title: 'D.A.B.S.', text: 'The Department of Beverage Services. Underfunded. Over-caffeinated. The last line of defense between this city and a catastrophic hangover.', art: 'badge' },
    { title: 'BIG BOOZE INC.', text: 'Rumors swirl of a shadowy syndicate flooding the city with cheap hooch, fake IDs, and bottomless brunch. Its CEO: the elusive Baron Von Brewster.', art: 'baron' },
    { title: 'THE SOBER SKYHAWK', text: "Tonight, a rookie takes command of DABS Enforcement Blimp #1. Your mission: enforce every beverage regulation in the book. With extreme prejudice.", art: 'blimp' },
  ];
  D.BRIEFINGS = [
    [
      { who: 'commissioner', text: "Rookie. Welcome to the Department of Beverage Services. Coffee's in the corner. It's decaf. We're serious about beverages here." },
      { who: 'commissioner', text: "Suds Row is a mess. Kids drinking, drunks drinking, bartenders pouring like it's a fire drill. I want every bar on that strip cited into the ground." },
      { who: 'commissioner', text: "Fly the Skyhawk over a bar, rappel through the window, and enforce. Check IDs, cite violators, and for the love of tonic water, don't cite the innocent. Internal Affairs reads every complaint." },
      { who: 'commissioner', text: "Bust four bars and the local kingpin will crawl out of his keg. Big Sal Suds. He rolls barrels at people. Don't ask me why. Cite him." },
      { who: 'radio', text: "Dispatch here! Controls: WASD or Arrows to fly, E to rappel over a glowing bar, SPACE fires the Citation Cannon. Pause with ESC. You got this, probably!" },
    ],
    [
      { who: 'commissioner', text: "Sal's keg manifest lists deliveries to the Neon Strip, all signed by someone called 'DJ B'. Subtle." },
      { who: 'commissioner', text: "Downtown clubs are running fake IDs and 'bottomless' promotions. Bottomless. It's in the name of the crime, Rookie." },
      { who: 'commissioner', text: "Watch the bartenders. If they serve a baby-faced patron without asking for ID, you cite them on the spot while the evidence is fresh. And check the promo boards." },
      { who: 'radio', text: "Heads up: Big Booze drones are patrolling the skies now. They drop kegs. SPACE to shoot them down. Evidence folders float around too, grab 'em for cash!" },
    ],
    [
      { who: 'commissioner', text: "DJ Blackout's playlist was titled 'LAST CALL — FINAL MIX'. Every track was sixty seconds of a man laughing. We think it's the Baron." },
      { who: 'commissioner', text: "Frat Row next. Students are walking OUT of bars with open drinks. Open containers, Rookie. On the sidewalk. Where children could see them... on the sidewalk." },
      { who: 'commissioner', text: "Suspects will run when cited. Chase them with SHIFT and tackle with SPACE. The kingpin, Chad Kegstand the Third, is a three-time beer pong champion. Cite him. Four times." },
      { who: 'radio', text: "Campus security helicopters are in the air tonight. They're big and they don't look where they're going. Neither do the frisbees." },
    ],
    [
      { who: 'commissioner', text: "Chad's tattoo read 'Operation Last Call, 12/31'. He said it was a tramp stamp. It was a shipping schedule." },
      { who: 'commissioner', text: "The Docks. Untaxed kegs are coming in by the boatload. Inspect any suspicious barrels behind the bar and cite the contraband." },
      { who: 'commissioner', text: "Captain Grog runs the fleet from a party boat called the S.S. Blackout. He fires barrels from cannons. This is, technically, a beverage violation." },
      { who: 'radio', text: "Fireworks over the harbor tonight. Pretty, and also they will blow the fins off your blimp. Fly careful!" },
    ],
    [
      { who: 'commissioner', text: "Grog's manifest: 10,000 gallons of something called 'Everflow', bound for a gala at Château Cabernet. The invitation was engraved. On a keg." },
      { who: 'commissioner', text: "Champagne Heights. Old money, watered-down spirits. Taste-test the suspicious bottles on the shelves. Yes, it's part of the job. No, you may not enjoy it." },
      { who: 'commissioner', text: "Countess Cabernet hosts the gala. She fires champagne corks at fifty miles an hour. Wear the vest. Cite her with dignity." },
      { who: 'radio', text: "Storm rolling in over Uptown. Lightning hits the tallest thing in the sky. That's you. Watch for the flash!" },
    ],
    [
      { who: 'commissioner', text: "It's all connected. Everflow is a self-replicating hooch. The Baron plans to dump it into the city water supply at midnight from his airship. Every tap in Port Tipsy would pour bourbon." },
      { who: 'commissioner', text: "The Distillery District is crawling with his people. Bust every bar so his supply lines collapse, then take the Skyhawk up against the Flying Speakeasy." },
      { who: 'commissioner', text: "Shoot out its engines, rappel aboard, and serve the Baron the ultimate citation: Form 86-Z. I've had it laminated." },
      { who: 'radio', text: "This is it, Agent. The whole department is watching. Also my mom. Hi mom! Go get him!" },
    ],
  ];
  D.DEBRIEFS = [
    [{ who: 'sal', mood: 'sad', text: "Ugh. Fine. You got me. But Sal's just a small fish! The Strip's where the real money is. Ask for DJ B. Tell him... tell him Sal says the kegs are still rolling." }, { who: 'commissioner', text: "Sloppy, loud, and effective. Suds Row is dry. Report to HQ for upgrades, Rookie. You're going to need them." }],
    [{ who: 'dj', mood: 'sad', text: "My set! My beautiful set! Okay, okay. The kids on Frat Row buy fakes from a bro named Chad. And the Baron... the Baron is planning something for New Year's." }, { who: 'commissioner', text: "The Strip is dark and sober. The mayor called to complain, then hiccupped, then hung up. Good work." }],
    [{ who: 'chad', mood: 'scared', text: "Bro. BRO. I'm just the middleman! The kegs come in through the Docks, on Grog's boats! Please don't tell my dad, he's on the board of DABS!" }, { who: 'commissioner', text: "He is not on the board. We don't have a board. We have a folding table. Frat Row is clean. Moving on to the harbor." }],
    [{ who: 'grog', mood: 'angry', text: "Blast ye! The Everflow shipment already sailed... to the Heights. The Countess is throwing a gala for the Baron. Ye'll never get past the velvet rope!" }, { who: 'commissioner', text: "The fleet is impounded. Every barrel. We're going to need a bigger evidence locker." }],
    [{ who: 'countess', mood: 'sad', text: "Such a brute. Very well. The Baron's airship departs from the Distillery District at midnight. He'll pour Everflow into the reservoir. The whole city, drunk forever. Frankly, it sounds exhausting." }, { who: 'commissioner', text: "The gala is over. Uptown is sober and furious. One district left, Agent. Get some sleep. Just kidding, there's no time." }],
    [{ who: 'baron', mood: 'sad', text: "NOOO! My Everflow! My empire! Cited... by a rookie with a blimp! Do you know how much this top hat cost?!" }, { who: 'commissioner', mood: 'happy', text: "The reservoir is safe. The Baron is in custody. The city's water tastes like water. Agent... you did it. Drinks are on me. Sparkling water, obviously." }],
  ];
  D.BOSS_INTRO = {
    sal: [{ who: 'sal', text: "Well, well. A DABS agent in MY kingdom. You like kegs, badge boy? Here, HAVE SOME KEGS!" }],
    dj: [{ who: 'dj', text: "Yo yo yo! Who let the narc in? Drop the bass... AND THE LIGHTS!" }],
    chad: [{ who: 'chad', text: "BRO. You just walked into Delta Chugga House during a RAGER. Boys! We got ourselves a pong tournament!" }],
    grog: [{ who: 'grog', text: "Arr! A landlubber with a clipboard! Load the barrel cannons, ye scallywags! FIRE AT THE PAPERWORK!" }],
    countess: [{ who: 'countess', text: "A guest without an invitation. How... provincial. Darlings, uncork the '87. The AGENT is thirsty for justice." }],
    baron: [{ who: 'baron', text: "So. The rookie who ruined my supply chain. Welcome aboard the Flying Speakeasy! At midnight, Port Tipsy drinks FOREVER. You're just in time for... LAST CALL!" }],
  };
  D.BOSS_PHASE = {
    sal: ['MORE KEGS!', "I'm just gettin' warmed up!"], dj: ['LIGHTS OUT!', 'TURN IT UP!'], chad: ['BROOOOS! GET HIM!', 'KEGSTAND MODE!'], grog: ['BROADSIDE!', 'ABANDON SHIP! (not really)'], countess: ['Bubbles, darling.', 'You have RUINED my gala!'], baron: ['ACTIVATE THE EVERFLOW!', 'NO! NOT THE MONOCLE!'],
  };
  D.HOW_TO_PLAY = [
    ['FLIGHT', 'WASD / Arrows to pilot the blimp. SPACE fires the Citation Cannon at drones and pigeons. Hover over a glowing bar and press E to rappel. Grab floating evidence folders for cash. Dock at HQ (far left) with E to buy upgrades.'],
    ['RAPPEL', 'A/D to steer left and right, S to drop faster, W to slow down. Dodge AC units, pigeons and drones. At the bottom, line up with the glowing window and press SPACE to crash through. Fast, clean entries earn bonus inspection time.'],
    ['INSPECTION', 'Walk up to patrons, staff, or suspicious objects and press E. Check IDs (1), cite violations (2), or back off (3). Every correct citation scores points and builds a combo. Citing the innocent files a complaint: three complaints and Internal Affairs pulls you out.'],
    ['EVIDENCE', 'Baby faces need an ID check. Wobbling patrons with a forest of empty glasses are over-served (headphones + music notes are just dancing). Staff sipping from flasks are drinking on duty. If the bartender serves a young patron with no "ID?" bubble, cite them while the alert is up. Watch for people walking out the door with a drink.'],
    ['SHOWDOWNS', 'Bust enough bars and the district kingpin appears. A/D to move, W to jump, SPACE to throw citations. Dodge kegs, corks, and bass drops. Reduce their ego to zero.'],
  ];
  D.CREDITS = ['DABS: Department of Beverage Services', 'A game about over-the-top beverage justice', '', 'Design, code, art, music: procedural pixels and sine waves', 'Blimp consultant: nobody, and it shows', 'No patrons were harmed. Several were cited.', '', 'Thanks for playing. Stay hydrated.'];
})();
