// DABS - game content: districts, bars, bosses, violations, upgrades, achievements, story
(function () {
  const D = DABS.data = {};
  const G = DABS.gfx;

  D.CHARACTERS = {
    cox: { name: 'Governor Cox', color: '#f5c542', bg1: '#2a2f55', bg2: '#0d1326', mood: 'neutral', look: { skin: '#f1c8a8', hair: '#6b4a2a', hairStyle: 0, shirt: '#f8fafc', jacket: '#1e293b', pants: '#0f172a', accessory: 'tie', tieColor: '#b91c1c' } },
    agent: { name: 'You (Tier-One Beverage Operator)', color: '#60a5fa', mood: 'angry', look: G.AGENT_LOOK },
    radio: { name: 'DABS Dispatch', color: '#a3e635', look: { skin: '#b07a4f', hair: '#1a1a1a', hairStyle: 6, shirt: '#14532d', pants: '#0f172a', hat: 'headphones' } },
    lizard: { name: '"Honest" Hal Scales', color: '#84cc16', bg1: '#1f3a12', bg2: '#0a1406', mood: 'happy', holding: 'paper', look: { skin: '#9bbf6a', hair: '#3a2a1a', hairStyle: 0, shirt: '#fde047', jacket: '#b45309', pants: '#5b4636', accessory: 'tie', tieColor: '#dc2626', glowEyes: '#fde047' } },
    dell: { name: '"Super" Dell Schanze', color: '#f59e0b', bg1: '#3a2a0a', bg2: '#140d04', mood: 'happy', look: { skin: '#f1c8a8', hair: '#e0b34b', hairStyle: 1, shirt: '#dc2626', pants: '#1e3a8a', back: 'paramotor' } },
    posty: { name: 'Post Malone', color: '#ec4899', bg1: '#3a0a2a', bg2: '#140410', mood: 'happy', holding: 'beer', look: { skin: '#f1c8a8', hair: '#4a2e1a', hairStyle: 2, shirt: '#f8fafc', pants: '#374151', beard: true, mustache: true, faceTats: true, accessory: 'chain' } },
    whale: { name: 'Moby Brine', color: '#38bdf8', bg1: '#0a2a3a', bg2: '#04101a', mood: 'angry', look: { whale: true } },
    skin: { name: 'The Skinwalker', color: '#c084fc', bg1: '#1a0a2a', bg2: '#08040f', mood: 'neutral', look: { skin: '#44403c', hair: '#0c0a09', hairStyle: 2, shirt: '#78716c', jacket: '#292524', pants: '#1c1917', hat: 'cowboy', hatColor: '#57534e', ears: 'wolf', glowEyes: '#fde047', mustache: true } },
    brigham: { name: 'Brigham Young', color: '#ef4444', bg1: '#3b0a0e', bg2: '#12040a', mood: 'angry', holding: 'bottle', look: { skin: '#f6d3b3', hair: '#8e8e8e', hairStyle: 2, beard: true, shirt: '#f8fafc', jacket: '#111827', pants: '#111', hat: 'tophat', hatBand: '#111', accessory: 'tie', tieColor: '#111' } },
  };

  D.VIOLATIONS = {
    UNDERAGE: { name: 'Serving a Minor', short: 'Underage', points: 600, code: '§32B-21-A', target: 'patron', desc: 'A patron under 21 is consuming alcohol.' },
    FAKE_ID: { name: 'Possession of a Fake ID', short: 'Fake ID', points: 700, code: '§32B-21-F', target: 'patron', desc: 'That hologram is a sticker of a seagull.' },
    OVERSERVED: { name: 'Over-Service', short: 'Over-served', points: 500, code: '§32B-44-B', target: 'patron', desc: 'Patron is visibly intoxicated and still being served.' },
    ON_DUTY: { name: 'Drinking on Duty', short: 'Drinking on duty', points: 550, code: '§32B-12-D', target: 'staff', desc: 'Staff member consuming alcohol while working.' },
    NO_ID_CHECK: { name: 'Failure to Check ID', short: 'No ID check', points: 650, code: '§32B-21-C', target: 'bartender', desc: 'Bartender served a youthful patron without checking ID.' },
    OPEN_CONTAINER: { name: 'Open Container Exit', short: 'Open container', points: 500, code: '§32B-31-O', target: 'patron', desc: 'Patron attempting to leave with an open drink.' },
    EXPIRED_LICENSE: { name: 'Expired Liquor License', short: 'Expired license', points: 800, code: '§32B-01-L', target: 'object', desc: 'The license on the wall expired before you were born.' },
    ILLEGAL_PROMO: { name: 'Illegal Happy Hour', short: 'Happy hour', points: 600, code: '§32B-55-P', target: 'object', desc: 'Happy hour is illegal in Utah. Regular hour only.' },
    UNTAXED_KEG: { name: 'Out-of-State Contraband Keg', short: 'Wyoming keg', points: 900, code: '§32B-77-K', target: 'object', desc: 'No DABS stamp. The receipt says Evanston.' },
    WATERED_DOWN: { name: 'Unmetered Heavy Pour', short: 'Heavy pour', points: 850, code: '§32B-66-W', target: 'object', desc: 'A legal pour is 1.5 oz. This spout has been tampered with.' },
  };
  D.PATRON_CITES = ['UNDERAGE', 'FAKE_ID', 'OVERSERVED', 'OPEN_CONTAINER', 'ON_DUTY'];
  D.BARTENDER_CITES = ['NO_ID_CHECK', 'ON_DUTY'];

  D.RANKS = [
    { name: 'Cadet', xp: 0 }, { name: 'Junior Agent', xp: 2500 }, { name: 'Agent', xp: 6000 }, { name: 'Senior Agent', xp: 12000 }, { name: 'Inspector', xp: 20000 },
    { name: 'Chief Inspector', xp: 30000 }, { name: 'Deputy Director', xp: 45000 }, { name: 'Director', xp: 65000 }, { name: 'Supreme Beehive Commander', xp: 90000 },
  ];
  D.rankFor = (xp) => { let r = D.RANKS[0], i = 0; D.RANKS.forEach((rk, k) => { if (xp >= rk.xp) { r = rk; i = k; } }); return { rank: r, index: i, next: D.RANKS[i + 1] || null }; };

  D.UPGRADES = [
    { id: 'engines', name: 'Turbo Props', cat: 'BLIMP', desc: 'Thrust and top speed +25% per level. Feel the (mild) G-forces.', costs: [300, 700, 1400] },
    { id: 'armor', name: 'Kevlar Envelope', cat: 'BLIMP', desc: 'Hull integrity +50 per level. Seagull-resistant.', costs: [250, 600, 1200] },
    { id: 'cannon', name: 'Citation Cannon', cat: 'BLIMP', desc: 'Faster fire rate and heavier paperwork. Two barrels at level 3.', costs: [350, 800, 1500] },
    { id: 'radar', name: 'Tip Radar', cat: 'BLIMP', desc: 'Wider rappel zone, violation counts on approach, folders on the minimap.', costs: [300, 700, 1300] },
    { id: 'rope', name: 'Kevlar Rope', cat: 'AGENT', desc: 'Quicker, steadier descents and shorter stuns when you bonk something.', costs: [250, 550, 1100] },
    { id: 'shift', name: 'Overtime Authorization', cat: 'AGENT', desc: '+10 seconds per inspection per level. Paid in exposure.', costs: [400, 900, 1800] },
    { id: 'scanner', name: 'ID Scanner', cat: 'AGENT', desc: 'ID checks are much faster. Reads holograms, seagull stickers included.', costs: [300, 700, 1400] },
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
    { id: 'drones10', name: 'Drone Ranger', desc: 'Shoot down 10 Valley Tan drones.', icon: '🛸' },
    { id: 'tackle10', name: 'Tackle Dummy', desc: 'Tackle 10 fleeing suspects.', icon: '🏈' },
    { id: 'folders25', name: 'Paper Pusher', desc: 'Collect 25 evidence folders.', icon: '📁' },
    { id: 'bythebook', name: 'By The Book', desc: 'Cite every violation in a bar with zero complaints.', icon: '📖' },
    { id: 'id50', name: 'Papers, Please', desc: 'Check 50 IDs.', icon: '🪪' },
    { id: 'boss1', name: "Party's Over", desc: 'Cite your first kingpin.', icon: '🎉' },
    { id: 'untouchable', name: 'Untouchable', desc: 'Defeat a kingpin without taking damage.', icon: '🛡️' },
    { id: 'fly10', name: 'Frequent Flyer', desc: 'Fly 10 km in the blimp.', icon: '✈️' },
    { id: 'crash', name: 'Oh, The Humanity', desc: 'Crash the blimp. It happens to everyone.', icon: '💥' },
    { id: 'oops', name: 'Oops', desc: 'Cite an innocent patron.', icon: '😬' },
    { id: 'combo4', name: 'Combo Cop', desc: 'Reach a x4 citation combo.', icon: '🔥' },
    { id: 'cite100', name: 'Century Citation', desc: 'Issue 100 citations.', icon: '💯' },
    { id: 'pigeons20', name: 'Miracle of the Gulls', desc: 'Splat 20 seagulls. The state bird. On duty.', icon: '🐦' },
    { id: 'speedrun', name: 'Speed Reader', desc: 'Clear every violation with 20+ seconds left.', icon: '⚡' },
    { id: 'fullkit', name: 'Fully Equipped', desc: 'Buy every upgrade.', icon: '🧰' },
    { id: 'allbars', name: 'No Bar Left Behind', desc: 'Bust every bar in the state, optional ones included.', icon: '🏙️' },
    { id: 'rank_director', name: 'Top Brass', desc: 'Reach the rank of Director.', icon: '⭐' },
    { id: 'win', name: 'This Is The Place', desc: 'Cite the last kingpin and save the Great Salt Lake.', icon: '🏆' },
  ];

  D.FIRST = ['Braxton', 'Brinley', 'Tyler', 'Kaylee', 'Doug', 'Priya', 'McKay', 'Ashlee', 'Jaxon', 'LaDawn', 'Jamal', 'Oaklee', 'Bruno', 'Sofia', 'LaVell', 'Brooklynn', 'Nephi', 'Tanya', 'Hyrum', 'Zoe', 'Marcus', 'Paisley', 'Skyler', 'Gus', 'Wanda', 'Brecken', 'Nadia', 'Kolby', 'Ruth', 'Kai', 'Bianca', 'Ammon', 'Lupe', 'Stockton', 'Dolores', 'Rocco', 'Ingrid', 'Bryson', 'Fern'];
  D.LAST = ['Jensen', 'Fizzle', 'Christensen', 'Tankard', 'Bybee', 'Hopkins', 'Sorensen', 'Guzzle', 'Nielsen', 'Corkwood', 'Barley', 'Tingey', 'Sipperton', 'Tumbler', 'Jeppson', 'Flagon', 'Draught', 'Smoot', 'Jigger', 'Highball', 'Hansen', 'Larsen', 'Stout', 'Chugg', 'Stoddard', 'Swizzle', 'Nightcap', 'Kimball', 'Tanner', 'Quaff'];
  D.PATRON_LINES = ['Another round! Of exactly 1.5 ounces!', 'Oh my heck, I love this song!', "It's my birthday! (it isn't)", 'Cheers!', 'I had to order nachos to get this. I do not want the nachos.', 'Best. Night. Ever.', 'Is this the 5% stuff?', 'Is that the DABS blimp outside?', "I'm just here for the fry sauce.", 'I drove to Evanston for fireworks once.', 'Hic!', 'Have you seen the whales? Out at the lake?', "I'm totally fine.", 'The inversion is bad tonight.', 'I am a normal human enjoying a beverage with my human mouth.', "Where's the bathroom?", 'Go Jazz!', 'You look like DABS.', 'Can I get a sidecar?'];
  D.YOUNG_LINES = ["I'm 21, I swear!", 'My mom thinks I am at institute.', 'Is this the study group?', "Don't tell my bishop.", 'I have a note.', "It's a dirty soda! ...ish.", 'I left my ID at the soda shop.'];
  D.FLEE_LINES = ["YOU'LL NEVER TAKE ME!", "I'm not even drunk!", "I'M FLEEING TO WENDOVER!", 'Run, legs, run!', "It's a fake fake ID!", 'MY DAD IS IN THE LEGISLATURE!', 'Catch me if you can, narc!', 'EVANSTON OR BUST!'];
  D.BARTENDER_LINES = ['What can I get ya? It will be 1.5 ounces.', "ID? Nah, you're good.", 'Did you order food? You have to order food.', "Don't tell the boss.", 'No doubles. I can do a single and a wish.', 'You look... old enough.', "I've seen you here since you were 12!"];
  D.CITED_LINES = ['Oh my heck!', "I'm calling my legislator!", 'Can I still finish this?', 'Worth it.', 'Flip.', 'Ugh, fine.', 'Do you take Venmo?', 'Fetch!'];
  D.INNOCENT_LINES = ["I'm THIRTY-FOUR! I have six kids!", "It's a DIRTY SODA! That is coconut syrup!", "It's cranberry juice!", "I'm the designated driver!", 'I want to speak to the Governor!', 'This is SPARKLING CIDER. It is a wedding reception.'];

  // Palettes per district: sky top/bottom, far/mid/near building tints, neon accent, ground
  D.DISTRICTS = [
    {
      id: 'slc', name: 'STATE STREET', sub: 'Salt Lake City — nine blocks of bars, one inversion, zero doubles', width: 5600, music: 'city',
      sky: ['#0b0f2e', '#2a1d4a', '#5a2d3a'], far: '#1a1a3a', mid: '#23233f', near: '#2e2a45', neon: ['#ff3cac', '#ffd166', '#06d6a0'], ground: '#1a1826', fog: 'rgba(110,90,90,0.3)',
      hazards: { pigeons: 1, drones: 0, choppers: 0, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK'], patrons: [5, 7], time: 50, folders: 10,
      bars: [
        { name: 'The Zion Curtain', tag: 'You are not allowed to watch them make it' }, { name: 'Members Only', tag: 'Still charging the $4 club fee from 2008' }, { name: 'The 3.2 Room', tag: 'It is 5% now. The sign was expensive.' }, { name: 'Intent To Dine', tag: 'You must order food. The food is one pretzel.' },
        { name: 'The Sidecar', tag: 'A shot next to your drink. Never in it.', opt: true }, { name: 'The Inversion Lounge', tag: 'You cannot see the violations. Or the mountains.', opt: true },
      ],
      boss: { id: 'lizard', lair: 'CROSSROADS PRE-OWNED', name: '"Honest" Hal Scales', hp: 24, title: 'Used Cars. Definitely a Human.' },
    },
    {
      id: 'slopes', name: 'SILICON SLOPES', sub: 'Point of the Mountain — startups, paragliders, and kombucha on tap', width: 6400, music: 'city',
      sky: ['#070a24', '#1b1650', '#7a1f7a'], far: '#141838', mid: '#1d1f4a', near: '#27234f', neon: ['#00f5d4', '#f15bb5', '#fee440', '#9b5de5'], ground: '#141226', fog: 'rgba(150,60,160,0.22)',
      hazards: { pigeons: 1, drones: 1, choppers: 0, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY'], patrons: [6, 8], time: 52, folders: 12,
      bars: [
        { name: 'Series A Taproom', tag: 'Pre-revenue. Post-sobriety.' }, { name: 'The Pivot', tag: 'It was a soda shop until Tuesday' }, { name: 'Unlimited PTO', tag: 'Unlimited anything is a violation here' }, { name: 'The Thermal', tag: 'Paragliders land on the patio. Hard.' }, { name: "Porter's Roadhouse", tag: 'Rockwell ran a brewery here in 1858. Paperwork pending.' },
        { name: 'Kombucha Kult', tag: 'It is 0.5%. We are checking anyway.', opt: true }, { name: 'The Standup', tag: 'Daily at 9. Nobody is standing by 10.', opt: true },
      ],
      boss: { id: 'dell', lair: 'TOTALLY AWESOME COMPUTERS', name: '"Super" Dell Schanze', hp: 30, title: 'Totally Awesome. Totally Unlicensed.' },
    },
    {
      id: 'parkcity', name: 'PARK CITY', sub: 'Main Street — $28 cocktails, $900 jackets, priceless violations', width: 6800, music: 'city',
      sky: ['#0a1a2e', '#123a5a', '#2c6a7a'], far: '#0f2238', mid: '#173049', near: '#1f3a55', neon: ['#ffd60a', '#ff4d6d', '#4cc9f0'], ground: '#0f1c2a', fog: 'rgba(60,120,150,0.22)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 0, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER'], patrons: [7, 9], time: 55, folders: 12,
      bars: [
        { name: 'Après Whenever', tag: 'Ski boots on the bar. Not our department.' }, { name: 'The Silver Vein', tag: 'Old mining town. They struck bottomless mimosas.' }, { name: 'The Premiere Party', tag: 'Everyone in here is "a producer"' }, { name: 'The Powder Keg', tag: 'Greatest Snow on Earth. Heaviest pour in Summit County.' }, { name: 'Hot Tub Time Share', tag: 'A bar in a hot tub. So many forms.' },
        { name: 'The Lift Line', tag: 'Singles line only. No doubles, obviously.', opt: true }, { name: 'Condo 4B', tag: 'An unlicensed "tasting room" with a ski rack', opt: true },
      ],
      boss: { id: 'posty', lair: "POSTY'S PONG LODGE", name: 'Post Malone', hp: 36, title: "Cottonwood Heights' Nicest Neighbor. Pong Final Boss." },
    },
    {
      id: 'lake', name: 'THE GREAT SALT LAKE', sub: 'Saltair — brine shrimp, brine flies, and something much bigger', width: 7000, music: 'city',
      sky: ['#04101a', '#0a2a3a', '#1d5a5a'], far: '#082030', mid: '#0d2a3d', near: '#123548', neon: ['#00b4d8', '#ff9f1c', '#e63946'], ground: '#061218', fog: 'rgba(40,110,120,0.3)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 1, storm: 0 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG'], patrons: [7, 10], time: 58, folders: 14,
      bars: [
        { name: 'The Brine Fly', tag: 'Four billion regulars' }, { name: 'The Salty Pavilion', tag: 'Burned down twice. Reopened three times.' }, { name: 'Shrimp & Sip', tag: 'The shrimp are sea monkeys. The sip is 4 oz.' }, { name: 'The Floating Keg', tag: 'Everything floats out here. Even the evidence.' }, { name: 'Antelope Island Iced Tea', tag: 'It is not tea. The bison know.' },
        { name: 'The Spiral Jetty', tag: 'You walk in circles before you even order', opt: true }, { name: 'Lake Stink Tavern', tag: 'You get used to it. You should not have to.', opt: true },
      ],
      boss: { id: 'whale', lair: 'THE SALTAIR GROTTO', name: 'Moby Brine', hp: 42, title: 'The Great Salt Whale. Planted 1875. Thirsty since.' },
    },
    {
      id: 'basin', name: 'THE UINTAH BASIN', sub: 'Vernal — dinosaurs, oil rigs, and lights in the sky that are not ours', width: 7200, music: 'city',
      sky: ['#100a2e', '#3a1a5a', '#8a3a7a'], far: '#1b1238', mid: '#2a1a4a', near: '#37245a', neon: ['#a3e635', '#e0aaff', '#f5c542'], ground: '#160f2a', fog: 'rgba(140,90,170,0.25)',
      hazards: { pigeons: 1, drones: 1, choppers: 1, fireworks: 1, storm: 1 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG', 'WATERED_DOWN'], patrons: [8, 11], time: 60, folders: 14,
      bars: [
        { name: 'The Tipsy T-Rex', tag: 'Arms too short to check IDs' }, { name: 'Dinosaur Juice', tag: 'Oil-field strong. Do not light a match.' }, { name: 'The Mutilated Cow', tag: 'Steakhouse. Do not ask where they get it.' }, { name: 'Area 435', tag: 'The area code is real. So is the hum.' }, { name: 'Probe & Pour', tag: 'Abductees drink half off, which is illegal' },
        { name: 'The Crop Circle K', tag: 'Gas, snacks, unlicensed slushies', opt: true }, { name: 'The Portal', tag: 'Opens at 9. Nobody knows where to.', opt: true },
      ],
      boss: { id: 'skin', lair: 'SKINWALKER RANCH', name: 'The Skinwalker', hp: 48, title: 'Shapeshifter. Holder of 400 Fake IDs.' },
    },
    {
      id: 'provo', name: 'HAPPY VALLEY', sub: 'Provo — officially dry. Check behind the soda shops. Final shift.', width: 7600, music: 'city',
      sky: ['#0a0508', '#2a0a12', '#5a1a1a'], far: '#1a0a10', mid: '#25101a', near: '#301622', neon: ['#ff2a2a', '#ffb703', '#8ac926'], ground: '#120609', fog: 'rgba(120,40,40,0.3)',
      hazards: { pigeons: 1, drones: 2, choppers: 1, fireworks: 1, storm: 1 }, violations: ['UNDERAGE', 'OVERSERVED', 'EXPIRED_LICENSE', 'NO_ID_CHECK', 'FAKE_ID', 'ILLEGAL_PROMO', 'ON_DUTY', 'OPEN_CONTAINER', 'UNTAXED_KEG', 'WATERED_DOWN'], patrons: [9, 12], time: 62, folders: 16,
      bars: [
        { name: 'Extra Dirty Soda', tag: 'Ask for the cola "extra dirty"' }, { name: 'The Ward Party', tag: 'It said BYOB. Nobody was supposed to B.' }, { name: 'Funeral Potatoes', tag: 'Comfort food. Suspiciously fermented.' }, { name: 'The Fry Sauce Room', tag: 'Two parts mayo, one part ketchup, six parts trouble' }, { name: 'Curfew', tag: 'Open until 10:30 p.m. Sharp.' }, { name: 'Y Mountain Lookout', tag: 'Last stop before the airship' },
        { name: 'Sparkling Cider Cellar', tag: 'They swear it is cider', opt: true },
      ],
      boss: { id: 'brigham', lair: 'THE FLYING BEEHIVE', name: 'Brigham Young', hp: 64, title: 'President, Valley Tan Whiskey Co. (est. 1850s)', airship: true },
    },
  ];
  D.DISTRICTS.forEach((d, i) => { d.index = i; d.required = d.bars.filter(b => !b.opt).length; });

  // ---------- Story ----------
  D.INTRO_CARDS = [
    { title: 'UTAH', text: 'The Beehive State. Five national parks, the Greatest Snow on Earth, and every drink poured exactly one and a half ounces at a time. Somebody has to make sure.', art: 'city' },
    { title: 'D.A.B.S.', text: 'The Department of Alcoholic Beverage Services. On paper, they run the state liquor stores and file compliance reports. In their hearts, they are a tier-one tactical unit.', art: 'badge' },
    { title: 'VALLEY TAN', text: 'Word on State Street: an outlaw outfit is flooding the Wasatch Front with heavy pours, happy hours, and kegs from Evanston. Nobody has seen the boss. Nobody will even say the name.', art: 'baron' },
    { title: 'THE SOBER SEAGULL', text: 'Tonight, a rookie takes command of DABS Enforcement Blimp #1. Nobody at the Capitol remembers approving a blimp. You report directly to the Governor. He has asked you to stop saying that.', art: 'blimp' },
  ];
  D.BRIEFINGS = [
    [
      { who: 'cox', text: "Hi there. Spencer Cox. Governor. My office says you've been calling every eleven minutes asking for 'mission parameters.' Welcome to DABS, I guess." },
      { who: 'agent', text: 'Eagle One, this is Sober Seagull. Requesting permission to go loud.' },
      { who: 'cox', text: "I'm not Eagle One. You inspect bars. It's a compliance job. There's a checklist. Why does the Department have a blimp?" },
      { who: 'cox', text: "Okay. State Street. We're getting complaints: minors served, folks over-served, licenses older than I am. Check IDs, write the citations, and please don't cite innocent people. I read every complaint personally. It ruins my evenings." },
      { who: 'cox', text: "Bust four bars and whoever is supplying them will have to show himself. We don't have a name. We have a business card. It smells like a terrarium." },
      { who: 'radio', text: "Dispatch here, Operator! Controls: WASD or Arrows to fly, E to rappel over a glowing bar, SPACE fires the Citation Cannon. Pause with ESC. This is the coolest job in state government!" },
    ],
    [
      { who: 'cox', text: "Hal's sales ledger shows four hundred kegerators delivered to Point of the Mountain, billed as 'gaming PCs.' Where the buyer's name goes, somebody just drew an exclamation point." },
      { who: 'cox', text: "Silicon Slopes. The startups are passing fake IDs and running something called 'bottomless kombucha hour.' Happy hour is illegal in Utah, Agent. Check the promo boards, and cite any bartender who skips an ID check while the evidence is fresh." },
      { who: 'agent', text: 'Solid copy, Eagle One. Stacking up on the kombucha.' },
      { who: 'cox', text: "Please don't stack up on anything." },
      { who: 'radio', text: "Heads up: Valley Tan drones are in the airspace now. They drop kegs. SPACE to engage. Evidence folders float around too, grab 'em for cash!" },
    ],
    [
      { who: 'cox', text: "That hard drive had one file on it: 'OPERATION SALTED RIM.' It was a spreadsheet of lime prices and the words 'TOTALLY AWESOME' four thousand times." },
      { who: 'cox', text: "Park City next. Folks are walking out of bars onto Main Street with open drinks. During the film festival. There are critics present, Agent." },
      { who: 'cox', text: "People run when you cite them up there. SHIFT to chase, SPACE to tackle. Gently. Somebody up there is hosting an unlicensed pong tournament. A celebrity, apparently. My staff won't tell me who. They said I'd make it weird." },
      { who: 'radio', text: "Chopper 5 is up covering the festival and it does NOT yield to blimps. Stay frosty, Seagull. That's a ski joke and a tactical term." },
    ],
    [
      { who: 'cox', text: "That young man was very polite about it. He says the party supplies came off the lake, out by Saltair: ten thousand pounds of rim salt, and kegs that crossed the Wyoming line from Evanston." },
      { who: 'cox', text: "The Great Salt Lake. Inspect the kegs behind every bar. No DABS stamp means contraband." },
      { who: 'cox', text: "The bartenders out there all say the same thing: the supplier is 'a big fish.' I'm assuming that's a figure of speech. Nothing lives in that lake but brine shrimp." },
      { who: 'radio', text: "Evanston fireworks over the marina tonight! Gorgeous, illegal, and they will absolutely pop a blimp. Fly careful!" },
    ],
    [
      { who: 'cox', text: "The whale gave us a manifest. Ten thousand gallons of tequila, trucked from Wendover to a ranch in the Uintah Basin. The signature is different on every page. So is the handwriting. So is the species." },
      { who: 'cox', text: "Vernal. The bars out there pour heavy. A legal pour is one and a half ounces, so test the suspicious bottles on the top shelf. Yes, measuring is the job. No, it is not 'recon.'" },
      { who: 'cox', text: "Whatever runs that ranch has been carded four hundred times and passed every one, as somebody different. It's the best fake ID in the state. Be careful out there." },
      { who: 'radio', text: "Lightning over the Basin tonight, and it likes tall things. That's you. Also I've got lights on my scope that aren't ours. Small ones. Watch for those little guys." },
    ],
    [
      { who: 'cox', text: "Okay. I've got it all on one whiteboard. Tequila from Wendover. Salt from Saltair. Six tons of lime Jell-O out of Utah County. Somebody means to turn the Great Salt Lake into the world's largest margarita. The rim is already salted." },
      { who: 'cox', text: "And I think I know who's behind it. I'm not going to say the name out loud, because it sounds insane and I'd like to finish my term. Valley Tan was the territory's whiskey monopoly in the 1850s. Somebody wants it back. His airship leaves Happy Valley at midnight on the 24th." },
      { who: 'cox', text: "Shut down every speakeasy behind those soda shops so his supply dries up. Then take your... blimp... up against the Flying Beehive. Shoot out the engines, get aboard, and serve him Form 86-Z. I had it laminated. I'm in this now, apparently." },
      { who: 'agent', text: 'Eagle One, Sober Seagull is wheels up.' },
      { who: 'cox', text: '...Godspeed, Seagull.' },
      { who: 'radio', text: "This is it, Operator! The whole department is watching! All eleven of us! Go get him!" },
    ],
  ];
  D.DEBRIEFS = [
    [{ who: 'lizard', mood: 'sad', text: "Okay! Okay. You got me. But I'm small inventory! The real volume moves south, to Point of the Mountain. Ask for the loud one. You'll hear him before you see him. Tell him Hal says the financing fell through. Hssss. I mean. Ahem." }, { who: 'cox', text: "State Street is quiet. His face came off a little at the end there. We're going to leave that out of the report. Go see about some upgrades, Agent." }],
    [{ who: 'dell', mood: 'sad', text: "NOT awesome! Totally NOT awesome! Fine! The kegs go up Parleys Canyon to Park City! Some pong tournament! And the big guy has plans for the 24th! SALTY plans!" }, { who: 'cox', text: "Silicon Slopes is back to regular, legal burnout. He asked me to tell you he's running for governor again. That's fine. Everybody does." }],
    [{ who: 'posty', mood: 'sad', text: "Aw, man. And y'all were so nice about it. Okay: the salt, the kegs, all of it comes off the lake. Saltair. There's a big dude out there. Like, BIG big. Appreciate you. Be safe." }, { who: 'cox', text: "He signed the citation and thanked you for your service. Good kid. Park City is dry. Head for the lake." }],
    [{ who: 'whale', mood: 'sad', text: "Fwoosh. Fine. The tequila never came by water. It's at a ranch in the Basin. Don't trust the rancher. Or the cattle. Or the other rancher, who is the same rancher." }, { who: 'cox', text: "We impounded the whale's kegs. We did not impound the whale. Nobody had a form for it. I've got a long call with Wildlife Resources ahead of me." }],
    [{ who: 'skin', mood: 'sad', text: "Very well. It leaves from Happy Valley at midnight on the 24th. He pours it all into the lake. One state, one rim, one drink. Keep the IDs. I have more. I am already someone else." }, { who: 'cox', text: "The Basin is quiet. That thing shook my hand on the way out and for a second it was me. I didn't love that. One district left, Agent." }],
    [{ who: 'brigham', mood: 'sad', text: "CITED! In my own territory! By a state agency! I had the liquor monopoly FIRST! ...This is not the place." }, { who: 'cox', mood: 'happy', text: "The lake is safe. Still salty, still a lake, zero percent alcohol by volume. Agent... you did it. Root beers are on me. And fine. Just this once. Eagle One, out." }],
  ];
  D.BOSS_INTRO = {
    lizard: [{ who: 'lizard', text: "Welcome, welcome to Crossroads Pre-Owned! A badge! Love that for you. What's it gonna take to put you in a citation-free evening TODAY? No? Then let's talk about the UNDERCOATING!" }],
    dell: [{ who: 'dell', text: "WHOA! A DABS agent! In MY airspace! Do you know who I am?! I'm SUPER DELL! And this is gonna be TOTALLY... AWESOME!" }],
    posty: [{ who: 'posty', text: "Ayyy, what's up, officer! Welcome to the lodge, make yourself at home. Oh. You're here to shut it down? Dang. Okay. Respectfully... rack 'em." }],
    whale: [{ who: 'whale', text: "FWOOOOSH. A hundred and fifty years in this lake. No predators. No last call. And they send one little man on a rope. Come here, little man." }],
    skin: [{ who: 'skin', text: "Good evening, Agent. Do you need to see some identification? I have so many. Go on. Pick one." }],
    brigham: [{ who: 'brigham', text: "So. The State sends a rookie with a clipboard. I crossed a continent, boy. I founded this territory AND its whiskey monopoly. At midnight the lake becomes a margarita. THIS IS THE PLACE... FOR LAST CALL!" }],
  };
  D.BOSS_PHASE = {
    lizard: ['ZERO DOWN! ZERO MERCY!', 'I AM A NORMAL HUMAN DEALER!'], dell: ['TOTALLY AWESOME!', 'SUPER DELL CANNOT BE GROUNDED!'], posty: ['Sorry in advance, bro!', 'RE-RACK! EVERYBODY IN!'], whale: ['THAR I BLOW!', 'RELEASE THE GULLS!'], skin: ['Who am I now?', 'LIGHTS OUT, AGENT.'], brigham: ['RELEASE THE VALLEY TAN!', 'NOT THE BEARD!'],
  };
  D.HOW_TO_PLAY = [
    ['FLIGHT', 'WASD / Arrows to pilot the blimp. SPACE fires the Citation Cannon at drones and seagulls. Hover over a glowing bar and press E to rappel. Grab floating evidence folders for cash. Dock at HQ (far left) with E to buy upgrades.'],
    ['RAPPEL', 'A/D to steer left and right, S to drop faster, W to slow down. Dodge AC units, seagulls and drones. At the bottom, line up with the glowing window and press SPACE to crash through. Fast, clean entries earn bonus inspection time.'],
    ['INSPECTION', 'Walk up to patrons, staff, or suspicious objects and press E. Check IDs (1), cite violations (2), or back off (3). Every correct citation scores points and builds a combo. Citing the innocent files a complaint: three complaints and Internal Affairs pulls you out.'],
    ['EVIDENCE', 'Baby faces need an ID check. Wobbling patrons with a forest of empty glasses are over-served (headphones + music notes are just dancing). Staff sipping from flasks are drinking on duty. If the bartender serves a young patron with no "ID?" bubble, cite them while the alert is up. Watch for people walking out the door with a drink.'],
    ['SHOWDOWNS', 'Bust enough bars and the district kingpin appears. A/D to move, W to jump, SPACE to throw citations. Dodge whatever they throw at you. Reduce their ego to zero.'],
  ];
  D.CREDITS = ['DABS: Department of Alcoholic Beverage Services', 'A parody. Not affiliated with the State of Utah or anyone depicted.', '', 'Design, code, art, music: procedural pixels and sine waves', 'Blimp consultant: nobody, and it shows', 'No patrons were harmed. Several were cited.', '', 'Thanks for playing. Please order food with that.', '', 'A Game By Sam Garfield'];
})();
